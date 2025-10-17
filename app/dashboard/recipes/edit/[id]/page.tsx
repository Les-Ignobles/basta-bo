"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RecipeForm } from '@/features/cooking/components/recipe-form'
import type { RecipeFormValues, Recipe } from '@/features/cooking/types'
import { useRecipeStore } from '@/features/cooking/stores/recipe-store'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function EditRecipePage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const recipeId = Number(params.id)
    const returnPage = searchParams.get('returnPage')
    const { fetchKitchenEquipments, fetchDiets, updateRecipe, kitchenEquipments, diets } = useRecipeStore()

    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchKitchenEquipments()
        fetchDiets()
    }, [fetchKitchenEquipments, fetchDiets])

    useEffect(() => {
        async function fetchRecipe() {
            try {
                const response = await fetch(`/api/recipes?id=${recipeId}`)
                if (response.ok) {
                    const data = await response.json()
                    setRecipe(data.data)
                } else {
                    router.push('/dashboard/recipes')
                }
            } catch (error) {
                console.error('Failed to fetch recipe:', error)
                router.push('/dashboard/recipes')
            } finally {
                setLoading(false)
            }
        }

        if (recipeId) {
            fetchRecipe()
        }
    }, [recipeId, router])

    async function handleSubmit(values: RecipeFormValues) {
        setSubmitting(true)
        try {
            await updateRecipe(recipeId, {
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
            // Retourner à la page spécifiée ou à la page 1 par défaut
            const targetPage = returnPage ? `?page=${returnPage}` : ''
            router.push(`/dashboard/recipes${targetPage}`)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Chargement de la recette...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (!recipe) {
        return (
            <div className="container mx-auto py-6">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Recette non trouvée</p>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard/recipes')}
                        className="mt-4"
                    >
                        Retour à la liste
                    </Button>
                </div>
            </div>
        )
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
                            onClick={() => {
                                const targetPage = returnPage ? `?page=${returnPage}` : ''
                                router.push(`/dashboard/recipes${targetPage}`)
                            }}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Button>
                        <h1 className="text-2xl font-semibold font-christmas">Modifier la recette</h1>
                    </div>
                    <Button
                        type="submit"
                        form="recipe-form"
                        disabled={submitting}
                        className="flex items-center gap-2"
                    >
                        {submitting ? "Mise à jour..." : "Enregistrer"}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
                <RecipeForm
                    onSubmit={handleSubmit}
                    defaultValues={recipe}
                    kitchenEquipments={kitchenEquipments}
                    diets={diets}
                    submittingLabel="Mise à jour..."
                    formId="recipe-form"
                />
            </div>
        </div>
    )
}
