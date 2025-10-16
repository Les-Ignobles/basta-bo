import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { RecipeRepository } from '@/features/cooking/repositories/recipe-repository'

export async function GET(req: NextRequest) {
    const repo = new RecipeRepository(supabaseServer)
    const { searchParams } = new URL(req.url)

    // Si un id est fourni en query parameter, rediriger vers la route spécifique
    const id = searchParams.get('id')
    if (id) {
        // Rediriger vers la route [id]
        const recipe = await repo.findById(Number(id))
        if (!recipe) {
            return Response.json({ error: 'Recipe not found' }, { status: 404 })
        }
        return Response.json({ data: recipe })
    }

    // Sinon, gérer la pagination des listes
    const page = Number(searchParams.get('page') ?? '1')
    const pageSize = Number(searchParams.get('pageSize') ?? '10')
    const search = searchParams.get('search') ?? undefined
    const noImage = (searchParams.get('noImage') ?? 'false') === 'true'
    const dishTypeParam = searchParams.get('dishType')
    const dishType = dishTypeParam ? Number(dishTypeParam) : undefined
    const dietsParam = searchParams.get('diets')
    const diets = dietsParam ? dietsParam.split(',').map(Number) : undefined
    const quantificationTypeParam = searchParams.get('quantificationType')
    const quantificationType = quantificationTypeParam ? Number(quantificationTypeParam) : undefined
    const isVisibleParam = searchParams.get('isVisible')
    const isVisible = isVisibleParam ? isVisibleParam === 'true' : undefined
    const isFolkloreParam = searchParams.get('isFolklore')
    const isFolklore = isFolkloreParam ? isFolkloreParam === 'true' : undefined

    const { data, total } = diets && diets.length > 0
        ? await repo.findPageWithDiets({ search, page, pageSize, noImage, dishType, diets, quantificationType, isVisible, isFolklore })
        : await repo.findPage({ search, page, pageSize, noImage, dishType, quantificationType, isVisible, isFolklore })
    return Response.json({ data, total, page, pageSize })
}

export async function POST(req: NextRequest) {
    const payload = await req.json()
    const repo = new RecipeRepository(supabaseServer)
    const created = await repo.create(payload)
    return Response.json({ data: created })
}

export async function PUT(req: NextRequest) {
    const payload = await req.json()
    const { id, ...rest } = payload
    const repo = new RecipeRepository(supabaseServer)
    const updated = await repo.update(Number(id), rest)
    return Response.json({ data: updated })
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    const repo = new RecipeRepository(supabaseServer)
    await repo.delete(id)
    return Response.json({ ok: true })
}
