export type SessionRecipeSummary = {
    title: string
    original_recipe_id: number | null
}

// Matches SessionCookingStepJSON from backend
export type SessionCookingStep = {
    order: number
    text: string
    action: string
    cooking_time: number | null
    step_time: number
    id: string
    img: string
    ingredients: SessionStepIngredient[]
    recipe_ids: string[]
}

export type SessionStepIngredient = {
    category_id: number | null
    id: string
    img_path: string | null
    is_basic: boolean
    is_ordered: boolean
    original_id: number
    quantity: number | null
    text: string
    unit: string | null
}

// Matches SessionAssemblyStepJSON from backend
export type SessionAssemblyStep = {
    order: number
    text: string
    desc: string
    id: string
    img: string | null
    original_recipe_id: number
    recipe_id: string
}

// Matches SessionIngredientJSON from backend
export type SessionIngredient = {
    category_id: number | null
    id: string
    img_path: string | null
    is_basic: boolean
    is_ordered: boolean
    original_id: number
    quantity: number | null
    text: string
    unit: string | null
}

export type BatchCookingSessionReview = {
    id: number
    created_at: string
    rating: number | null
    comment: string | null
    created_by: number
    session_id: number
    // Joined data
    user_profile?: {
        id: number
        email: string
        firstname: string
    }
    session?: {
        id: number
        meal_count: number
        people_count: number
        recipes: SessionRecipeSummary[]
        cooking_steps: SessionCookingStep[] | null
        assembly_steps: SessionAssemblyStep[] | null
        ingredients: SessionIngredient[] | null
    }
}

export type BatchCookingSessionReviewListResponse = {
    data: BatchCookingSessionReview[]
    total: number
    page: number
    pageSize: number
}
