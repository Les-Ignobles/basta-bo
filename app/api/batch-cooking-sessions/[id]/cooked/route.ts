import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { BatchCookingSessionRepository } from '@/features/cooking/repositories/batch-cooking-session-repository'

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const repo = new BatchCookingSessionRepository(supabaseServer)
        const id = parseInt(params.id)

        const session = await repo.markAsCooked(id)
        return Response.json(session)
    } catch (error) {
        console.error('Erreur lors du marquage comme cuisiné:', error)
        return Response.json(
            { error: 'Erreur lors du marquage comme cuisiné' },
            { status: 500 }
        )
    }
}
