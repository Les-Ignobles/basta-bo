"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/image-upload'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecipeFormValues, KitchenEquipment, Ingredient, StructuredIngredient, IngredientRecipePivot } from '@/features/cooking/types'
import { DishType, DISH_TYPE_LABELS, QuantificationType, QUANTIFICATION_TYPE_LABELS, IngredientUnit, INGREDIENT_UNIT_LABELS } from '@/features/cooking/types'
import type { Diet } from '@/features/cooking/types/diet'
import type { Allergy } from '@/features/cooking/types/allergy'
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
    formId?: string
}

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const DISH_TYPES = [
    { value: DishType.ENTREE, label: DISH_TYPE_LABELS[DishType.ENTREE] },
    { value: DishType.PLAT, label: DISH_TYPE_LABELS[DishType.PLAT] },
    { value: DishType.DESSERT, label: DISH_TYPE_LABELS[DishType.DESSERT] }
]

const QUANTIFICATION_TYPES = [
    { value: QuantificationType.PER_PERSON, label: QUANTIFICATION_TYPE_LABELS[QuantificationType.PER_PERSON] },
    { value: QuantificationType.PER_UNIT, label: QUANTIFICATION_TYPE_LABELS[QuantificationType.PER_UNIT] }
]

export function RecipeForm({ defaultValues, defaultIngredients, defaultStructuredIngredients, onSubmit, submittingLabel = 'Enregistrement...', kitchenEquipments, diets, allergies, formId }: Props) {
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
        dish_type: DishType.PLAT, // Par défaut "plat"
        quantification_type: QuantificationType.PER_PERSON, // Par défaut "par personne"
        is_folklore: false, // Par défaut false
        is_visible: true, // Par défaut true
        base_servings: null, // Nombre de portions de base
        ...defaultValues,
    } as RecipeFormValues)
    const [loading, setLoading] = useState(false)
    const [ingredientInput, setIngredientInput] = useState('')
    const [selectedMonths, setSelectedMonths] = useState<boolean[]>(new Array(12).fill(false))
    const [selectedEquipments, setSelectedEquipments] = useState<boolean[]>(new Array(kitchenEquipments.length).fill(false))
    const [selectedDiets, setSelectedDiets] = useState<boolean[]>(new Array(diets?.length || 0).fill(false))
    const [selectedAllergies, setSelectedAllergies] = useState<boolean[]>(new Array(allergies?.length || 0).fill(false))
    const [ingredientOpen, setIngredientOpen] = useState(false)
    const [searchResults, setSearchResults] = useState<Ingredient[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([])
    const [syncingIngredients, setSyncingIngredients] = useState(false)

    const { searchIngredients } = useCookingStore()

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
        }, 300) // Debounce de 300ms

        return () => clearTimeout(timeoutId)
    }, [ingredientInput, searchIngredients])

    // Update form values when defaultValues change (for edit mode)
    // On utilise JSON.stringify pour comparer le contenu réel, pas juste la référence
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
                base_servings: defaultValues.base_servings ?? null,
            } as RecipeFormValues)
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
                is_optional: si.is_optional
            }))
            setValues(prev => ({ ...prev, structured_ingredients: structuredIngredients }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultStructuredIngredients)])

    // Initialize masks from default values
    // On utilise JSON.stringify pour comparer le contenu réel
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

        if (defaultValues?.allergy_mask !== undefined && allergies) {
            const allergySelections = allergies.map(allergy =>
                (defaultValues.allergy_mask! & (1 << allergy.bit_index)) !== 0
            )
            setSelectedAllergies(allergySelections)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultValues), kitchenEquipments, diets, allergies])

    // Mettre à jour selectedDiets quand diets change
    useEffect(() => {
        if (diets && diets.length !== selectedDiets.length) {
            setSelectedDiets(new Array(diets.length).fill(false))
        }
    }, [diets, selectedDiets.length])

    // Mettre à jour selectedAllergies quand allergies change
    useEffect(() => {
        if (allergies && allergies.length !== selectedAllergies.length) {
            setSelectedAllergies(new Array(allergies.length).fill(false))
        }
    }, [allergies, selectedAllergies.length])

    // Initialiser selectedIngredients depuis defaultIngredients (mode édition)
    // On utilise JSON.stringify pour comparer le contenu réel
    useEffect(() => {
        if (defaultIngredients && defaultIngredients.length > 0) {
            setSelectedIngredients(defaultIngredients)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultIngredients)])

    // Fonction helper pour synchroniser les ingrédients via l'API (mode édition uniquement)
    async function syncIngredientsToAPI(ingredientIds: number[], ingredientNames: string[], structuredIngredients?: StructuredIngredient[]) {
        const recipeId = defaultValues?.id
        if (!recipeId) return // Mode création, pas de sync immédiat

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
            // On pourrait afficher un toast d'erreur ici
        } finally {
            setSyncingIngredients(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            // Convert selected months to bitmask
            let seasonalityMask = 0
            selectedMonths.forEach((selected, index) => {
                if (selected) {
                    seasonalityMask |= (1 << index)
                }
            })

            // Convert selected equipments to bitmask
            let equipmentsMask = 0
            selectedEquipments.forEach((selected, index) => {
                if (selected && kitchenEquipments[index]?.bit_index !== null) {
                    equipmentsMask |= (1 << kitchenEquipments[index].bit_index!)
                }
            })

            // Convert selected diets to bitmask
            let dietMask = 0
            if (diets) {
                selectedDiets.forEach((selected, index) => {
                    if (selected && diets[index]) {
                        dietMask |= (1 << diets[index].bit_index)
                    }
                })
            }

            // Convert selected allergies to bitmask
            let allergyMask = 0
            if (allergies) {
                selectedAllergies.forEach((selected, index) => {
                    if (selected && allergies[index]) {
                        allergyMask |= (1 << allergies[index].bit_index)
                    }
                })
            }

            await onSubmit({
                ...values,
                seasonality_mask: seasonalityMask || null,
                kitchen_equipments_mask: equipmentsMask || null,
                diet_mask: dietMask || null,
                allergy_mask: allergyMask || null,
            })
        } finally {
            setLoading(false)
        }
    }

    async function addIngredient(ingredient: Ingredient) {
        // Vérifier que l'ingrédient n'est pas déjà sélectionné
        if (!selectedIngredients.find(i => i.id === ingredient.id)) {
            const newSelectedIngredients = [...selectedIngredients, ingredient]
            setSelectedIngredients(newSelectedIngredients)

            const newIngredientIds = newSelectedIngredients.map(i => i.id)
            const newIngredientNames = newSelectedIngredients.map(i => i.name.fr)

            // Ajouter un nouvel ingrédient structuré avec valeurs par défaut
            const newStructuredIngredient: StructuredIngredient = {
                ingredient_id: ingredient.id,
                quantity: null,
                unit: null,
                is_optional: false
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

            // Synchroniser avec l'API en mode édition (avec les données structurées)
            await syncIngredientsToAPI(newIngredientIds, newIngredientNames, newStructuredIngredients)
        }
    }

    async function removeIngredient(index: number) {
        const removedIngredient = selectedIngredients[index]
        const newSelectedIngredients = selectedIngredients.filter((_, i) => i !== index)
        setSelectedIngredients(newSelectedIngredients)

        const newIngredientIds = newSelectedIngredients.map(i => i.id)
        const newIngredientNames = newSelectedIngredients.map(i => i.name.fr)

        // Filtrer aussi les structured_ingredients pour retirer l'ingrédient supprimé
        const newStructuredIngredients = (values.structured_ingredients || [])
            .filter(si => si.ingredient_id !== removedIngredient.id)

        setValues(prev => ({
            ...prev,
            ingredients_name: newIngredientNames,
            ingredient_ids: newIngredientIds,
            structured_ingredients: newStructuredIngredients
        }))

        // Synchroniser avec l'API en mode édition (avec les données structurées)
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

    function toggleAllergy(index: number) {
        setSelectedAllergies(prev => prev.map((selected, i) => i === index ? !selected : selected))
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
                        { ingredient_id: ingredientId, quantity: null, unit: null, is_optional: false, [field]: value }
                    ]
                }
            }
        })
    }

    function getStructuredIngredient(ingredientId: number): StructuredIngredient | undefined {
        return values.structured_ingredients?.find(si => si.ingredient_id === ingredientId)
    }

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">Informations & Préparation</TabsTrigger>
                    <TabsTrigger value="criteria">Critères</TabsTrigger>
                </TabsList>

                {/* Tab 1: Informations générales, Ingrédients & Préparation */}
                <TabsContent value="info" className="space-y-6 mt-6">
                    {/* Section Titre et Image */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-foreground">Informations principales</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                            <div className="space-y-2">
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
                        </div>
                    </div>

                    {/* Section Classification */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-foreground">Classification</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Type de plat *</label>
                                <Select
                                    value={values.dish_type.toString()}
                                    onValueChange={(value) => setValues(prev => ({ ...prev, dish_type: parseInt(value) as DishType }))}
                                >
                                    <SelectTrigger className="text-base">
                                        <SelectValue placeholder="Sélectionner un type de plat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DISH_TYPES.map((dishType) => (
                                            <SelectItem key={dishType.value} value={dishType.value.toString()}>
                                                {dishType.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Entrée, plat principal ou dessert</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Type de quantification *</label>
                                <Select
                                    value={values.quantification_type.toString()}
                                    onValueChange={(value) => setValues(prev => ({ ...prev, quantification_type: parseInt(value) as QuantificationType }))}
                                >
                                    <SelectTrigger className="text-base">
                                        <SelectValue placeholder="Sélectionner un type de quantification" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QUANTIFICATION_TYPES.map((quantificationType) => (
                                            <SelectItem key={quantificationType.value} value={quantificationType.value.toString()}>
                                                {quantificationType.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Comment les portions sont calculées</p>
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
                                <p className="text-xs text-muted-foreground">Nombre de personnes pour les quantités de base</p>
                            </div>
                        </div>
                    </div>

                    {/* Section Options */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-foreground">Options de publication</h3>
                        <div className="flex flex-col gap-4 border rounded-lg p-4 bg-muted/30">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <Checkbox
                                    checked={values.is_visible}
                                    onCheckedChange={(checked) => setValues(prev => ({ ...prev, is_visible: Boolean(checked) }))}
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Visible sur l&apos;application</span>
                                    <span className="text-xs text-muted-foreground">La recette sera accessible aux utilisateurs</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <Checkbox
                                    checked={values.is_folklore}
                                    onCheckedChange={(checked) => setValues(prev => ({ ...prev, is_folklore: Boolean(checked) }))}
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Recette folklore</span>
                                    <span className="text-xs text-muted-foreground">Marque cette recette comme traditionnelle ou régionale</span>
                                </div>
                            </label>
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
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Sélectionner les ingrédients
                            </div>
                            <div className="flex gap-2 w-full max-w-md">
                                <Popover open={ingredientOpen} onOpenChange={setIngredientOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={ingredientOpen}
                                            className="flex-1 justify-between"
                                        >
                                            {ingredientInput || "Ajouter un nouvel ingrédient..."}
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
                                                            "Tapez pour rechercher des ingrédients..."}
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
                        </div>

                        {/* Comparaison côte à côte : Texte original vs Structuré */}
                        {selectedIngredients.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Colonne gauche : Quantités textuelles (original) */}
                                <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground font-medium">
                                        Quantités textuelles (ancien format)
                                    </div>
                                    <Textarea
                                        value={values.ingredients_quantities ?? ''}
                                        onChange={(e) => setValues(prev => ({ ...prev, ingredients_quantities: e.target.value }))}
                                        placeholder="Quantités des ingrédients (format texte)"
                                        rows={16}
                                        className="resize-none bg-muted/30 text-muted-foreground text-sm"
                                    />
                                </div>

                                {/* Colonne droite : Quantités structurées (migration) */}
                                <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground font-medium">
                                        Quantités structurées (normalisées)
                                    </div>
                                    <div className="border rounded-md overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="text-left p-2 font-medium">Ingrédient</th>
                                                    <th className="text-left p-2 font-medium w-20">Qté</th>
                                                    <th className="text-left p-2 font-medium w-32">Unité</th>
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
                                                            <td className="p-2">
                                                                <span className="truncate block max-w-[180px]" title={ingredient.name.fr}>
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
                                </div>
                            </div>
                        )}

                        {/* Afficher le textarea seul si pas d'ingrédients sélectionnés */}
                        {selectedIngredients.length === 0 && (
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                    Quantités des ingrédients (sélectionnez des ingrédients pour voir la comparaison)
                                </div>
                                <Textarea
                                    value={values.ingredients_quantities ?? ''}
                                    onChange={(e) => setValues(prev => ({ ...prev, ingredients_quantities: e.target.value }))}
                                    placeholder="Quantités des ingrédients"
                                    rows={8}
                                    className="resize-none bg-muted/30 text-muted-foreground"
                                />
                            </div>
                        )}
                    </div>

                    {/* Section Préparation (en dessous) */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-foreground">Instructions de préparation</h3>
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Décrivez les étapes de préparation de la recette
                            </div>
                            <Textarea
                                value={values.instructions ?? ''}
                                onChange={(e) => setValues(prev => ({ ...prev, instructions: e.target.value }))}
                                placeholder="Instructions de la recette"
                                rows={12}
                                className="resize-none"
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 2: Critères de sélection */}
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

                            {/* Allergies */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Allergies non compatibles</div>
                                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
                                    {allergies?.map((allergy, index) => (
                                        <label key={allergy.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={selectedAllergies[index] || false}
                                                onCheckedChange={() => toggleAllergy(index)}
                                            />
                                            <span>{allergy.emoji} {allergy.name.fr}</span>
                                        </label>
                                    )) || (
                                            <div className="text-sm text-muted-foreground">Chargement des allergies...</div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </form>
    )
}
