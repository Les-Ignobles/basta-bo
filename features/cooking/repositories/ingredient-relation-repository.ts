import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from '@/lib/repositories/base-repository'
import {
  IngredientRelation,
  CreateIngredientRelationPayload,
  IngredientRelationType,
  IngredientRelationWithNames,
} from '../types/ingredient-relation'

export class IngredientRelationRepository extends BaseRepository<IngredientRelation> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'ingredient_relations')
  }

  /**
   * Récupère toutes les relations avec les noms des ingrédients
   */
  async findAllWithNames(params?: {
    ingredientId?: number
    relationType?: IngredientRelationType
    page?: number
    pageSize?: number
  }): Promise<{ data: IngredientRelationWithNames[]; total: number }> {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 50
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = this.client
      .from('ingredient_relations')
      .select(
        `
        *,
        ingredient:ingredients!ingredient_relations_ingredient_id_fkey(id, name),
        related_ingredient:ingredients!ingredient_relations_related_ingredient_id_fkey(id, name)
      `,
        { count: 'exact' }
      )

    // Filtre par ingrédient
    if (params?.ingredientId) {
      query = query.or(
        `ingredient_id.eq.${params.ingredientId},related_ingredient_id.eq.${params.ingredientId}`
      )
    }

    // Filtre par type de relation
    if (params?.relationType) {
      query = query.eq('relation_type', params.relationType)
    }

    // Tri et pagination
    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Error fetching ingredient relations: ${error.message}`)
    }

    // Mapper les résultats avec les noms
    const mappedData: IngredientRelationWithNames[] = (data ?? []).map((item: any) => ({
      id: item.id,
      ingredient_id: item.ingredient_id,
      related_ingredient_id: item.related_ingredient_id,
      relation_type: item.relation_type as IngredientRelationType,
      created_at: item.created_at,
      ingredient_name: item.ingredient?.name?.fr || 'Unknown',
      related_ingredient_name: item.related_ingredient?.name?.fr || 'Unknown',
    }))

    return {
      data: mappedData,
      total: count ?? 0,
    }
  }

  /**
   * Crée une nouvelle relation
   */
  async create(payload: CreateIngredientRelationPayload): Promise<IngredientRelation> {
    const { data, error } = await this.client
      .from('ingredient_relations')
      .insert({
        ingredient_id: payload.ingredient_id,
        related_ingredient_id: payload.related_ingredient_id,
        relation_type: payload.relation_type,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating ingredient relation: ${error.message}`)
    }

    return data
  }

  /**
   * Crée une relation bidirectionnelle (A → B et B → A)
   */
  async createBidirectional(
    payload: CreateIngredientRelationPayload
  ): Promise<IngredientRelation[]> {
    // Créer les deux relations
    const { data, error } = await this.client
      .from('ingredient_relations')
      .insert([
        {
          ingredient_id: payload.ingredient_id,
          related_ingredient_id: payload.related_ingredient_id,
          relation_type: payload.relation_type,
        },
        {
          ingredient_id: payload.related_ingredient_id,
          related_ingredient_id: payload.ingredient_id,
          relation_type: payload.relation_type,
        },
      ])
      .select()

    if (error) {
      throw new Error(`Error creating bidirectional ingredient relation: ${error.message}`)
    }

    return data ?? []
  }

  /**
   * Supprime une relation
   */
  async deleteById(id: number): Promise<void> {
    const { error } = await this.client.from('ingredient_relations').delete().eq('id', id)

    if (error) {
      throw new Error(`Error deleting ingredient relation: ${error.message}`)
    }
  }

  /**
   * Supprime une relation bidirectionnelle (A → B et B → A)
   */
  async deleteBidirectional(ingredientId: number, relatedIngredientId: number): Promise<void> {
    const { error } = await this.client
      .from('ingredient_relations')
      .delete()
      .or(
        `and(ingredient_id.eq.${ingredientId},related_ingredient_id.eq.${relatedIngredientId}),and(ingredient_id.eq.${relatedIngredientId},related_ingredient_id.eq.${ingredientId})`
      )

    if (error) {
      throw new Error(`Error deleting bidirectional ingredient relation: ${error.message}`)
    }
  }

  /**
   * Récupère toutes les relations d'un ingrédient
   */
  async findByIngredientId(ingredientId: number): Promise<IngredientRelation[]> {
    const { data, error } = await this.client
      .from('ingredient_relations')
      .select('*')
      .or(`ingredient_id.eq.${ingredientId},related_ingredient_id.eq.${ingredientId}`)

    if (error) {
      throw new Error(`Error fetching ingredient relations: ${error.message}`)
    }

    return data ?? []
  }

  /**
   * Récupère récursivement tous les ingrédients liés (enfants) via les relations
   * @param ingredientIds - IDs des ingrédients de départ
   * @param relationType - Type de relation à suivre
   * @param maxDepth - Profondeur maximale de récursion
   * @returns Liste de tous les IDs d'ingrédients liés (incluant les IDs de départ)
   */
  async findRelatedIngredientsRecursive(
    ingredientIds: number[],
    relationType: IngredientRelationType = IngredientRelationType.FAMILY,
    maxDepth: number = 3
  ): Promise<number[]> {
    const allIds = new Set<number>(ingredientIds)
    let currentLevelIds = [...ingredientIds]
    let depth = 0

    while (depth < maxDepth && currentLevelIds.length > 0) {
      const { data, error } = await this.client
        .from('ingredient_relations')
        .select('related_ingredient_id')
        .in('ingredient_id', currentLevelIds)
        .eq('relation_type', relationType)

      if (error) {
        console.error('Error fetching related ingredients:', error)
        break
      }

      const newIds: number[] = []
      for (const row of data ?? []) {
        if (!allIds.has(row.related_ingredient_id)) {
          allIds.add(row.related_ingredient_id)
          newIds.push(row.related_ingredient_id)
        }
      }

      currentLevelIds = newIds
      depth++
    }

    return Array.from(allIds)
  }
}
