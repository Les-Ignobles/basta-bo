import { BaseRepository } from '@/lib/repositories/base-repository'
import type { Diet, DietFormValues } from '@/features/cooking/types/diet'

export class DietRepository extends BaseRepository<Diet> {
    constructor(client: any) {
        super(client, 'diets')
    }

    async findAll(): Promise<Diet[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .order('order', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch diets: ${error.message}`)
        }

        return data || []
    }

    async findById(id: number): Promise<Diet | null> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            throw new Error(`Failed to fetch diet: ${error.message}`)
        }

        return data
    }

    async findBySlug(slug: string): Promise<Diet | null> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            throw new Error(`Failed to fetch diet by slug: ${error.message}`)
        }

        return data
    }

    async create(payload: DietFormValues): Promise<Diet> {
        const { data, error } = await this.client
            .from(this.table)
            .insert(payload)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create diet: ${error.message}`)
        }

        return data
    }

    async update(id: number, payload: Partial<DietFormValues>): Promise<Diet> {
        const { data, error } = await this.client
            .from(this.table)
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update diet: ${error.message}`)
        }

        return data
    }

    async delete(id: number): Promise<void> {
        const { error } = await this.client
            .from(this.table)
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Failed to delete diet: ${error.message}`)
        }
    }
}
