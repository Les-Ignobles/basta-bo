import type { SupabaseClient } from '@supabase/supabase-js'
import type { RecipeOrderItem } from '@/features/cooking/types/recipe-category'

export interface RecipeCategoryPivot {
    id: number
    recipe_id: number
    category_id: number
    position: number
    created_at: string
}

export class RecipeCategoryPivotRepository {
    private client: SupabaseClient
    private table = 'recipe_category_pivot'

    constructor(client: SupabaseClient) {
        this.client = client
    }

    async findByRecipeId(recipeId: number): Promise<RecipeCategoryPivot[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .eq('recipe_id', recipeId)

        if (error) {
            throw new Error(`Failed to fetch category pivots for recipe ${recipeId}: ${error.message}`)
        }

        return data || []
    }

    async getCategoryIdsByRecipeId(recipeId: number): Promise<number[]> {
        const pivots = await this.findByRecipeId(recipeId)
        return pivots.map(p => p.category_id)
    }

    async syncCategories(recipeId: number, categoryIds: number[]): Promise<void> {
        // Delete all existing associations for this recipe
        const { error: deleteError } = await this.client
            .from(this.table)
            .delete()
            .eq('recipe_id', recipeId)

        if (deleteError) {
            throw new Error(`Failed to delete existing category associations: ${deleteError.message}`)
        }

        // Insert new associations
        if (categoryIds.length > 0) {
            const insertData = categoryIds.map(categoryId => ({
                recipe_id: recipeId,
                category_id: categoryId,
            }))

            const { error: insertError } = await this.client
                .from(this.table)
                .insert(insertData)

            if (insertError) {
                throw new Error(`Failed to insert category associations: ${insertError.message}`)
            }
        }
    }

    async addCategory(recipeId: number, categoryId: number): Promise<void> {
        const { error } = await this.client
            .from(this.table)
            .insert({ recipe_id: recipeId, category_id: categoryId })

        if (error) {
            // Ignore duplicate key errors (23505)
            if (error.code !== '23505') {
                throw new Error(`Failed to add category: ${error.message}`)
            }
        }
    }

    async removeCategory(recipeId: number, categoryId: number): Promise<void> {
        const { error } = await this.client
            .from(this.table)
            .delete()
            .eq('recipe_id', recipeId)
            .eq('category_id', categoryId)

        if (error) {
            throw new Error(`Failed to remove category: ${error.message}`)
        }
    }

    // US4: Recipe ordering within categories

    async getRecipesByCategoryOrdered(categoryId: number): Promise<RecipeOrderItem[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select(`
                position,
                recipes:recipe_id (
                    id,
                    title,
                    img_path
                )
            `)
            .eq('category_id', categoryId)
            .order('position', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch recipes for category ${categoryId}: ${error.message}`)
        }

        return (data || []).map((item: any) => ({
            id: item.recipes.id,
            title: item.recipes.title,
            img_path: item.recipes.img_path,
            position: item.position,
        }))
    }

    async updateRecipePositions(categoryId: number, recipeIds: number[]): Promise<void> {
        // Update each recipe position in the pivot table
        const updates = recipeIds.map((recipeId, index) => ({
            recipe_id: recipeId,
            category_id: categoryId,
            position: index + 1, // Position starts at 1
        }))

        // Use upsert to update positions (the unique constraint is on recipe_id + category_id)
        const { error } = await this.client
            .from(this.table)
            .upsert(updates, {
                onConflict: 'recipe_id,category_id',
                ignoreDuplicates: false,
            })

        if (error) {
            throw new Error(`Failed to update recipe positions for category ${categoryId}: ${error.message}`)
        }
    }

    // US5: Add recipe to category from category page

    async addRecipeToCategory(categoryId: number, recipeId: number): Promise<RecipeOrderItem> {
        // Get the max position for this category
        const { data: maxData, error: maxError } = await this.client
            .from(this.table)
            .select('position')
            .eq('category_id', categoryId)
            .order('position', { ascending: false })
            .limit(1)

        if (maxError) {
            throw new Error(`Failed to get max position: ${maxError.message}`)
        }

        const maxPosition = maxData && maxData.length > 0 ? maxData[0].position : 0
        const newPosition = maxPosition + 1

        // Insert the new recipe with the next position
        const { error: insertError } = await this.client
            .from(this.table)
            .insert({
                recipe_id: recipeId,
                category_id: categoryId,
                position: newPosition,
            })

        if (insertError) {
            // Handle duplicate key error
            if (insertError.code === '23505') {
                throw new Error('Recipe is already in this category')
            }
            throw new Error(`Failed to add recipe to category: ${insertError.message}`)
        }

        // Fetch the recipe details to return
        const { data: recipeData, error: recipeError } = await this.client
            .from('recipes')
            .select('id, title, img_path')
            .eq('id', recipeId)
            .single()

        if (recipeError) {
            throw new Error(`Failed to fetch recipe details: ${recipeError.message}`)
        }

        return {
            id: recipeData.id,
            title: recipeData.title,
            img_path: recipeData.img_path,
            position: newPosition,
        }
    }

    async getRecipeIdsInCategory(categoryId: number): Promise<number[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('recipe_id')
            .eq('category_id', categoryId)

        if (error) {
            throw new Error(`Failed to fetch recipe IDs for category ${categoryId}: ${error.message}`)
        }

        return (data || []).map(item => item.recipe_id)
    }
}
