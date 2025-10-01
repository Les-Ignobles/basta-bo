import { create } from 'zustand'
import { Recipe, KitchenEquipment, RecipeFormValues, DishType } from '../types'
import type { Diet } from '@/features/cooking/types/diet'

type RecipeState = {
    recipes: Recipe[]
    kitchenEquipments: KitchenEquipment[]
    diets: Diet[]
    loading: boolean
    error?: string
    // editing state
    editingRecipe: Recipe | null
    // selection state
    selectedRecipes: number[]
    // filters
    page: number
    pageSize: number
    total: number
    search: string
    noImage: boolean
    dishType: DishType | 'all'
    fetchRecipes: () => Promise<void>
    fetchKitchenEquipments: () => Promise<void>
    fetchDiets: () => Promise<void>
    createRecipe: (payload: Omit<RecipeFormValues, 'id'>) => Promise<void>
    updateRecipe: (id: number, payload: Partial<RecipeFormValues>) => Promise<void>
    deleteRecipe: (id: number) => Promise<void>
    bulkDeleteRecipes: (ids: number[]) => Promise<void>
    bulkUpdateDishType: (ids: number[], dishType: DishType) => Promise<void>
    bulkUpdateSeasonality: (ids: number[], seasonalityMask: number) => Promise<void>
    bulkUpdateDietMask: (ids: number[], dietMask: number) => Promise<void>
    bulkUpdateKitchenEquipmentsMask: (ids: number[], equipmentsMask: number) => Promise<void>
    setSearch: (s: string) => void
    setPage: (p: number) => void
    setNoImage: (b: boolean) => void
    setDishType: (d: DishType | 'all') => void
    setEditingRecipe: (recipe: Recipe | null) => void
    setSelectedRecipes: (ids: number[]) => void
    toggleRecipeSelection: (id: number) => void
    selectAllRecipes: () => void
    clearSelection: () => void
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
    recipes: [],
    kitchenEquipments: [],
    diets: [],
    loading: false,
    error: undefined,
    editingRecipe: null,
    selectedRecipes: [],
    page: 1,
    pageSize: 50,
    total: 0,
    search: '',
    noImage: false,
    dishType: 'all',
    async fetchRecipes() {
        set({ loading: true, error: undefined })
        try {
            const { page, pageSize, search, noImage, dishType } = get()
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
            if (search) params.set('search', search)
            if (noImage) params.set('noImage', 'true')
            if (dishType !== 'all') params.set('dishType', String(dishType))
            const res = await fetch(`/api/recipes?${params.toString()}`)
            const json = await res.json()
            set({ recipes: json.data ?? [], total: json.total ?? 0 })
        } catch (e: any) {
            set({ error: e?.message ?? 'Erreur de chargement' })
        } finally {
            set({ loading: false })
        }
    },
    async fetchKitchenEquipments() {
        set({ loading: true })
        try {
            const res = await fetch('/api/kitchen-equipments')
            const { data } = await res.json()
            set({ kitchenEquipments: data })
        } catch (error) {
            console.error('Failed to fetch kitchen equipments:', error)
        } finally {
            set({ loading: false })
        }
    },

    async fetchDiets() {
        set({ loading: true })
        try {
            const res = await fetch('/api/diets')
            const { data } = await res.json()
            set({ diets: data })
        } catch (error) {
            console.error('Failed to fetch diets:', error)
        } finally {
            set({ loading: false })
        }
    },
    async createRecipe(payload) {
        set({ loading: true })
        try {
            await fetch('/api/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            get().fetchRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to create recipe:', error)
        } finally {
            set({ loading: false })
        }
    },
    async updateRecipe(id, payload) {
        set({ loading: true })
        try {
            await fetch('/api/recipes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            })
            get().fetchRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to update recipe:', error)
        } finally {
            set({ loading: false })
        }
    },
    async deleteRecipe(id) {
        set({ loading: true })
        try {
            await fetch(`/api/recipes?id=${id}`, {
                method: 'DELETE',
            })
            get().fetchRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to delete recipe:', error)
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
    setDishType(d) {
        set({ dishType: d, page: 1 })
    },

    async bulkDeleteRecipes(ids) {
        set({ loading: true })
        try {
            await Promise.all(
                ids.map(id =>
                    fetch(`/api/recipes?id=${id}`, {
                        method: 'DELETE',
                    })
                )
            )
            set({ selectedRecipes: [] })
            get().fetchRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to bulk delete recipes:', error)
        } finally {
            set({ loading: false })
        }
    },

    async bulkUpdateDishType(ids, dishType) {
        set({ loading: true })
        try {
            await Promise.all(
                ids.map(id =>
                    fetch('/api/recipes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, dish_type: dishType })
                    })
                )
            )
            set({ selectedRecipes: [] })
            get().fetchRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to bulk update dish type:', error)
        } finally {
            set({ loading: false })
        }
    },

    async bulkUpdateSeasonality(ids, seasonalityMask) {
        set({ loading: true })
        try {
            await Promise.all(
                ids.map(id =>
                    fetch('/api/recipes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, seasonality_mask: seasonalityMask })
                    })
                )
            )
            set({ selectedRecipes: [] })
            get().fetchRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to bulk update seasonality:', error)
        } finally {
            set({ loading: false })
        }
    },

    async bulkUpdateDietMask(ids, dietMask) {
        set({ loading: true })
        try {
            await Promise.all(
                ids.map(id =>
                    fetch('/api/recipes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, diet_mask: dietMask })
                    })
                )
            )
            set({ selectedRecipes: [] })
            get().fetchRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to bulk update diet mask:', error)
        } finally {
            set({ loading: false })
        }
    },

    async bulkUpdateKitchenEquipmentsMask(ids, equipmentsMask) {
        set({ loading: true })
        try {
            await Promise.all(
                ids.map(id =>
                    fetch('/api/recipes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, kitchen_equipments_mask: equipmentsMask })
                    })
                )
            )
            set({ selectedRecipes: [] })
            get().fetchRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to bulk update kitchen equipments mask:', error)
        } finally {
            set({ loading: false })
        }
    },

    setSelectedRecipes(ids) {
        set({ selectedRecipes: ids })
    },

    toggleRecipeSelection(id) {
        set(state => ({
            selectedRecipes: state.selectedRecipes.includes(id)
                ? state.selectedRecipes.filter(i => i !== id)
                : [...state.selectedRecipes, id]
        }))
    },

    selectAllRecipes() {
        set(state => ({
            selectedRecipes: state.recipes.map(r => Number(r.id))
        }))
    },

    clearSelection() {
        set({ selectedRecipes: [] })
    },
    setEditingRecipe(recipe) {
        set({ editingRecipe: recipe })
    },
}))
