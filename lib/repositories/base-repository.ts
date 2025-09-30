import type { SupabaseClient } from '@supabase/supabase-js'

export abstract class BaseRepository<T extends { id: number }> {
    protected table: string
    protected client: SupabaseClient

    constructor(client: SupabaseClient, table: string) {
        this.client = client
        this.table = table
    }

    async findAll(): Promise<T[]> {
        const { data, error } = await this.client.from(this.table).select('*')
        if (error) throw error
        return (data ?? []) as T[]
    }

    async findById(id: number): Promise<T | null> {
        const { data, error } = await this.client.from(this.table).select('*').eq('id', id).single()
        if (error) {
            if ((error as unknown as Record<string, unknown>).code === 'PGRST116') return null
            throw error
        }
        return (data as T) ?? null
    }

    async create(payload: Omit<T, 'id'>): Promise<T> {
        const { data, error } = await this.client.from(this.table).insert(payload as Record<string, unknown>).select('*').single()
        if (error) throw error
        return data as T
    }

    async update(id: number, payload: Partial<T>): Promise<T> {
        const { data, error } = await this.client.from(this.table).update(payload as Record<string, unknown>).eq('id', id).select('*').single()
        if (error) throw error
        return data as T
    }

    async delete(id: number): Promise<void> {
        const { error } = await this.client.from(this.table).delete().eq('id', id)
        if (error) throw error
    }
}


