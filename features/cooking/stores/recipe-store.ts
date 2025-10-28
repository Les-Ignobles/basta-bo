import { create } from 'zustand'
import { Recipe, KitchenEquipment, RecipeFormValues, DishType, QuantificationType } from '../types'
import type { Diet } from '@/features/cooking/types/diet'
import type { Allergy } from '@/features/cooking/types/allergy'

type RecipeState = {
    recipes: Recipe[]
    kitchenEquipments: KitchenEquipment[]
    diets: Diet[]
    allergies: Allergy[]
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
    selectedDiets: number[]
    selectedKitchenEquipments: number[]
    quantificationType: QuantificationType | 'all'
    isVisible: boolean | null
    isFolklore: boolean | null
    fetchRecipes: () => Promise<void>
    fetchKitchenEquipments: () => Promise<void>
    fetchDiets: () => Promise<void>
    fetchAllergies: () => Promise<void>
    createRecipe: (payload: Omit<RecipeFormValues, 'id'>) => Promise<void>
    updateRecipe: (id: number, payload: Partial<RecipeFormValues>) => Promise<void>
    deleteRecipe: (id: number) => Promise<void>
    bulkDeleteRecipes: (ids: number[]) => Promise<void>
    bulkUpdateDishType: (ids: number[], dishType: DishType) => Promise<void>
    bulkUpdateSeasonality: (ids: number[], seasonalityMask: number) => Promise<void>
    bulkUpdateDietMask: (ids: number[], dietMask: number) => Promise<void>
    bulkUpdateKitchenEquipmentsMask: (ids: number[], equipmentsMask: number) => Promise<void>
    bulkUpdateVisibility: (ids: number[], isVisible: boolean) => Promise<void>
    setSearch: (s: string) => void
    setPage: (p: number) => void
    setNoImage: (b: boolean) => void
    setDishType: (d: DishType | 'all') => void
    setSelectedDiets: (diets: number[]) => void
    setSelectedKitchenEquipments: (equipments: number[]) => void
    setQuantificationType: (q: QuantificationType | 'all') => void
    setIsVisible: (v: boolean | null) => void
    setIsFolklore: (f: boolean | null) => void
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
    allergies: [],
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
    selectedDiets: [],
    selectedKitchenEquipments: [],
    quantificationType: 'all',
    isVisible: null,
    isFolklore: null,
    async fetchRecipes() {
        set({ loading: true, error: undefined })
        try {
            const { page, pageSize, search, noImage, dishType, selectedDiets, selectedKitchenEquipments, quantificationType, isVisible, isFolklore } = get()

            // Protection contre les requêtes avec page=1 non désirées
            if (page === 1 && typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search)
                const urlPage = urlParams.get('page')
                if (urlPage && urlPage !== '1') {
                    console.log('Skipping fetchRecipes with page=1 when URL has page=' + urlPage)
                    return
                }
            }

            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
            if (search) params.set('search', search)
            if (noImage) params.set('noImage', 'true')
            if (dishType !== 'all') params.set('dishType', String(dishType))
            if (selectedDiets.length > 0) params.set('diets', selectedDiets.join(','))
            if (selectedKitchenEquipments.length > 0) params.set('kitchenEquipments', selectedKitchenEquipments.join(','))
            if (quantificationType !== 'all') params.set('quantificationType', String(quantificationType))
            if (isVisible !== null) params.set('isVisible', String(isVisible))
            if (isFolklore !== null) params.set('isFolklore', String(isFolklore))

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
        const state = get()
        if (state.kitchenEquipments.length > 0) return // Déjà chargé

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
        const state = get()
        if (state.diets.length > 0) return // Déjà chargé

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

    async fetchAllergies() {
        const state = get()
        if (state.allergies.length > 0) return // Déjà chargé

        set({ loading: true })
        try {
            const res = await fetch('/api/allergies')
            const { data } = await res.json()
            set({ allergies: data })
        } catch (error) {
            console.error('Failed to fetch allergies:', error)
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
            // Ne pas faire fetchRecipes() ici car la page liste va se recharger
            // get().fetchRecipes() // Refresh list
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

    async bulkUpdateVisibility(ids, isVisible) {
        set({ loading: true })
        try {
            await Promise.all(
                ids.map(id =>
                    fetch('/api/recipes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, is_visible: isVisible })
                    })
                )
            )
            set({ selectedRecipes: [] })
            get().fetchRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to bulk update visibility:', error)
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
    setSelectedDiets(diets) {
        set({ selectedDiets: diets })
    },
    setSelectedKitchenEquipments(equipments) {
        set({ selectedKitchenEquipments: equipments })
    },
    setQuantificationType(quantificationType) {
        set({ quantificationType })
    },
    setIsVisible(isVisible) {
        set({ isVisible })
    },
    setIsFolklore(isFolklore) {
        set({ isFolklore })
    },
}))
