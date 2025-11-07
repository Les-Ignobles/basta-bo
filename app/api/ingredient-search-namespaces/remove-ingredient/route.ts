import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientSearchNamespaceRepository } from '@/features/cooking/repositories/ingredient-search-namespace-repository'

/**
 * POST /api/ingredient-search-namespaces/remove-ingredient
 * Retire un ingrédient d'un namespace
 */
export async function POST(request: NextRequest) {
  try {
    const repository = new IngredientSearchNamespaceRepository(supabaseServer)

    const body = await request.json()
    const { ingredientId, bitIndex } = body

    if (!ingredientId || bitIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: ingredientId, bitIndex' },
        { status: 400 }
      )
    }

    await repository.removeIngredientFromNamespace(ingredientId, bitIndex)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/ingredient-search-namespaces/remove-ingredient]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
