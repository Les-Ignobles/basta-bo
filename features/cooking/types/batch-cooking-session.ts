// Types pour les batch cooking sessions
export type CreationStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type BatchCookingSession = {
    id: number
    created_at: string
    recipes: any[]
    ingredients: any[]
    cooking_steps: any[]
    assembly_steps: any[]
    meal_count: number
    people_count: number
    is_cooked: boolean
    recipe_count: number
    recipe_generation_status: CreationStatus
    starting_steps: any[]
    ingredient_generation_status: CreationStatus
    cooking_step_generation_status: CreationStatus
    created_by: number
    assembly_step_generation_status: CreationStatus
    cooked_at: string | null
    time_saved: number
    money_saved: number
    detailed_ingredients: any[]
    meals: any[]
    cooking_steps_text: string | null
    is_original: boolean
    seed: string | null
    algo_version: string | null
    parent_id: number | null
    // Champs calculés
    children_count?: number
}

export type BatchCookingSessionForm = {
    id?: number
    meal_count: number
    people_count: number
    seed?: string
    algo_version?: string
}

// Types pour les filtres et la pagination
export type BatchCookingSessionFilters = {
    search?: string
    is_original?: boolean
    is_cooked?: boolean
    recipe_generation_status?: CreationStatus
    ingredient_generation_status?: CreationStatus
    cooking_step_generation_status?: CreationStatus
    assembly_step_generation_status?: CreationStatus
    created_by?: number
}

export type BatchCookingSessionListResponse = {
    data: BatchCookingSession[]
    total: number
    page: number
    pageSize: number
}
