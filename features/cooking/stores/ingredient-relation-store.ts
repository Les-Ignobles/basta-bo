import { create } from 'zustand'
import {
  IngredientRelationWithNames,
  CreateIngredientRelationPayload,
  IngredientRelationType,
} from '../types/ingredient-relation'

type IngredientRelationState = {
  // Data
  relations: IngredientRelationWithNames[]
  total: number

  // Loading & errors
  loading: boolean
  error?: string

  // Filters
  page: number
  pageSize: number
  ingredientId?: number
  relationType?: IngredientRelationType

  // Actions
  fetchRelations: () => Promise<void>
  createRelation: (payload: CreateIngredientRelationPayload, bidirectional?: boolean) => Promise<void>
  deleteRelation: (id: number) => Promise<void>
  deleteBidirectional: (ingredientId: number, relatedIngredientId: number) => Promise<void>

  // Setters
  setPage: (page: number) => void
  setIngredientIdFilter: (ingredientId?: number) => void
  setRelationTypeFilter: (relationType?: IngredientRelationType) => void
  reset: () => void
}

export const useIngredientRelationStore = create<IngredientRelationState>((set, get) => ({
  // Initial state
  relations: [],
  total: 0,
  loading: false,
  page: 1,
  pageSize: 50,

  // Fetch relations
  fetchRelations: async () => {
    set({ loading: true, error: undefined })

    try {
      const { page, pageSize, ingredientId, relationType } = get()
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })

      if (ingredientId) params.set('ingredientId', String(ingredientId))
      if (relationType) params.set('relationType', relationType)

      const res = await fetch(`/api/ingredient-relations?${params}`)

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      const json = await res.json()

      set({
        relations: json.data,
        total: json.total,
        loading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      })
    }
  },

  // Create relation
  createRelation: async (payload, bidirectional = false) => {
    set({ loading: true, error: undefined })

    try {
      const res = await fetch('/api/ingredient-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, bidirectional }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`)
      }

      // Refresh la liste
      await get().fetchRelations()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      })
      throw error
    }
  },

  // Delete relation
  deleteRelation: async (id) => {
    set({ loading: true, error: undefined })

    try {
      const res = await fetch(`/api/ingredient-relations?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      // Refresh la liste
      await get().fetchRelations()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      })
      throw error
    }
  },

  // Delete bidirectional
  deleteBidirectional: async (ingredientId, relatedIngredientId) => {
    set({ loading: true, error: undefined })

    try {
      const res = await fetch(`/api/ingredient-relations/bidirectional`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientId, relatedIngredientId }),
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      // Refresh la liste
      await get().fetchRelations()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      })
      throw error
    }
  },

  // Setters
  setPage: (page) => set({ page }),
  setIngredientIdFilter: (ingredientId) => set({ ingredientId, page: 1 }),
  setRelationTypeFilter: (relationType) => set({ relationType, page: 1 }),
  reset: () =>
    set({
      relations: [],
      total: 0,
      loading: false,
      error: undefined,
      page: 1,
      ingredientId: undefined,
      relationType: undefined,
    }),
}))
