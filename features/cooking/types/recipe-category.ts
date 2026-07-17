import type { TranslationText } from '@/lib/i18n'

/**
 * Types de catégories dynamiques
 */
export type DynamicCategoryType = 'seasonality' | 'user_recommendations' | 'new_recipes'

/** Libellés des types de catégories automatiques (badges, tooltips, aperçus) */
export const DYNAMIC_TYPE_LABELS: Record<DynamicCategoryType, { emoji: string; badge: string; description: string }> = {
    seasonality: {
        emoji: '🍂',
        badge: 'Saison',
        description: 'Recettes sélectionnées automatiquement selon la saison',
    },
    user_recommendations: {
        emoji: '⭐',
        badge: 'Recommandations',
        description: 'Recettes personnalisées selon le profil utilisateur',
    },
    new_recipes: {
        emoji: '✨',
        badge: 'Nouveautés',
        description: 'Recettes marquées « Nouveauté » (même vague que la popup)',
    },
}

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
    // Données de compatibilité profil (badges d'anticipation dans la liste éditoriale)
    diet_mask?: number | null
    allergy_mask?: number | null
    is_visible?: boolean
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
