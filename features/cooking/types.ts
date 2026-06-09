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
    calories_per_100g: number | null
    proteins_per_100g: number | null
    fats_per_100g: number | null
    carbs_per_100g: number | null
    price_per_100g: number | null
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
    // Valeurs nutritionnelles par portion
    calories_per_serving: number | null
    proteins_per_serving: number | null
    fats_per_serving: number | null
    carbs_per_serving: number | null
    batchcooking_usage_count: number
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
    // Valeurs nutritionnelles par portion
    calories_per_serving?: number | null
    proteins_per_serving?: number | null
    fats_per_serving?: number | null
    carbs_per_serving?: number | null
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
    weight_in_grams: number | null
}

export type StructuredIngredient = {
    ingredient_id: number
    quantity: number | null
    unit: IngredientUnit | null
    is_optional: boolean
    weight_in_grams: number | null
}

// === Recipe Actions (V6 normalization) ===

export type RecipeActionIngredientBO = {
    name: string
    ingredient_id: number
}

export type RecipeActionBO = {
    id: number
    recipe_id: number
    step_index: number
    action_type: string
    equipment: string | null
    raw_instruction: string
    normalized_instruction: string
    duration_minutes: number
    passive_time_minutes: number
    ingredients: RecipeActionIngredientBO[]
    phase: string
    created_at: string
}

export enum RecipeActionType {
    WASH = 'wash',
    PEEL = 'peel',
    CUT = 'cut',
    GRATE = 'grate',
    MINCE = 'mince',
    CRUSH = 'crush',
    ZEST = 'zest',
    SQUEEZE = 'squeeze',
    DRAIN = 'drain',
    SOAK = 'soak',
    MARINATE = 'marinate',
    MIX = 'mix',
    WHISK = 'whisk',
    KNEAD = 'knead',
    BLEND = 'blend',
    SAUTE = 'saute',
    FRY = 'fry',
    DEEP_FRY = 'deep_fry',
    BOIL = 'boil',
    SIMMER = 'simmer',
    STEAM = 'steam',
    REDUCE = 'reduce',
    FLAMBE = 'flambe',
    STIR_FRY = 'stir_fry',
    PREHEAT = 'preheat',
    BAKE = 'bake',
    ROAST = 'roast',
    GRILL = 'grill',
    BROIL = 'broil',
    GRATINATE = 'gratinate',
    ASSEMBLE = 'assemble',
    SEASON = 'season',
    GARNISH = 'garnish',
    COOL = 'cool',
    REST = 'rest',
    STORE = 'store',
}

export const RECIPE_ACTION_TYPE_LABELS: Record<RecipeActionType, string> = {
    [RecipeActionType.WASH]: 'Laver',
    [RecipeActionType.PEEL]: 'Eplucher',
    [RecipeActionType.CUT]: 'Couper',
    [RecipeActionType.GRATE]: 'Raper',
    [RecipeActionType.MINCE]: 'Emincer',
    [RecipeActionType.CRUSH]: 'Ecraser',
    [RecipeActionType.ZEST]: 'Zester',
    [RecipeActionType.SQUEEZE]: 'Presser',
    [RecipeActionType.DRAIN]: 'Egoutter',
    [RecipeActionType.SOAK]: 'Tremper',
    [RecipeActionType.MARINATE]: 'Mariner',
    [RecipeActionType.MIX]: 'Melanger',
    [RecipeActionType.WHISK]: 'Fouetter',
    [RecipeActionType.KNEAD]: 'Petrir',
    [RecipeActionType.BLEND]: 'Mixer',
    [RecipeActionType.SAUTE]: 'Faire sauter',
    [RecipeActionType.FRY]: 'Frire',
    [RecipeActionType.DEEP_FRY]: 'Friture',
    [RecipeActionType.BOIL]: 'Cuire à l\'eau / Bouillir',
    [RecipeActionType.SIMMER]: 'Mijoter',
    [RecipeActionType.STEAM]: 'Cuire vapeur',
    [RecipeActionType.REDUCE]: 'Reduire',
    [RecipeActionType.FLAMBE]: 'Flamber',
    [RecipeActionType.STIR_FRY]: 'Sauter (wok)',
    [RecipeActionType.PREHEAT]: 'Prechauffer',
    [RecipeActionType.BAKE]: 'Cuire au four',
    [RecipeActionType.ROAST]: 'Rotir',
    [RecipeActionType.GRILL]: 'Griller',
    [RecipeActionType.BROIL]: 'Gratiner (grill)',
    [RecipeActionType.GRATINATE]: 'Gratiner',
    [RecipeActionType.ASSEMBLE]: 'Assembler',
    [RecipeActionType.SEASON]: 'Assaisonner',
    [RecipeActionType.GARNISH]: 'Garnir',
    [RecipeActionType.COOL]: 'Refroidir',
    [RecipeActionType.REST]: 'Reposer',
    [RecipeActionType.STORE]: 'Stocker',
}

export enum CookingEquipmentBO {
    // Contenants
    BOWL = 'bowl',
    SALAD_BOWL = 'salad_bowl',
    FOOD_CONTAINER = 'food_container',
    // Cuisson feu / plaque
    FRYING_PAN = 'frying_pan',
    SAUCEPAN = 'saucepan',
    STOCKPOT = 'stockpot',
    WOK = 'wok',
    DUTCH_OVEN = 'dutch_oven',
    GRILL_PAN = 'grill_pan',
    CREPE_PAN = 'crepe_pan',
    // Four & moules
    OVEN = 'oven',
    BAKING_SHEET = 'baking_sheet',
    BAKING_DISH = 'baking_dish',
    CAKE_PAN = 'cake_pan',
    TART_PAN = 'tart_pan',
    MUFFIN_PAN = 'muffin_pan',
    RAMEKIN = 'ramekin',
    // Cuisson spécialisée
    STEAMER = 'steamer',
    DEEP_FRYER = 'deep_fryer',
    PRESSURE_COOKER = 'pressure_cooker',
    SLOW_COOKER = 'slow_cooker',
    // Électroménager
    BLENDER = 'blender',
    IMMERSION_BLENDER = 'immersion_blender',
    FOOD_PROCESSOR = 'food_processor',
    STAND_MIXER = 'stand_mixer',
    // Aucun
    NONE = 'none',
}

export const COOKING_EQUIPMENT_LABELS: Record<CookingEquipmentBO, string> = {
    [CookingEquipmentBO.BOWL]: 'Bol',
    [CookingEquipmentBO.SALAD_BOWL]: 'Saladier',
    [CookingEquipmentBO.FOOD_CONTAINER]: 'Boîte hermétique / Tupperware',
    [CookingEquipmentBO.FRYING_PAN]: 'Poêle',
    [CookingEquipmentBO.SAUCEPAN]: 'Casserole',
    [CookingEquipmentBO.STOCKPOT]: 'Faitout',
    [CookingEquipmentBO.WOK]: 'Wok',
    [CookingEquipmentBO.DUTCH_OVEN]: 'Cocotte',
    [CookingEquipmentBO.GRILL_PAN]: 'Poêle grill',
    [CookingEquipmentBO.CREPE_PAN]: 'Crêpière',
    [CookingEquipmentBO.OVEN]: 'Four',
    [CookingEquipmentBO.BAKING_SHEET]: 'Plaque de cuisson',
    [CookingEquipmentBO.BAKING_DISH]: 'Plat à four',
    [CookingEquipmentBO.CAKE_PAN]: 'Moule à gâteau',
    [CookingEquipmentBO.TART_PAN]: 'Moule à tarte',
    [CookingEquipmentBO.MUFFIN_PAN]: 'Moule à muffins',
    [CookingEquipmentBO.RAMEKIN]: 'Ramequin',
    [CookingEquipmentBO.STEAMER]: 'Cuiseur vapeur',
    [CookingEquipmentBO.DEEP_FRYER]: 'Friteuse',
    [CookingEquipmentBO.PRESSURE_COOKER]: 'Cocotte-minute',
    [CookingEquipmentBO.SLOW_COOKER]: 'Mijoteuse',
    [CookingEquipmentBO.BLENDER]: 'Mixeur / Blender',
    [CookingEquipmentBO.IMMERSION_BLENDER]: 'Mixeur plongeant',
    [CookingEquipmentBO.FOOD_PROCESSOR]: 'Robot culinaire',
    [CookingEquipmentBO.STAND_MIXER]: 'Robot pâtissier',
    [CookingEquipmentBO.NONE]: 'Aucun',
}

