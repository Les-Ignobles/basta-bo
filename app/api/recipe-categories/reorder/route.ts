import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { RecipeCategoryRepository } from '@/features/cooking/repositories/recipe-category-repository'

type ReorderUpdate = {
    id: number
    chip_order?: number
    section_order?: number
    display_as_chip?: boolean
    display_as_section?: boolean
}

/**
 * PUT /api/recipe-categories/reorder
 * Body: { updates: ReorderUpdate[] }
 * Applique un lot de changements d'ordre/placement en un seul appel
 * (remplace la boucle de PUT unitaires du drag & drop).
 */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const updates: ReorderUpdate[] = body?.updates

        if (!Array.isArray(updates) || updates.length === 0) {
            return Response.json(
                { error: 'updates must be a non-empty array' },
                { status: 400 }
            )
        }

        const allowedKeys = new Set(['id', 'chip_order', 'section_order', 'display_as_chip', 'display_as_section'])
        for (const update of updates) {
            if (typeof update?.id !== 'number') {
                return Response.json({ error: 'Each update requires a numeric id' }, { status: 400 })
            }
            for (const key of Object.keys(update)) {
                if (!allowedKeys.has(key)) {
                    return Response.json({ error: `Unexpected field: ${key}` }, { status: 400 })
                }
            }
        }

        const repo = new RecipeCategoryRepository(supabaseServer)
        await repo.bulkReorder(updates)

        return Response.json({ success: true, count: updates.length })
    } catch (error) {
        console.error('Error bulk reordering categories:', error)
        return Response.json(
            { error: 'Erreur lors du réordonnancement des catégories' },
            { status: 500 }
        )
    }
}
