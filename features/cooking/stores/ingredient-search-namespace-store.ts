import { create } from 'zustand'
import {
  IngredientSearchNamespace,
  CreateIngredientSearchNamespacePayload,
} from '../types/ingredient-search-namespace'

type IngredientForNamespace = {
  id: number
  name: any
  isInNamespace: boolean
}

type IngredientSearchNamespaceState = {
  // Data
  namespaces: IngredientSearchNamespace[]
  ingredientsForNamespace: IngredientForNamespace[]
  selectedNamespace: IngredientSearchNamespace | null

  // Loading & errors
  loading: boolean
  error?: string

  // Actions
  fetchNamespaces: () => Promise<void>
  fetchIngredientsForNamespace: (bitIndex: number) => Promise<void>
  createNamespace: (payload: CreateIngredientSearchNamespacePayload) => Promise<void>
  deleteNamespace: (id: number) => Promise<void>
  addIngredientToNamespace: (ingredientId: number, bitIndex: number) => Promise<void>
  removeIngredientFromNamespace: (ingredientId: number, bitIndex: number) => Promise<void>

  // Setters
  setSelectedNamespace: (namespace: IngredientSearchNamespace | null) => void
  reset: () => void
}

export const useIngredientSearchNamespaceStore = create<IngredientSearchNamespaceState>(
  (set, get) => ({
    // Initial state
    namespaces: [],
    ingredientsForNamespace: [],
    selectedNamespace: null,
    loading: false,

    // Fetch namespaces
    fetchNamespaces: async () => {
      set({ loading: true, error: undefined })

      try {
        const res = await fetch('/api/ingredient-search-namespaces')

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`)
        }

        const json = await res.json()

        set({
          namespaces: json.data,
          loading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        })
      }
    },

    // Fetch ingredients for a namespace
    fetchIngredientsForNamespace: async (bitIndex) => {
      set({ loading: true, error: undefined })

      try {
        const res = await fetch(`/api/ingredient-search-namespaces/${bitIndex}/ingredients`)

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`)
        }

        const json = await res.json()

        set({
          ingredientsForNamespace: json.data,
          loading: false,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        })
      }
    },

    // Create namespace
    createNamespace: async (payload) => {
      set({ loading: true, error: undefined })

      try {
        const res = await fetch('/api/ingredient-search-namespaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`)
        }

        // Refresh la liste
        await get().fetchNamespaces()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        })
        throw error
      }
    },

    // Delete namespace
    deleteNamespace: async (id) => {
      set({ loading: true, error: undefined })

      try {
        const res = await fetch(`/api/ingredient-search-namespaces?id=${id}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`)
        }

        // Refresh la liste
        await get().fetchNamespaces()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        })
        throw error
      }
    },

    // Add ingredient to namespace
    addIngredientToNamespace: async (ingredientId, bitIndex) => {
      try {
        const res = await fetch('/api/ingredient-search-namespaces/add-ingredient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredientId, bitIndex }),
        })

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`)
        }

        // Refresh la liste des ingrédients
        await get().fetchIngredientsForNamespace(bitIndex)
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }
    },

    // Remove ingredient from namespace
    removeIngredientFromNamespace: async (ingredientId, bitIndex) => {
      try {
        const res = await fetch('/api/ingredient-search-namespaces/remove-ingredient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredientId, bitIndex }),
        })

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`)
        }

        // Refresh la liste des ingrédients
        await get().fetchIngredientsForNamespace(bitIndex)
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }
    },

    // Setters
    setSelectedNamespace: (namespace) => set({ selectedNamespace: namespace }),
    reset: () =>
      set({
        namespaces: [],
        ingredientsForNamespace: [],
        selectedNamespace: null,
        loading: false,
        error: undefined,
      }),
  })
)
