import { supabaseServer } from '@/lib/supabase/server-client'

export async function GET() {
    try {
        const { data, error } = await supabaseServer
            .from('unsubscribe_feedbacks')
            .select('*, user_profile:user_profiles!user_profile_id(firstname, email)')
            .order('created_at', { ascending: false })

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ data })
    } catch (error) {
        console.error('Erreur lors de la récupération des retours de désabonnement:', error)
        return Response.json(
            { error: 'Erreur lors de la récupération des retours de désabonnement' },
            { status: 500 }
        )
    }
}
