import { create } from 'zustand'
import { BatchCookingSessionReview } from '@/features/cooking/types/batch-cooking-session-review'

type BatchCookingSessionReviewState = {
    // Donnees
    reviews: BatchCookingSessionReview[]
    total: number
    page: number
    pageSize: number

    // Etats
    loading: boolean
    error: string | null

    // Actions
    setPage: (page: number) => void
    fetchReviews: () => Promise<void>
}

const initialState = {
    reviews: [],
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    error: null
}

export const useBatchCookingSessionReviewStore = create<BatchCookingSessionReviewState>((set, get) => ({
    ...initialState,

    setPage: (page) => set({ page }),

    fetchReviews: async () => {
        const { page, pageSize } = get()
        set({ loading: true, error: null })

        try {
            const response = await fetch(`/api/batch-cooking-session-reviews?page=${page}&pageSize=${pageSize}`)

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const data = await response.json()
            set({
                reviews: data.data,
                total: data.total,
                loading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
        }
    }
}))
