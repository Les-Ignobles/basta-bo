import { NextResponse } from 'next/server'
import { PendingIngredientRepository } from '@/features/cooking/repositories/pending-ingredient-repository'
import { IngredientRepository } from '@/features/cooking/repositories/ingredient-repository'
import { IngredientCategoryRepository } from '@/features/cooking/repositories/ingredient-category-repository'
import { createClient } from '@/lib/supabase/server'
import { OpenaiIaService } from '@/lib/ia/openai-service'
import { z } from 'zod'
import type { Ingredient } from '@/features/cooking/types'

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
    category_suggestion: z.string().optional()
  }))
})

export async function POST() {
  try {
    const supabase = await createClient()
    const pendingRepo = new PendingIngredientRepository(supabase)
    const ingredientRepo = new IngredientRepository(supabase)
    const categoryRepo = new IngredientCategoryRepository(supabase)

    // Récupérer tous les pending ingredients
    const pendingIngredients = await pendingRepo.findAll()
    
    if (pendingIngredients.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Aucun ingrédient en attente à traiter',
        processed: 0,
        created: []
      })
    }

    // Récupérer les catégories pour l'IA
    const categories = await categoryRepo.findAll()
    const categoryList = categories.map(cat => `${cat.emoji || ''} ${cat.title.fr}`.trim()).join(', ')

    // Préparer le prompt pour l'IA
    const pendingNames = pendingIngredients.map(p => p.name).join(', ')
    
    const prompt = `Tu es un expert culinaire. Je vais te donner une liste d'ingrédients en attente et tu dois me retourner pour chacun :
1. Le nom en français (tel quel), anglais et espagnol
2. Le suffixe singulier (ex: "1 cuillère à soupe de...") en 3 langues
3. Le suffixe pluriel (ex: "2 cuillères à soupe de...") en 3 langues
4. Une suggestion de catégorie parmi : ${categoryList}

Ingrédients à traiter : ${pendingNames}

Retourne un JSON avec un tableau d'objets. Pour chaque ingrédient, utilise le nom exact donné.`

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

    // Créer les ingrédients et supprimer les pending
    const createdIngredients = []
    const errors = []

    for (let i = 0; i < pendingIngredients.length; i++) {
      try {
        const pending = pendingIngredients[i]
        const aiResult = aiResults[i]

        if (!aiResult) {
          errors.push(`Pas de résultat IA pour ${pending.name}`)
          continue
        }

        // Trouver la catégorie suggérée
        let categoryId = null
        if (aiResult.category_suggestion) {
          const suggestedCategory = categories.find(cat => 
            cat.title.fr.toLowerCase().includes(aiResult.category_suggestion!.toLowerCase()) ||
            aiResult.category_suggestion!.toLowerCase().includes(cat.title.fr.toLowerCase())
          )
          if (suggestedCategory) {
            categoryId = suggestedCategory.id
          }
        }

        // Créer l'ingrédient
        const ingredientData: Omit<Ingredient, 'id'> = {
          name: aiResult.name,
          suffix_singular: aiResult.suffix_singular,
          suffix_plural: aiResult.suffix_plural,
          category_id: categoryId,
          img_path: null,
          created_at: new Date().toISOString()
        }

        const newIngredient = await ingredientRepo.create(ingredientData)
        createdIngredients.push(newIngredient)

        // Supprimer le pending ingredient
        await pendingRepo.delete(pending.id)

      } catch (error) {
        console.error(`Erreur pour ${pendingIngredients[i].name}:`, error)
        errors.push(`Erreur pour ${pendingIngredients[i].name}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Traitement terminé : ${createdIngredients.length} ingrédients créés`,
      processed: pendingIngredients.length,
      created: createdIngredients,
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
