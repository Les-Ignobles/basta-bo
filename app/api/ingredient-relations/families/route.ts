import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientRelationType } from '@/features/cooking/types/ingredient-relation'

/**
 * GET /api/ingredient-relations/families
 * Récupère la liste des ingrédients "familles" (qui ont au moins un enfant via relation FAMILY)
 */
export async function GET() {
  try {
    // Récupérer toutes les relations de type FAMILY
    const { data: relations, error: relationsError } = await supabaseServer
      .from('ingredient_relations')
      .select('ingredient_id, related_ingredient_id')
      .eq('relation_type', IngredientRelationType.FAMILY)

    if (relationsError) {
      throw new Error(`Error fetching relations: ${relationsError.message}`)
    }

    // Compter les enfants pour chaque parent
    const parentCounts = new Map<number, number>()

    for (const relation of relations ?? []) {
      const count = parentCounts.get(relation.ingredient_id) ?? 0
      parentCounts.set(relation.ingredient_id, count + 1)
    }

    // Récupérer les informations des ingrédients parents
    const parentIds = Array.from(parentCounts.keys())

    if (parentIds.length === 0) {
      return NextResponse.json({ families: [] })
    }

    const { data: ingredients, error: ingredientsError } = await supabaseServer
      .from('ingredients')
      .select('id, name')
      .in('id', parentIds)
      .order('name->fr', { ascending: true })

    if (ingredientsError) {
      throw new Error(`Error fetching ingredients: ${ingredientsError.message}`)
    }

    // Combiner les données
    const families = (ingredients ?? []).map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      childrenCount: parentCounts.get(ingredient.id) ?? 0,
    }))

    return NextResponse.json({ families })
  } catch (error) {
    console.error('[GET /api/ingredient-relations/families]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
