"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RecipeForm } from '@/features/cooking/components/recipe-form'
import type { RecipeFormValues, Recipe, Ingredient, IngredientRecipePivot } from '@/features/cooking/types'
import type { RecipeCategory } from '@/features/cooking/types/recipe-category'
import { useRecipeStore } from '@/features/cooking/stores/recipe-store'
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function EditRecipePage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const recipeId = Number(params.id)
    const returnPage = searchParams.get('returnPage')
    const { fetchKitchenEquipments, fetchDiets, fetchAllergies, updateRecipe, kitchenEquipments, diets, allergies } = useRecipeStore()

    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [structuredIngredients, setStructuredIngredients] = useState<(IngredientRecipePivot & { ingredient: Ingredient })[]>([])
    const [recipeCategories, setRecipeCategories] = useState<RecipeCategory[]>([])
    const [recipeCategoryIds, setRecipeCategoryIds] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [navigation, setNavigation] = useState<{ previous: number | null; next: number | null } | null>(null)

    useEffect(() => {
        fetchKitchenEquipments()
        fetchDiets()
        fetchAllergies()
    }, [fetchKitchenEquipments, fetchDiets, fetchAllergies])

    useEffect(() => {
        async function fetchRecipeData() {
            try {
                // Construire les paramètres de filtrage depuis l'URL pour la navigation contextuelle
                const navParams = new URLSearchParams()
                const search = searchParams.get('search')
                const noImage = searchParams.get('noImage')
                const dishType = searchParams.get('dishType')
                const diets = searchParams.get('diets')
                const kitchenEquipments = searchParams.get('kitchenEquipments')
                const quantificationType = searchParams.get('quantificationType')
                const isVisible = searchParams.get('isVisible')
                const isFolklore = searchParams.get('isFolklore')

                if (search) navParams.set('search', search)
                if (noImage) navParams.set('noImage', noImage)
                if (dishType) navParams.set('dishType', dishType)
                if (diets) navParams.set('diets', diets)
                if (kitchenEquipments) navParams.set('kitchenEquipments', kitchenEquipments)
                if (quantificationType) navParams.set('quantificationType', quantificationType)
                if (isVisible) navParams.set('isVisible', isVisible)
                if (isFolklore) navParams.set('isFolklore', isFolklore)

                const navigationUrl = navParams.toString()
                    ? `/api/recipes/${recipeId}/navigation?${navParams.toString()}`
                    : `/api/recipes/${recipeId}/navigation`

                // Charger la recette, les ingrédients, catégories et navigation en parallèle
                const [recipeResponse, ingredientsResponse, navigationResponse, categoriesResponse, recipeCategoriesResponse] = await Promise.all([
                    fetch(`/api/recipes?id=${recipeId}`),
                    fetch(`/api/recipes/${recipeId}/ingredients`),
                    fetch(navigationUrl),
                    fetch('/api/recipe-categories'),
                    fetch(`/api/recipes/${recipeId}/categories`)
                ])

                if (recipeResponse.ok && ingredientsResponse.ok) {
                    const recipeData = await recipeResponse.json()
                    const ingredientsData = await ingredientsResponse.json()

                    setRecipe(recipeData.data)
                    setIngredients(ingredientsData.data || [])
                    setStructuredIngredients(ingredientsData.structured || [])

                    if (navigationResponse.ok) {
                        const navigationData = await navigationResponse.json()
                        setNavigation(navigationData.data)
                    }

                    if (categoriesResponse.ok) {
                        const categoriesData = await categoriesResponse.json()
                        setRecipeCategories(categoriesData.data || [])
                    }

                    if (recipeCategoriesResponse.ok) {
                        const recipeCategoriesData = await recipeCategoriesResponse.json()
                        setRecipeCategoryIds(recipeCategoriesData.data || [])
                    }
                } else {
                    router.push('/dashboard/recipes')
                }
            } catch (error) {
                console.error('Failed to fetch recipe data:', error)
                router.push('/dashboard/recipes')
            } finally {
                setLoading(false)
            }
        }

        if (recipeId) {
            fetchRecipeData()
        }
    }, [recipeId, router, searchParams])

    async function handleCategoriesChange(categoryIds: number[]) {
        try {
            await fetch(`/api/recipes/${recipeId}/categories`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryIds })
            })
            setRecipeCategoryIds(categoryIds)
        } catch (error) {
            console.error('Failed to update recipe categories:', error)
        }
    }

    async function handleSubmit(values: RecipeFormValues) {
        setSubmitting(true)
        try {
            await updateRecipe(recipeId, {
                title: values.title,
                ingredients_name: values.ingredients_name,
                ingredient_ids: values.ingredient_ids,
                ingredients_quantities: values.ingredients_quantities ?? null,
                structured_ingredients: values.structured_ingredients,
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

            // Recharger les données de la recette pour mettre à jour l'affichage
            // Le RecipeForm écoutera automatiquement les changements de defaultValues
            const [recipeResponse, ingredientsResponse] = await Promise.all([
                fetch(`/api/recipes?id=${recipeId}`),
                fetch(`/api/recipes/${recipeId}/ingredients`)
            ])

            if (recipeResponse.ok && ingredientsResponse.ok) {
                const recipeData = await recipeResponse.json()
                const ingredientsData = await ingredientsResponse.json()
                setRecipe(recipeData.data)
                setIngredients(ingredientsData.data || [])
                setStructuredIngredients(ingredientsData.structured || [])
            }
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
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (navigation?.previous) {
                                        // Préserver tous les paramètres de filtrage pour la navigation
                                        router.push(`/dashboard/recipes/edit/${navigation.previous}?${searchParams.toString()}`)
                                    }
                                }}
                                disabled={!navigation?.previous}
                                className="flex items-center gap-1"
                                title="Recette précédente"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (navigation?.next) {
                                        // Préserver tous les paramètres de filtrage pour la navigation
                                        router.push(`/dashboard/recipes/edit/${navigation.next}?${searchParams.toString()}`)
                                    }
                                }}
                                disabled={!navigation?.next}
                                className="flex items-center gap-1"
                                title="Recette suivante"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
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
                    defaultValues={{
                        ...recipe,
                        ingredient_ids: ingredients.map(i => i.id)
                    }}
                    defaultIngredients={ingredients}
                    defaultStructuredIngredients={structuredIngredients}
                    kitchenEquipments={kitchenEquipments}
                    diets={diets}
                    allergies={allergies}
                    recipeCategories={recipeCategories}
                    defaultCategoryIds={recipeCategoryIds}
                    onCategoriesChange={handleCategoriesChange}
                    submittingLabel="Mise à jour..."
                    formId="recipe-form"
                />
            </div>
        </div>
    )
}
