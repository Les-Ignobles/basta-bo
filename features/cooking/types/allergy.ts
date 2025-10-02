export interface Allergy {
    id: number
    created_at: string
    title: { fr: string; en?: string; es?: string }
    emoji: string
    slug: string
    order: number
    bit_index: number
}

export interface AllergyFormValues {
    title?: { fr: string; en?: string; es?: string }
    emoji?: string
    slug?: string
    order?: number
    bit_index?: number
}
