import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActiveUser } from '../types'

export class UserRepository {
    private client: SupabaseClient

    constructor(client: SupabaseClient) {
        this.client = client
    }

    async findActiveUsers({ page, pageSize, search, sortBy, sortOrder }: {
        page: number
        pageSize: number
        search?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
    }): Promise<{ data: ActiveUser[]; total: number }> {
        let query = this.client.from('active_users_view').select('*', { count: 'exact' })

        if (search) {
            query = query.or(`firstname.ilike.%${search}%,email.ilike.%${search}%`)
        }

        const column = sortBy || 'last_session_at'
        const ascending = sortOrder === 'asc'
        query = query.order(column, { ascending })

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        return {
            data: (data ?? []) as ActiveUser[],
            total: count ?? 0,
        }
    }
}
