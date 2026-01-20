import { NextRequest, NextResponse } from 'next/server'
import { RecipeCategoryPivotRepository } from '@/features/cooking/repositories/recipe-category-pivot-repository'
import { supabaseServer } from '@/lib/supabase/server-client'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const recipeId = Number(id)

        if (isNaN(recipeId)) {
            return NextResponse.json(
                { error: 'Invalid recipe ID' },
                { status: 400 }
            )
        }

        const repo = new RecipeCategoryPivotRepository(supabaseServer)
        const categoryIds = await repo.getCategoryIdsByRecipeId(recipeId)

        return NextResponse.json({ data: categoryIds })
    } catch (error) {
        console.error('Error fetching recipe categories:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recipe categories' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const recipeId = Number(id)

        if (isNaN(recipeId)) {
            return NextResponse.json(
                { error: 'Invalid recipe ID' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { categoryIds } = body

        if (!Array.isArray(categoryIds)) {
            return NextResponse.json(
                { error: 'categoryIds must be an array' },
                { status: 400 }
            )
        }

        const repo = new RecipeCategoryPivotRepository(supabaseServer)
        await repo.syncCategories(recipeId, categoryIds)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error syncing recipe categories:', error)
        return NextResponse.json(
            { error: 'Failed to sync recipe categories' },
            { status: 500 }
        )
    }
}
