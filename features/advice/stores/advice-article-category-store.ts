import { create } from 'zustand'
import type { AdviceArticleCategory } from '@/features/advice/types'

interface AdviceArticleCategoryStore {
    categories: AdviceArticleCategory[]
    loading: boolean
    error: string | null
    total: number
    page: number
    pageSize: number
    searchInput: string
    translationFilter: 'incomplete' | 'complete' | null

    // Actions
    setCategories: (categories: AdviceArticleCategory[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setTotal: (total: number) => void
    setPage: (page: number) => void
    setPageSize: (pageSize: number) => void
    setSearchInput: (searchInput: string) => void
    setTranslationFilter: (filter: 'incomplete' | 'complete' | null) => void

    fetchCategories: () => Promise<void>
    createCategory: (category: Omit<AdviceArticleCategory, 'id' | 'created_at'>) => Promise<AdviceArticleCategory>
    updateCategory: (id: number, category: Partial<AdviceArticleCategory>) => Promise<AdviceArticleCategory>
    deleteCategory: (id: number) => Promise<void>
}

export const useAdviceArticleCategoryStore = create<AdviceArticleCategoryStore>((set, get) => ({
    categories: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 50,
    searchInput: '',
    translationFilter: null,

    setCategories: (categories) => set({ categories }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setTotal: (total) => set({ total }),
    setPage: (page) => set({ page }),
    setPageSize: (pageSize) => set({ pageSize }),
    setSearchInput: (searchInput) => set({ searchInput }),
    setTranslationFilter: (translationFilter) => set({ translationFilter }),

    fetchCategories: async () => {
        set({ loading: true, error: null })
        try {
            const { page, pageSize, searchInput, translationFilter } = get()

            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
            })

            if (searchInput) params.append('search', searchInput)
            if (translationFilter) params.append('translationFilter', translationFilter)

            const response = await fetch(`/api/advice-article-categories?${params}`)
            if (!response.ok) throw new Error('Erreur lors du chargement des catégories')

            const result = await response.json()
            set({
                categories: result.data,
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

    createCategory: async (category) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/advice-article-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(category),
            })

            if (!response.ok) throw new Error('Erreur lors de la création de la catégorie')

            const result = await response.json()
            await get().fetchCategories() // Rafraîchir la liste
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

    updateCategory: async (id, category) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/advice-article-categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...category }),
            })

            if (!response.ok) throw new Error('Erreur lors de la mise à jour de la catégorie')

            const result = await response.json()
            await get().fetchCategories() // Rafraîchir la liste
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

    deleteCategory: async (id) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch(`/api/advice-article-categories?id=${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Erreur lors de la suppression de la catégorie')

            await get().fetchCategories() // Rafraîchir la liste
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
