import { NextResponse } from 'next/server'
import { PendingIngredientRepository } from '@/features/cooking/repositories/pending-ingredient-repository'
// import { IngredientRepository } from '@/features/cooking/repositories/ingredient-repository'
import { IngredientCategoryRepository } from '@/features/cooking/repositories/ingredient-category-repository'
import { createClient } from '@/lib/supabase/server'
import { OpenaiIaService } from '@/lib/ia/openai-service'
import { z } from 'zod'
// import type { Ingredient } from '@/features/cooking/types'

// Schéma pour la réponse IA
const BulkIngredientSchema = z.object({
    ingredients: z.array(z.object({
        name: z.object({
            fr: z.string(),
            en: z.string(),
            es: z.string()
        }),
        suffix_singular: z.object({
            fr: z.string(),
            en: z.string(),
            es: z.string()
        }),
        suffix_plural: z.object({
            fr: z.string(),
            en: z.string(),
            es: z.string()
        }),
        category_id: z.number().nullable()
    }))
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { pendingIds } = body

        if (!pendingIds || !Array.isArray(pendingIds) || pendingIds.length === 0) {
            return NextResponse.json(
                { error: 'pendingIds array is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const pendingRepo = new PendingIngredientRepository(supabase)
        const categoryRepo = new IngredientCategoryRepository(supabase)

        // Récupérer les pending ingredients spécifiés
        const pendingIngredients = []
        for (const id of pendingIds) {
            const pending = await pendingRepo.findById(id)
            if (pending) {
                pendingIngredients.push(pending)
            }
        }

        if (pendingIngredients.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Aucun ingrédient en attente trouvé',
                processed: 0,
                ingredients: []
            })
        }

        // Récupérer les catégories pour l'IA
        const categories = await categoryRepo.findAll()
        const categoryList = categories.map(cat => `${cat.emoji || ''} ${cat.title.fr} (ID: ${cat.id})`.trim()).join(', ')

        // Préparer le prompt pour l'IA
        const pendingNames = pendingIngredients.map(p => p.name).join(', ')

        const prompt = `Tu es un expert culinaire. Je vais te donner une liste d'ingrédients en attente et tu dois me retourner pour chacun :
1. Le nom en français (tel quel), anglais et espagnol
2. Le suffixe singulier pour l'affichage dans les recettes (ex: "de fruit de la passion" - SANS "cuillère" ou autre unité) en 3 langues
3. Le suffixe pluriel pour l'affichage dans les recettes (ex: "de fruits de la passion" - SANS "cuillères" ou autre unité) en 3 langues
4. L'ID de la catégorie appropriée parmi : ${categoryList}

IMPORTANT : Les suffixes sont SEULEMENT la partie "de..." qui suit l'unité de mesure. Par exemple :
- "Fruit de la passion" → singulier: "de fruit de la passion", pluriel: "de fruits de la passion"
- "Tomate" → singulier: "de tomate", pluriel: "de tomates"
- "Sel" → singulier: "de sel", pluriel: "de sel" (invariable)

NE PAS inclure les unités de mesure (cuillère, gramme, etc.) dans les suffixes.

Ingrédients à traiter : ${pendingNames}

Retourne un JSON avec un tableau d'objets. Pour chaque ingrédient, utilise le nom exact donné. Si aucun ingrédient ne correspond à une catégorie, utilise null pour category_id.`

        // Appeler l'IA
        const iaService = new OpenaiIaService('gpt-4o-mini')
        const response = await iaService
            .setMessages([{ role: 'user', content: prompt }])
            .getCompletionResult<z.infer<typeof BulkIngredientSchema>>({
                schemaType: BulkIngredientSchema,
                schemaName: 'BulkIngredientSchema',
                temperature: 0.3
            })

        const aiResults = response.ingredients

        // Traiter les résultats IA et retourner les données générées
        const processedIngredients = []
        const errors = []

        for (let i = 0; i < pendingIngredients.length; i++) {
            try {
                const pending = pendingIngredients[i]
                const aiResult = aiResults[i]

                if (!aiResult) {
                    errors.push(`Pas de résultat IA pour ${pending.name}`)
                    continue
                }

                // Récupérer la catégorie directement depuis l'ID retourné par l'IA
                let categoryId = aiResult.category_id
                let categoryName = null
                if (categoryId !== null) {
                    const suggestedCategory = categories.find(cat => cat.id === categoryId)
                    if (suggestedCategory) {
                        categoryName = suggestedCategory.title.fr
                    } else {
                        // Si l'ID n'existe pas, on met null
                        categoryId = null
                    }
                }

                // Préparer les données de l'ingrédient générées par l'IA
                const ingredientData = {
                    pendingId: pending.id,
                    pendingName: pending.name,
                    name: aiResult.name,
                    suffix_singular: aiResult.suffix_singular,
                    suffix_plural: aiResult.suffix_plural,
                    category_id: categoryId,
                    category_name: categoryName,
                    img_path: null,
                    created_at: new Date().toISOString()
                }

                processedIngredients.push(ingredientData)

            } catch (error) {
                console.error(`Erreur pour ${pendingIngredients[i].name}:`, error)
                errors.push(`Erreur pour ${pendingIngredients[i].name}: ${error}`)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Génération IA terminée : ${processedIngredients.length} ingrédients traités`,
            processed: pendingIngredients.length,
            ingredients: processedIngredients,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error) {
        console.error('Error in bulk process:', error)
        return NextResponse.json(
            { error: 'Failed to process pending ingredients', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
