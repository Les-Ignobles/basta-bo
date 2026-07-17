import { BaseRepository } from '@/lib/repositories/base-repository'
import { BatchCookingSessionReview, BatchCookingSessionReviewListResponse } from '@/features/cooking/types/batch-cooking-session-review'
import type { SupabaseClient } from '@supabase/supabase-js'

export class BatchCookingSessionReviewRepository extends BaseRepository<BatchCookingSessionReview> {
    constructor(client: SupabaseClient) {
        super(client, 'batch_cooking_session_reviews')
    }

    /**
     * Liste paginée avec session allégée : les colonnes lourdes de la session
     * (cooking_steps, assembly_steps, ingredients — ~450 KB par page de 20)
     * sont chargées à la demande via GET /api/batch-cooking-sessions/[id]
     * quand une review est ouverte.
     */
    async findPage(
        page: number = 1,
        pageSize: number = 20
    ): Promise<BatchCookingSessionReviewListResponse> {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error, count } = await this.client
            .from(this.table)
            .select(`
                *,
                user_profile:user_profiles!created_by (
                    id,
                    email,
                    firstname
                ),
                session:batch_cooking_sessions!session_id (
                    id,
                    meal_count,
                    people_count,
                    recipes
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) {
            throw new Error(`Erreur lors de la récupération des reviews: ${error.message}`)
        }

        return {
            data: (data || []) as BatchCookingSessionReview[],
            total: count || 0,
            page,
            pageSize
        }
    }
}
