import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { BatchCookingSessionRepository } from '@/features/cooking/repositories/batch-cooking-session-repository'

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const repo = new BatchCookingSessionRepository(supabaseServer)
        const sessionId = parseInt(id)

        const session = await repo.markAsCooked(sessionId)
        return Response.json(session)
    } catch (error) {
        console.error('Erreur lors du marquage comme cuisiné:', error)
        return Response.json(
            { error: 'Erreur lors du marquage comme cuisiné' },
            { status: 500 }
        )
    }
}
