import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params

        // Fetch user profile
        const { data: profile, error: profileError } = await supabaseServer
            .from('user_profiles')
            .select('id, firstname, email, created_at, appetite, diets, allergies, kitchen_equipment, liked_ingredients, disliked_ingredients, batch_cooking_frequency, batch_cooking_goals, meal_people_quantity, time_saved, money_saved, premium_sub_end_at')
            .eq('id', Number(id))
            .single()

        if (profileError) throw profileError

        // Fetch reference data to resolve IDs to names
        const likedIds = profile.liked_ingredients ?? []
        const dislikedIds = profile.disliked_ingredients ?? []
        const ingredientIds = [...likedIds, ...dislikedIds].filter((id: number) => id > 0)

        const [allergiesRes, dietsRes, equipmentsRes, ingredientsRes] = await Promise.all([
            supabaseServer.from('allergies').select('id, name'),
            supabaseServer.from('diets').select('id, title, emoji'),
            supabaseServer.from('kitchen_equipments').select('id, name, emoji'),
            ingredientIds.length > 0
                ? supabaseServer.from('ingredients').select('id, name').in('id', ingredientIds)
                : Promise.resolve({ data: [] }),
        ])

        // Resolve IDs to labels
        const allergyMap = Object.fromEntries((allergiesRes.data ?? []).map((a: { id: number; name: { fr: string } }) => [a.id, a.name.fr]))
        const dietMap = Object.fromEntries((dietsRes.data ?? []).map((d: { id: number; title: { fr: string }; emoji: string }) => [d.id, `${d.emoji} ${d.title.fr}`]))
        const equipmentMap = Object.fromEntries((equipmentsRes.data ?? []).map((e: { id: number; name: { fr: string }; emoji: string }) => [e.id, `${e.emoji} ${e.name.fr}`]))
        const ingredientMap = Object.fromEntries((ingredientsRes.data ?? []).map((i: { id: number; name: string | { fr: string } }) => [i.id, typeof i.name === 'object' ? i.name.fr : i.name]))

        const resolvedProfile = {
            ...profile,
            allergies_labels: (profile.allergies ?? []).map((id: number) => allergyMap[id]).filter(Boolean),
            diets_labels: (profile.diets ?? []).map((id: number) => dietMap[id]).filter(Boolean),
            kitchen_equipment_labels: (profile.kitchen_equipment ?? []).map((id: number) => equipmentMap[id]).filter(Boolean),
            liked_ingredients_labels: likedIds.map((id: number) => ingredientMap[id]).filter(Boolean),
            disliked_ingredients_labels: dislikedIds.map((id: number) => ingredientMap[id]).filter(Boolean),
        }

        // Fetch sessions
        const { data: sessions, error: sessionsError } = await supabaseServer
            .from('batch_cooking_sessions')
            .select('id, created_at, meal_count, people_count, recipe_count, is_cooked, cooked_at, total_cooking_time')
            .eq('created_by', Number(id))
            .order('created_at', { ascending: false })

        if (sessionsError) throw sessionsError

        return Response.json({ profile: resolvedProfile, sessions: sessions ?? [] })
    } catch (error) {
        console.error('Error fetching user detail:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
