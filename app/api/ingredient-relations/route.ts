import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientRelationRepository } from '@/features/cooking/repositories/ingredient-relation-repository'
import {
  IngredientRelationType,
  CreateIngredientRelationPayload,
} from '@/features/cooking/types/ingredient-relation'

/**
 * GET /api/ingredient-relations
 * Récupère toutes les relations avec filtres optionnels
 */
export async function GET(request: NextRequest) {
  try {
    const repository = new IngredientRelationRepository(supabaseServer)

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)
    const ingredientId = searchParams.get('ingredientId')
      ? parseInt(searchParams.get('ingredientId')!, 10)
      : undefined
    const relationType = searchParams.get('relationType') as IngredientRelationType | undefined

    const { data, total } = await repository.findAllWithNames({
      ingredientId,
      relationType,
      page,
      pageSize,
    })

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('[GET /api/ingredient-relations]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ingredient-relations
 * Crée une nouvelle relation (simple ou bidirectionnelle)
 */
export async function POST(request: NextRequest) {
  try {
    const repository = new IngredientRelationRepository(supabaseServer)

    const body = await request.json()
    const { ingredient_id, related_ingredient_id, relation_type, bidirectional } = body

    // Validation
    if (!ingredient_id || !related_ingredient_id || !relation_type) {
      return NextResponse.json(
        { error: 'Missing required fields: ingredient_id, related_ingredient_id, relation_type' },
        { status: 400 }
      )
    }

    if (ingredient_id === related_ingredient_id) {
      return NextResponse.json({ error: 'Cannot create self-relation' }, { status: 400 })
    }

    const payload: CreateIngredientRelationPayload = {
      ingredient_id,
      related_ingredient_id,
      relation_type: relation_type as IngredientRelationType,
    }

    const data = bidirectional
      ? await repository.createBidirectional(payload)
      : await repository.create(payload)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[POST /api/ingredient-relations]', error)

    // Gestion erreur contrainte unique
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: 'Cette relation existe déjà' }, { status: 409 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ingredient-relations?id=123
 * Supprime une relation par ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const repository = new IngredientRelationRepository(supabaseServer)

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    await repository.deleteById(parseInt(id, 10))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/ingredient-relations]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
