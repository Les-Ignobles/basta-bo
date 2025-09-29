import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientRepository } from '@/features/cooking/repositories/ingredient-repository'

export async function GET() {
    const repo = new IngredientRepository(supabaseServer)
    const data = await repo.findAll()
    return Response.json({ data })
}

export async function POST(req: NextRequest) {
    const payload = await req.json()
    const repo = new IngredientRepository(supabaseServer)
    const created = await repo.create(payload)
    return Response.json({ data: created })
}


