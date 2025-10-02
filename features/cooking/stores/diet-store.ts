import { create } from 'zustand'
import type { Diet } from '../types/diet'

type DietState = {
    diets: Diet[]
    loading: boolean
    error: string | null
}

type DietActions = {
    fetchDiets: () => Promise<void>
    clearError: () => void
}

export const useDietStore = create<DietState & DietActions>((set, get) => ({
    // State
    diets: [],
    loading: false,
    error: null,

    // Actions
    fetchDiets: async () => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/diets')
            if (!response.ok) {
                throw new Error('Failed to fetch diets')
            }

            const data = await response.json()
            set({
                diets: data.data,
                loading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
        }
    },

    clearError: () => {
        set({ error: null })
    }
}))
