export interface ActiveUser {
    id: number
    firstname: string
    email: string | null
    registered_at: string
    premium_sub_end_at: string | null
    session_count: number
    last_session_at: string
}
