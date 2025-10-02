import { BaseRepository } from '@/lib/repositories/base-repository'
import type { RecipeGenerationResult, RecipeGenerationStats } from '../types/recipe-generation-result'

export class RecipeGenerationResultRepository extends BaseRepository<RecipeGenerationResult> {
    constructor(client: any) {
        super(client, 'recipe_generation_results')
    }

    async findPage({ page, pageSize, search, dietMask, allergyMask, kitchenEquipmentMask }: { page: number; pageSize: number; search?: string; dietMask?: number; allergyMask?: number; kitchenEquipmentMask?: number }): Promise<{ data: RecipeGenerationResult[]; total: number }> {
        // Si on a un filtre par masque, on doit faire une approche différente car PostgREST ne supporte pas les opérations bit à bit
        if ((dietMask !== undefined && dietMask > 0) ||
            (allergyMask !== undefined && allergyMask > 0) ||
            (kitchenEquipmentMask !== undefined && kitchenEquipmentMask > 0)) {
            return this.findPageWithMaskFilter({ page, pageSize, search, dietMask, allergyMask, kitchenEquipmentMask })
        }

        // Approche normale sans filtre de régime
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        let query = (this.client as any).from(this.table).select('*', { count: 'exact' })

        if (search && search.trim()) {
            // Recherche dans les ingrédients ou pool_signature
            query = query.or(`ingredients.cs.{${search}},pool_signature.ilike.%${search}%`)
        }

        query = query.order('last_used_at', { ascending: false, nullsLast: true })
        const { data, error, count } = await query.range(from, to)
        if (error) throw error
        return { data: (data ?? []) as RecipeGenerationResult[], total: count ?? 0 }
    }

    private async findPageWithMaskFilter({ page, pageSize, search, dietMask, allergyMask, kitchenEquipmentMask }: { page: number; pageSize: number; search?: string; dietMask?: number; allergyMask?: number; kitchenEquipmentMask?: number }): Promise<{ data: RecipeGenerationResult[]; total: number }> {
        // Récupérer toutes les données pour appliquer le filtre côté client
        let query = (this.client as any).from(this.table).select('*')

        if (search && search.trim()) {
            // Recherche dans les ingrédients ou pool_signature
            query = query.or(`ingredients.cs.{${search}},pool_signature.ilike.%${search}%`)
        }

        query = query.order('last_used_at', { ascending: false, nullsLast: true })
        const { data, error } = await query
        if (error) throw error

        // Appliquer les filtres par masque côté client
        const allResults = (data ?? []) as RecipeGenerationResult[]
        const filteredResults = allResults.filter(result => {
            // Filtre par diet_mask
            if (dietMask !== undefined && dietMask > 0) {
                if (!result.diets_mask || (result.diets_mask & dietMask) === 0) {
                    return false
                }
            }

            // Filtre par allergy_mask
            if (allergyMask !== undefined && allergyMask > 0) {
                if (!result.allergies_mask || (result.allergies_mask & allergyMask) === 0) {
                    return false
                }
            }

            // Filtre par kitchen_equipment_mask
            if (kitchenEquipmentMask !== undefined && kitchenEquipmentMask > 0) {
                if (!result.kitchen_equipment_mask || (result.kitchen_equipment_mask & kitchenEquipmentMask) === 0) {
                    return false
                }
            }

            return true
        })

        // Appliquer la pagination côté client
        const total = filteredResults.length
        const from = (page - 1) * pageSize
        const to = from + pageSize
        const paginatedResults = filteredResults.slice(from, to)

        return { data: paginatedResults, total }
    }

    async getStats(): Promise<RecipeGenerationStats> {
        try {
            // Statistiques générales
            const { data: totalData, error: totalError } = await (this.client as any)
                .from(this.table)
                .select('id, shown_count, picked_count, compatibility_score, ingredients, dish_type, last_used_at')

            if (totalError) throw totalError

            const total = totalData?.length || 0
            const totalShown = totalData?.reduce((sum: number, item: any) => sum + (item.shown_count || 0), 0) || 0
            const totalPicked = totalData?.reduce((sum: number, item: any) => sum + (item.picked_count || 0), 0) || 0

            // Score de compatibilité moyen
            const validScores = totalData?.filter((item: any) => item.compatibility_score !== null)
            const averageCompatibilityScore = validScores?.length > 0
                ? validScores.reduce((sum: number, item: any) => sum + (item.compatibility_score || 0), 0) / validScores.length
                : 0

            // Ingrédients les plus utilisés
            const ingredientCounts: Record<string, number> = {}
            totalData?.forEach((item: any) => {
                if (item.ingredients && Array.isArray(item.ingredients)) {
                    item.ingredients.forEach((ingredient: string) => {
                        ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + 1
                    })
                }
            })
            const mostUsedIngredients = Object.entries(ingredientCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([ingredient, count]) => ({ ingredient, count }))

            // Types de plats les plus utilisés
            const dishTypeCounts: Record<number, number> = {}
            totalData?.forEach((item: any) => {
                if (item.dish_type !== null) {
                    dishTypeCounts[item.dish_type] = (dishTypeCounts[item.dish_type] || 0) + 1
                }
            })
            const mostUsedDishTypes = Object.entries(dishTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([dish_type, count]) => ({ dish_type: parseInt(dish_type), count }))

            // Activité récente (dernières 24h)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            const recentActivity = totalData?.filter((item: any) =>
                item.last_used_at && new Date(item.last_used_at) > new Date(oneDayAgo)
            ).length || 0

            // Taux de cache hit (approximation basée sur shown_count vs total)
            const cacheHitRate = total > 0 ? (totalShown / (total * 10)) * 100 : 0 // Approximation

            return {
                total,
                totalShown,
                totalPicked,
                averageCompatibilityScore: Math.round(averageCompatibilityScore * 100) / 100,
                mostUsedIngredients,
                mostUsedDishTypes,
                cacheHitRate: Math.min(cacheHitRate, 100),
                recentActivity
            }
        } catch (error) {
            console.error('Error fetching recipe generation stats:', error)
            throw error
        }
    }

    async getRecentActivity(limit: number = 10): Promise<RecipeGenerationResult[]> {
        const { data, error } = await (this.client as any)
            .from(this.table)
            .select('*')
            .order('last_used_at', { ascending: false, nullsLast: true })
            .limit(limit)

        if (error) throw error
        return (data ?? []) as RecipeGenerationResult[]
    }

    async deleteById(id: number): Promise<void> {
        const { error } = await (this.client as any)
            .from(this.table)
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    async clearOldEntries(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()

        const { data, error } = await (this.client as any)
            .from(this.table)
            .delete()
            .lt('created_at', cutoffDate)
            .select('id')

        if (error) throw error
        return data?.length || 0
    }
}
