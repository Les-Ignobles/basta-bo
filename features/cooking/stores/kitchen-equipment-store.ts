import { create } from 'zustand'
import type { KitchenEquipment } from '../types/kitchen-equipment'

type KitchenEquipmentState = {
    kitchenEquipment: KitchenEquipment[]
    loading: boolean
    error: string | null
}

type KitchenEquipmentActions = {
    fetchKitchenEquipment: () => Promise<void>
    clearError: () => void
}

export const useKitchenEquipmentStore = create<KitchenEquipmentState & KitchenEquipmentActions>((set, get) => ({
    // State
    kitchenEquipment: [],
    loading: false,
    error: null,

    // Actions
    fetchKitchenEquipment: async () => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/kitchen-equipment')
            if (!response.ok) {
                throw new Error('Failed to fetch kitchen equipment')
            }

            const data = await response.json()
            set({
                kitchenEquipment: data.data,
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
