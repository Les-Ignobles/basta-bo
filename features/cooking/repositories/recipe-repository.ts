import { BaseRepository } from '@/lib/repositories/base-repository'
import type { Recipe, QuantificationType } from '@/features/cooking/types'

export class RecipeRepository extends BaseRepository<Recipe> {
    constructor(client: any) {
        super(client, 'recipes')
    }

    async findPage({ search, page, pageSize, noImage, dishType, quantificationType, isVisible, isFolklore }: { search?: string; page: number; pageSize: number; noImage?: boolean; dishType?: number; quantificationType?: number; isVisible?: boolean; isFolklore?: boolean }): Promise<{ data: Recipe[]; total: number }> {
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

        if (isVisible !== undefined) {
            query = query.eq('is_visible', isVisible)
        }

        if (isFolklore !== undefined) {
            query = query.eq('is_folklore', isFolklore)
        }

        query = query.order('title', { ascending: true })
        const { data, error, count } = await query.range(from, to)
        if (error) throw error
        return { data: (data ?? []) as Recipe[], total: count ?? 0 }
    }

    async findPageWithDiets({ search, page, pageSize, noImage, dishType, diets, quantificationType, isVisible, isFolklore }: { search?: string; page: number; pageSize: number; noImage?: boolean; dishType?: number; diets?: number[]; quantificationType?: number; isVisible?: boolean; isFolklore?: boolean }): Promise<{ data: Recipe[]; total: number }> {
        if (diets && diets.length > 0) {
            // Quand on a des filtres de régime, on doit récupérer toutes les recettes d'abord
            // sans appliquer les filtres de visibilité/folklore côté serveur
            const allRecipes = await this.findPage({
                search,
                page: 1,
                pageSize: 1000, // Récupérer un grand nombre
                noImage,
                dishType,
                quantificationType
                // Ne pas passer isVisible et isFolklore ici
            })

            // Filtrer par régime
            let filteredRecipes = allRecipes.data.filter((recipe: Recipe) => {
                if (!recipe.diet_mask || recipe.diet_mask === null) return false

                // Vérifier si la recette a TOUS les régimes sélectionnés (AND)
                return diets.every(dietId => {
                    const bitPosition = 1 << (dietId - 1)
                    return (recipe.diet_mask! & bitPosition) > 0
                })
            })

            // Appliquer les filtres de visibilité/folklore côté client
            if (isVisible !== undefined) {
                filteredRecipes = filteredRecipes.filter(recipe => recipe.is_visible === isVisible)
            }
            if (isFolklore !== undefined) {
                filteredRecipes = filteredRecipes.filter(recipe => recipe.is_folklore === isFolklore)
            }

            // Appliquer la pagination
            const from = (page - 1) * pageSize
            const to = from + pageSize
            const paginatedRecipes = filteredRecipes.slice(from, to)

            return { data: paginatedRecipes, total: filteredRecipes.length }
        }

        // Si pas de filtres de régime, utiliser la méthode normale
        return await this.findPage({
            search,
            page,
            pageSize,
            noImage,
            dishType,
            quantificationType,
            isVisible,
            isFolklore
        })
    }
}
