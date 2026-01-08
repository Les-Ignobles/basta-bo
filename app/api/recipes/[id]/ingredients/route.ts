import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientRecipePivotRepository } from '@/features/cooking/repositories/ingredient-recipe-pivot-repository'
import { RecipeRepository } from '@/features/cooking/repositories/recipe-repository'
import type { StructuredIngredient } from '@/features/cooking/types'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const pivotRepo = new IngredientRecipePivotRepository(supabaseServer)

    try {
        // Retourne les ingrédients avec leurs données structurées (quantity, unit, is_optional)
        const structuredIngredients = await pivotRepo.findStructuredIngredientsByRecipeId(Number(id))

        // Extraire aussi la liste simple des ingrédients pour compatibilité
        const ingredients = structuredIngredients.map(si => si.ingredient).filter(Boolean)

        return Response.json({
            data: ingredients,
            structured: structuredIngredients
        })
    } catch (error) {
        console.error('Failed to fetch recipe ingredients:', error)
        return Response.json({ error: 'Failed to fetch ingredients' }, { status: 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const { ingredient_ids, ingredients_name, structured_ingredients, base_servings } = await req.json()
    const pivotRepo = new IngredientRecipePivotRepository(supabaseServer)
    const recipeRepo = new RecipeRepository(supabaseServer)

    try {
        // Si on a des ingrédients structurés, utiliser la nouvelle méthode
        if (structured_ingredients && Array.isArray(structured_ingredients) && structured_ingredients.length > 0) {
            await pivotRepo.syncRecipeStructuredIngredients(Number(id), structured_ingredients as StructuredIngredient[])
        } else if (ingredient_ids) {
            // Sinon, utiliser l'ancienne méthode avec juste les IDs
            await pivotRepo.syncRecipeIngredients(Number(id), ingredient_ids || [])
        }

        // Mettre à jour les champs dans la table recipes
        const recipeUpdate: Record<string, string[] | number | null> = {}
        if (ingredients_name !== undefined) {
            recipeUpdate.ingredients_name = ingredients_name
        }
        if (base_servings !== undefined) {
            recipeUpdate.base_servings = base_servings
        }

        if (Object.keys(recipeUpdate).length > 0) {
            await recipeRepo.update(Number(id), recipeUpdate)
        }

        return Response.json({ success: true })
    } catch (error) {
        console.error('Failed to update recipe ingredients:', error)
        return Response.json({ error: 'Failed to update ingredients' }, { status: 500 })
    }
}
