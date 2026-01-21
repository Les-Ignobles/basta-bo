import type { TranslationText } from '@/lib/i18n'

/**
 * Types de catégories dynamiques
 */
export type DynamicCategoryType = 'seasonality' | 'user_recommendations'

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
    /** True si le contenu est calculé dynamiquement */
    is_dynamic: boolean
    /** Type de calcul: seasonality ou user_recommendations */
    dynamic_type: DynamicCategoryType | null
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
    is_dynamic: boolean
    dynamic_type: DynamicCategoryType | null
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

/**
 * Drag state for category drag & drop between zones
 */
export type DragZone = 'chip' | 'section'

export interface DragState {
    activeId: string | null
    activeCategory: RecipeCategory | null
    sourceZone: DragZone | null
    overZone: DragZone | null
}
