import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientRelationRepository } from '@/features/cooking/repositories/ingredient-relation-repository'

/**
 * DELETE /api/ingredient-relations/bidirectional
 * Supprime une relation bidirectionnelle (A → B et B → A)
 */
export async function DELETE(request: NextRequest) {
  try {
    const repository = new IngredientRelationRepository(supabaseServer)

    const body = await request.json()
    const { ingredientId, relatedIngredientId } = body

    if (!ingredientId || !relatedIngredientId) {
      return NextResponse.json(
        { error: 'Missing required fields: ingredientId, relatedIngredientId' },
        { status: 400 }
      )
    }

    await repository.deleteBidirectional(ingredientId, relatedIngredientId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/ingredient-relations/bidirectional]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
