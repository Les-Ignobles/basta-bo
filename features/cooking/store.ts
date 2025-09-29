"use client"
import { create } from 'zustand'
import type { Ingredient, IngredientCategory } from '@/features/cooking/types'

type CookingState = {
    ingredients: Ingredient[]
    categories: IngredientCategory[]
    loading: boolean
    error?: string
    // filters
    page: number
    pageSize: number
    total: number
    search: string
    noImage: boolean
    selectedCategories: number[]
    fetchIngredients: () => Promise<void>
    fetchCategories: () => Promise<void>
    createIngredient: (payload: Omit<Ingredient, 'id' | 'created_at'>) => Promise<void>
    updateIngredient: (id: number, payload: Partial<Ingredient>) => Promise<void>
    deleteIngredient: (id: number) => Promise<void>
    setSearch: (s: string) => void
    setPage: (p: number) => void
    setNoImage: (b: boolean) => void
    setSelectedCategories: (categories: number[]) => void
}

export const useCookingStore = create<CookingState>((set, get) => ({
    ingredients: [],
    categories: [],
    loading: false,
    error: undefined,
    page: 1,
    pageSize: 50,
    total: 0,
    search: '',
    noImage: false,
    selectedCategories: [],
    async fetchIngredients() {
        set({ loading: true, error: undefined })
        try {
            const { page, pageSize, search, noImage, selectedCategories } = get()
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
            if (search) params.set('search', search)
            if (noImage) params.set('noImage', 'true')
            if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','))
            const res = await fetch(`/api/ingredients?${params.toString()}`)
            const json = await res.json()
            set({ ingredients: json.data ?? [], total: json.total ?? 0 })
        } catch (e: any) {
            set({ error: e?.message ?? 'Erreur de chargement' })
        } finally {
            set({ loading: false })
        }
    },
    async fetchCategories() {
        try {
            const res = await fetch('/api/ingredient-categories')
            const json = await res.json()
            set({ categories: json.data ?? [] })
        } catch (e: any) {
            set({ error: e?.message ?? 'Erreur de chargement' })
        }
    },
    async createIngredient(payload) {
        set({ loading: true, error: undefined })
        try {
            const res = await fetch('/api/ingredients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error('Erreur création ingrédient')
            await get().fetchIngredients()
        } catch (e: any) {
            set({ error: e?.message ?? 'Erreur de création' })
        } finally {
            set({ loading: false })
        }
    },
    async updateIngredient(id, payload) {
        set({ loading: true, error: undefined })
        try {
            const res = await fetch('/api/ingredients', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            })
            if (!res.ok) throw new Error('Erreur mise à jour ingrédient')
            await get().fetchIngredients()
        } catch (e: any) {
            set({ error: e?.message ?? 'Erreur de mise à jour' })
        } finally {
            set({ loading: false })
        }
    },
    async deleteIngredient(id) {
        set({ loading: true, error: undefined })
        try {
            const res = await fetch(`/api/ingredients?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Erreur suppression ingrédient')
            await get().fetchIngredients()
        } catch (e: any) {
            set({ error: e?.message ?? 'Erreur de suppression' })
        } finally {
            set({ loading: false })
        }
    },
    setSearch(s) {
        set({ search: s, page: 1 })
    },
    setPage(p) {
        set({ page: p })
    },
    setNoImage(b) {
        set({ noImage: b, page: 1 })
    },
    setSelectedCategories(categories) {
        set({ selectedCategories: categories, page: 1 })
    },
}))


