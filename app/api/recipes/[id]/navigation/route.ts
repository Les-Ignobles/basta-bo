import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { RecipeRepository } from '@/features/cooking/repositories/recipe-repository'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const recipeId = Number(id)

    if (isNaN(recipeId)) {
        return Response.json({ error: 'Invalid recipe ID' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)

    // Extraire les filtres depuis les query params
    const search = searchParams.get('search') ?? undefined
    const noImage = searchParams.get('noImage') === 'true'
    const dishTypeParam = searchParams.get('dishType')
    const dishType = dishTypeParam && dishTypeParam !== 'all' ? Number(dishTypeParam) : undefined
    const dietsParam = searchParams.get('diets')
    const diets = dietsParam ? dietsParam.split(',').map(Number) : undefined
    const kitchenEquipmentsParam = searchParams.get('kitchenEquipments')
    const kitchenEquipments = kitchenEquipmentsParam ? kitchenEquipmentsParam.split(',').map(Number) : undefined
    const quantificationTypeParam = searchParams.get('quantificationType')
    const quantificationType = quantificationTypeParam && quantificationTypeParam !== 'all' ? Number(quantificationTypeParam) : undefined
    const isVisibleParam = searchParams.get('isVisible')
    const isVisible = isVisibleParam ? isVisibleParam === 'true' : undefined
    const isFolkloreParam = searchParams.get('isFolklore')
    const isFolklore = isFolkloreParam ? isFolkloreParam === 'true' : undefined

    const repo = new RecipeRepository(supabaseServer)

    try {
        const navigation = await repo.findAdjacentRecipes(recipeId, {
            search,
            noImage,
            dishType,
            diets,
            kitchenEquipments,
            quantificationType,
            isVisible,
            isFolklore
        })
        return Response.json({ data: navigation })
    } catch (error) {
        console.error('Error fetching adjacent recipes:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
