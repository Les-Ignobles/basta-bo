import { BaseRepository } from '@/lib/repositories/base-repository'
import type { Recipe, QuantificationType } from '@/features/cooking/types'

export class RecipeRepository extends BaseRepository<Recipe> {
    constructor(client: any) {
        super(client, 'recipes')
    }

    async findPage({ search, page, pageSize, noImage, dishType, quantificationType }: { search?: string; page: number; pageSize: number; noImage?: boolean; dishType?: number; quantificationType?: number }): Promise<{ data: Recipe[]; total: number }> {
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

        if (quantificationType !== undefined) {
            query = query.eq('quantification_type', quantificationType)
        }

        query = query.order('title', { ascending: true })
        const { data, error, count } = await query.range(from, to)
        if (error) throw error
        return { data: (data ?? []) as Recipe[], total: count ?? 0 }
    }

    async findPageWithDiets({ search, page, pageSize, noImage, dishType, diets, quantificationType }: { search?: string; page: number; pageSize: number; noImage?: boolean; dishType?: number; diets?: number[]; quantificationType?: number }): Promise<{ data: Recipe[]; total: number }> {
        // Pour l'instant, utiliser la méthode normale et filtrer côté client
        // TODO: Implémenter une solution SQL plus robuste si nécessaire
        const result = await this.findPage({ search, page, pageSize, noImage, dishType, quantificationType })

        if (diets && diets.length > 0) {
            const filteredRecipes = result.data.filter((recipe: Recipe) => {
                if (!recipe.diet_mask || recipe.diet_mask === null) return false

                // Vérifier si la recette a au moins un des régimes sélectionnés
                return diets.some(dietId => {
                    const bitPosition = 1 << (dietId - 1)
                    return (recipe.diet_mask! & bitPosition) > 0
                })
            })

            return { data: filteredRecipes, total: filteredRecipes.length }
        }

        return result
    }
}
