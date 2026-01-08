export type SessionRecipeSummary = {
    title: string
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
    }
}

export type BatchCookingSessionReviewListResponse = {
    data: BatchCookingSessionReview[]
    total: number
    page: number
    pageSize: number
}
