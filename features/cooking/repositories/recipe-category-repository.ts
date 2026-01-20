import type { SupabaseClient } from '@supabase/supabase-js'
import type { RecipeCategory, RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'

export class RecipeCategoryRepository {
    private client: SupabaseClient
    private table = 'recipe_categories'

    constructor(client: SupabaseClient) {
        this.client = client
    }

    async findAll(): Promise<RecipeCategory[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch recipe categories: ${error.message}`)
        }

        return data || []
    }

    async findById(id: number): Promise<RecipeCategory | null> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null
            }
            throw new Error(`Failed to fetch recipe category: ${error.message}`)
        }

        return data
    }

    async findPinned(): Promise<RecipeCategory[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .eq('is_pinned', true)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Failed to fetch pinned categories: ${error.message}`)
        }

        return data || []
    }

    async create(payload: RecipeCategoryFormValues): Promise<RecipeCategory> {
        const dbPayload = {
            name: { fr: payload.name_fr, en: payload.name_en },
            emoji: payload.emoji,
            color: payload.color,
            is_pinned: payload.is_pinned,
        }

        const { data, error } = await this.client
            .from(this.table)
            .insert(dbPayload)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create recipe category: ${error.message}`)
        }

        return data
    }

    async update(id: number, payload: Partial<RecipeCategoryFormValues>): Promise<RecipeCategory> {
        const dbPayload: Record<string, unknown> = {}

        if (payload.name_fr !== undefined || payload.name_en !== undefined) {
            // Fetch current values first to merge
            const current = await this.findById(id)
            if (current) {
                dbPayload.name = {
                    fr: payload.name_fr ?? current.name.fr,
                    en: payload.name_en ?? current.name.en,
                }
            }
        }
        if (payload.emoji !== undefined) dbPayload.emoji = payload.emoji
        if (payload.color !== undefined) dbPayload.color = payload.color
        if (payload.is_pinned !== undefined) dbPayload.is_pinned = payload.is_pinned

        const { data, error } = await this.client
            .from(this.table)
            .update(dbPayload)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update recipe category: ${error.message}`)
        }

        return data
    }

    async delete(id: number): Promise<void> {
        const { error } = await this.client
            .from(this.table)
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Failed to delete recipe category: ${error.message}`)
        }
    }
}
