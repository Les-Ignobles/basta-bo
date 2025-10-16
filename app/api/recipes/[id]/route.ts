import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { RecipeRepository } from '@/features/cooking/repositories/recipe-repository'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const recipeId = Number(id)
    const repo = new RecipeRepository(supabaseServer)

    try {
        const recipe = await repo.findById(recipeId)
        if (!recipe) {
            return Response.json({ error: 'Recipe not found' }, { status: 404 })
        }
        return Response.json({ data: recipe })
    } catch (error) {
        console.error('Failed to fetch recipe:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
