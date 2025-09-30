import { create } from 'zustand'
import type { PendingIngredient, PendingIngredientFormValues } from '../types'

type PendingIngredientState = {
    pendingIngredients: PendingIngredient[]
    loading: boolean
    error: string | null
    page: number
    pageSize: number
    total: number
    search: string
    editingPendingIngredient: PendingIngredient | null
}

type PendingIngredientActions = {
    fetchPendingIngredients: () => Promise<void>
    deletePendingIngredient: (id: number) => Promise<void>
    convertToIngredient: (pendingId: number, ingredientData: PendingIngredientFormValues) => Promise<void>
    setSearch: (search: string) => void
    setPage: (page: number) => void
    setEditingPendingIngredient: (pendingIngredient: PendingIngredient | null) => void
    clearError: () => void
}

export const usePendingIngredientStore = create<PendingIngredientState & PendingIngredientActions>((set, get) => ({
    // State
    pendingIngredients: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 50,
    total: 0,
    search: '',
    editingPendingIngredient: null,

    // Actions
    fetchPendingIngredients: async () => {
        set({ loading: true, error: null })
        try {
            const { page, pageSize, search } = get()
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                ...(search && { search })
            })

            const response = await fetch(`/api/pending-ingredients?${params}`)
            if (!response.ok) {
                throw new Error('Failed to fetch pending ingredients')
            }

            const data = await response.json()
            set({
                pendingIngredients: data.data,
                total: data.total,
                loading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
        }
    },

    deletePendingIngredient: async (id: number) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch(`/api/pending-ingredients?id=${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete pending ingredient')
            }

            // Refresh the list
            await get().fetchPendingIngredients()
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
        }
    },

    convertToIngredient: async (pendingId: number, ingredientData: PendingIngredientFormValues) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/pending-ingredients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pendingId,
                    ingredientData
                })
            })

            if (!response.ok) {
                throw new Error('Failed to convert pending ingredient')
            }

            // Refresh the list
            await get().fetchPendingIngredients()
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
        }
    },

    setSearch: (search: string) => {
        set({ search, page: 1 })
    },

    setPage: (page: number) => {
        set({ page })
    },

    setEditingPendingIngredient: (pendingIngredient: PendingIngredient | null) => {
        set({ editingPendingIngredient: pendingIngredient })
    },

    clearError: () => {
        set({ error: null })
    }
}))
