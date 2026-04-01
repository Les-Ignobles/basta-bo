import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; actionId: string }> }
) {
    const { actionId } = await params
    const body = await req.json()

    try {
        const { data, error } = await supabaseServer
            .from('recipe_actions')
            .update(body)
            .eq('id', Number(actionId))
            .select('*')
            .single()

        if (error) throw error

        return Response.json({ data })
    } catch (error) {
        console.error('Failed to update recipe action:', error)
        return Response.json({ error: 'Failed to update recipe action' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; actionId: string }> }
) {
    const { actionId } = await params

    try {
        const { error } = await supabaseServer
            .from('recipe_actions')
            .delete()
            .eq('id', Number(actionId))

        if (error) throw error

        return Response.json({ success: true })
    } catch (error) {
        console.error('Failed to delete recipe action:', error)
        return Response.json({ error: 'Failed to delete recipe action' }, { status: 500 })
    }
}
