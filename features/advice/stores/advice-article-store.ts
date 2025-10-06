import { create } from 'zustand'
import type { AdviceArticle } from '@/features/advice/types'

interface AdviceArticleStore {
    articles: AdviceArticle[]
    loading: boolean
    error: string | null
    total: number
    page: number
    pageSize: number
    searchInput: string
    selectedCategoryId: number | null
    selectedPublicationState: string | null
    selectedIsFeatured: boolean | null
    translationFilter: 'incomplete' | 'complete' | null

    // Actions
    setArticles: (articles: AdviceArticle[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setTotal: (total: number) => void
    setPage: (page: number) => void
    setPageSize: (pageSize: number) => void
    setSearchInput: (searchInput: string) => void
    setSelectedCategoryId: (categoryId: number | null) => void
    setSelectedPublicationState: (publicationState: string | null) => void
    setSelectedIsFeatured: (isFeatured: boolean | null) => void
    setTranslationFilter: (filter: 'incomplete' | 'complete' | null) => void

    fetchArticles: () => Promise<void>
    createArticle: (article: Omit<AdviceArticle, 'id' | 'created_at'>) => Promise<AdviceArticle>
    updateArticle: (id: number, article: Partial<AdviceArticle>) => Promise<AdviceArticle>
    deleteArticle: (id: number) => Promise<void>
}

export const useAdviceArticleStore = create<AdviceArticleStore>((set, get) => ({
    articles: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 50,
    searchInput: '',
    selectedCategoryId: null,
    selectedPublicationState: null,
    selectedIsFeatured: null,
    translationFilter: null,

    setArticles: (articles) => set({ articles }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setTotal: (total) => set({ total }),
    setPage: (page) => set({ page }),
    setPageSize: (pageSize) => set({ pageSize }),
    setSearchInput: (searchInput) => set({ searchInput }),
    setSelectedCategoryId: (selectedCategoryId) => set({ selectedCategoryId }),
    setSelectedPublicationState: (selectedPublicationState) => set({ selectedPublicationState }),
    setSelectedIsFeatured: (selectedIsFeatured) => set({ selectedIsFeatured }),
    setTranslationFilter: (translationFilter) => set({ translationFilter }),

    fetchArticles: async () => {
        set({ loading: true, error: null })
        try {
            const { page, pageSize, searchInput, selectedCategoryId, selectedPublicationState, selectedIsFeatured, translationFilter } = get()

            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
            })

            if (searchInput) params.append('search', searchInput)
            if (selectedCategoryId) params.append('categoryId', selectedCategoryId.toString())
            if (selectedPublicationState) params.append('publicationState', selectedPublicationState)
            if (selectedIsFeatured !== null) params.append('isFeatured', selectedIsFeatured.toString())
            if (translationFilter) params.append('translationFilter', translationFilter)

            const response = await fetch(`/api/advice-articles?${params}`)
            if (!response.ok) throw new Error('Erreur lors du chargement des articles')

            const result = await response.json()
            set({
                articles: result.data,
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

    createArticle: async (article) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/advice-articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(article),
            })

            if (!response.ok) throw new Error('Erreur lors de la création de l\'article')

            const result = await response.json()
            await get().fetchArticles() // Rafraîchir la liste
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

    updateArticle: async (id, article) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/advice-articles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...article }),
            })

            if (!response.ok) throw new Error('Erreur lors de la mise à jour de l\'article')

            const result = await response.json()
            await get().fetchArticles() // Rafraîchir la liste
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

    deleteArticle: async (id) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch(`/api/advice-articles?id=${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Erreur lors de la suppression de l\'article')

            await get().fetchArticles() // Rafraîchir la liste
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
