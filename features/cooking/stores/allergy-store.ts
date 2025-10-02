import { create } from 'zustand'
import type { Allergy } from '../types/allergy'

type AllergyState = {
    allergies: Allergy[]
    loading: boolean
    error: string | null
}

type AllergyActions = {
    fetchAllergies: () => Promise<void>
    clearError: () => void
}

export const useAllergyStore = create<AllergyState & AllergyActions>((set, get) => ({
    // State
    allergies: [],
    loading: false,
    error: null,

    // Actions
    fetchAllergies: async () => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/allergies')
            if (!response.ok) {
                throw new Error('Failed to fetch allergies')
            }

            const data = await response.json()
            set({
                allergies: data.data,
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
