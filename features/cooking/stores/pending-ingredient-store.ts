import { create } from 'zustand'
import type { PendingIngredient } from '../types'
import type { IngredientFormValues } from '../components/ingredient-form'

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
    fetchPendingCount: () => Promise<void>
    deletePendingIngredient: (id: number) => Promise<void>
    convertToIngredient: (pendingId: number, ingredientData: IngredientFormValues) => Promise<void>
    bulkProcessWithAI: () => Promise<{ success: boolean; message: string; processed: number; created: Record<string, unknown>[]; errors?: string[] }>
    previewBulkProcess: () => Promise<{ success: boolean; message: string; processed: number; ingredients: Record<string, unknown>[]; errors?: string[] }>
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

    fetchPendingCount: async () => {
        try {
            const response = await fetch('/api/pending-ingredients?page=1&pageSize=1')
            if (!response.ok) {
                throw new Error('Failed to fetch pending count')
            }

            const data = await response.json()
            set({ total: data.total })
        } catch (error) {
            console.error('Error fetching pending count:', error)
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

    convertToIngredient: async (pendingId: number, ingredientData: IngredientFormValues) => {
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

    bulkProcessWithAI: async () => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/pending-ingredients/bulk-process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ preview: false })
            })

            if (!response.ok) {
                throw new Error('Failed to process pending ingredients with AI')
            }

            const result = await response.json()
            
            // Refresh the list and count
            await get().fetchPendingIngredients()
            await get().fetchPendingCount()
            
            set({ loading: false })
            return result
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
            throw error
        }
    },

    previewBulkProcess: async () => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/pending-ingredients/bulk-process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ preview: true })
            })

            if (!response.ok) {
                throw new Error('Failed to preview pending ingredients with AI')
            }

            const result = await response.json()
            set({ loading: false })
            return result
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
            throw error
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
