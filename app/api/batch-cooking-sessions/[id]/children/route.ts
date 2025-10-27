import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { BatchCookingSessionRepository } from '@/features/cooking/repositories/batch-cooking-session-repository'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const repo = new BatchCookingSessionRepository(supabaseServer)
        const parentId = parseInt(params.id)

        const children = await repo.findChildrenByParentId(parentId)
        return Response.json(children)
    } catch (error) {
        console.error('Erreur lors de la récupération des sessions enfants:', error)
        return Response.json(
            { error: 'Erreur lors de la récupération des sessions enfants' },
            { status: 500 }
        )
    }
}
