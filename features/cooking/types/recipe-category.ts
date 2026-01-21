import type { TranslationText } from '@/lib/i18n'

export interface RecipeCategory {
    id: number
    name: TranslationText
    emoji: string
    color: string
    is_pinned: boolean
    display_as_chip: boolean
    display_as_section: boolean
    chip_order: number
    section_order: number
    created_at: string
}

export interface RecipeCategoryFormValues {
    name_fr: string
    name_en: string
    emoji: string
    color: string
    is_pinned: boolean
    display_as_chip: boolean
    display_as_section: boolean
    chip_order: number
    section_order: number
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
