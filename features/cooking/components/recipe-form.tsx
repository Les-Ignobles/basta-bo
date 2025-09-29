"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/image-upload'
import type { RecipeFormValues, KitchenEquipment } from '@/features/cooking/types'

type Props = {
    defaultValues?: Partial<RecipeFormValues>
    onSubmit: (values: RecipeFormValues) => Promise<void> | void
    submittingLabel?: string
    kitchenEquipments: KitchenEquipment[]
}

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export function RecipeForm({ defaultValues, onSubmit, submittingLabel = 'Enregistrement...', kitchenEquipments }: Props) {
    const [values, setValues] = useState<RecipeFormValues>({
        title: '',
        ingredients_name: [],
        img_path: '',
        seasonality_mask: null,
        kitchen_equipments_mask: null,
        instructions: '',
        ...defaultValues,
    } as RecipeFormValues)
    const [loading, setLoading] = useState(false)
    const [ingredientInput, setIngredientInput] = useState('')
    const [selectedMonths, setSelectedMonths] = useState<boolean[]>(new Array(12).fill(false))
    const [selectedEquipments, setSelectedEquipments] = useState<boolean[]>(new Array(kitchenEquipments.length).fill(false))

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
    }, [defaultValues, kitchenEquipments])

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

            await onSubmit({
                ...values,
                seasonality_mask: seasonalityMask || null,
                kitchen_equipments_mask: equipmentsMask || null,
            })
        } finally {
            setLoading(false)
        }
    }

    function addIngredient() {
        if (ingredientInput.trim()) {
            setValues(prev => ({
                ...prev,
                ingredients_name: [...prev.ingredients_name, ingredientInput.trim()]
            }))
            setIngredientInput('')
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
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
                    <div className="text-xs text-muted-foreground">Ingrédients</div>
                    <div className="flex gap-2">
                        <Input
                            value={ingredientInput}
                            onChange={(e) => setIngredientInput(e.target.value)}
                            placeholder="Ajouter un ingrédient"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                        />
                        <Button type="button" onClick={addIngredient} size="sm">
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
                    <div className="text-xs text-muted-foreground">Instructions</div>
                    <Textarea
                        value={values.instructions ?? ''}
                        onChange={(e) => setValues(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Instructions de la recette"
                        rows={4}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <ImageUpload
                        value={values.img_path ?? undefined}
                        onChange={(url) => setValues(prev => ({ ...prev, img_path: url }))}
                        bucket="recipes"
                        ingredientId={defaultValues?.id ? String(defaultValues.id) : undefined}
                        ingredientName={values.title}
                    />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">Saisonnalité</div>
                            <div className="grid grid-cols-3 gap-2">
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

                        <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">Équipements de cuisine</div>
                            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
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
