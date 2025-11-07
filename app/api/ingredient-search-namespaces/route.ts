import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientSearchNamespaceRepository } from '@/features/cooking/repositories/ingredient-search-namespace-repository'
import { CreateIngredientSearchNamespacePayload } from '@/features/cooking/types/ingredient-search-namespace'

/**
 * GET /api/ingredient-search-namespaces
 * Récupère tous les namespaces
 */
export async function GET() {
  try {
    const repository = new IngredientSearchNamespaceRepository(supabaseServer)
    const data = await repository.findAll()

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/ingredient-search-namespaces]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ingredient-search-namespaces
 * Crée un nouveau namespace
 */
export async function POST(request: NextRequest) {
  try {
    const repository = new IngredientSearchNamespaceRepository(supabaseServer)

    const body = await request.json()
    const { name, bit_index } = body

    // Validation
    if (!name || bit_index === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, bit_index' },
        { status: 400 }
      )
    }

    const payload: CreateIngredientSearchNamespacePayload = {
      name,
      bit_index,
    }

    const data = await repository.create(payload)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[POST /api/ingredient-search-namespaces]', error)

    // Gestion erreur contrainte unique
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: 'Ce namespace existe déjà' }, { status: 409 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ingredient-search-namespaces?id=123
 * Supprime un namespace
 */
export async function DELETE(request: NextRequest) {
  try {
    const repository = new IngredientSearchNamespaceRepository(supabaseServer)

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    await repository.deleteById(parseInt(id, 10))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/ingredient-search-namespaces]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
