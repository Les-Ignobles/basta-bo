import type { TranslationText } from '@/lib/i18n'

export interface RecipeCategory {
    id: number
    name: TranslationText
    emoji: string
    color: string
    is_pinned: boolean
    created_at: string
}

export interface RecipeCategoryFormValues {
    name_fr: string
    name_en: string
    emoji: string
    color: string
    is_pinned: boolean
}

/**
 * Lightweight recipe data for ordering within a category
 */
export interface RecipeOrderItem {
    id: number
    title: string
    img_path: string | null
    position: number
}
