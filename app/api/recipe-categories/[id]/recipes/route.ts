import { NextRequest, NextResponse } from 'next/server'
import { RecipeCategoryPivotRepository } from '@/features/cooking/repositories/recipe-category-pivot-repository'
import { supabaseServer } from '@/lib/supabase/server-client'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * GET /api/recipe-categories/[id]/recipes
 * Returns recipes for a category ordered by position
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const categoryId = parseInt(id, 10)

        if (isNaN(categoryId)) {
            return NextResponse.json(
                { error: 'Invalid category ID' },
                { status: 400 }
            )
        }

        const repo = new RecipeCategoryPivotRepository(supabaseServer)
        const recipes = await repo.getRecipesByCategoryOrdered(categoryId)

        return NextResponse.json({ data: recipes })
    } catch (error) {
        console.error('Error fetching recipes for category:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recipes for category' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/recipe-categories/[id]/recipes
 * Adds a recipe to the category with the next available position
 * Body: { recipe_id: number }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const categoryId = parseInt(id, 10)

        if (isNaN(categoryId)) {
            return NextResponse.json(
                { error: 'Invalid category ID' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { recipe_id } = body

        if (typeof recipe_id !== 'number') {
            return NextResponse.json(
                { error: 'recipe_id must be a number' },
                { status: 400 }
            )
        }

        const repo = new RecipeCategoryPivotRepository(supabaseServer)
        const addedRecipe = await repo.addRecipeToCategory(categoryId, recipe_id)

        return NextResponse.json({ data: addedRecipe })
    } catch (error) {
        console.error('Error adding recipe to category:', error)
        const message = error instanceof Error ? error.message : 'Failed to add recipe to category'
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/recipe-categories/[id]/recipes
 * Updates recipe positions within a category
 * Body: { recipe_ids: number[] } - array of recipe IDs in the new order
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const categoryId = parseInt(id, 10)

        if (isNaN(categoryId)) {
            return NextResponse.json(
                { error: 'Invalid category ID' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { recipe_ids } = body

        if (!Array.isArray(recipe_ids)) {
            return NextResponse.json(
                { error: 'recipe_ids must be an array' },
                { status: 400 }
            )
        }

        const repo = new RecipeCategoryPivotRepository(supabaseServer)
        await repo.updateRecipePositions(categoryId, recipe_ids)

        // Return updated order
        const updatedRecipes = await repo.getRecipesByCategoryOrdered(categoryId)

        return NextResponse.json({ data: updatedRecipes })
    } catch (error) {
        console.error('Error updating recipe positions:', error)
        return NextResponse.json(
            { error: 'Failed to update recipe positions' },
            { status: 500 }
        )
    }
}
