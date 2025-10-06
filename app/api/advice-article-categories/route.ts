import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { AdviceArticleCategoryRepository } from '@/features/advice/repositories/advice-article-category-repository'

export async function GET(req: NextRequest) {
    const repo = new AdviceArticleCategoryRepository(supabaseServer)
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') ?? '1')
    const pageSize = Number(searchParams.get('pageSize') ?? '50')
    const search = searchParams.get('search') ?? undefined
    const translationFilter = searchParams.get('translationFilter') as 'incomplete' | 'complete' | undefined

    const { data, total } = await repo.findPage({ search, page, pageSize, translationFilter })

    return Response.json({ data, total, page, pageSize })
}

export async function POST(req: NextRequest) {
    const payload = await req.json()
    console.log(payload)
    const repo = new AdviceArticleCategoryRepository(supabaseServer)
    const created = await repo.create(payload)
    return Response.json({ data: created })
}

export async function PUT(req: NextRequest) {
    const payload = await req.json()
    const { id, ...rest } = payload
    const repo = new AdviceArticleCategoryRepository(supabaseServer)
    const updated = await repo.update(Number(id), rest)
    return Response.json({ data: updated })
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    const repo = new AdviceArticleCategoryRepository(supabaseServer)
    await repo.delete(id)
    return Response.json({ ok: true })
}
