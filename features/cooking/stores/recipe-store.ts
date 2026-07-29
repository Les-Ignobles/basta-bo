import { create } from 'zustand'
import { Recipe, KitchenEquipment, RecipeFormValues, DishType, QuantificationType } from '../types'
import type { Diet } from '@/features/cooking/types/diet'
import type { Allergy } from '@/features/cooking/types/allergy'

type RecipeState = {
    recipes: Recipe[]
    /** Catalogue complet chargé une fois pour la recherche/filtres côté client. */
    allRecipes: Recipe[]
    kitchenEquipments: KitchenEquipment[]
    diets: Diet[]
    allergies: Allergy[]
    loading: boolean
    /** Chargement dédié au catalogue complet (découplé du `loading` partagé). */
    recipesLoading: boolean
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
    /** Filtre : recettes avec des ingrédients d'étapes non reliés au catalogue. */
    orphanOnly: boolean
    dishType: DishType | 'all'
    selectedDiets: number[]
    selectedKitchenEquipments: number[]
    quantificationType: QuantificationType | 'all'
    isVisible: boolean | null
    isFolklore: boolean | null
    /** Mois sélectionnés pour le filtre saisonnalité (0 = janvier ... 11 = décembre). */
    selectedMonths: number[]
    fetchRecipes: () => Promise<void>
    fetchAllRecipes: () => Promise<void>
    fetchKitchenEquipments: () => Promise<void>
    fetchDiets: () => Promise<void>
    fetchAllergies: () => Promise<void>
    createRecipe: (payload: Omit<RecipeFormValues, 'id'>) => Promise<Recipe | null>
    updateRecipe: (id: number, payload: Partial<RecipeFormValues>) => Promise<void>
    deleteRecipe: (id: number) => Promise<void>
    bulkDeleteRecipes: (ids: number[]) => Promise<void>
    bulkUpdateDishType: (ids: number[], dishType: DishType) => Promise<void>
    bulkUpdateSeasonality: (ids: number[], seasonalityMask: number) => Promise<void>
    bulkUpdateDietMask: (ids: number[], dietMask: number) => Promise<void>
    bulkUpdateKitchenEquipmentsMask: (ids: number[], equipmentsMask: number) => Promise<void>
    bulkUpdateVisibility: (ids: number[], isVisible: boolean) => Promise<void>
    toggleRecipeIsNew: (id: number, isNew: boolean) => Promise<void>
    setSearch: (s: string) => void
    setPage: (p: number) => void
    setNoImage: (b: boolean) => void
    setOrphanOnly: (b: boolean) => void
    setDishType: (d: DishType | 'all') => void
    setSelectedDiets: (diets: number[]) => void
    setSelectedKitchenEquipments: (equipments: number[]) => void
    setQuantificationType: (q: QuantificationType | 'all') => void
    setIsVisible: (v: boolean | null) => void
    setIsFolklore: (f: boolean | null) => void
    setSelectedMonths: (months: number[]) => void
    setEditingRecipe: (recipe: Recipe | null) => void
    setSelectedRecipes: (ids: number[]) => void
    toggleRecipeSelection: (id: number) => void
    selectAllRecipes: () => void
    clearSelection: () => void
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
    recipes: [],
    allRecipes: [],
    kitchenEquipments: [],
    diets: [],
    allergies: [],
    loading: false,
    recipesLoading: true,
    error: undefined,
    editingRecipe: null,
    selectedRecipes: [],
    page: 1,
    pageSize: 50,
    total: 0,
    search: '',
    noImage: false,
    orphanOnly: false,
    dishType: 'all',
    selectedDiets: [],
    selectedKitchenEquipments: [],
    quantificationType: 'all',
    isVisible: null,
    isFolklore: null,
    selectedMonths: [],
    async fetchAllRecipes() {
        set({ recipesLoading: true, error: undefined })
        try {
            const res = await fetch('/api/recipes?all=true')
            const json = await res.json()
            const data = (json.data ?? []) as Recipe[]
            set({ allRecipes: data, total: data.length })
        } catch (e: any) {
            set({ error: e?.message ?? 'Erreur de chargement' })
        } finally {
            set({ recipesLoading: false })
        }
    },
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
            const response = await fetch('/api/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const { data } = await response.json()
            get().fetchAllRecipes() // Refresh list
            return data as Recipe
        } catch (error) {
            console.error('Failed to create recipe:', error)
            return null
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
            // get().fetchAllRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to update recipe:', error)
        } finally {
            set({ loading: false })
        }
    },
    async deleteRecipe(id) {
        set({ loading: true })
        try {
            const res = await fetch(`/api/recipes?id=${id}`, {
                method: 'DELETE',
            })
            if (!res.ok) {
                const { error } = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
                throw new Error(error || `HTTP ${res.status}`)
            }
            get().fetchAllRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to delete recipe:', error)
            alert(`La suppression a échoué : ${error instanceof Error ? error.message : error}`)
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
    setOrphanOnly(b) {
        set({ orphanOnly: b, page: 1 })
    },
    setDishType(d) {
        set({ dishType: d, page: 1 })
    },

    async bulkDeleteRecipes(ids) {
        set({ loading: true })
        try {
            const responses = await Promise.all(
                ids.map(id =>
                    fetch(`/api/recipes?id=${id}`, {
                        method: 'DELETE',
                    })
                )
            )
            const failed = responses.filter(r => !r.ok).length
            if (failed > 0) {
                alert(`${failed} recette(s) sur ${ids.length} n'ont pas pu être supprimées.`)
            }
            set({ selectedRecipes: [] })
            get().fetchAllRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to bulk delete recipes:', error)
            alert(`La suppression a échoué : ${error instanceof Error ? error.message : error}`)
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
            get().fetchAllRecipes() // Refresh list
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
            get().fetchAllRecipes() // Refresh list
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
            get().fetchAllRecipes() // Refresh list
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
            get().fetchAllRecipes() // Refresh list
        } catch (error) {
            console.error('Failed to bulk update kitchen equipments mask:', error)
        } finally {
            set({ loading: false })
        }
    },

    async toggleRecipeIsNew(id, isNew) {
        // Optimiste : on met à jour la liste localement, revert si l'API échoue
        const applyIsNew = (value: boolean) =>
            set(state => ({
                recipes: state.recipes.map(r => (Number(r.id) === id ? { ...r, is_new: value } : r)),
                allRecipes: state.allRecipes.map(r => (Number(r.id) === id ? { ...r, is_new: value } : r))
            }))
        applyIsNew(isNew)
        try {
            const response = await fetch('/api/recipes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_new: isNew })
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
        } catch (error) {
            console.error('Failed to toggle recipe is_new:', error)
            applyIsNew(!isNew)
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
            get().fetchAllRecipes() // Refresh list
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
    setSelectedMonths(months) {
        set({ selectedMonths: months })
    },
}))
