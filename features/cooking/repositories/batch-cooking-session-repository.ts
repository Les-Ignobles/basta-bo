import { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from '@/lib/repositories/base-repository'
import { BatchCookingSession, BatchCookingSessionForm, BatchCookingSessionFilters, BatchCookingSessionListResponse } from '@/features/cooking/types/batch-cooking-session'

export class BatchCookingSessionRepository extends BaseRepository<BatchCookingSession> {
    constructor(supabase: SupabaseClient) {
        super(supabase, 'batch_cooking_sessions')
    }

    async findPage(
        page: number = 1,
        pageSize: number = 50,
        filters: BatchCookingSessionFilters = {}
    ): Promise<BatchCookingSessionListResponse> {
        console.log('Repository findPage appelé avec:', { page, pageSize, filters })
        
        let query = this.supabase
            .from(this.tableName)
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

        // Pagination
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        query = query
            .order('created_at', { ascending: false })
            .range(from, to)

        console.log('Exécution de la requête Supabase...')
        const { data, error, count } = await query

        if (error) {
            console.error('Erreur Supabase:', error)
            throw new Error(`Erreur lors de la récupération des batch cooking sessions: ${error.message}`)
        }

        console.log('Données récupérées:', { count, dataLength: data?.length })

        // Compter les enfants pour chaque session
        const sessionsWithChildrenCount = await Promise.all(
            (data || []).map(async (session) => {
                const { count: childrenCount } = await this.supabase
                    .from(this.tableName)
                    .select('*', { count: 'exact', head: true })
                    .eq('parent_id', session.id)

                return {
                    ...session,
                    children_count: childrenCount || 0
                }
            })
        )

        console.log('Sessions avec comptage des enfants terminé')
        return {
            data: sessionsWithChildrenCount,
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
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('parent_id', parentId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Erreur lors de la récupération des sessions enfants: ${error.message}`)
        }

        return data || []
    }

    async create(formData: BatchCookingSessionForm): Promise<BatchCookingSession> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert({
                meal_count: formData.meal_count,
                people_count: formData.people_count,
                seed: formData.seed,
                algo_version: formData.algo_version,
                is_original: true
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Erreur lors de la création de la session: ${error.message}`)
        }

        return data
    }

    async update(id: number, formData: Partial<BatchCookingSessionForm>): Promise<BatchCookingSession> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update(formData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erreur lors de la mise à jour de la session: ${error.message}`)
        }

        return data
    }

    async markAsCooked(id: number): Promise<BatchCookingSession> {
        const { data, error } = await this.supabase
            .from(this.tableName)
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
