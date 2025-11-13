import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientRepository } from '@/features/cooking/repositories/ingredient-repository'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const ingredientId = Number(id)

    if (isNaN(ingredientId)) {
        return Response.json({ error: 'Invalid ingredient ID' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)

    // Extraire les filtres depuis les query params
    const search = searchParams.get('search') ?? undefined
    const noImage = searchParams.get('noImage') === 'true'
    const categoriesParam = searchParams.get('categories')
    const categories = categoriesParam ? categoriesParam.split(',').map(Number) : undefined
    const translationFilterParam = searchParams.get('translationFilter')
    const translationFilter = translationFilterParam && translationFilterParam !== 'all'
        ? translationFilterParam as 'incomplete' | 'complete'
        : undefined

    const repo = new IngredientRepository(supabaseServer)

    try {
        const navigation = await repo.findAdjacentIngredients(ingredientId, {
            search,
            noImage,
            categories,
            translationFilter
        })
        return Response.json({ data: navigation })
    } catch (error) {
        console.error('Error fetching adjacent ingredients:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
