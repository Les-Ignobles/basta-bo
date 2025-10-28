import { BaseRepository } from '@/lib/repositories/base-repository'
import { BatchCookingSession, BatchCookingSessionForm, BatchCookingSessionFilters, BatchCookingSessionListResponse } from '@/features/cooking/types/batch-cooking-session'
import type { SupabaseClient } from '@supabase/supabase-js'

export class BatchCookingSessionRepository extends BaseRepository<BatchCookingSession> {
    constructor(client: SupabaseClient) {
        super(client, 'batch_cooking_sessions')
    }

    async findPage(
        page: number = 1,
        pageSize: number = 50,
        filters: BatchCookingSessionFilters = {}
    ): Promise<BatchCookingSessionListResponse> {
        console.log('Repository findPage appelé avec:', { page, pageSize, filters })

        // D'abord récupérer toutes les sessions originales pour pouvoir les trier
        let query = this.client
            .from(this.table)
            .select('*', { count: 'exact' })

        // Filtres
        if (filters.search) {
            query = query.or(`seed.ilike.%${filters.search}%,algo_version.ilike.%${filters.search}%`)
        }

        if (filters.is_original !== undefined) {
            query = query.eq('is_original', filters.is_original)
        }

        if (filters.is_cooked !== undefined) {
            query = query.eq('is_cooked', filters.is_cooked)
        }

        if (filters.recipe_generation_status) {
            query = query.eq('recipe_generation_status', filters.recipe_generation_status)
        }

        if (filters.ingredient_generation_status) {
            query = query.eq('ingredient_generation_status', filters.ingredient_generation_status)
        }

        if (filters.cooking_step_generation_status) {
            query = query.eq('cooking_step_generation_status', filters.cooking_step_generation_status)
        }

        if (filters.assembly_step_generation_status) {
            query = query.eq('assembly_step_generation_status', filters.assembly_step_generation_status)
        }

        if (filters.created_by) {
            query = query.eq('created_by', filters.created_by)
        }

        // Récupérer toutes les données pour pouvoir les trier
        query = query.order('created_at', { ascending: false })

        console.log('Exécution de la requête Supabase...')
        const { data, error, count } = await query

        if (error) {
            console.error('Erreur Supabase:', error)
            throw new Error(`Erreur lors de la récupération des batch cooking sessions: ${error.message}`)
        }

        console.log('Données récupérées:', { count, dataLength: data?.length })

        // Compter les enfants pour chaque session et extraire l'algo_name
        const sessionsWithChildrenCount = await Promise.all(
            (data || []).map(async (session) => {
                const { count: childrenCount } = await this.client
                    .from(this.table)
                    .select('*', { count: 'exact', head: true })
                    .eq('parent_id', session.id)

                // Extraire l'algo_name des recettes
                let algo_name = 'N/A'
                if (session.recipes && Array.isArray(session.recipes) && session.recipes.length > 0) {
                    // Prendre le premier titre de recette comme algo_name
                    algo_name = session.recipes[0]?.title || 'N/A'
                }

                return {
                    ...session,
                    children_count: childrenCount || 0,
                    algo_name
                }
            })
        )

        // Trier par nombre d'enfants décroissant
        sessionsWithChildrenCount.sort((a, b) => (b.children_count || 0) - (a.children_count || 0))

        // Appliquer la pagination après le tri
        const from = (page - 1) * pageSize
        const to = from + pageSize
        const paginatedData = sessionsWithChildrenCount.slice(from, to)

        console.log('Sessions avec comptage des enfants terminé')
        return {
            data: paginatedData,
            total: count || 0,
            page,
            pageSize
        }
    }

    async findOriginalSessions(
        page: number = 1,
        pageSize: number = 50,
        filters: Omit<BatchCookingSessionFilters, 'is_original'> = {}
    ): Promise<BatchCookingSessionListResponse> {
        return this.findPage(page, pageSize, { ...filters, is_original: true })
    }

    async findChildrenByParentId(parentId: number): Promise<BatchCookingSession[]> {
        console.log('Recherche des sessions enfants pour parent_id:', parentId)

        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .eq('parent_id', parentId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erreur lors de la récupération des sessions enfants:', error)
            throw new Error(`Erreur lors de la récupération des sessions enfants: ${error.message}`)
        }

        console.log('Sessions enfants trouvées:', data?.length || 0)
        return data || []
    }

    async create(payload: Omit<BatchCookingSession, 'id'>): Promise<BatchCookingSession> {
        const { data, error } = await this.client
            .from(this.table)
            .insert(payload)
            .select()
            .single()

        if (error) {
            throw new Error(`Erreur lors de la création de la session: ${error.message}`)
        }

        return data
    }

    async update(id: number, payload: Partial<BatchCookingSession>): Promise<BatchCookingSession> {
        const { data, error } = await this.client
            .from(this.table)
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erreur lors de la mise à jour de la session: ${error.message}`)
        }

        return data
    }

    async markAsCooked(id: number): Promise<BatchCookingSession> {
        const { data, error } = await this.client
            .from(this.table)
            .update({
                is_cooked: true,
                cooked_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erreur lors du marquage comme cuisiné: ${error.message}`)
        }

        return data
    }
}
