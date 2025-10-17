import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { RecipeRepository } from '@/features/cooking/repositories/recipe-repository'
import { AllergyRepository } from '@/features/cooking/repositories/allergy-repository'
import { OpenaiIaService } from '@/lib/ia/openai-service'
import { z } from 'zod'
import { Recipe } from '@/features/cooking/types'
import { Allergy } from '@/features/cooking/types/allergy'

// Schéma Zod pour valider la réponse de l'IA
const AllergyAnalysisSchema = z.object({
    incompatibleAllergyIds: z.array(z.number())
})

export async function POST(req: NextRequest) {
    try {
        const { batchSize = 10, startFrom = 0 } = await req.json()

        const recipeRepo = new RecipeRepository(supabaseServer)
        const allergyRepo = new AllergyRepository(supabaseServer)

        // Récupérer toutes les allergies pour construire le prompt
        const allergies = await allergyRepo.findAll()
        if (allergies.length === 0) {
            return Response.json({ error: 'Aucune allergie trouvée' }, { status: 400 })
        }

        // Récupérer toutes les recettes
        const allRecipes = await recipeRepo.findAll()
        const totalRecipes = allRecipes.length

        if (startFrom >= totalRecipes) {
            return Response.json({
                message: 'Toutes les recettes ont été traitées',
                processed: 0,
                total: totalRecipes
            })
        }

        // Prendre un batch de recettes
        const recipesToProcess = allRecipes.slice(startFrom, startFrom + batchSize)

        console.log(`Traitement de ${recipesToProcess.length} recettes (${startFrom + 1}-${startFrom + recipesToProcess.length}/${totalRecipes})`)

        // Traiter les recettes en parallèle
        const results = await Promise.allSettled(
            recipesToProcess.map(async (recipe) => {
                try {
                    // Créer une instance IA dédiée pour cette recette
                    const iaService = new OpenaiIaService('gpt-4o-mini')

                    // Construire le prompt pour l'IA
                    const prompt = buildAnalysisPrompt(recipe, allergies)

                    // Appeler l'IA avec validation Zod
                    const response = await iaService
                        .clearMessages()
                        .addUser(prompt)
                        .getCompletionResult<z.infer<typeof AllergyAnalysisSchema>>({
                            maxTokens: 500,
                            temperature: 0.1,
                            schemaType: AllergyAnalysisSchema,
                            schemaName: 'AllergyAnalysis'
                        })

                    // Extraire les IDs directement depuis la réponse structurée
                    const incompatibleAllergyIds = response.incompatibleAllergyIds || []
                    const incompatibleAllergies = allergies.filter(allergy =>
                        incompatibleAllergyIds.includes(allergy.id)
                    )

                    // Log pour debug
                    console.log(`\n=== ANALYSE RECETTE ${recipe.id} ===`)
                    console.log(`Titre: ${recipe.title}`)
                    console.log(`Ingrédients: ${recipe.ingredients_name?.join(', ') || 'Aucun'}`)
                    console.log(`Instructions: ${recipe.instructions || 'Aucune'}`)
                    console.log(`IDs d'allergies incompatibles: [${incompatibleAllergyIds.join(', ')}]`)
                    console.log(`Nombre d'allergies détectées: ${incompatibleAllergies.length}`)
                    console.log(`Détails des allergies:`, incompatibleAllergies.map(a => `${a.id}: ${a.name.fr}`))

                    // Calculer le bitmask
                    const allergyMask = calculateAllergyMask(incompatibleAllergies)

                    console.log(`- Bitmask calculé: ${allergyMask}`)
                    console.log(`- Bitmask binaire: ${allergyMask.toString(2)}`)

                    // Mettre à jour la recette
                    await recipeRepo.update(recipe.id, { allergy_mask: allergyMask })

                    // Vérifier le décodage du bitmask
                    const decodedAllergies = []
                    for (let i = 0; i < allergies.length; i++) {
                        if (allergyMask & (1 << allergies[i].bit_index)) {
                            decodedAllergies.push(allergies[i])
                        }
                    }

                    console.log(`- Décodage du bitmask: ${decodedAllergies.length} allergies`)
                    console.log(`- Détails décodés:`, decodedAllergies.map(a => `${a.id}: ${a.name.fr}`))

                    return {
                        recipeId: recipe.id,
                        title: recipe.title,
                        incompatibleAllergies: incompatibleAllergies.map(a => a.name.fr),
                        decodedAllergies: decodedAllergies.map(a => a.name.fr),
                        allergyMask,
                        count: incompatibleAllergies.length,
                        decodedCount: decodedAllergies.length
                    }
                } catch (error) {
                    console.error(`Erreur pour la recette ${recipe.id} (${recipe.title}):`, error)
                    return {
                        recipeId: recipe.id,
                        title: recipe.title,
                        error: error instanceof Error ? error.message : 'Erreur inconnue'
                    }
                }
            })
        )

        // Analyser les résultats
        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length
        const processed = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean)

        // Calculer le taux de réussite correctement
        const successRate = recipesToProcess.length > 0 ? ((successful / recipesToProcess.length) * 100).toFixed(2) : '0.00'

        return Response.json({
            message: `Traitement terminé pour le batch ${startFrom + 1}-${startFrom + recipesToProcess.length}`,
            processed: successful,
            failed,
            total: totalRecipes,
            successRate: `${successRate}%`,
            nextStart: startFrom + batchSize,
            hasMore: startFrom + batchSize < totalRecipes,
            results: processed
        })

    } catch (error) {
        console.error('Erreur dans l\'analyse des allergies:', error)
        return Response.json({
            error: 'Erreur interne du serveur',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 })
    }
}

function buildAnalysisPrompt(recipe: Recipe, allergies: Allergy[]): string {
    const allergyList = allergies.map(a => `${a.id}: ${a.name.fr}`).join(', ')
    const ingredients = recipe.ingredients_name?.join(', ') || 'Non spécifié'

    return `
    Tu es un expert en allergies alimentaires.
    Analyse attentivement la recette suivante et identifie uniquement les allergies réellement incompatibles avec les ingrédients listés.

    RECETTE

    Titre : ${recipe.title}
    Ingrédients : ${ingredients}

    LISTE D'ALLERGIES DISPONIBLES

    ${allergyList}

    Ne tiens compte que des ingrédients réellement présents. Ne fais aucune hypothèse sur des ingrédients cachés ou potentiels.

    Retourne ta réponse uniquement sous forme d’un objet JSON contenant une propriété incompatibleAllergyIds, qui est un tableau d’IDs des allergies incompatibles.

    Exemple attendu :
    { "incompatibleAllergyIds": [ID des allergies ici] }
    
`
}


function calculateAllergyMask(incompatibleAllergies: { bit_index: number }[]): number {
    let mask = 0

    incompatibleAllergies.forEach(allergy => {
        if (allergy.bit_index !== undefined) {
            mask |= (1 << allergy.bit_index)
        }
    })

    return mask
}
