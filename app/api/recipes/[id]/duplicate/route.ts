import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'

/**
 * POST /api/recipes/[id]/duplicate
 * Duplique intégralement une recette : la ligne `recipes` (titre, version textuelle,
 * classification/options, critères…), ses ingrédients (pivot), ses étapes de
 * préparation (`recipe_actions`) et ses catégories (pivot, avec position).
 *
 * La copie est créée masquée (`is_visible = false`) avec « (Copie) » ajouté au titre.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const sourceId = Number(id)

    if (!Number.isFinite(sourceId)) {
        return Response.json({ error: 'Invalid recipe id' }, { status: 400 })
    }

    try {
        // 1) Recette source (toutes les colonnes)
        const { data: source, error: sourceError } = await supabaseServer
            .from('recipes')
            .select('*')
            .eq('id', sourceId)
            .single()

        if (sourceError || !source) {
            return Response.json({ error: 'Recipe not found' }, { status: 404 })
        }

        // 2) Construire la ligne dupliquée
        const insertRow: Record<string, unknown> = { ...source }
        delete insertRow.id
        delete insertRow.created_at
        // Les embeddings seront recalculés pour la copie
        delete insertRow.name_embedding
        delete insertRow.name_embedding_test
        insertRow.title = `${source.title} (Copie)`
        insertRow.is_visible = false // la copie est masquée
        insertRow.is_new = false
        insertRow.parent_id = null // copie indépendante
        insertRow.batchcooking_usage_count = 0

        const { data: created, error: createError } = await supabaseServer
            .from('recipes')
            .insert(insertRow)
            .select('*')
            .single()

        if (createError || !created) {
            throw createError ?? new Error('Failed to create duplicated recipe')
        }

        const newId = created.id as number

        // 3) Ingrédients (pivot)
        const { data: pivots, error: pivotError } = await supabaseServer
            .from('ingredient_recipe_pivot')
            .select('ingredient_id, quantity, unit, is_optional, weight_in_grams')
            .eq('recipe_id', sourceId)
        if (pivotError) throw pivotError
        if (pivots && pivots.length > 0) {
            const { error } = await supabaseServer
                .from('ingredient_recipe_pivot')
                .insert(pivots.map((p) => ({ ...p, recipe_id: newId })))
            if (error) throw error
        }

        // 4) Étapes de préparation
        const { data: actions, error: actionsError } = await supabaseServer
            .from('recipe_actions')
            .select('step_index, action_type, equipment, normalized_instruction, duration_minutes, passive_time_minutes, ingredients, phase')
            .eq('recipe_id', sourceId)
        if (actionsError) throw actionsError
        if (actions && actions.length > 0) {
            const { error } = await supabaseServer
                .from('recipe_actions')
                .insert(actions.map((a) => ({ ...a, recipe_id: newId })))
            if (error) throw error
        }

        // 5) Catégories (pivot, avec position)
        const { data: cats, error: catsError } = await supabaseServer
            .from('recipe_category_pivot')
            .select('category_id, position')
            .eq('recipe_id', sourceId)
        if (catsError) throw catsError
        if (cats && cats.length > 0) {
            const { error } = await supabaseServer
                .from('recipe_category_pivot')
                .insert(cats.map((c) => ({ ...c, recipe_id: newId })))
            if (error) throw error
        }

        return Response.json({ data: created })
    } catch (error) {
        console.error('[POST /api/recipes/[id]/duplicate]', error)
        return Response.json(
            { error: error instanceof Error ? error.message : 'Duplication failed' },
            { status: 500 }
        )
    }
}
