import { create } from 'zustand'
import type { UnsubscribeFeedback } from './types'

interface UnsubscribeFeedbackState {
    feedbacks: UnsubscribeFeedback[]
    isLoading: boolean
    error: string | null
    fetchFeedbacks: () => Promise<void>
}

export const useUnsubscribeFeedbackStore = create<UnsubscribeFeedbackState>((set) => ({
    feedbacks: [],
    isLoading: false,
    error: null,

    fetchFeedbacks: async () => {
        set({ isLoading: true, error: null })
        try {
            const res = await fetch('/api/unsubscribe-feedbacks')
            const json = await res.json()

            if (!res.ok) {
                set({ isLoading: false, error: json.error || 'Erreur lors du chargement' })
                return
            }

            set({ isLoading: false, feedbacks: json.data })
        } catch (error) {
            console.error('Error fetching unsubscribe feedbacks:', error)
            set({ isLoading: false, error: 'Erreur lors du chargement des retours' })
        }
    },
}))
