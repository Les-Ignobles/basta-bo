import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { BatchCookingSessionReviewRepository } from '@/features/cooking/repositories/batch-cooking-session-review-repository'

export async function GET(req: NextRequest) {
    try {
        const repo = new BatchCookingSessionReviewRepository(supabaseServer)
        const { searchParams } = new URL(req.url)

        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '20')

        const result = await repo.findPage(page, pageSize)
        return Response.json(result)
    } catch (error) {
        console.error('Erreur lors de la récupération des reviews:', error)
        return Response.json(
            { error: 'Erreur lors de la récupération des reviews', details: error instanceof Error ? error.message : 'Erreur inconnue' },
            { status: 500 }
        )
    }
}
