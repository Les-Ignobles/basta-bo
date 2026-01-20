"use client"
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RecipeForm } from '@/features/cooking/components/recipe-form'
import type { RecipeFormValues } from '@/features/cooking/types'
import type { RecipeCategory } from '@/features/cooking/types/recipe-category'
import { useRecipeStore } from '@/features/cooking/stores/recipe-store'
import { ArrowLeft } from 'lucide-react'

export default function NewRecipePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnPage = searchParams.get('returnPage')
    const { fetchKitchenEquipments, fetchDiets, fetchAllergies, createRecipe, kitchenEquipments, diets, allergies } = useRecipeStore()
    const [duplicatedRecipe, setDuplicatedRecipe] = useState<RecipeFormValues | null>(null)
    const [loading, setLoading] = useState(false)
    const [recipeCategories, setRecipeCategories] = useState<RecipeCategory[]>([])
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])

    useEffect(() => {
        fetchKitchenEquipments()
        fetchDiets()
        fetchAllergies()

        // Charger les catégories de recettes
        fetch('/api/recipe-categories')
            .then(res => res.json())
            .then(data => setRecipeCategories(data.data || []))
            .catch(err => console.error('Failed to fetch recipe categories:', err))

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
    }, [fetchKitchenEquipments, fetchDiets, fetchAllergies])

    async function handleSubmit(values: RecipeFormValues) {
        setLoading(true)
        try {
            const newRecipe = await createRecipe({
                title: values.title,
                ingredients_name: values.ingredients_name,
                ingredients_quantities: values.ingredients_quantities ?? null,
                img_path: values.img_path ?? null,
                seasonality_mask: values.seasonality_mask ?? null,
                kitchen_equipments_mask: values.kitchen_equipments_mask ?? null,
                diet_mask: values.diet_mask ?? null,
                allergy_mask: values.allergy_mask ?? null,
                instructions: values.instructions ?? null,
                dish_type: values.dish_type,
                quantification_type: values.quantification_type,
                is_folklore: values.is_folklore,
                is_visible: values.is_visible,
                base_servings: values.base_servings ?? null,
                // Valeurs nutritionnelles
                calories_per_serving: values.calories_per_serving ?? null,
                proteins_per_serving: values.proteins_per_serving ?? null,
                fats_per_serving: values.fats_per_serving ?? null,
                carbs_per_serving: values.carbs_per_serving ?? null,
            })

            // Sauvegarder les catégories si la recette a été créée et des catégories sont sélectionnées
            if (newRecipe?.id && selectedCategoryIds.length > 0) {
                await fetch(`/api/recipes/${newRecipe.id}/categories`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categoryIds: selectedCategoryIds })
                })
            }

            // Retourner à la page spécifiée ou à la page 1 par défaut
            const targetPage = returnPage ? `?page=${returnPage}` : ''
            router.push(`/dashboard/recipes${targetPage}`)
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
                    allergies={allergies}
                    recipeCategories={recipeCategories}
                    defaultCategoryIds={selectedCategoryIds}
                    onCategoriesChange={setSelectedCategoryIds}
                    submittingLabel="Création..."
                    formId="recipe-form"
                />
            </div>
        </div>
    )
}
