import { BaseRepository } from '@/lib/repositories/base-repository'
import type { PendingIngredient } from '../types'
import type { SupabaseClient } from '@supabase/supabase-js'

export class PendingIngredientRepository extends BaseRepository<PendingIngredient> {
    constructor(client: SupabaseClient) {
        super(client, 'pending_ingredients')
    }

    async findAll(): Promise<PendingIngredient[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Error fetching pending ingredients: ${error.message}`)
        }

        return data || []
    }

    async findPage(page: number = 1, pageSize: number = 50, search?: string): Promise<{
        data: PendingIngredient[]
        total: number
        page: number
        pageSize: number
    }> {
        const offset = (page - 1) * pageSize

        let query = this.client
            .from(this.table)
            .select('*', { count: 'exact' })

        if (search) {
            query = query.ilike('name', `%${search}%`)
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1)

        if (error) {
            throw new Error(`Error fetching pending ingredients page: ${error.message}`)
        }

        return {
            data: data || [],
            total: count || 0,
            page,
            pageSize
        }
    }

    async delete(id: number): Promise<void> {
        const { error } = await this.client
            .from(this.table)
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Error deleting pending ingredient: ${error.message}`)
        }
    }
}
