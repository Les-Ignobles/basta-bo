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
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecipeFormValues, KitchenEquipment, Ingredient } from '@/features/cooking/types'
import { DishType, DISH_TYPE_LABELS, QuantificationType, QUANTIFICATION_TYPE_LABELS } from '@/features/cooking/types'
import type { Diet } from '@/features/cooking/types/diet'
import { useCookingStore } from '@/features/cooking/store'

export type { RecipeFormValues }

type Props = {
    defaultValues?: Partial<RecipeFormValues>
    onSubmit: (values: RecipeFormValues) => Promise<void> | void
    submittingLabel?: string
    kitchenEquipments: KitchenEquipment[]
    diets: Diet[]
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

export function RecipeForm({ defaultValues, onSubmit, submittingLabel = 'Enregistrement...', kitchenEquipments, diets }: Props) {
    const [values, setValues] = useState<RecipeFormValues>({
        title: '',
        ingredients_name: [],
        ingredients_quantities: '',
        img_path: '',
        seasonality_mask: null,
        kitchen_equipments_mask: null,
        diet_mask: null,
        instructions: '',
        dish_type: DishType.PLAT, // Par défaut "plat"
        quantification_type: QuantificationType.PER_PERSON, // Par défaut "par personne"
        ...defaultValues,
    } as RecipeFormValues)
    const [loading, setLoading] = useState(false)
    const [ingredientInput, setIngredientInput] = useState('')
    const [selectedMonths, setSelectedMonths] = useState<boolean[]>(new Array(12).fill(false))
    const [selectedEquipments, setSelectedEquipments] = useState<boolean[]>(new Array(kitchenEquipments.length).fill(false))
    const [selectedDiets, setSelectedDiets] = useState<boolean[]>(new Array(diets?.length || 0).fill(false))
    const [ingredientOpen, setIngredientOpen] = useState(false)
    const [searchResults, setSearchResults] = useState<Ingredient[]>([])
    const [searching, setSearching] = useState(false)

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

    // Initialize masks from default values
    useEffect(() => {
        if (defaultValues?.seasonality_mask) {
            const months = []
            for (let i = 0; i < 12; i++) {
                months.push((defaultValues.seasonality_mask & (1 << i)) !== 0)
            }
            setSelectedMonths(months)
        }

        if (defaultValues?.kitchen_equipments_mask) {
            const equipments = kitchenEquipments.map(eq =>
                eq.bit_index !== null ? (defaultValues.kitchen_equipments_mask! & (1 << eq.bit_index)) !== 0 : false
            )
            setSelectedEquipments(equipments)
        }

        if (defaultValues?.diet_mask && diets) {
            const dietSelections = diets.map(diet =>
                (defaultValues.diet_mask! & (1 << diet.bit_index)) !== 0
            )
            setSelectedDiets(dietSelections)
        }
    }, [defaultValues, kitchenEquipments, diets])

    // Mettre à jour selectedDiets quand diets change
    useEffect(() => {
        if (diets && diets.length !== selectedDiets.length) {
            setSelectedDiets(new Array(diets.length).fill(false))
        }
    }, [diets, selectedDiets.length])

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

            await onSubmit({
                ...values,
                seasonality_mask: seasonalityMask || null,
                kitchen_equipments_mask: equipmentsMask || null,
                diet_mask: dietMask || null,
            })
        } finally {
            setLoading(false)
        }
    }

    function addIngredient(ingredientName?: string) {
        const name = ingredientName || ingredientInput.trim()
        if (name && !values.ingredients_name.includes(name)) {
            setValues(prev => ({
                ...prev,
                ingredients_name: [...prev.ingredients_name, name]
            }))
            setIngredientInput('')
            setIngredientOpen(false)
        }
    }

    function removeIngredient(index: number) {
        setValues(prev => ({
            ...prev,
            ingredients_name: prev.ingredients_name.filter((_, i) => i !== index)
        }))
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
                {/* Titre, Type de plat, Type de quantification et Image sur la même ligne */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Titre</div>
                        <Input
                            value={values.title}
                            onChange={(e) => setValues(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Titre de la recette"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Type de plat</div>
                        <Select
                            value={values.dish_type.toString()}
                            onValueChange={(value) => setValues(prev => ({ ...prev, dish_type: parseInt(value) as DishType }))}
                        >
                            <SelectTrigger>
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
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Type de quantification</div>
                        <Select
                            value={values.quantification_type.toString()}
                            onValueChange={(value) => setValues(prev => ({ ...prev, quantification_type: parseInt(value) as QuantificationType }))}
                        >
                            <SelectTrigger>
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
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Image</div>
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

                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                        Ingrédients
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
                                        {(() => {
                                            return (
                                                <>
                                                    {/* Option pour ajouter le texte saisi */}
                                                    {ingredientInput.trim() && !values.ingredients_name.includes(ingredientInput.trim()) && (
                                                        <CommandGroup heading="Ajouter">
                                                            <CommandItem
                                                                value={ingredientInput}
                                                                onSelect={() => addIngredient(ingredientInput.trim())}
                                                            >
                                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                                "{ingredientInput.trim()}"
                                                            </CommandItem>
                                                        </CommandGroup>
                                                    )}

                                                    {/* Suggestions d'ingrédients existants */}
                                                    {searchResults.length > 0 && (
                                                        <CommandGroup heading="Suggestions">
                                                            {searchResults.map((ingredient) => (
                                                                <CommandItem
                                                                    key={ingredient.id}
                                                                    value={ingredient.name.fr}
                                                                    onSelect={() => addIngredient(ingredient.name.fr)}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            values.ingredients_name.includes(ingredient.name.fr) ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {ingredient.name.fr}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    )}
                                                </>
                                            )
                                        })()}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Button type="button" onClick={() => addIngredient()} size="sm" className="shrink-0">
                            Ajouter
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {values.ingredients_name.map((ingredient, index) => (
                            <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                                <span>{ingredient}</span>
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
                        rows={3}
                    />
                </div>

                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Instructions</div>
                    <Textarea
                        value={values.instructions ?? ''}
                        onChange={(e) => setValues(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Instructions de la recette"
                        rows={4}
                    />
                </div>


                {/* Section des checkboxes sur 3 colonnes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Saisonnalité */}
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Saisonnalité</div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
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
                        <div className="text-xs text-muted-foreground">Équipements de cuisine</div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
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
                        <div className="text-xs text-muted-foreground">Régimes alimentaires</div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
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
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={loading}>
                    {loading ? submittingLabel : 'Enregistrer'}
                </Button>
            </div>
        </form>
    )
}
