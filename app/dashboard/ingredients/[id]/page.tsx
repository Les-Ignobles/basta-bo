"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Ingredient, Recipe, IngredientCategory } from '@/features/cooking/types'
import { DISH_TYPE_LABELS } from '@/features/cooking/types'
import { IngredientForm, type IngredientFormValues } from '@/features/cooking/components/ingredient-form'
import { useCookingStore } from '@/features/cooking/store'

const FORM_ID = 'ingredient-edit-form'

export default function IngredientDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const ingredientId = Number(params.id)
    const returnPage = searchParams.get('returnPage')

    const [ingredient, setIngredient] = useState<Ingredient | null>(null)
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [categories, setCategories] = useState<IngredientCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [navigation, setNavigation] = useState<{ previous: number | null; next: number | null } | null>(null)

    const { updateIngredient } = useCookingStore()

    useEffect(() => {
        async function fetchData() {
            if (isNaN(ingredientId)) {
                setError('ID ingrédient invalide')
                setLoading(false)
                return
            }

            try {
                setLoading(true)

                // Construire les paramètres de filtrage depuis l'URL pour la navigation contextuelle
                const navParams = new URLSearchParams()
                const search = searchParams.get('search')
                const noImage = searchParams.get('noImage')
                const categoriesParam = searchParams.get('categories')
                const translationFilter = searchParams.get('translationFilter')

                if (search) navParams.set('search', search)
                if (noImage) navParams.set('noImage', noImage)
                if (categoriesParam) navParams.set('categories', categoriesParam)
                if (translationFilter) navParams.set('translationFilter', translationFilter)

                const navigationUrl = navParams.toString()
                    ? `/api/ingredients/${ingredientId}/navigation?${navParams.toString()}`
                    : `/api/ingredients/${ingredientId}/navigation`

                // Fetch ingredient, recipes, categories and navigation in parallel
                const [ingredientRes, categoriesRes, navigationRes] = await Promise.all([
                    fetch(`/api/ingredients/${ingredientId}`),
                    fetch('/api/ingredient-categories'),
                    fetch(navigationUrl)
                ])

                if (!ingredientRes.ok) {
                    throw new Error('Ingrédient introuvable')
                }

                const ingredientData = await ingredientRes.json()
                setIngredient(ingredientData.data.ingredient)
                setRecipes(ingredientData.data.recipes)

                const categoriesData = await categoriesRes.json()
                setCategories(categoriesData.data ?? [])

                if (navigationRes.ok) {
                    const navigationData = await navigationRes.json()
                    setNavigation(navigationData.data)
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Erreur de chargement')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [ingredientId, searchParams])

    const getCategoryLabel = (categoryId: number | null) => {
        if (!categoryId) return 'Aucune catégorie'
        const category = categories.find(c => Number(c.id) === Number(categoryId))
        if (!category) return `Catégorie ${categoryId}`
        return `${category.emoji ?? ''} ${category.title?.fr ?? ''}`.trim()
    }

    async function handleSubmit(values: IngredientFormValues) {
        if (!values.id) return
        setSubmitting(true)
        try {
            await updateIngredient(values.id, {
                name: values.name,
                suffix_singular: values.suffix_singular,
                suffix_plural: values.suffix_plural,
                img_path: values.img_path ?? null,
                category_id: values.category_id ?? null,
                is_basic: values.is_basic,
                calories_per_100g: values.calories_per_100g ?? null,
                proteins_per_100g: values.proteins_per_100g ?? null,
                fats_per_100g: values.fats_per_100g ?? null,
                carbs_per_100g: values.carbs_per_100g ?? null,
                price_per_100g: values.price_per_100g ?? null,
            })

            // Reload ingredient data so the page reflects the latest persisted state
            const ingredientRes = await fetch(`/api/ingredients/${ingredientId}`)
            if (ingredientRes.ok) {
                const ingredientData = await ingredientRes.json()
                setIngredient(ingredientData.data.ingredient)
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
                        <span>Chargement de l&apos;ingrédient...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !ingredient) {
        return (
            <div className="container mx-auto py-6">
                <Button variant="ghost" onClick={() => {
                    const targetPage = returnPage ? `?page=${returnPage}` : ''
                    router.push(`/dashboard/ingredients${targetPage}`)
                }}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux ingrédients
                </Button>
                <Card className="mt-4">
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">
                            {error || 'Ingrédient introuvable'}
                        </p>
                    </CardContent>
                </Card>
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
                                router.push(`/dashboard/ingredients${targetPage}`)
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
                                        router.push(`/dashboard/ingredients/${navigation.previous}?${searchParams.toString()}`)
                                    }
                                }}
                                disabled={!navigation?.previous}
                                title="Ingrédient précédent"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (navigation?.next) {
                                        router.push(`/dashboard/ingredients/${navigation.next}?${searchParams.toString()}`)
                                    }
                                }}
                                disabled={!navigation?.next}
                                title="Ingrédient suivant"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold font-christmas">
                                {ingredient.name?.fr || 'Sans nom'}
                            </h1>
                            <Badge variant="secondary">
                                {getCategoryLabel(ingredient.category_id)}
                            </Badge>
                            {ingredient.is_basic && (
                                <Badge variant="outline">Ingrédient de base</Badge>
                            )}
                        </div>
                    </div>
                    <Button
                        type="submit"
                        form={FORM_ID}
                        disabled={submitting}
                        className="flex items-center gap-2"
                    >
                        {submitting ? 'Mise à jour...' : 'Enregistrer'}
                    </Button>
                </div>
            </div>

            {/* Formulaire d'édition (toujours rendu) */}
            <div className="bg-white rounded-lg border p-6">
                <IngredientForm
                    onSubmit={handleSubmit}
                    defaultValues={ingredient}
                    categories={categories.map((c) => ({ id: Number(c.id), label: `${c.emoji ?? ''} ${c.title?.fr ?? ''}`.trim() }))}
                    formId={FORM_ID}
                    submittingLabel="Mise à jour..."
                />
            </div>

            {/* Recettes utilisant cet ingrédient */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-christmas">Recettes utilisant cet ingrédient</CardTitle>
                    <CardDescription>
                        {recipes.length} recette{recipes.length > 1 ? 's' : ''} trouvée{recipes.length > 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recipes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            Aucune recette ne contient cet ingrédient pour le moment.
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {recipes.map((recipe) => (
                                <Card key={recipe.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/recipes/edit/${recipe.id}`)}>
                                    {recipe.img_path && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={recipe.img_path}
                                            alt={recipe.title}
                                            className="h-32 w-full object-cover"
                                        />
                                    )}
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base line-clamp-2">
                                            {recipe.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {DISH_TYPE_LABELS[recipe.dish_type]}
                                            </Badge>
                                            {recipe.is_folklore && (
                                                <Badge variant="outline" className="text-xs">
                                                    Folklore
                                                </Badge>
                                            )}
                                            {!recipe.is_visible && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Non visible
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
