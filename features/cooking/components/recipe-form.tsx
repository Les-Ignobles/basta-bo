"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/image-upload'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Check, ChevronsUpDown, Loader2, Flame, Beef, Droplets, Wheat } from 'lucide-react'
import { RecipeActionsSection } from './recipe-actions-section'
import { RecipePriceBreakdown } from './recipe-price-breakdown'
import { cn } from '@/lib/utils'
import type { RecipeFormValues, KitchenEquipment, Ingredient, StructuredIngredient, IngredientRecipePivot } from '@/features/cooking/types'
import { DishType, DISH_TYPE_LABELS, QuantificationType, QUANTIFICATION_TYPE_LABELS, IngredientUnit, INGREDIENT_UNIT_LABELS } from '@/features/cooking/types'
import type { Diet } from '@/features/cooking/types/diet'
import type { Allergy } from '@/features/cooking/types/allergy'
import type { RecipeCategory } from '@/features/cooking/types/recipe-category'
import { useCookingStore } from '@/features/cooking/store'

export type { RecipeFormValues }

type Props = {
    defaultValues?: Partial<RecipeFormValues>
    defaultIngredients?: Ingredient[]
    defaultStructuredIngredients?: (IngredientRecipePivot & { ingredient: Ingredient })[]
    onSubmit: (values: RecipeFormValues) => Promise<void> | void
    submittingLabel?: string
    kitchenEquipments: KitchenEquipment[]
    diets: Diet[]
    allergies: Allergy[]
    recipeCategories?: RecipeCategory[]
    defaultCategoryIds?: number[]
    onCategoriesChange?: (categoryIds: number[]) => void
    formId?: string
    recipeId?: number
}

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const DISH_TYPES = [
    { value: DishType.ENTREE, label: DISH_TYPE_LABELS[DishType.ENTREE] },
    { value: DishType.PLAT, label: DISH_TYPE_LABELS[DishType.PLAT] },
    { value: DishType.DESSERT, label: DISH_TYPE_LABELS[DishType.DESSERT] },
    { value: DishType.SNACK, label: DISH_TYPE_LABELS[DishType.SNACK] },
    { value: DishType.BREAKFAST, label: DISH_TYPE_LABELS[DishType.BREAKFAST] }
]

const QUANTIFICATION_TYPES = [
    { value: QuantificationType.PER_PERSON, label: QUANTIFICATION_TYPE_LABELS[QuantificationType.PER_PERSON] },
    { value: QuantificationType.PER_UNIT, label: QUANTIFICATION_TYPE_LABELS[QuantificationType.PER_UNIT] }
]

export function RecipeForm({ defaultValues, defaultIngredients, defaultStructuredIngredients, onSubmit, submittingLabel = 'Enregistrement...', kitchenEquipments, diets, allergies, recipeCategories, defaultCategoryIds, onCategoriesChange, formId, recipeId }: Props) {
    const [values, setValues] = useState<RecipeFormValues>({
        title: '',
        ingredients_name: [],
        ingredient_ids: [],
        ingredients_quantities: '',
        structured_ingredients: [],
        img_path: '',
        seasonality_mask: null,
        kitchen_equipments_mask: null,
        diet_mask: null,
        allergy_mask: null,
        instructions: '',
        dish_type: DishType.PLAT,
        quantification_type: QuantificationType.PER_PERSON,
        is_folklore: false,
        is_visible: true,
        is_new: false,
        base_servings: null,
        units_per_serving: null,
        calories_per_serving: null,
        proteins_per_serving: null,
        fats_per_serving: null,
        carbs_per_serving: null,
        ...defaultValues,
    } as RecipeFormValues)
    // Rendement (unités par portion) : base figée à l'activation, puis modifiable avec recalcul.
    const [baselineLocked, setBaselineLocked] = useState<boolean>(defaultValues?.units_per_serving != null)
    const [loading, setLoading] = useState(false)
    const [ingredientInput, setIngredientInput] = useState('')
    const [selectedMonths, setSelectedMonths] = useState<boolean[]>(new Array(12).fill(false))
    const [selectedEquipments, setSelectedEquipments] = useState<boolean[]>(new Array(kitchenEquipments.length).fill(false))
    const [selectedDiets, setSelectedDiets] = useState<boolean[]>(new Array(diets?.length || 0).fill(false))
    const [ingredientOpen, setIngredientOpen] = useState(false)
    const [searchResults, setSearchResults] = useState<Ingredient[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([])
    const [syncingIngredients, setSyncingIngredients] = useState(false)
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(defaultCategoryIds || [])
    const [priceBreakdownOpen, setPriceBreakdownOpen] = useState(false)

    const { searchIngredients } = useCookingStore()

    // Initialize categories from defaultCategoryIds
    useEffect(() => {
        if (defaultCategoryIds) {
            setSelectedCategoryIds(defaultCategoryIds)
        }
    }, [defaultCategoryIds])

    // Recherche d'ingrédients avec debounce
    useEffect(() => {
        if (!ingredientInput.trim()) {
            setSearchResults([])
            return
        }

        const timeoutId = setTimeout(async () => {
            setSearching(true)
            try {
                const results = await searchIngredients(ingredientInput)
                setSearchResults(results)
            } finally {
                setSearching(false)
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [ingredientInput, searchIngredients])

    // Update form values when defaultValues change (for edit mode)
    useEffect(() => {
        if (defaultValues) {
            setValues({
                title: defaultValues.title || '',
                ingredients_name: defaultValues.ingredients_name || [],
                ingredients_quantities: defaultValues.ingredients_quantities || '',
                structured_ingredients: defaultValues.structured_ingredients || [],
                img_path: defaultValues.img_path || '',
                seasonality_mask: defaultValues.seasonality_mask || null,
                kitchen_equipments_mask: defaultValues.kitchen_equipments_mask || null,
                diet_mask: defaultValues.diet_mask || null,
                instructions: defaultValues.instructions || '',
                dish_type: defaultValues.dish_type || DishType.PLAT,
                quantification_type: defaultValues.quantification_type || QuantificationType.PER_PERSON,
                is_folklore: defaultValues.is_folklore || false,
                is_visible: defaultValues.is_visible !== undefined ? defaultValues.is_visible : true,
                is_new: defaultValues.is_new ?? false,
                base_servings: defaultValues.base_servings ?? null,
                units_per_serving: defaultValues.units_per_serving ?? null,
                calories_per_serving: defaultValues.calories_per_serving ?? null,
                proteins_per_serving: defaultValues.proteins_per_serving ?? null,
                fats_per_serving: defaultValues.fats_per_serving ?? null,
                carbs_per_serving: defaultValues.carbs_per_serving ?? null,
            } as RecipeFormValues)
            setBaselineLocked(defaultValues.units_per_serving != null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultValues)])

    // Initialiser les ingrédients structurés depuis defaultStructuredIngredients (mode édition)
    useEffect(() => {
        if (defaultStructuredIngredients && defaultStructuredIngredients.length > 0) {
            const structuredIngredients: StructuredIngredient[] = defaultStructuredIngredients.map(si => ({
                ingredient_id: si.ingredient_id,
                quantity: si.quantity,
                unit: si.unit,
                is_optional: si.is_optional,
                weight_in_grams: si.weight_in_grams ?? null
            }))
            setValues(prev => ({ ...prev, structured_ingredients: structuredIngredients }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultStructuredIngredients)])

    // Initialize masks from default values
    useEffect(() => {
        if (defaultValues?.seasonality_mask !== undefined && defaultValues.seasonality_mask !== null) {
            const months = []
            for (let i = 0; i < 12; i++) {
                months.push((defaultValues.seasonality_mask & (1 << i)) !== 0)
            }
            setSelectedMonths(months)
        }

        if (defaultValues?.kitchen_equipments_mask !== undefined) {
            const equipments = kitchenEquipments.map(eq =>
                eq.bit_index !== null ? (defaultValues.kitchen_equipments_mask! & (1 << eq.bit_index)) !== 0 : false
            )
            setSelectedEquipments(equipments)
        }

        if (defaultValues?.diet_mask !== undefined && diets) {
            const dietSelections = diets.map(diet =>
                (defaultValues.diet_mask! & (1 << diet.bit_index)) !== 0
            )
            setSelectedDiets(dietSelections)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultValues), kitchenEquipments, diets, allergies])

    // Mettre à jour selectedDiets quand diets change
    useEffect(() => {
        if (diets && diets.length !== selectedDiets.length) {
            setSelectedDiets(new Array(diets.length).fill(false))
        }
    }, [diets, selectedDiets.length])

    // Initialiser selectedIngredients depuis defaultIngredients (mode édition)
    useEffect(() => {
        if (defaultIngredients && defaultIngredients.length > 0) {
            setSelectedIngredients(defaultIngredients)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultIngredients)])

    // Fonction helper pour synchroniser les ingrédients via l'API (mode édition uniquement)
    async function syncIngredientsToAPI(ingredientIds: number[], ingredientNames: string[], structuredIngredients?: StructuredIngredient[]) {
        const recipeId = defaultValues?.id
        if (!recipeId) return

        setSyncingIngredients(true)
        try {
            const response = await fetch(`/api/recipes/${recipeId}/ingredients`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredient_ids: ingredientIds,
                    ingredients_name: ingredientNames,
                    structured_ingredients: structuredIngredients
                })
            })
            if (!response.ok) {
                throw new Error('Failed to sync ingredients')
            }
        } catch (error) {
            console.error('Failed to sync ingredients:', error)
        } finally {
            setSyncingIngredients(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            let seasonalityMask = 0
            selectedMonths.forEach((selected, index) => {
                if (selected) {
                    seasonalityMask |= (1 << index)
                }
            })

            let equipmentsMask = 0
            selectedEquipments.forEach((selected, index) => {
                if (selected && kitchenEquipments[index]?.bit_index !== null) {
                    equipmentsMask |= (1 << kitchenEquipments[index].bit_index!)
                }
            })

            let dietMask = 0
            if (diets) {
                selectedDiets.forEach((selected, index) => {
                    if (selected && diets[index]) {
                        dietMask |= (1 << diets[index].bit_index)
                    }
                })
            }

            await onSubmit({
                ...values,
                seasonality_mask: seasonalityMask || null,
                kitchen_equipments_mask: equipmentsMask || null,
                diet_mask: dietMask || null,
                allergy_mask: computedAllergyMask || null,
            })
        } finally {
            setLoading(false)
        }
    }

    async function addIngredient(ingredient: Ingredient) {
        if (!selectedIngredients.find(i => i.id === ingredient.id)) {
            const newSelectedIngredients = [...selectedIngredients, ingredient]
            setSelectedIngredients(newSelectedIngredients)

            const newIngredientIds = newSelectedIngredients.map(i => i.id)
            const newIngredientNames = newSelectedIngredients.map(i => i.name.fr)

            const newStructuredIngredient: StructuredIngredient = {
                ingredient_id: ingredient.id,
                quantity: null,
                unit: null,
                is_optional: false,
                weight_in_grams: null
            }
            const newStructuredIngredients = [...(values.structured_ingredients || []), newStructuredIngredient]

            setValues(prev => ({
                ...prev,
                ingredients_name: newIngredientNames,
                ingredient_ids: newIngredientIds,
                structured_ingredients: newStructuredIngredients
            }))

            setIngredientInput('')
            setIngredientOpen(false)

            await syncIngredientsToAPI(newIngredientIds, newIngredientNames, newStructuredIngredients)
        }
    }

    async function removeIngredient(index: number) {
        const removedIngredient = selectedIngredients[index]
        const newSelectedIngredients = selectedIngredients.filter((_, i) => i !== index)
        setSelectedIngredients(newSelectedIngredients)

        const newIngredientIds = newSelectedIngredients.map(i => i.id)
        const newIngredientNames = newSelectedIngredients.map(i => i.name.fr)

        const newStructuredIngredients = (values.structured_ingredients || [])
            .filter(si => si.ingredient_id !== removedIngredient.id)

        setValues(prev => ({
            ...prev,
            ingredients_name: newIngredientNames,
            ingredient_ids: newIngredientIds,
            structured_ingredients: newStructuredIngredients
        }))

        await syncIngredientsToAPI(newIngredientIds, newIngredientNames, newStructuredIngredients)
    }

    function toggleMonth(index: number) {
        setSelectedMonths(prev => prev.map((selected, i) => i === index ? !selected : selected))
    }

    function toggleEquipment(index: number) {
        setSelectedEquipments(prev => prev.map((selected, i) => i === index ? !selected : selected))
    }

    function toggleDiet(index: number) {
        setSelectedDiets(prev => prev.map((selected, i) => i === index ? !selected : selected))
    }

    function toggleCategory(categoryId: number) {
        setSelectedCategoryIds(prev => {
            const newIds = prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
            onCategoriesChange?.(newIds)
            return newIds
        })
    }

    function updateStructuredIngredient(ingredientId: number, field: keyof StructuredIngredient, value: number | IngredientUnit | boolean | null) {
        setValues(prev => {
            const structured = prev.structured_ingredients || []
            const existingIndex = structured.findIndex(si => si.ingredient_id === ingredientId)

            if (existingIndex >= 0) {
                const updated = [...structured]
                updated[existingIndex] = { ...updated[existingIndex], [field]: value }
                return { ...prev, structured_ingredients: updated }
            } else {
                return {
                    ...prev,
                    structured_ingredients: [
                        ...structured,
                        { ingredient_id: ingredientId, quantity: null, unit: null, is_optional: false, weight_in_grams: null, [field]: value }
                    ]
                }
            }
        })
    }

    function getStructuredIngredient(ingredientId: number): StructuredIngredient | undefined {
        return values.structured_ingredients?.find(si => si.ingredient_id === ingredientId)
    }

    const unitsEnabled = values.units_per_serving != null

    // Activer / désactiver le rendement. Désactivé => null (n'affecte rien).
    function toggleUnitsEnabled(enabled: boolean) {
        setValues(prev => ({ ...prev, units_per_serving: enabled ? (prev.units_per_serving ?? 1) : null }))
        setBaselineLocked(false)
    }

    // Phase 1 (base) : fixe le nombre d'unités que représentent les ingrédients
    // actuels, SANS recalculer les quantités.
    function setBaselineValue(rawValue: string) {
        const parsed = parseInt(rawValue, 10)
        const next = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
        setValues(prev => ({ ...prev, units_per_serving: next }))
    }

    // Phase 2 (base figée) : changer le rendement recalcule toutes les quantités
    // (quantité + poids) au prorata, en direct. Le nombre reste >= 1.
    function changeUnits(rawValue: string) {
        const parsed = parseInt(rawValue, 10)
        const next = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
        setValues(prev => {
            const prevUnits = prev.units_per_serving ?? 1
            const hasIngredients = (prev.structured_ingredients?.length ?? 0) > 0
            if (next === prevUnits || !hasIngredients) {
                return { ...prev, units_per_serving: next }
            }
            const ratio = next / prevUnits
            const round = (n: number) => Math.round(n * 1000) / 1000
            return {
                ...prev,
                units_per_serving: next,
                structured_ingredients: (prev.structured_ingredients || []).map(si => ({
                    ...si,
                    quantity: si.quantity != null ? round(si.quantity * ratio) : si.quantity,
                    weight_in_grams: si.weight_in_grams != null ? round(si.weight_in_grams * ratio) : si.weight_in_grams,
                })),
            }
        })
    }

    const hasNutrition = values.calories_per_serving !== null || values.proteins_per_serving !== null

    // Allergènes calculés depuis les ingrédients de la recette (source de vérité :
    // ingredients.allergy_mask, comme les valeurs nutritionnelles). Plus d'édition
    // manuelle : pour corriger, on corrige l'ingrédient.
    const computedAllergyMask = selectedIngredients.reduce((mask, ing) => mask | (ing.allergy_mask ?? 0), 0)
    const allergenSources = (bitIndex: number) =>
        selectedIngredients
            .filter(ing => ((ing.allergy_mask ?? 0) & (1 << bitIndex)) !== 0)
            .map(ing => ing.name?.fr)
            .filter(Boolean)
            .join(', ')

    // Calcul indicatif du prix par portion (ou par unité selon la quantification).
    // Source: price_per_100g de chaque ingrédient × grammes / 100, sommé puis divisé par base_servings.
    // Les ingrédients sans prix renseigné sont ignorés et signalés via `isPartial`.
    const pricePerServing = (() => {
        const baseServings = values.base_servings ?? 0
        if (baseServings <= 0) return null
        const structured = values.structured_ingredients ?? []
        if (structured.length === 0) return null

        let total = 0
        let pricedCount = 0
        let missingPriceCount = 0

        for (const si of structured) {
            const ingredient = selectedIngredients.find(i => i.id === si.ingredient_id)
            if (!ingredient) continue

            // Grammes : même règle que pour la nutrition (g → quantity, kg → ×1000, sinon weight_in_grams)
            let grams: number | null = null
            if (si.unit === IngredientUnit.GRAM) {
                grams = si.quantity
            } else if (si.unit === IngredientUnit.KILOGRAM) {
                grams = si.quantity !== null ? si.quantity * 1000 : null
            } else {
                grams = si.weight_in_grams
            }
            if (grams === null || grams <= 0) continue

            if (ingredient.price_per_100g === null || ingredient.price_per_100g === undefined) {
                missingPriceCount++
                continue
            }
            total += ingredient.price_per_100g * grams / 100
            pricedCount++
        }

        if (pricedCount === 0) return null
        return {
            value: total / baseServings,
            isPartial: missingPriceCount > 0,
            missingPriceCount,
        }
    })()

    const priceLabel = values.quantification_type === QuantificationType.PER_UNIT ? 'unité' : 'portion'

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="recipe" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="recipe">Recette</TabsTrigger>
                    <TabsTrigger value="preparation">Préparation</TabsTrigger>
                    <TabsTrigger value="criteria">Critères</TabsTrigger>
                </TabsList>

                {/* Tab 1: Recette (infos + ingrédients) */}
                <TabsContent value="recipe" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                    {/* Colonne principale */}
                    <div className="space-y-6 min-w-0">
                    {/* Section Titre */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-foreground">Informations principales</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Titre de la recette *</label>
                            <Input
                                value={values.title}
                                onChange={(e) => setValues(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Ex: Tarte aux pommes"
                                required
                                className="text-base"
                            />
                        </div>
                    </div>

                    {/* Section Classification (compact) */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-foreground">Classification</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Type de plat *</label>
                                <Select
                                    value={values.dish_type.toString()}
                                    onValueChange={(value) => setValues(prev => ({ ...prev, dish_type: parseInt(value) as DishType }))}
                                >
                                    <SelectTrigger className="text-base">
                                        <SelectValue placeholder="Type de plat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DISH_TYPES.map((dishType) => (
                                            <SelectItem key={dishType.value} value={dishType.value.toString()}>
                                                {dishType.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Quantification *</label>
                                <Select
                                    value={values.quantification_type.toString()}
                                    onValueChange={(value) => setValues(prev => ({ ...prev, quantification_type: parseInt(value) as QuantificationType }))}
                                >
                                    <SelectTrigger className="text-base">
                                        <SelectValue placeholder="Quantification" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QUANTIFICATION_TYPES.map((qt) => (
                                            <SelectItem key={qt.value} value={qt.value.toString()}>
                                                {qt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Portions de base</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={values.base_servings ?? ''}
                                    onChange={(e) => setValues(prev => ({
                                        ...prev,
                                        base_servings: e.target.value ? parseInt(e.target.value, 10) : null
                                    }))}
                                    placeholder="Ex: 4"
                                    className="text-base"
                                />
                            </div>

                        </div>

                        {/* Rendement : unités par portion (opt-in) */}
                        <div className="space-y-3 rounded-md border p-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={unitsEnabled}
                                    onCheckedChange={(c) => toggleUnitsEnabled(Boolean(c))}
                                />
                                <span className="text-sm font-medium">Activer les unités par portion</span>
                                <span className="text-xs text-muted-foreground">(ex: 4 cookies — n&apos;entre pas dans le batch cooking)</span>
                            </label>

                            {unitsEnabled && !baselineLocked && (
                                <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted/40 px-3 py-3">
                                    <span className="text-sm">Les ingrédients actuels représentent</span>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={values.units_per_serving ?? 1}
                                        onChange={(e) => setBaselineValue(e.target.value)}
                                        className="h-9 w-20 text-base"
                                    />
                                    <span className="text-sm">unité(s)</span>
                                    <Button type="button" size="sm" onClick={() => setBaselineLocked(true)}>
                                        Valider la base
                                    </Button>
                                    <p className="w-full text-xs text-muted-foreground">
                                        Définit la base sans recalculer les quantités. Les quantités déjà saisies restent inchangées.
                                    </p>
                                </div>
                            )}

                            {unitsEnabled && baselineLocked && (
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-foreground">Unités par portion</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={values.units_per_serving ?? 1}
                                            onChange={(e) => changeUnits(e.target.value)}
                                            className="h-9 w-28 text-base"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setBaselineLocked(false)}
                                        title="Corriger la base sans recalculer les quantités"
                                    >
                                        Redéfinir la base
                                    </Button>
                                    <p className="w-full text-xs text-muted-foreground">
                                        Changer cette valeur recalcule les quantités d&apos;ingrédients au prorata.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section Ingrédients */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">Ingrédients</h3>
                            {syncingIngredients && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>

                        {/* Sélection d'ingrédients */}
                        <div className="flex gap-2 w-full max-w-md">
                            <Popover open={ingredientOpen} onOpenChange={setIngredientOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={ingredientOpen}
                                        className="flex-1 justify-between"
                                    >
                                        {ingredientInput || "Ajouter un ingrédient..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput
                                            placeholder="Taper le nom d'un ingrédient..."
                                            value={ingredientInput}
                                            onValueChange={setIngredientInput}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                {searching ? "Recherche en cours..." :
                                                    searchResults.length === 0 && ingredientInput ? "Aucun ingrédient trouvé." :
                                                        "Tapez pour rechercher..."}
                                            </CommandEmpty>
                                            {searchResults.length > 0 && (
                                                <CommandGroup heading="Ingrédients disponibles">
                                                    {searchResults.map((ingredient) => (
                                                        <CommandItem
                                                            key={ingredient.id}
                                                            value={ingredient.name.fr}
                                                            onSelect={() => addIngredient(ingredient)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedIngredients.find(i => i.id === ingredient.id) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {ingredient.name.fr}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Tableau ingrédients structurés (pleine largeur) */}
                        {selectedIngredients.length > 0 && (
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="w-10"></th>
                                            <th className="text-left p-2 font-medium">Ingrédient</th>
                                            <th className="text-left p-2 font-medium w-24">Quantité</th>
                                            <th className="text-left p-2 font-medium w-32">Unité</th>
                                            <th className="text-left p-2 font-medium w-24">Poids (g)</th>
                                            <th className="text-center p-2 font-medium w-14">Opt.</th>
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...selectedIngredients]
                                            .sort((a, b) => a.name.fr.localeCompare(b.name.fr, 'fr'))
                                            .map((ingredient) => {
                                            const structured = getStructuredIngredient(ingredient.id)
                                            const originalIndex = selectedIngredients.findIndex(i => i.id === ingredient.id)
                                            return (
                                                <tr key={ingredient.id} className="border-t">
                                                    <td className="p-1 pl-2">
                                                        {ingredient.img_path ? (
                                                            <img
                                                                src={ingredient.img_path}
                                                                alt={ingredient.name.fr}
                                                                className="w-8 h-8 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                                ?
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        <span className="truncate block max-w-[200px]" title={ingredient.name.fr}>
                                                            {ingredient.name.fr}
                                                        </span>
                                                    </td>
                                                    <td className="p-1">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={structured?.quantity ?? ''}
                                                            onChange={(e) => updateStructuredIngredient(
                                                                ingredient.id,
                                                                'quantity',
                                                                e.target.value ? parseFloat(e.target.value) : null
                                                            )}
                                                            className="h-8 text-sm w-full"
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                    <td className="p-1">
                                                        <Select
                                                            value={structured?.unit ?? 'none'}
                                                            onValueChange={(value) => updateStructuredIngredient(
                                                                ingredient.id,
                                                                'unit',
                                                                value === 'none' ? null : value as IngredientUnit
                                                            )}
                                                        >
                                                            <SelectTrigger className="h-8 text-sm">
                                                                <SelectValue placeholder="-" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">-</SelectItem>
                                                                {Object.entries(INGREDIENT_UNIT_LABELS).map(([unit, label]) => (
                                                                    <SelectItem key={unit} value={unit}>
                                                                        {label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="p-1">
                                                        {structured?.unit && structured.unit !== IngredientUnit.GRAM && structured.unit !== IngredientUnit.KILOGRAM ? (
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                value={structured?.weight_in_grams ?? ''}
                                                                onChange={(e) => updateStructuredIngredient(
                                                                    ingredient.id,
                                                                    'weight_in_grams',
                                                                    e.target.value ? parseFloat(e.target.value) : null
                                                                )}
                                                                className="h-8 text-sm w-full"
                                                                placeholder="-"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground px-2">auto</span>
                                                        )}
                                                    </td>
                                                    <td className="p-1 text-center">
                                                        <Checkbox
                                                            checked={structured?.is_optional ?? false}
                                                            onCheckedChange={(checked) => updateStructuredIngredient(
                                                                ingredient.id,
                                                                'is_optional',
                                                                Boolean(checked)
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="p-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeIngredient(originalIndex)}
                                                            className="text-muted-foreground hover:text-destructive"
                                                        >
                                                            ×
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedIngredients.length === 0 && (
                            <div className="border border-dashed rounded-md p-8 text-center text-sm text-muted-foreground">
                                Aucun ingrédient ajouté. Utilisez le champ ci-dessus pour rechercher et ajouter des ingrédients.
                            </div>
                        )}

                        {/* Ancien format (texte brut) */}
                        {values.ingredients_quantities && (
                            <div className="space-y-2">
                                <div className="text-xs text-muted-foreground font-medium">Ancien format (texte brut)</div>
                                <Textarea
                                    value={values.ingredients_quantities ?? ''}
                                    onChange={(e) => setValues(prev => ({ ...prev, ingredients_quantities: e.target.value }))}
                                    rows={10}
                                    className="resize-none bg-muted/30 text-muted-foreground text-sm"
                                />
                            </div>
                        )}
                    </div>
                    </div>
                    {/* fin colonne principale */}

                    {/* Sidebar sticky : image, statut, nutrition */}
                    <aside className="space-y-4 lg:sticky lg:top-24">
                        {/* Image */}
                        <div className="rounded-lg border p-4 space-y-2">
                            <label className="text-sm font-medium text-foreground">Image de la recette</label>
                            <ImageUpload
                                value={values.img_path ?? undefined}
                                onChange={(url) => setValues(prev => ({ ...prev, img_path: url }))}
                                bucket="recipes"
                                ingredientName={values.title}
                                defaultSize={800}
                                allowSizeSelection={true}
                            />
                        </div>

                        {/* Statut */}
                        <div className="rounded-lg border p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-foreground">Statut</h4>
                            <label className="flex items-center justify-between gap-2 cursor-pointer">
                                <span className="text-sm">Visible</span>
                                <Switch
                                    checked={values.is_visible}
                                    onCheckedChange={(checked) => setValues(prev => ({ ...prev, is_visible: Boolean(checked) }))}
                                />
                            </label>
                            <label className="flex items-center justify-between gap-2 cursor-pointer">
                                <span className="text-sm">Folklore</span>
                                <Switch
                                    checked={values.is_folklore}
                                    onCheckedChange={(checked) => setValues(prev => ({ ...prev, is_folklore: Boolean(checked) }))}
                                />
                            </label>
                            <label className="flex items-center justify-between gap-2 cursor-pointer">
                                <span className="text-sm">Nouveauté <span className="text-xs text-muted-foreground">(popup app)</span></span>
                                <Switch
                                    checked={values.is_new ?? false}
                                    onCheckedChange={(checked) => setValues(prev => ({ ...prev, is_new: Boolean(checked) }))}
                                />
                            </label>
                        </div>

                        {/* Nutrition & prix */}
                        {(hasNutrition || pricePerServing || selectedIngredients.length > 0) && (
                            <div className="rounded-lg border p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-foreground">Nutrition &amp; prix</h4>
                                {hasNutrition ? (
                                    <>
                                        <div className="flex items-baseline gap-1.5">
                                            <Flame className="h-5 w-5 text-orange-500 self-center" />
                                            <span className="text-2xl font-semibold tabular-nums">{values.calories_per_serving ?? '—'}</span>
                                            <span className="text-xs text-muted-foreground">kcal / {priceLabel}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded-md bg-muted/50 p-2 text-center">
                                                <div className="flex items-center justify-center gap-1 text-red-500"><Beef className="h-3.5 w-3.5" /></div>
                                                <div className="text-sm font-medium tabular-nums">{values.proteins_per_serving ?? '—'}<span className="text-xs text-muted-foreground"> g</span></div>
                                                <div className="text-[10px] text-muted-foreground">Protéines</div>
                                            </div>
                                            <div className="rounded-md bg-muted/50 p-2 text-center">
                                                <div className="flex items-center justify-center gap-1 text-yellow-500"><Droplets className="h-3.5 w-3.5" /></div>
                                                <div className="text-sm font-medium tabular-nums">{values.fats_per_serving ?? '—'}<span className="text-xs text-muted-foreground"> g</span></div>
                                                <div className="text-[10px] text-muted-foreground">Lipides</div>
                                            </div>
                                            <div className="rounded-md bg-muted/50 p-2 text-center">
                                                <div className="flex items-center justify-center gap-1 text-amber-700"><Wheat className="h-3.5 w-3.5" /></div>
                                                <div className="text-sm font-medium tabular-nums">{values.carbs_per_serving ?? '—'}<span className="text-xs text-muted-foreground"> g</span></div>
                                                <div className="text-[10px] text-muted-foreground">Glucides</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Valeurs nutritionnelles non renseignées.</p>
                                )}
                                {pricePerServing ? (
                                    <button
                                        type="button"
                                        onClick={() => setPriceBreakdownOpen(true)}
                                        className="flex w-full items-center justify-between gap-1.5 text-sm rounded-md border px-3 py-2 hover:bg-muted transition-colors"
                                        title={pricePerServing.isPartial
                                            ? `Estimation partielle : ${pricePerServing.missingPriceCount} ingrédient(s) sans prix renseigné. Cliquer pour voir le détail et éditer.`
                                            : `Cliquer pour voir le détail par ingrédient et éditer les prix au 100g`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <span className="text-base">💶</span>
                                            <span className="font-medium tabular-nums">{pricePerServing.value.toFixed(2)} €</span>
                                            <span className="text-xs text-muted-foreground">/ {priceLabel}{pricePerServing.isPartial ? ' (partiel)' : ''}</span>
                                        </span>
                                        <span className="text-xs text-muted-foreground underline">détail</span>
                                    </button>
                                ) : selectedIngredients.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setPriceBreakdownOpen(true)}
                                        className="text-xs text-muted-foreground underline hover:text-foreground"
                                        title="Aucun prix calculable pour l'instant. Cliquer pour renseigner les prix au 100g."
                                    >
                                        💶 Renseigner les prix
                                    </button>
                                )}
                            </div>
                        )}
                    </aside>
                  </div>
                </TabsContent>

                {/* Tab 2: Préparation */}
                <TabsContent value="preparation" className="space-y-6 mt-6">
                    {/* Actions normalisées (V6) - section principale */}
                    {recipeId ? (
                        <RecipeActionsSection recipeId={recipeId} />
                    ) : (
                        <div className="border border-dashed rounded-md p-8 text-center text-sm text-muted-foreground">
                            Enregistrez la recette pour accéder aux étapes de préparation.
                        </div>
                    )}

                    {/* Version textuelle des instructions (utilisee par la conversion IA) */}
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground font-medium">
                            Version textuelle (source pour la conversion IA)
                        </div>
                        <Textarea
                            value={values.instructions ?? ''}
                            onChange={(e) => setValues(prev => ({ ...prev, instructions: e.target.value }))}
                            rows={12}
                            placeholder="Collez ici la preparation au format texte brut. Enregistrez la recette puis utilisez le bouton 'Reconvertir (IA)' ci-dessus pour generer les etapes normalisees."
                            className="resize-none bg-muted/30 text-sm"
                        />
                    </div>
                </TabsContent>

                {/* Tab 3: Critères de sélection */}
                <TabsContent value="criteria" className="space-y-4 mt-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Critères de sélection</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Saisonnalité */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Saisonnalité</div>
                                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
                                    {MONTHS.map((month, index) => (
                                        <label key={index} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={selectedMonths[index]}
                                                onCheckedChange={() => toggleMonth(index)}
                                            />
                                            <span>{month}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Équipements de cuisine */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Équipements de cuisine</div>
                                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
                                    {kitchenEquipments.map((equipment, index) => (
                                        <label key={equipment.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={selectedEquipments[index]}
                                                onCheckedChange={() => toggleEquipment(index)}
                                            />
                                            <span>{equipment.emoji} {equipment.name.fr}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Régimes alimentaires */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Régimes alimentaires</div>
                                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
                                    {diets?.map((diet, index) => (
                                        <label key={diet.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={selectedDiets[index] || false}
                                                onCheckedChange={() => toggleDiet(index)}
                                            />
                                            <span>{diet.emoji} {diet.title.fr}</span>
                                        </label>
                                    )) || (
                                            <div className="text-sm text-muted-foreground">Chargement des régimes...</div>
                                        )}
                                </div>
                            </div>

                            {/* Allergènes — calculés depuis les ingrédients, non éditables */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Allergènes (calculés depuis les ingrédients)</div>
                                <div className="space-y-2 border rounded-md p-3">
                                    {allergies && allergies.length > 0 ? (
                                        computedAllergyMask === 0 ? (
                                            <div className="text-sm text-muted-foreground">Aucun allergène détecté dans les ingrédients.</div>
                                        ) : (
                                            allergies
                                                .filter(allergy => (computedAllergyMask & (1 << allergy.bit_index)) !== 0)
                                                .map(allergy => (
                                                    <div key={allergy.id} className="text-sm">
                                                        <span className="font-medium">{allergy.emoji} {allergy.name.fr}</span>
                                                        <span className="text-muted-foreground"> — via {allergenSources(allergy.bit_index)}</span>
                                                    </div>
                                                ))
                                        )
                                    ) : (
                                        <div className="text-sm text-muted-foreground">Chargement des allergies...</div>
                                    )}
                                    <div className="text-xs text-muted-foreground pt-1 border-t">
                                        Pour corriger, modifie les allergènes de l&apos;ingrédient concerné (fiche Ingrédient) : la recette sera mise à jour automatiquement.
                                    </div>
                                </div>
                            </div>

                            {/* Catégories de recettes */}
                            {recipeCategories && recipeCategories.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Catégories de recettes</div>
                                    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
                                        {recipeCategories.map((category) => (
                                            <label key={category.id} className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={selectedCategoryIds.includes(category.id)}
                                                    onCheckedChange={() => toggleCategory(category.id)}
                                                />
                                                <span
                                                    className="flex items-center gap-2"
                                                    style={{ color: category.color }}
                                                >
                                                    {category.emoji} {category.name.fr}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <RecipePriceBreakdown
                open={priceBreakdownOpen}
                onOpenChange={setPriceBreakdownOpen}
                selectedIngredients={selectedIngredients}
                structuredIngredients={values.structured_ingredients ?? []}
                baseServings={values.base_servings ?? null}
                quantificationType={values.quantification_type}
                onIngredientPriceUpdated={(id, newPrice) => {
                    // Met à jour le catalogue local pour que le badge prix et la modale se rafraîchissent
                    // immédiatement sans refetch. La valeur a déjà été persistée côté API.
                    setSelectedIngredients((prev) =>
                        prev.map((ing) => (ing.id === id ? { ...ing, price_per_100g: newPrice } : ing))
                    )
                }}
            />
        </form>
    )
}
