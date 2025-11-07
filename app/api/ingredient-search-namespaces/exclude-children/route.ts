import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientSearchNamespaceRepository } from '@/features/cooking/repositories/ingredient-search-namespace-repository'

/**
 * POST /api/ingredient-search-namespaces/exclude-children
 * Exclut tous les enfants d'un ingrédient des namespaces spécifiés
 */
export async function POST(request: NextRequest) {
  try {
    const repository = new IngredientSearchNamespaceRepository(supabaseServer)

    const body = await request.json()
    const { parentIngredientId, namespaceBitIndexes } = body

    if (!parentIngredientId || !Array.isArray(namespaceBitIndexes)) {
      return NextResponse.json(
        { error: 'Missing required fields: parentIngredientId (number), namespaceBitIndexes (array)' },
        { status: 400 }
      )
    }

    const result = await repository.excludeChildrenFromNamespaces(
      parentIngredientId,
      namespaceBitIndexes
    )

    return NextResponse.json({
      success: true,
      excludedCount: result.excludedCount,
      childrenIds: result.childrenIds,
    })
  } catch (error) {
    console.error('[POST /api/ingredient-search-namespaces/exclude-children]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
