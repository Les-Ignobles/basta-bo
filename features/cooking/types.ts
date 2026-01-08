import type { TranslationText } from '@/lib/i18n'

export enum DishType {
    ENTREE = 1,
    PLAT = 2,
    DESSERT = 3
}

export const DISH_TYPE_LABELS = {
    [DishType.ENTREE]: 'Entrée',
    [DishType.PLAT]: 'Plat',
    [DishType.DESSERT]: 'Dessert'
} as const

export enum QuantificationType {
    PER_PERSON = 1,
    PER_UNIT = 2,
}

export const QUANTIFICATION_TYPE_LABELS = {
    [QuantificationType.PER_PERSON]: 'Par personne',
    [QuantificationType.PER_UNIT]: 'Par unité'
} as const

// Unités de mesure pour les ingrédients structurés
export enum IngredientUnit {
    // Unités de mesure précises
    GRAM = 'g',
    KILOGRAM = 'kg',
    MILLILITER = 'ml',
    CENTILITER = 'cl',
    LITER = 'l',

    // Unités de volume
    TABLESPOON = 'càs',
    TEASPOON = 'càc',
    CUP = 'cup',

    // Unités dénombrables
    PIECE = 'pièce',
    SLICE = 'tranche',
    LEAF = 'feuille',
    CLOVE = 'gousse',

    // Unités approximatives
    HANDFUL = 'poignée',
    PINCH = 'pincée',
    BUNCH = 'bouquet',
    BUNDLE = 'botte',
    SPRIG = 'brin',
}

export const INGREDIENT_UNIT_LABELS: Record<IngredientUnit, string> = {
    [IngredientUnit.GRAM]: 'Gramme (g)',
    [IngredientUnit.KILOGRAM]: 'Kilogramme (kg)',
    [IngredientUnit.MILLILITER]: 'Millilitre (ml)',
    [IngredientUnit.CENTILITER]: 'Centilitre (cl)',
    [IngredientUnit.LITER]: 'Litre (l)',
    [IngredientUnit.TABLESPOON]: 'Cuillère à soupe (càs)',
    [IngredientUnit.TEASPOON]: 'Cuillère à café (càc)',
    [IngredientUnit.CUP]: 'Tasse (cup)',
    [IngredientUnit.PIECE]: 'Pièce',
    [IngredientUnit.SLICE]: 'Tranche',
    [IngredientUnit.LEAF]: 'Feuille',
    [IngredientUnit.CLOVE]: 'Gousse',
    [IngredientUnit.HANDFUL]: 'Poignée',
    [IngredientUnit.PINCH]: 'Pincée',
    [IngredientUnit.BUNCH]: 'Bouquet',
    [IngredientUnit.BUNDLE]: 'Botte',
    [IngredientUnit.SPRIG]: 'Brin',
}

export type Ingredient = {
    id: number
    created_at: string
    img_path: string | null
    name: TranslationText
    suffix_singular: TranslationText
    suffix_plural: TranslationText
    category_id: number | null
    is_basic: boolean
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
    ingredients_quantities: string | null  // Ancien champ textuel (conservé pour comparaison)
    img_path: string | null
    seasonality_mask: number | null
    kitchen_equipments_mask: number | null
    diet_mask: number | null
    allergy_mask: number | null
    instructions: string | null
    dish_type: DishType
    quantification_type: QuantificationType
    is_folklore: boolean
    is_visible: boolean
    base_servings: number | null  // Nombre de portions de base pour le calcul des quantités
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
    ingredient_ids?: number[]  // IDs des ingrédients pour la table pivot (ne sera pas stocké dans recipes)
    ingredients_quantities?: string | null  // Ancien champ textuel (conservé pour comparaison)
    structured_ingredients?: StructuredIngredient[]  // Nouveaux ingrédients structurés (quantity, unit, is_optional)
    img_path?: string | null
    seasonality_mask?: number | null
    kitchen_equipments_mask?: number | null
    diet_mask?: number | null
    allergy_mask?: number | null
    instructions?: string | null
    dish_type: DishType
    quantification_type: QuantificationType
    is_folklore: boolean
    is_visible: boolean
    base_servings?: number | null  // Nombre de portions de base
}

export type PendingIngredient = {
    id: number
    created_at: string
    name: string
}

export type PendingIngredientFormValues = {
    id?: number
    name: TranslationText
    suffix_singular: TranslationText
    suffix_plural: TranslationText
    category_id: number | null
    img_path?: string | null
    is_basic: boolean
}

export type IngredientRecipePivot = {
    id: number
    ingredient_id: number
    recipe_id: number
    created_at: string
    quantity: number | null
    unit: IngredientUnit | null
    is_optional: boolean
}

export type StructuredIngredient = {
    ingredient_id: number
    quantity: number | null
    unit: IngredientUnit | null
    is_optional: boolean
}

