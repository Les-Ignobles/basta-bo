import type { TranslationText } from '@/lib/i18n'

export type Ingredient = {
    id: number
    created_at: string
    img_path: string | null
    name: TranslationText
    suffix_singular: TranslationText
    suffix_plural: TranslationText
    category_id: number | null
}

export type IngredientCategory = {
    id: number
    created_at: string
    title: TranslationText
    emoji: string
}

export type Recipe = {
    id: number
    created_at: string
    title: string
    ingredients_name: string[]
    img_path: string | null
    seasonality_mask: number | null
    kitchen_equipments_mask: number | null
    instructions: string | null
}

export type KitchenEquipment = {
    id: number
    created_at: string
    name: TranslationText
    emoji: string
    bit_index: number | null
}

export type RecipeFormValues = {
    id?: number
    title: string
    ingredients_name: string[]
    img_path?: string | null
    seasonality_mask?: number | null
    kitchen_equipments_mask?: number | null
    instructions?: string | null
}

