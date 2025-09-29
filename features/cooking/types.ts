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


