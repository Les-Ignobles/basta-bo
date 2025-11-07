import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientSearchNamespaceRepository } from '@/features/cooking/repositories/ingredient-search-namespace-repository'

/**
 * GET /api/ingredient-search-namespaces/[bitIndex]/ingredients
 * Récupère tous les ingrédients avec leur statut pour un namespace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bitIndex: string }> }
) {
  try {
    const { bitIndex } = await params
    const repository = new IngredientSearchNamespaceRepository(supabaseServer)

    const data = await repository.getIngredientsForNamespace(parseInt(bitIndex, 10))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/ingredient-search-namespaces/[bitIndex]/ingredients]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
