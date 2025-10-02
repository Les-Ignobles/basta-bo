import { BaseRepository } from '@/lib/repositories/base-repository'
import type { Recipe } from '@/features/cooking/types'

export class RecipeRepository extends BaseRepository<Recipe> {
    constructor(client: any) {
        super(client, 'recipes')
    }

    async findPage({ search, page, pageSize, noImage, dishType, diets }: { search?: string; page: number; pageSize: number; noImage?: boolean; dishType?: number; diets?: number[] }): Promise<{ data: Recipe[]; total: number }> {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        let query = (this.client as any).from(this.table).select('*', { count: 'exact' })

        if (search && search.trim()) {
            query = query.ilike('title', `%${search}%`)
        }

        if (noImage) {
            query = query.is('img_path', null)
        }

        if (dishType !== undefined) {
            query = query.eq('dish_type', dishType)
        }

        if (diets && diets.length > 0) {
            // Filtre par régimes alimentaires : la recette doit avoir au moins un des régimes sélectionnés
            // Utilisation d'un OR pour chaque régime sélectionné
            const dietConditions = diets.map(dietId => 
                `diet_mask & ${1 << (dietId - 1)} > 0`
            ).join(' OR ')
            
            if (dietConditions) {
                query = query.or(dietConditions)
            }
        }

        query = query.order('title', { ascending: true })
        const { data, error, count } = await query.range(from, to)
        if (error) throw error
        return { data: (data ?? []) as Recipe[], total: count ?? 0 }
    }
}
