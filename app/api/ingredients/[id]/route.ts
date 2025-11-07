import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientRepository } from '@/features/cooking/repositories/ingredient-repository'
import { IngredientRecipePivotRepository } from '@/features/cooking/repositories/ingredient-recipe-pivot-repository'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const ingredientId = Number(params.id)

    if (isNaN(ingredientId)) {
        return Response.json({ error: 'Invalid ingredient ID' }, { status: 400 })
    }

    const ingredientRepo = new IngredientRepository(supabaseServer)
    const pivotRepo = new IngredientRecipePivotRepository(supabaseServer)

    try {
        const ingredient = await ingredientRepo.findById(ingredientId)
        if (!ingredient) {
            return Response.json({ error: 'Ingredient not found' }, { status: 404 })
        }

        const recipes = await pivotRepo.findRecipesForIngredient(ingredientId)

        return Response.json({ data: { ingredient, recipes } })
    } catch (error) {
        console.error('Error fetching ingredient details:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
