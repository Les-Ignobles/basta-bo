export interface KitchenEquipment {
    id: number
    created_at: string
    name: { fr: string; en?: string; es?: string }
    emoji: string
    slug?: string
    order?: number
    bit_index: number
}

export interface KitchenEquipmentFormValues {
    title?: { fr: string; en?: string; es?: string }
    emoji?: string
    slug?: string
    order?: number
    bit_index?: number
}
