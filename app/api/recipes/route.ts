import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { RecipeRepository } from '@/features/cooking/repositories/recipe-repository'

export async function GET(req: NextRequest) {
    const repo = new RecipeRepository(supabaseServer)
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') ?? '1')
    const pageSize = Number(searchParams.get('pageSize') ?? '10')
    const search = searchParams.get('search') ?? undefined
    const noImage = (searchParams.get('noImage') ?? 'false') === 'true'
    const dishTypeParam = searchParams.get('dishType')
    const dishType = dishTypeParam ? Number(dishTypeParam) : undefined
    const dietsParam = searchParams.get('diets')
    const diets = dietsParam ? dietsParam.split(',').map(Number) : undefined
    const { data, total } = await repo.findPage({ search, page, pageSize, noImage, dishType, diets })
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
