import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { UserRepository } from '@/features/users/repositories/user-repository'

export async function GET(req: NextRequest) {
    try {
        const repo = new UserRepository(supabaseServer)
        const { searchParams } = new URL(req.url)
        const page = Number(searchParams.get('page') ?? '1')
        const pageSize = Number(searchParams.get('pageSize') ?? '50')
        const search = searchParams.get('search') ?? undefined
        const sortBy = searchParams.get('sortBy') ?? undefined
        const sortOrder = (searchParams.get('sortOrder') ?? undefined) as 'asc' | 'desc' | undefined

        const { data, total } = await repo.findActiveUsers({ page, pageSize, search, sortBy, sortOrder })
        return Response.json({ data, total, page, pageSize })
    } catch (error) {
        console.error('Error fetching users:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
