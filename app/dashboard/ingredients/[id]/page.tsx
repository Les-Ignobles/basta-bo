"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, ChefHat, Loader2, Pencil } from 'lucide-react'
import type { Ingredient, Recipe, IngredientCategory } from '@/features/cooking/types'
import { DISH_TYPE_LABELS } from '@/features/cooking/types'
import { IngredientForm, type IngredientFormValues } from '@/features/cooking/components/ingredient-form'
import { useCookingStore } from '@/features/cooking/store'

export default function IngredientDetailPage() {
    const params = useParams()
    const router = useRouter()
    const ingredientId = Number(params.id)

    const [ingredient, setIngredient] = useState<Ingredient | null>(null)
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [categories, setCategories] = useState<IngredientCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

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

                // Fetch ingredient and recipes
                const ingredientRes = await fetch(`/api/ingredients/${ingredientId}`)
                if (!ingredientRes.ok) {
                    throw new Error('Ingrédient introuvable')
                }
                const ingredientData = await ingredientRes.json()
                setIngredient(ingredientData.data.ingredient)
                setRecipes(ingredientData.data.recipes)

                // Fetch categories
                const categoriesRes = await fetch('/api/ingredient-categories')
                const categoriesData = await categoriesRes.json()
                setCategories(categoriesData.data ?? [])
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Erreur de chargement')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [ingredientId])

    const getCategoryLabel = (categoryId: number | null) => {
        if (!categoryId) return 'Aucune catégorie'
        const category = categories.find(c => Number(c.id) === Number(categoryId))
        if (!category) return `Catégorie ${categoryId}`
        return `${category.emoji ?? ''} ${category.title?.fr ?? ''}`.trim()
    }

    async function handleSubmit(values: IngredientFormValues) {
        if (!values.id) return

        await updateIngredient(values.id, {
            name: values.name,
            suffix_singular: values.suffix_singular,
            suffix_plural: values.suffix_plural,
            img_path: values.img_path ?? null,
            category_id: values.category_id ?? null,
            is_basic: values.is_basic,
        })

        setEditDialogOpen(false)

        // Reload ingredient data
        const ingredientRes = await fetch(`/api/ingredients/${ingredientId}`)
        if (ingredientRes.ok) {
            const ingredientData = await ingredientRes.json()
            setIngredient(ingredientData.data.ingredient)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Chargement...</span>
                </div>
            </div>
        )
    }

    if (error || !ingredient) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.push('/dashboard/ingredients')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux ingrédients
                </Button>
                <Card>
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.push('/dashboard/ingredients')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux ingrédients
                </Button>
                <Button onClick={() => setEditDialogOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Éditer l&apos;ingrédient
                </Button>
            </div>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-w-[95vw] w-full">
                    <DialogHeader>
                        <DialogTitle className="font-christmas">Modifier l&apos;ingrédient</DialogTitle>
                    </DialogHeader>
                    <IngredientForm
                        onSubmit={handleSubmit}
                        defaultValues={ingredient || undefined}
                        categories={categories.map((c) => ({ id: Number(c.id), label: `${c.emoji ?? ''} ${c.title?.fr ?? ''}`.trim() }))}
                    />
                </DialogContent>
            </Dialog>

            {/* Ingredient Details Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        {ingredient.img_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={ingredient.img_path}
                                alt={ingredient.name?.fr ?? ''}
                                className="h-24 w-24 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
                                <ChefHat className="h-12 w-12 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1">
                            <CardTitle className="text-2xl font-christmas mb-2">
                                {ingredient.name?.fr ?? 'Sans nom'}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">
                                    {getCategoryLabel(ingredient.category_id)}
                                </Badge>
                                {ingredient.is_basic && (
                                    <Badge variant="outline">
                                        Ingrédient de base
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Singulier:</span>
                            <span className="ml-2">{ingredient.suffix_singular?.fr ?? '-'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Pluriel:</span>
                            <span className="ml-2">{ingredient.suffix_plural?.fr ?? '-'}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">ID:</span>
                            <span className="ml-2">{ingredient.id}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Créé le:</span>
                            <span className="ml-2">{new Date(ingredient.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recipes List Card */}
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
