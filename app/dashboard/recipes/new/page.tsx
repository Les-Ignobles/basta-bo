"use client"
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RecipeFormValues } from '@/features/cooking/types'
import { DishType, DISH_TYPE_LABELS, QuantificationType, QUANTIFICATION_TYPE_LABELS } from '@/features/cooking/types'
import { useRecipeStore } from '@/features/cooking/stores/recipe-store'
import { ArrowLeft } from 'lucide-react'

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

export default function NewRecipePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnPage = searchParams.get('returnPage')
    const { createRecipe } = useRecipeStore()

    const [title, setTitle] = useState('')
    const [dishType, setDishType] = useState<DishType>(DishType.PLAT)
    const [quantificationType, setQuantificationType] = useState<QuantificationType>(QuantificationType.PER_PERSON)
    const [isFolklore, setIsFolklore] = useState(false)
    const [loading, setLoading] = useState(false)

    // Pré-remplir depuis une recette dupliquée si présente en sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('duplicatedRecipe')
        if (stored) {
            try {
                const recipe = JSON.parse(stored) as RecipeFormValues
                setTitle(recipe.title ?? '')
                if (recipe.dish_type !== undefined) setDishType(recipe.dish_type)
                if (recipe.quantification_type !== undefined) setQuantificationType(recipe.quantification_type)
                if (recipe.is_folklore !== undefined) setIsFolklore(recipe.is_folklore)
                sessionStorage.removeItem('duplicatedRecipe')
            } catch (error) {
                console.error('Failed to parse duplicated recipe:', error)
            }
        }
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!title.trim()) return

        setLoading(true)
        try {
            const newRecipe = await createRecipe({
                title: title.trim(),
                ingredients_name: [],
                ingredients_quantities: null,
                img_path: null,
                seasonality_mask: null,
                kitchen_equipments_mask: null,
                diet_mask: null,
                allergy_mask: null,
                instructions: null,
                dish_type: dishType,
                quantification_type: quantificationType,
                is_folklore: isFolklore,
                is_visible: false,
                base_servings: null,
                calories_per_serving: null,
                proteins_per_serving: null,
                fats_per_serving: null,
                carbs_per_serving: null,
            })

            if (newRecipe?.id) {
                const editParams = returnPage ? `?returnPage=${returnPage}` : ''
                router.push(`/dashboard/recipes/edit/${newRecipe.id}${editParams}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Barre sticky avec navigation */}
            <div className="sticky top-0 z-50 bg-background border-b pb-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const targetPage = returnPage ? `?page=${returnPage}` : ''
                                router.push(`/dashboard/recipes${targetPage}`)
                            }}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Button>
                        <h1 className="text-2xl font-semibold font-christmas">Nouvelle recette</h1>
                    </div>
                    <Button
                        type="submit"
                        form="new-recipe-form"
                        disabled={loading || !title.trim()}
                        className="flex items-center gap-2"
                    >
                        {loading ? "Création..." : "Créer et continuer"}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg border p-6 max-w-2xl mx-auto">
                <p className="text-sm text-muted-foreground mb-6">
                    Renseignez les informations de base pour créer la recette. Vous pourrez ensuite ajouter les ingrédients, les étapes de préparation et tout le reste sur la page d&apos;édition.
                </p>

                <form id="new-recipe-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Titre de la recette"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type de plat</Label>
                            <Select
                                value={String(dishType)}
                                onValueChange={(value) => setDishType(Number(value) as DishType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DISH_TYPES.map(type => (
                                        <SelectItem key={type.value} value={String(type.value)}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Quantification</Label>
                            <Select
                                value={String(quantificationType)}
                                onValueChange={(value) => setQuantificationType(Number(value) as QuantificationType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {QUANTIFICATION_TYPES.map(type => (
                                        <SelectItem key={type.value} value={String(type.value)}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={isFolklore}
                                onCheckedChange={(checked) => setIsFolklore(checked === true)}
                            />
                            <span>Folklore</span>
                        </label>
                    </div>
                </form>
            </div>
        </div>
    )
}
