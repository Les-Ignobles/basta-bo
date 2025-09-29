import { BaseRepository } from '@/lib/repositories/base-repository'
import type { IngredientCategory } from '@/features/cooking/types'

export class IngredientCategoryRepository extends BaseRepository<IngredientCategory> {
    constructor(client: any) {
        super(client, 'ingredient_categories')
    }
}


