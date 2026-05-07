export interface ActiveUser {
    id: number
    firstname: string
    email: string | null
    registered_at: string
    premium_sub_end_at: string | null
    session_count: number
    last_session_at: string
}

export type PremiumFilter = 'all' | 'premium' | 'non_premium'

export interface UserExportFilters {
    registeredFrom?: string
    registeredTo?: string
    lastSessionFrom?: string
    lastSessionTo?: string
    premium?: PremiumFilter
    minSessions?: number
    hasEmail?: boolean
}
