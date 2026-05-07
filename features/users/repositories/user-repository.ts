import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActiveUser, UserExportFilters } from '../types'

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

    async exportUsers(filters: UserExportFilters): Promise<ActiveUser[]> {
        const PAGE_SIZE = 1000
        const nowIso = new Date().toISOString()
        const all: ActiveUser[] = []
        let from = 0

        while (true) {
            let query = this.client.from('active_users_view').select('*')

            if (filters.registeredFrom) query = query.gte('registered_at', filters.registeredFrom)
            if (filters.registeredTo) query = query.lte('registered_at', filters.registeredTo)
            if (filters.lastSessionFrom) query = query.gte('last_session_at', filters.lastSessionFrom)
            if (filters.lastSessionTo) query = query.lte('last_session_at', filters.lastSessionTo)
            if (typeof filters.minSessions === 'number') query = query.gte('session_count', filters.minSessions)
            if (filters.hasEmail) query = query.not('email', 'is', null).neq('email', '')

            if (filters.premium === 'premium') {
                query = query.gt('premium_sub_end_at', nowIso)
            } else if (filters.premium === 'non_premium') {
                query = query.or(`premium_sub_end_at.is.null,premium_sub_end_at.lte.${nowIso}`)
            }

            query = query.order('last_session_at', { ascending: false }).range(from, from + PAGE_SIZE - 1)

            const { data, error } = await query
            if (error) throw error

            const rows = (data ?? []) as ActiveUser[]
            all.push(...rows)
            if (rows.length < PAGE_SIZE) break
            from += PAGE_SIZE
        }

        return all
    }
}
