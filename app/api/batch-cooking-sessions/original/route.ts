import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { BatchCookingSessionRepository } from '@/features/cooking/repositories/batch-cooking-session-repository'

export async function GET(req: NextRequest) {
    try {
        const repo = new BatchCookingSessionRepository(supabaseServer)
        const { searchParams } = new URL(req.url)

        // Paramètres de pagination
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '50')

        // Filtres (sans is_original car on force à true)
        const filters = {
            search: searchParams.get('search') || undefined,
            is_cooked: searchParams.get('is_cooked') === 'true' ? true : searchParams.get('is_cooked') === 'false' ? false : undefined,
            recipe_generation_status: searchParams.get('recipe_generation_status') || undefined,
            ingredient_generation_status: searchParams.get('ingredient_generation_status') || undefined,
            cooking_step_generation_status: searchParams.get('cooking_step_generation_status') || undefined,
            assembly_step_generation_status: searchParams.get('assembly_step_generation_status') || undefined,
            created_by: searchParams.get('created_by') ? parseInt(searchParams.get('created_by')!) : undefined
        }

        // Supprimer les valeurs undefined
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== undefined)
        )

        const result = await repo.findOriginalSessions(page, pageSize, cleanFilters)
        return Response.json(result)
    } catch (error) {
        console.error('Erreur lors de la récupération des sessions originales:', error)
        return Response.json(
            { error: 'Erreur lors de la récupération des sessions originales' },
            { status: 500 }
        )
    }
}
