import { create } from 'zustand'
import type { AdviceFaq } from '@/features/advice/types'

interface AdviceFaqStore {
    faqs: AdviceFaq[]
    loading: boolean
    error: string | null
    total: number
    page: number
    pageSize: number
    searchInput: string
    translationFilter: 'incomplete' | 'complete' | null

    // Actions
    setFaqs: (faqs: AdviceFaq[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setTotal: (total: number) => void
    setPage: (page: number) => void
    setPageSize: (pageSize: number) => void
    setSearchInput: (searchInput: string) => void
    setTranslationFilter: (filter: 'incomplete' | 'complete' | null) => void

    fetchFaqs: () => Promise<void>
    createFaq: (faq: Omit<AdviceFaq, 'id' | 'created_at'>) => Promise<AdviceFaq>
    updateFaq: (id: number, faq: Partial<AdviceFaq>) => Promise<AdviceFaq>
    deleteFaq: (id: number) => Promise<void>
}

export const useAdviceFaqStore = create<AdviceFaqStore>((set, get) => ({
    faqs: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 50,
    searchInput: '',
    translationFilter: null,

    setFaqs: (faqs) => set({ faqs }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setTotal: (total) => set({ total }),
    setPage: (page) => set({ page }),
    setPageSize: (pageSize) => set({ pageSize }),
    setSearchInput: (searchInput) => set({ searchInput }),
    setTranslationFilter: (translationFilter) => set({ translationFilter }),

    fetchFaqs: async () => {
        set({ loading: true, error: null })
        try {
            const { page, pageSize, searchInput, translationFilter } = get()

            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
            })

            if (searchInput) params.append('search', searchInput)
            if (translationFilter) params.append('translationFilter', translationFilter)

            const response = await fetch(`/api/advice-faq?${params}`)
            if (!response.ok) throw new Error('Erreur lors du chargement des FAQ')

            const result = await response.json()
            set({
                faqs: result.data,
                total: result.total,
                loading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
        }
    },

    createFaq: async (faq) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/advice-faq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(faq),
            })

            if (!response.ok) throw new Error('Erreur lors de la création de la FAQ')

            const result = await response.json()
            await get().fetchFaqs() // Rafraîchir la liste
            set({ loading: false })
            return result.data
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
            throw error
        }
    },

    updateFaq: async (id, faq) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/advice-faq', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...faq }),
            })

            if (!response.ok) throw new Error('Erreur lors de la mise à jour de la FAQ')

            const result = await response.json()
            await get().fetchFaqs() // Rafraîchir la liste
            set({ loading: false })
            return result.data
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
            throw error
        }
    },

    deleteFaq: async (id) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch(`/api/advice-faq?id=${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Erreur lors de la suppression de la FAQ')

            await get().fetchFaqs() // Rafraîchir la liste
            set({ loading: false })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
            throw error
        }
    },
}))
