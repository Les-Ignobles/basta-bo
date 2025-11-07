import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from '@/lib/repositories/base-repository'
import {
  IngredientSearchNamespace,
  CreateIngredientSearchNamespacePayload,
  UpdateIngredientSearchNamespacePayload,
} from '../types/ingredient-search-namespace'
import { IngredientRelationRepository } from './ingredient-relation-repository'
import { IngredientRelationType } from '../types/ingredient-relation'

export class IngredientSearchNamespaceRepository extends BaseRepository<IngredientSearchNamespace> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'ingredient_search_namespaces')
  }

  /**
   * Récupère tous les namespaces
   */
  async findAll(): Promise<IngredientSearchNamespace[]> {
    const { data, error } = await this.client
      .from('ingredient_search_namespaces')
      .select('*')
      .order('bit_index', { ascending: true })

    if (error) {
      throw new Error(`Error fetching ingredient search namespaces: ${error.message}`)
    }

    return data ?? []
  }

  /**
   * Crée un nouveau namespace
   */
  async create(payload: CreateIngredientSearchNamespacePayload): Promise<IngredientSearchNamespace> {
    const { data, error } = await this.client
      .from('ingredient_search_namespaces')
      .insert({
        name: payload.name,
        bit_index: payload.bit_index,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating ingredient search namespace: ${error.message}`)
    }

    return data
  }

  /**
   * Met à jour un namespace
   */
  async updateById(
    id: number,
    payload: UpdateIngredientSearchNamespacePayload
  ): Promise<IngredientSearchNamespace> {
    const { data, error } = await this.client
      .from('ingredient_search_namespaces')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating ingredient search namespace: ${error.message}`)
    }

    return data
  }

  /**
   * Supprime un namespace
   */
  async deleteById(id: number): Promise<void> {
    const { error } = await this.client.from('ingredient_search_namespaces').delete().eq('id', id)

    if (error) {
      throw new Error(`Error deleting ingredient search namespace: ${error.message}`)
    }
  }

  /**
   * Ajoute un ingrédient à un namespace (via bitmap)
   */
  async addIngredientToNamespace(ingredientId: number, bitIndex: number): Promise<void> {
    // Récupérer le mask actuel
    const { data: ingredient, error: fetchError } = await this.client
      .from('ingredients')
      .select('search_namespace_mask')
      .eq('id', ingredientId)
      .single()

    if (fetchError) {
      throw new Error(`Error fetching ingredient: ${fetchError.message}`)
    }

    const currentMask = ingredient?.search_namespace_mask ?? 0
    const newMask = currentMask | (1 << bitIndex)

    // Mettre à jour le mask
    const { error: updateError } = await this.client
      .from('ingredients')
      .update({ search_namespace_mask: newMask })
      .eq('id', ingredientId)

    if (updateError) {
      throw new Error(`Error adding ingredient to namespace: ${updateError.message}`)
    }
  }

  /**
   * Retire un ingrédient d'un namespace (via bitmap)
   */
  async removeIngredientFromNamespace(ingredientId: number, bitIndex: number): Promise<void> {
    // Récupérer le mask actuel
    const { data: ingredient, error: fetchError } = await this.client
      .from('ingredients')
      .select('search_namespace_mask')
      .eq('id', ingredientId)
      .single()

    if (fetchError) {
      throw new Error(`Error fetching ingredient: ${fetchError.message}`)
    }

    const currentMask = ingredient?.search_namespace_mask ?? 0
    const newMask = currentMask & ~(1 << bitIndex)

    // Mettre à jour le mask
    const { error: updateError } = await this.client
      .from('ingredients')
      .update({ search_namespace_mask: newMask })
      .eq('id', ingredientId)

    if (updateError) {
      throw new Error(`Error removing ingredient from namespace: ${updateError.message}`)
    }
  }

  /**
   * Récupère tous les ingrédients avec leur statut pour un namespace
   */
  async getIngredientsForNamespace(bitIndex: number): Promise<
    Array<{
      id: number
      name: any
      isInNamespace: boolean
    }>
  > {
    const { data, error } = await this.client.from('ingredients').select('id, name, search_namespace_mask')

    if (error) {
      throw new Error(`Error fetching ingredients: ${error.message}`)
    }

    const mask = 1 << bitIndex

    return (data ?? []).map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      isInNamespace: (ingredient.search_namespace_mask & mask) !== 0,
    }))
  }

  /**
   * Exclut tous les enfants d'un ingrédient des namespaces spécifiés
   * (retire les bits correspondants aux namespaces pour tous les enfants)
   */
  async excludeChildrenFromNamespaces(
    parentIngredientId: number,
    namespaceBitIndexes: number[]
  ): Promise<{ excludedCount: number; childrenIds: number[] }> {
    // 1. Récupérer tous les enfants via les relations "family"
    const relationRepo = new IngredientRelationRepository(this.client)
    const childrenIds = await relationRepo.findRelatedIngredientsRecursive(
      [parentIngredientId],
      IngredientRelationType.FAMILY,
      3 // maxDepth
    )

    // Retirer l'ingrédient parent de la liste
    const onlyChildren = childrenIds.filter((id) => id !== parentIngredientId)

    if (onlyChildren.length === 0) {
      return { excludedCount: 0, childrenIds: [] }
    }

    // 2. Pour chaque enfant, retirer les bits des namespaces spécifiés
    let excludedCount = 0

    for (const childId of onlyChildren) {
      // Récupérer le mask actuel
      const { data: ingredient, error: fetchError } = await this.client
        .from('ingredients')
        .select('search_namespace_mask')
        .eq('id', childId)
        .single()

      if (fetchError) {
        console.error(`Error fetching ingredient ${childId}:`, fetchError.message)
        continue
      }

      let currentMask = ingredient?.search_namespace_mask ?? 0

      // Retirer tous les bits des namespaces spécifiés
      for (const bitIndex of namespaceBitIndexes) {
        currentMask = currentMask & ~(1 << bitIndex)
      }

      // Mettre à jour le mask
      const { error: updateError } = await this.client
        .from('ingredients')
        .update({ search_namespace_mask: currentMask })
        .eq('id', childId)

      if (updateError) {
        console.error(`Error updating ingredient ${childId}:`, updateError.message)
        continue
      }

      excludedCount++
    }

    return { excludedCount, childrenIds: onlyChildren }
  }
}
