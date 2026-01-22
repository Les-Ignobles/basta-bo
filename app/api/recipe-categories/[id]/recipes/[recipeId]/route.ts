import { NextRequest, NextResponse } from 'next/server'
import { RecipeCategoryPivotRepository } from '@/features/cooking/repositories/recipe-category-pivot-repository'
import { supabaseServer } from '@/lib/supabase/server-client'

interface RouteParams {
    params: Promise<{ id: string; recipeId: string }>
}

/**
 * DELETE /api/recipe-categories/[id]/recipes/[recipeId]
 * Removes a recipe from a category (deletes the pivot entry)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id, recipeId } = await params
        const categoryId = parseInt(id, 10)
        const recipeIdNum = parseInt(recipeId, 10)

        if (isNaN(categoryId) || isNaN(recipeIdNum)) {
            return NextResponse.json(
                { error: 'Invalid category or recipe ID' },
                { status: 400 }
            )
        }

        const repo = new RecipeCategoryPivotRepository(supabaseServer)
        await repo.removeCategory(recipeIdNum, categoryId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error removing recipe from category:', error)
        return NextResponse.json(
            { error: 'Failed to remove recipe from category' },
            { status: 500 }
        )
    }
}
