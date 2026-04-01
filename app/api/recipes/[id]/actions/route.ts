import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const body = await req.json()

    try {
        const { data, error } = await supabaseServer
            .from('recipe_actions')
            .insert({
                recipe_id: Number(id),
                step_index: body.step_index ?? 0,
                action_type: body.action_type ?? 'cut',
                equipment: body.equipment ?? null,
                raw_instruction: body.raw_instruction ?? '',
                normalized_instruction: body.normalized_instruction ?? '',
                duration_minutes: body.duration_minutes ?? 0,
                passive_time_minutes: body.passive_time_minutes ?? 0,
                ingredients: body.ingredients ?? [],
                phase: body.phase ?? 'cooking',
            })
            .select('*')
            .single()

        if (error) throw error

        return Response.json({ data })
    } catch (error) {
        console.error('Failed to create recipe action:', error)
        return Response.json({ error: 'Failed to create recipe action' }, { status: 500 })
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const { data, error } = await supabaseServer
            .from('recipe_actions')
            .select('*')
            .eq('recipe_id', Number(id))
            .order('step_index', { ascending: true })

        if (error) throw error

        return Response.json({ data: data ?? [] })
    } catch (error) {
        console.error('Failed to fetch recipe actions:', error)
        return Response.json({ error: 'Failed to fetch recipe actions' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const { error } = await supabaseServer
            .from('recipe_actions')
            .delete()
            .eq('recipe_id', Number(id))

        if (error) throw error

        return Response.json({ success: true })
    } catch (error) {
        console.error('Failed to delete recipe actions:', error)
        return Response.json({ error: 'Failed to delete recipe actions' }, { status: 500 })
    }
}
