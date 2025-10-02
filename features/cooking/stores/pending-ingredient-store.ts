import { create } from 'zustand'
import type { PendingIngredient } from '../types'
import type { IngredientFormValues } from '../components/ingredient-form'

type PendingIngredientState = {
    pendingIngredients: PendingIngredient[]
    loading: boolean
    error: string | null
    page: number
    pageSize: number
    total: number
    search: string
    editingPendingIngredient: PendingIngredient | null
    selectedPendingIngredients: number[]
}

type PendingIngredientActions = {
    fetchPendingIngredients: () => Promise<void>
    fetchPendingCount: () => Promise<void>
    deletePendingIngredient: (id: number) => Promise<void>
    bulkDeletePendingIngredients: (ids: number[]) => Promise<void>
    convertToIngredient: (pendingId: number, ingredientData: IngredientFormValues) => Promise<void>
    bulkProcessWithAI: (ingredientsToCreate: Record<string, unknown>[], onProgress?: (completed: number, total: number, success: boolean, ingredientName: string) => void) => Promise<{ success: boolean; message: string; processed: number; created: Record<string, unknown>[]; errors?: string[] }>
    previewBulkProcess: (onProgress?: (completed: number, total: number, result?: Record<string, unknown>) => void) => Promise<{ success: boolean; message: string; processed: number; ingredients: Record<string, unknown>[]; errors?: string[] }>
    generateIngredientData: (pendingId: number) => Promise<{ success: boolean; ingredient: Record<string, unknown>; error?: string }>
    setSearch: (search: string) => void
    setPage: (page: number) => void
    setEditingPendingIngredient: (pendingIngredient: PendingIngredient | null) => void
    setSelectedPendingIngredients: (ids: number[]) => void
    togglePendingIngredientSelection: (id: number) => void
    selectAllPendingIngredients: () => void
    clearPendingIngredientSelection: () => void
    clearError: () => void
}

export const usePendingIngredientStore = create<PendingIngredientState & PendingIngredientActions>((set, get) => ({
    // State
    pendingIngredients: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 50,
    total: 0,
    search: '',
    editingPendingIngredient: null,
    selectedPendingIngredients: [],

    // Actions
    fetchPendingIngredients: async () => {
        set({ loading: true, error: null })
        try {
            const { page, pageSize, search } = get()
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                ...(search && { search })
            })

            const response = await fetch(`/api/pending-ingredients?${params}`)
            if (!response.ok) {
                throw new Error('Failed to fetch pending ingredients')
            }

            const data = await response.json()
            set({
                pendingIngredients: data.data,
                total: data.total,
                loading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
        }
    },

    fetchPendingCount: async () => {
        try {
            const response = await fetch('/api/pending-ingredients?page=1&pageSize=1')
            if (!response.ok) {
                throw new Error('Failed to fetch pending count')
            }

            const data = await response.json()
            set({ total: data.total })
        } catch (error) {
            console.error('Error fetching pending count:', error)
        }
    },

    deletePendingIngredient: async (id: number) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch(`/api/pending-ingredients?id=${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete pending ingredient')
            }

            // Refresh the list
            await get().fetchPendingIngredients()
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
        }
    },

    convertToIngredient: async (pendingId: number, ingredientData: IngredientFormValues) => {
        set({ loading: true, error: null })
        try {
            const response = await fetch('/api/pending-ingredients/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pendingId,
                    ingredientData
                })
            })

            if (!response.ok) {
                throw new Error('Failed to convert pending ingredient')
            }

            // Refresh the list
            await get().fetchPendingIngredients()
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
        }
    },

    bulkProcessWithAI: async (ingredientsToCreate: Record<string, unknown>[], onProgress?: (completed: number, total: number, success: boolean, ingredientName: string) => void) => {
        set({ loading: true, error: null })
        try {
            const results = {
                success: true,
                message: '',
                processed: 0,
                created: [] as Record<string, unknown>[],
                errors: [] as string[]
            }

            const total = ingredientsToCreate.length
            let completed = 0

            // Traiter chaque ingrédient individuellement
            for (const ingredientData of ingredientsToCreate) {
                try {
                    const pendingId = ingredientData.pendingId as number
                    const ingredientName = ingredientData.pendingName as string || 'Ingrédient inconnu'

                    if (!pendingId) {
                        results.errors.push('ID pending manquant')
                        completed++
                        onProgress?.(completed, total, false, ingredientName)
                        continue
                    }

                    // Utiliser la nouvelle route de conversion
                    const response = await fetch('/api/pending-ingredients/convert', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            pendingId,
                            ingredientData: {
                                name: ingredientData.name,
                                suffix_singular: ingredientData.suffix_singular,
                                suffix_plural: ingredientData.suffix_plural,
                                category_id: ingredientData.category_id,
                                img_path: null
                            }
                        })
                    })

                    if (response.ok) {
                        results.created.push(ingredientData)
                        results.processed++
                        completed++
                        onProgress?.(completed, total, true, ingredientName)
                    } else {
                        const errorData = await response.json()
                        const errorMsg = `Erreur pour ${ingredientName}: ${errorData.error || 'Erreur inconnue'}`
                        results.errors.push(errorMsg)
                        completed++
                        onProgress?.(completed, total, false, ingredientName)
                    }
                } catch (error) {
                    const ingredientName = ingredientData.pendingName as string || 'Ingrédient inconnu'
                    const errorMsg = `Erreur pour ${ingredientName}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
                    results.errors.push(errorMsg)
                    completed++
                    onProgress?.(completed, total, false, ingredientName)
                }
            }

            results.message = `Traitement terminé : ${results.created.length} ingrédient(s) créé(s) sur ${results.processed} traité(s)`

            // Refresh the list and count
            await get().fetchPendingIngredients()
            await get().fetchPendingCount()

            set({ loading: false })
            return results
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
            throw error
        }
    },

    previewBulkProcess: async (onProgress?: (completed: number, total: number, result?: Record<string, unknown>) => void) => {
        set({ loading: true, error: null })
        try {
            const { pendingIngredients } = get()
            const results: Record<string, unknown>[] = []
            const errors: string[] = []
            const BATCH_SIZE = 15 // Traiter par paquets de 15

            // Diviser en paquets
            const batches = []
            for (let i = 0; i < pendingIngredients.length; i += BATCH_SIZE) {
                batches.push(pendingIngredients.slice(i, i + BATCH_SIZE))
            }

            let completed = 0

            // Traiter chaque paquet en parallèle
            for (const batch of batches) {
                const batchPromises = batch.map(async (pending) => {
                    try {
                        const result = await get().generateIngredientData(pending.id)
                        completed++

                        if (result.success) {
                            results.push(result.ingredient)
                            // Callback de progression avec le résultat
                            onProgress?.(completed, pendingIngredients.length, result.ingredient)
                            return { success: true, ingredient: result.ingredient }
                        } else {
                            errors.push(result.error || `Erreur pour ${pending.name}`)
                            onProgress?.(completed, pendingIngredients.length)
                            return { success: false, error: result.error }
                        }
                    } catch (error) {
                        completed++
                        errors.push(`Erreur pour ${pending.name}: ${error}`)
                        onProgress?.(completed, pendingIngredients.length)
                        return { success: false, error: error }
                    }
                })

                // Attendre que le paquet soit terminé avant de passer au suivant
                await Promise.all(batchPromises)
            }

            set({ loading: false })
            return {
                success: true,
                message: `Génération IA terminée : ${results.length} ingrédients traités`,
                processed: pendingIngredients.length,
                ingredients: results,
                errors: errors.length > 0 ? errors : undefined
            }
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
            throw error
        }
    },

    generateIngredientData: async (pendingId: number) => {
        try {
            // Récupérer le nom du pending ingredient
            const { pendingIngredients } = get()
            const pending = pendingIngredients.find(p => p.id === pendingId)

            if (!pending) {
                return {
                    success: false,
                    ingredient: {},
                    error: 'Pending ingredient non trouvé'
                }
            }

            const response = await fetch('/api/ingredients/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ingredientName: pending.name })
            })

            if (!response.ok) {
                throw new Error('Failed to generate ingredient data with AI')
            }

            const result = await response.json()

            if (result.success && result.ingredient) {
                return {
                    success: true,
                    ingredient: {
                        ...result.ingredient,
                        pendingId: pendingId,
                        pendingName: pending.name
                    }
                }
            } else {
                return {
                    success: false,
                    ingredient: {},
                    error: result.message || 'Aucun résultat généré'
                }
            }
        } catch (error) {
            return {
                success: false,
                ingredient: {},
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    },

    setSearch: (search: string) => {
        set({ search, page: 1 })
    },

    setPage: (page: number) => {
        set({ page })
    },

    setEditingPendingIngredient: (pendingIngredient: PendingIngredient | null) => {
        set({ editingPendingIngredient: pendingIngredient })
    },

    clearError: () => {
        set({ error: null })
    },

    bulkDeletePendingIngredients: async (ids: number[]) => {
        set({ loading: true, error: null })
        try {
            // Supprimer chaque pending ingredient individuellement
            const deletePromises = ids.map(id =>
                fetch(`/api/pending-ingredients?id=${id}`, {
                    method: 'DELETE'
                })
            )

            await Promise.all(deletePromises)

            // Refresh the list and count
            await get().fetchPendingIngredients()
            await get().fetchPendingCount()

            // Clear selection
            set({ selectedPendingIngredients: [] })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            })
        }
    },

    setSelectedPendingIngredients: (ids: number[]) => {
        set({ selectedPendingIngredients: ids })
    },

    togglePendingIngredientSelection: (id: number) => {
        set((state) => {
            const selected = state.selectedPendingIngredients
            const isSelected = selected.includes(id)

            if (isSelected) {
                return { selectedPendingIngredients: selected.filter(selectedId => selectedId !== id) }
            } else {
                return { selectedPendingIngredients: [...selected, id] }
            }
        })
    },

    selectAllPendingIngredients: () => {
        set((state) => ({
            selectedPendingIngredients: state.pendingIngredients.map(p => p.id)
        }))
    },

    clearPendingIngredientSelection: () => {
        set({ selectedPendingIngredients: [] })
    }
}))
