export interface RecipeGenerationResult {
    id: number
    created_at: string
    appetite: string | null // public.appetite enum
    diets_mask: number
    allergies_mask: number
    kitchen_equipment_mask: number
    season_mask: number
    recipe_count: number
    result: any // JSONB - contient les recettes générées
    initiator_id: number | null
    original_recipes: number[]
    ingredients: string[]
    pool_signature: string
    exclusion_key: string | null
    compatibility_score: number | null
    compat_pos: number | null
    compat_neg: number | null
    shown_count: number
    picked_count: number
    last_used_at: string | null
    dish_type: number
}

export interface RecipeGenerationResultFormValues {
    appetite?: string | null
    diets_mask?: number
    allergies_mask?: number
    kitchen_equipment_mask?: number
    season_mask?: number
    recipe_count?: number
    result?: any
    initiator_id?: number | null
    original_recipes?: number[]
    ingredients?: string[]
    pool_signature?: string
    exclusion_key?: string | null
    compatibility_score?: number | null
    compat_pos?: number | null
    compat_neg?: number | null
    shown_count?: number
    picked_count?: number
    last_used_at?: string | null
    dish_type?: number
}

export interface RecipeGenerationStats {
    total: number
    totalShown: number
    totalPicked: number
    averageCompatibilityScore: number
    mostUsedIngredients: Array<{ ingredient: string; count: number }>
    mostUsedDishTypes: Array<{ dish_type: number; count: number }>
    cacheHitRate: number
    recentActivity: number // nombre d'utilisations dans les dernières 24h
}
