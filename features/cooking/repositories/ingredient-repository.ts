import { BaseRepository } from '@/lib/repositories/base-repository'
import type { Ingredient } from '@/features/cooking/types'

export class IngredientRepository extends BaseRepository<Ingredient> {
    constructor(client: any) {
        super(client, 'ingredients')
    }

    async findPage({ search, page, pageSize, noImage, categories }: { search?: string; page: number; pageSize: number; noImage?: boolean; categories?: number[] }): Promise<{ data: Ingredient[]; total: number }> {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        let query = (this.client as any).from(this.table).select('*', { count: 'exact' })
        if (search && search.trim()) {
            // Recherche sur le nom FR (ajuster au besoin pour d’autres langues)
            query = query.ilike('name->>fr', `%${search}%`)
        }
        if (noImage) {
            query = query.is('img_path', null)
        }
        if (categories && categories.length > 0) {
            query = query.in('category_id', categories)
        }
        query = query.order('name->>fr', { ascending: true })
        const { data, error, count } = await query.range(from, to)
        if (error) throw error
        return { data: (data ?? []) as Ingredient[], total: count ?? 0 }
    }
}


