"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RecipeForm } from '@/features/cooking/components/recipe-form'
import type { RecipeFormValues } from '@/features/cooking/types'
import { useRecipeStore } from '@/features/cooking/stores/recipe-store'
import { ArrowLeft } from 'lucide-react'

export default function NewRecipePage() {
    const router = useRouter()
    const { fetchKitchenEquipments, fetchDiets, createRecipe, kitchenEquipments, diets } = useRecipeStore()
    const [duplicatedRecipe, setDuplicatedRecipe] = useState<RecipeFormValues | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchKitchenEquipments()
        fetchDiets()

        // Vérifier s'il y a une recette dupliquée dans sessionStorage
        const stored = sessionStorage.getItem('duplicatedRecipe')
        if (stored) {
            try {
                const recipe = JSON.parse(stored)
                setDuplicatedRecipe(recipe)
                sessionStorage.removeItem('duplicatedRecipe') // Nettoyer après utilisation
            } catch (error) {
                console.error('Failed to parse duplicated recipe:', error)
            }
        }
    }, [fetchKitchenEquipments, fetchDiets])

    async function handleSubmit(values: RecipeFormValues) {
        setLoading(true)
        try {
            await createRecipe({
                title: values.title,
                ingredients_name: values.ingredients_name,
                ingredients_quantities: values.ingredients_quantities ?? null,
                img_path: values.img_path ?? null,
                seasonality_mask: values.seasonality_mask ?? null,
                kitchen_equipments_mask: values.kitchen_equipments_mask ?? null,
                diet_mask: values.diet_mask ?? null,
                instructions: values.instructions ?? null,
                dish_type: values.dish_type,
                quantification_type: values.quantification_type,
                is_folklore: values.is_folklore,
                is_visible: values.is_visible,
            })
            router.push('/dashboard/recipes')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Barre sticky avec navigation et actions */}
            <div className="sticky top-0 z-50 bg-background border-b pb-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Button>
                        <h1 className="text-2xl font-semibold font-christmas">Nouvelle recette</h1>
                    </div>
                    <Button
                        type="submit"
                        form="recipe-form"
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        {loading ? "Création..." : "Enregistrer"}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
                <RecipeForm
                    onSubmit={handleSubmit}
                    defaultValues={duplicatedRecipe || undefined}
                    kitchenEquipments={kitchenEquipments}
                    diets={diets}
                    submittingLabel="Création..."
                    formId="recipe-form"
                />
            </div>
        </div>
    )
}
