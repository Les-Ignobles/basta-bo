import { create } from 'zustand'
import type { RecipeGenerationResult, RecipeGenerationStats } from '../types/recipe-generation-result'

type RecipeGenerationResultState = {
    results: RecipeGenerationResult[]
    stats: RecipeGenerationStats | null
    recentActivity: RecipeGenerationResult[]
    loading: boolean
    error: string | null
    page: number
    pageSize: number
    total: number
    search: string
    dietMask: number | null
    allergyMask: number | null
    kitchenEquipmentMask: number | null
}

type RecipeGenerationResultActions = {
    fetchResults: () => Promise<void>
    fetchStats: () => Promise<void>
    fetchRecentActivity: () => Promise<void>
    setSearch: (search: string) => void
    setDietMask: (dietMask: number | null) => void
    setAllergyMask: (allergyMask: number | null) => void
    setKitchenEquipmentMask: (kitchenEquipmentMask: number | null) => void
    setPage: (page: number) => void
    clearOldEntries: (daysOld?: number) => Promise<void>
    clearError: () => void
}

export const useRecipeGenerationResultStore = create<RecipeGenerationResultState & RecipeGenerationResultActions>((set, get) => ({
    // State
    results: [],
    stats: null,
    recentActivity: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 50,
    total: 0,
    search: '',
    dietMask: null,
    allergyMask: null,
    kitchenEquipmentMask: null,

    // Actions
    fetchResults: async () => {
        set({ loading: true, error: null })
        try {
            const { page, pageSize, search, dietMask, allergyMask, kitchenEquipmentMask } = get()
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                ...(search && { search }),
                ...(dietMask !== null && { dietMask: dietMask.toString() }),
                ...(allergyMask !== null && { allergyMask: allergyMask.toString() }),
                ...(kitchenEquipmentMask !== null && { kitchenEquipmentMask: kitchenEquipmentMask.toString() })
            })

            const response = await fetch(`/api/recipe-generation-results?${params}`)
            if (!response.ok) {
                throw new Error('Failed to fetch recipe generation results')
            }

            const data = await response.json()
            set({
                results: data.data,
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

    fetchStats: async () => {
        try {
            const response = await fetch('/api/recipe-generation-results?action=stats')
            if (!response.ok) {
                throw new Error('Failed to fetch stats')
            }

            const data = await response.json()
            set({ stats: data.data })
        } catch (error) {
            console.error('Error fetching stats:', error)
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
        }
    },

    fetchRecentActivity: async () => {
        try {
            const response = await fetch('/api/recipe-generation-results?action=recent&limit=10')
            if (!response.ok) {
                throw new Error('Failed to fetch recent activity')
            }

            const data = await response.json()
            set({ recentActivity: data.data })
        } catch (error) {
            console.error('Error fetching recent activity:', error)
            set({ error: error instanceof Error ? error.message : 'Unknown error' })
        }
    },

    clearOldEntries: async (daysOld = 30) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch(`/api/recipe-generation-results?action=clear-old&days=${daysOld}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to clear old entries')
            }

            const data = await response.json()

            // Rafraîchir les données après suppression
            await Promise.all([
                get().fetchResults(),
                get().fetchStats(),
                get().fetchRecentActivity()
            ])

            set({ loading: false })
            return data.deletedCount
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

    setDietMask: (dietMask: number | null) => {
        set({ dietMask, page: 1 })
    },

    setAllergyMask: (allergyMask: number | null) => {
        set({ allergyMask, page: 1 })
    },

    setKitchenEquipmentMask: (kitchenEquipmentMask: number | null) => {
        set({ kitchenEquipmentMask, page: 1 })
    },

    setPage: (page: number) => {
        set({ page })
    },

    clearError: () => {
        set({ error: null })
    }
}))
