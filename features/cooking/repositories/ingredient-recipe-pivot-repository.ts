import { BaseRepository } from '@/lib/repositories/base-repository'
import type { IngredientRecipePivot, Ingredient, Recipe, StructuredIngredient } from '@/features/cooking/types'

export class IngredientRecipePivotRepository extends BaseRepository<IngredientRecipePivot> {
    constructor(client: any) {
        super(client, 'ingredient_recipe_pivot')
    }

    async findByRecipeId(recipeId: number): Promise<IngredientRecipePivot[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .eq('recipe_id', recipeId)

        if (error) throw error
        return (data ?? []) as IngredientRecipePivot[]
    }

    async findIngredientsForRecipe(recipeId: number): Promise<Ingredient[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('ingredient_id, ingredients(*)')
            .eq('recipe_id', recipeId)

        if (error) throw error

        // Extraire les objets ingredients depuis les résultats
        return (data ?? []).map((item: any) => item.ingredients).filter(Boolean) as Ingredient[]
    }

    async findRecipesForIngredient(ingredientId: number): Promise<Recipe[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('recipe_id, recipes(*)')
            .eq('ingredient_id', ingredientId)

        if (error) throw error

        // Extraire les objets recipes depuis les résultats
        return (data ?? []).map((item: any) => item.recipes).filter(Boolean) as Recipe[]
    }

    async deleteByRecipeId(recipeId: number): Promise<void> {
        const { error } = await this.client
            .from(this.table)
            .delete()
            .eq('recipe_id', recipeId)

        if (error) throw error
    }

    async createBatch(pivots: Omit<IngredientRecipePivot, 'id' | 'created_at'>[]): Promise<IngredientRecipePivot[]> {
        if (pivots.length === 0) return []

        const { data, error } = await this.client
            .from(this.table)
            .insert(pivots)
            .select('*')

        if (error) throw error
        return (data ?? []) as IngredientRecipePivot[]
    }

    async syncRecipeIngredients(recipeId: number, ingredientIds: number[]): Promise<void> {
        // Supprimer les anciennes relations
        await this.deleteByRecipeId(recipeId)

        // Créer les nouvelles relations
        if (ingredientIds.length > 0) {
            const pivots = ingredientIds.map(ingredientId => ({
                recipe_id: recipeId,
                ingredient_id: ingredientId,
                quantity: null,
                unit: null,
                is_optional: false
            }))
            await this.createBatch(pivots)
        }
    }

    async syncRecipeStructuredIngredients(recipeId: number, structuredIngredients: StructuredIngredient[]): Promise<void> {
        // Supprimer les anciennes relations
        await this.deleteByRecipeId(recipeId)

        // Créer les nouvelles relations avec données structurées
        if (structuredIngredients.length > 0) {
            const pivots = structuredIngredients.map(si => ({
                recipe_id: recipeId,
                ingredient_id: si.ingredient_id,
                quantity: si.quantity,
                unit: si.unit,
                is_optional: si.is_optional
            }))
            await this.createBatch(pivots)
        }
    }

    async findStructuredIngredientsByRecipeId(recipeId: number): Promise<(IngredientRecipePivot & { ingredient: Ingredient })[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*, ingredient:ingredients(*)')
            .eq('recipe_id', recipeId)

        if (error) throw error
        return (data ?? []) as (IngredientRecipePivot & { ingredient: Ingredient })[]
    }
}
