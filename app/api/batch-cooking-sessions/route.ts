import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { BatchCookingSessionRepository } from '@/features/cooking/repositories/batch-cooking-session-repository'

export async function GET(req: NextRequest) {
    try {
        console.log('Début de la requête GET /api/batch-cooking-sessions')
        const repo = new BatchCookingSessionRepository(supabaseServer)
        const { searchParams } = new URL(req.url)

        // Paramètres de pagination
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '50')

        console.log('Paramètres:', { page, pageSize })

        // Filtres
        const filters = {
            search: searchParams.get('search') || undefined,
            is_original: searchParams.get('is_original') === 'true' ? true : searchParams.get('is_original') === 'false' ? false : undefined,
            is_cooked: searchParams.get('is_cooked') === 'true' ? true : searchParams.get('is_cooked') === 'false' ? false : undefined,
            recipe_generation_status: searchParams.get('recipe_generation_status') || undefined,
            ingredient_generation_status: searchParams.get('ingredient_generation_status') || undefined,
            cooking_step_generation_status: searchParams.get('cooking_step_generation_status') || undefined,
            assembly_step_generation_status: searchParams.get('assembly_step_generation_status') || undefined,
            created_by: searchParams.get('created_by') ? parseInt(searchParams.get('created_by')!) : undefined
        }

        // Supprimer les valeurs undefined
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value !== undefined)
        )

        console.log('Filtres nettoyés:', cleanFilters)

        const result = await repo.findPage(page, pageSize, cleanFilters)
        console.log('Résultat:', { total: result.total, dataLength: result.data.length })
        return Response.json(result)
    } catch (error) {
        console.error('Erreur lors de la récupération des batch cooking sessions:', error)
        return Response.json(
            { error: 'Erreur lors de la récupération des sessions', details: error instanceof Error ? error.message : 'Erreur inconnue' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const repo = new BatchCookingSessionRepository(supabaseServer)
        const body = await req.json()

        const session = await repo.create(body)
        return Response.json(session, { status: 201 })
    } catch (error) {
        console.error('Erreur lors de la création de la batch cooking session:', error)
        return Response.json(
            { error: 'Erreur lors de la création de la session' },
            { status: 500 }
        )
    }
}
