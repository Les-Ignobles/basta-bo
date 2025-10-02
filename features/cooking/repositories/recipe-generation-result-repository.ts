import { BaseRepository } from '@/lib/repositories/base-repository'
import type { RecipeGenerationResult, RecipeGenerationStats } from '../types/recipe-generation-result'

export class RecipeGenerationResultRepository extends BaseRepository<RecipeGenerationResult> {
    constructor(client: any) {
        super(client, 'recipe_generation_results')
    }

    async findPage({ page, pageSize, search }: { page: number; pageSize: number; search?: string }): Promise<{ data: RecipeGenerationResult[]; total: number }> {
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
                .sort(([,a], [,b]) => b - a)
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
                .sort(([,a], [,b]) => b - a)
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
