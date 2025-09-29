import { BaseRepository } from '@/lib/repositories/base-repository'
import type { Ingredient } from '@/features/cooking/types'

export class IngredientRepository extends BaseRepository<Ingredient> {
    constructor(client: any) {
        super(client, 'ingredients')
    }
}


