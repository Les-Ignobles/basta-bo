import { create } from 'zustand'
import { Recipe, KitchenEquipment, RecipeFormValues, DishType } from '../types'

type RecipeState = {
    recipes: Recipe[]
    kitchenEquipments: KitchenEquipment[]
    loading: boolean
    error?: string
    // editing state
    editingRecipe: Recipe | null
    // filters
    page: number
    pageSize: number
    total: number
    search: string
    noImage: boolean
    dishType: DishType | 'all'
    fetchRecipes: () => Promise<void>
    fetchKitchenEquipments: () => Promise<void>
    createRecipe: (payload: Omit<RecipeFormValues, 'id'>) => Promise<void>
    updateRecipe: (id: number, payload: Partial<RecipeFormValues>) => Promise<void>
    deleteRecipe: (id: number) => Promise<void>
    setSearch: (s: string) => void
    setPage: (p: number) => void
    setNoImage: (b: boolean) => void
    setDishType: (d: DishType | 'all') => void
    setEditingRecipe: (recipe: Recipe | null) => void
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
    recipes: [],
    kitchenEquipments: [],
    loading: false,
    error: undefined,
    editingRecipe: null,
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
    setEditingRecipe(recipe) {
        set({ editingRecipe: recipe })
    },
}))
