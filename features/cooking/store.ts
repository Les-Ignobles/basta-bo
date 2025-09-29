"use client"
import { create } from 'zustand'
import type { Ingredient, IngredientCategory } from '@/features/cooking/types'

type CookingState = {
    ingredients: Ingredient[]
    categories: IngredientCategory[]
    loading: boolean
    error?: string
    fetchIngredients: () => Promise<void>
    fetchCategories: () => Promise<void>
    createIngredient: (payload: Omit<Ingredient, 'id' | 'created_at'>) => Promise<void>
}

export const useCookingStore = create<CookingState>((set, get) => ({
    ingredients: [],
    categories: [],
    loading: false,
    error: undefined,
    async fetchIngredients() {
        set({ loading: true, error: undefined })
        try {
            const res = await fetch('/api/ingredients')
            const json = await res.json()
            set({ ingredients: json.data ?? [] })
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
}))


