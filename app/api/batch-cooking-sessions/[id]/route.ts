import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { BatchCookingSessionRepository } from '@/features/cooking/repositories/batch-cooking-session-repository'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const repo = new BatchCookingSessionRepository(supabaseServer)
        const sessionId = parseInt(id)

        const session = await repo.findById(sessionId)
        if (!session) {
            return Response.json(
                { error: 'Session non trouvée' },
                { status: 404 }
            )
        }

        return Response.json(session)
    } catch (error) {
        console.error('Erreur lors de la récupération de la session:', error)
        return Response.json(
            { error: 'Erreur lors de la récupération de la session' },
            { status: 500 }
        )
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const repo = new BatchCookingSessionRepository(supabaseServer)
        const sessionId = parseInt(id)
        const body = await req.json()

        const session = await repo.update(sessionId, body)
        return Response.json(session)
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la session:', error)
        return Response.json(
            { error: 'Erreur lors de la mise à jour de la session' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const repo = new BatchCookingSessionRepository(supabaseServer)
        const sessionId = parseInt(id)

        await repo.delete(sessionId)
        return Response.json({ success: true })
    } catch (error) {
        console.error('Erreur lors de la suppression de la session:', error)
        return Response.json(
            { error: 'Erreur lors de la suppression de la session' },
            { status: 500 }
        )
    }
}
