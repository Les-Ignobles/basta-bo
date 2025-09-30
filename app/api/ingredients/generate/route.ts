import { NextResponse } from 'next/server'
import { IngredientCategoryRepository } from '@/features/cooking/repositories/ingredient-category-repository'
import { createClient } from '@/lib/supabase/server'
import { OpenaiIaService } from '@/lib/ia/openai-service'
import { z } from 'zod'

// Schéma pour la réponse IA
const IngredientGenerationSchema = z.object({
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
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { ingredientName }: { ingredientName: string } = body

        if (!ingredientName?.trim()) {
            return NextResponse.json(
                { error: 'ingredientName est requis' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const categoryRepo = new IngredientCategoryRepository(supabase)

        // Récupérer toutes les catégories
        const categories = await categoryRepo.findAll()
        const categoryList = categories.map(cat => `${cat.emoji || ''} ${cat.title.fr} (ID: ${cat.id})`.trim()).join(', ')

        // Service IA
        const iaService = new OpenaiIaService('gpt-4o-mini')

        const prompt = `Tu es un expert culinaire français. Je vais te donner un nom d'ingrédient en français et tu dois me retourner :
1. Le nom en français (tel quel), anglais et espagnol
2. Le suffixe singulier pour l'affichage dans les recettes (ex: "de fruit de la passion" ou "d'ail" - SANS "cuillère" ou autre unité) en 3 langues
3. Le suffixe pluriel pour l'affichage dans les recettes (ex: "de fruits de la passion" ou "d'ails" - SANS "cuillères" ou autre unité) en 3 langues
4. L'ID de la catégorie appropriée parmi : ${categoryList}

IMPORTANT : Les suffixes sont SEULEMENT la partie "de/d'..." qui suit l'unité de mesure. Règles françaises :
- Utiliser "de" devant une consonne : "de tomate", "de sel", "de fruit de la passion"
- Utiliser "d'" devant une voyelle : "d'ail", "d'huile", "d'orange"
- Exemples corrects :
  * "Fruit de la passion" → singulier: "de fruit de la passion", pluriel: "de fruits de la passion"
  * "Ail" → singulier: "d'ail", pluriel: "d'ails"
  * "Tomate" → singulier: "de tomate", pluriel: "de tomates"
  * "Huile d'olive" → singulier: "d'huile d'olive", pluriel: "d'huiles d'olive"

NE PAS inclure les unités de mesure (cuillère, gramme, etc.) dans les suffixes.

Ingrédient à traiter : ${ingredientName.trim()}

Retourne un JSON avec un objet. Si aucun ingrédient ne correspond à une catégorie, utilise null pour category_id.`

        // Configurer les messages pour l'IA
        iaService.setMessages([
            { role: 'user', content: prompt }
        ])

        const result = await iaService.getCompletionResult<z.infer<typeof IngredientGenerationSchema>>({
            schemaType: IngredientGenerationSchema,
            schemaName: 'IngredientGenerationSchema',
            temperature: 0.3
        })

        if (!result) {
            return NextResponse.json(
                { error: 'Erreur lors de la génération IA' },
                { status: 500 }
            )
        }

        // Récupérer le nom de la catégorie si elle existe
        let categoryName = null
        if (result.category_id !== null) {
            const suggestedCategory = categories.find(cat => cat.id === result.category_id)
            if (suggestedCategory) {
                categoryName = suggestedCategory.title.fr
            } else {
                // Si l'ID n'existe pas, on met null
                result.category_id = null
            }
        }

        return NextResponse.json({
            success: true,
            ingredient: {
                name: result.name,
                suffix_singular: result.suffix_singular,
                suffix_plural: result.suffix_plural,
                category_id: result.category_id,
                category_name: categoryName
            }
        })

    } catch (error) {
        console.error('Error in ingredient generation:', error)
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}
