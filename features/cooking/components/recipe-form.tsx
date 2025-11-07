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
import type { RecipeFormValues, KitchenEquipment, Ingredient } from '@/features/cooking/types'
import { DishType, DISH_TYPE_LABELS, QuantificationType, QUANTIFICATION_TYPE_LABELS } from '@/features/cooking/types'
import type { Diet } from '@/features/cooking/types/diet'
import type { Allergy } from '@/features/cooking/types/allergy'
import { useCookingStore } from '@/features/cooking/store'

export type { RecipeFormValues }

type Props = {
    defaultValues?: Partial<RecipeFormValues>
    defaultIngredients?: Ingredient[]
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

export function RecipeForm({ defaultValues, defaultIngredients, onSubmit, submittingLabel = 'Enregistrement...', kitchenEquipments, diets, allergies, formId }: Props) {
    const [values, setValues] = useState<RecipeFormValues>({
        title: '',
        ingredients_name: [],
        ingredient_ids: [],
        ingredients_quantities: '',
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
                img_path: defaultValues.img_path || '',
                seasonality_mask: defaultValues.seasonality_mask || null,
                kitchen_equipments_mask: defaultValues.kitchen_equipments_mask || null,
                diet_mask: defaultValues.diet_mask || null,
                instructions: defaultValues.instructions || '',
                dish_type: defaultValues.dish_type || DishType.PLAT,
                quantification_type: defaultValues.quantification_type || QuantificationType.PER_PERSON,
                is_folklore: defaultValues.is_folklore || false,
                is_visible: defaultValues.is_visible !== undefined ? defaultValues.is_visible : true,
            } as RecipeFormValues)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultValues)])

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
    async function syncIngredientsToAPI(ingredientIds: number[], ingredientNames: string[]) {
        const recipeId = defaultValues?.id
        if (!recipeId) return // Mode création, pas de sync immédiat

        setSyncingIngredients(true)
        try {
            const response = await fetch(`/api/recipes/${recipeId}/ingredients`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredient_ids: ingredientIds,
                    ingredients_name: ingredientNames
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

            setValues(prev => ({
                ...prev,
                ingredients_name: newIngredientNames,
                ingredient_ids: newIngredientIds
            }))

            setIngredientInput('')
            setIngredientOpen(false)

            // Synchroniser avec l'API en mode édition
            await syncIngredientsToAPI(newIngredientIds, newIngredientNames)
        }
    }

    async function removeIngredient(index: number) {
        const newSelectedIngredients = selectedIngredients.filter((_, i) => i !== index)
        setSelectedIngredients(newSelectedIngredients)

        const newIngredientIds = newSelectedIngredients.map(i => i.id)
        const newIngredientNames = newSelectedIngredients.map(i => i.name.fr)

        setValues(prev => ({
            ...prev,
            ingredients_name: newIngredientNames,
            ingredient_ids: newIngredientIds
        }))

        // Synchroniser avec l'API en mode édition
        await syncIngredientsToAPI(newIngredientIds, newIngredientNames)
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

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">Informations</TabsTrigger>
                    <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
                    <TabsTrigger value="preparation">Préparation</TabsTrigger>
                    <TabsTrigger value="criteria">Critères</TabsTrigger>
                </TabsList>

                {/* Tab 1: Informations générales */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <span className="text-sm font-medium">Visible sur l'application</span>
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
                </TabsContent>

                {/* Tab 2: Ingrédients */}
                <TabsContent value="ingredients" className="space-y-4 mt-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">Liste des ingrédients</h3>
                            {syncingIngredients && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Sélectionner les ingrédients
                            </div>
                            <div className="flex gap-2 w-full">
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
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedIngredients.map((ingredient, index) => (
                                    <div key={ingredient.id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                                        <span>{ingredient.name.fr}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeIngredient(index)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Quantités des ingrédients</div>
                            <Textarea
                                value={values.ingredients_quantities ?? ''}
                                onChange={(e) => setValues(prev => ({ ...prev, ingredients_quantities: e.target.value }))}
                                placeholder="Quantités des ingrédients"
                                rows={6}
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 3: Préparation */}
                <TabsContent value="preparation" className="space-y-4 mt-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Instructions de préparation</h3>
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                                Décrivez les étapes de préparation de la recette
                            </div>
                            <Textarea
                                value={values.instructions ?? ''}
                                onChange={(e) => setValues(prev => ({ ...prev, instructions: e.target.value }))}
                                placeholder="Instructions de la recette"
                                rows={12}
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 4: Critères de sélection */}
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
