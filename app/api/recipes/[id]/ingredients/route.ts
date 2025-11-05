import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientRecipePivotRepository } from '@/features/cooking/repositories/ingredient-recipe-pivot-repository'
import { RecipeRepository } from '@/features/cooking/repositories/recipe-repository'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const pivotRepo = new IngredientRecipePivotRepository(supabaseServer)

    try {
        const ingredients = await pivotRepo.findIngredientsForRecipe(Number(id))
        return Response.json({ data: ingredients })
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
    const { ingredient_ids, ingredients_name } = await req.json()
    const pivotRepo = new IngredientRecipePivotRepository(supabaseServer)
    const recipeRepo = new RecipeRepository(supabaseServer)

    try {
        // Mettre à jour la table pivot
        await pivotRepo.syncRecipeIngredients(Number(id), ingredient_ids || [])

        // Mettre à jour le champ ingredients_name dans la table recipes
        if (ingredients_name !== undefined) {
            await recipeRepo.update(Number(id), { ingredients_name })
        }

        return Response.json({ success: true })
    } catch (error) {
        console.error('Failed to update recipe ingredients:', error)
        return Response.json({ error: 'Failed to update ingredients' }, { status: 500 })
    }
}
