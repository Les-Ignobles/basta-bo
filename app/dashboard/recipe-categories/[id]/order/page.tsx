"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeft, HelpCircle, UtensilsCrossed, Loader2 } from 'lucide-react'
import { RecipeOrderList } from '@/features/cooking/components/recipe-order-list'
import { RecipeSelector } from '@/features/cooking/components/recipe-selector'
import type { RecipeCategory, RecipeOrderItem } from '@/features/cooking/types/recipe-category'

export default function RecipeCategoryOrderPage() {
    const params = useParams()
    const router = useRouter()
    const categoryId = Number(params.id)

    const [category, setCategory] = useState<RecipeCategory | null>(null)
    const [recipes, setRecipes] = useState<RecipeOrderItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                setError(null)

                // Fetch category info
                const categoryRes = await fetch('/api/recipe-categories')
                const { data: categories } = await categoryRes.json()
                const found = categories?.find((c: RecipeCategory) => c.id === categoryId)
                setCategory(found || null)

                // Fetch recipes for this category
                const recipesRes = await fetch(`/api/recipe-categories/${categoryId}/recipes`)
                const { data: recipesData, error: recipesError } = await recipesRes.json()

                if (recipesError) {
                    throw new Error(recipesError)
                }

                setRecipes(recipesData || [])
            } catch (err) {
                console.error('Error fetching data:', err)
                setError('Erreur lors du chargement des données')
            } finally {
                setLoading(false)
            }
        }

        if (categoryId) {
            fetchData()
        }
    }, [categoryId])

    const handleOrderChange = async (recipeIds: number[]) => {
        try {
            const response = await fetch(`/api/recipe-categories/${categoryId}/recipes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipe_ids: recipeIds }),
            })

            const { data, error } = await response.json()
            if (error) {
                throw new Error(error)
            }

            // Update local state with new order
            setRecipes(data)
        } catch (err) {
            console.error('Error updating order:', err)
        }
    }

    const handleAddRecipe = async (recipeId: number) => {
        try {
            const response = await fetch(`/api/recipe-categories/${categoryId}/recipes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipe_id: recipeId }),
            })

            const { data, error } = await response.json()
            if (error) {
                throw new Error(error)
            }

            // Add the new recipe to the list
            setRecipes(prev => [...prev, data])
        } catch (err) {
            console.error('Error adding recipe:', err)
            throw err // Re-throw to let the selector know it failed
        }
    }

    const handleRemoveRecipe = async (recipeId: number) => {
        const response = await fetch(`/api/recipe-categories/${categoryId}/recipes/${recipeId}`, {
            method: 'DELETE',
        })

        if (!response.ok) {
            const { error } = await response.json()
            throw new Error(error || 'Erreur lors de la suppression')
        }

        // Update local state (recipe count in subtitle)
        setRecipes(prev => prev.filter(r => r.id !== recipeId))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !category) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl font-semibold font-christmas text-destructive">
                        {error || 'Catégorie non trouvée'}
                    </h1>
                </div>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/recipe-categories')}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Retour aux catégories</p>
                            </TooltipContent>
                        </Tooltip>

                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                style={{ backgroundColor: category.color + '20' }}
                            >
                                {category.emoji}
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold font-christmas">{category.name.fr}</h1>
                                <p className="text-sm text-muted-foreground">
                                    Gérer les recettes de cette catégorie
                                </p>
                            </div>
                        </div>
                    </div>

                    <RecipeSelector
                        excludeRecipeIds={recipes.map(r => r.id)}
                        onSelect={handleAddRecipe}
                    />
                </div>

                {/* Main content */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <UtensilsCrossed className="h-4 w-4" />
                                    Recettes de la catégorie
                                    <Badge variant="secondary" className="ml-2">
                                        {recipes.length} recette{recipes.length > 1 ? 's' : ''}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Les recettes seront affichées dans cet ordre
                                </CardDescription>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                    <p className="font-medium mb-1">Comment ça fonctionne ?</p>
                                    <ul className="text-xs space-y-1">
                                        <li><strong>Ajouter :</strong> Cliquez sur le bouton en haut à droite</li>
                                        <li><strong>Réordonner :</strong> Glissez-déposez les recettes</li>
                                        <li><strong>Retirer :</strong> Cliquez sur la corbeille</li>
                                    </ul>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="p-1 rounded-lg"
                            style={{ backgroundColor: `${category.color}15` }}
                        >
                            <div className="bg-background rounded-md p-4">
                                <RecipeOrderList
                                    recipes={recipes}
                                    onOrderChange={handleOrderChange}
                                    onRemove={handleRemoveRecipe}
                                />
                            </div>
                        </div>

                        {recipes.length === 0 && (
                            <div className="text-center py-8 mt-4 border-2 border-dashed rounded-lg">
                                <UtensilsCrossed className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground mb-3">
                                    Aucune recette dans cette catégorie
                                </p>
                                <RecipeSelector
                                    excludeRecipeIds={[]}
                                    onSelect={handleAddRecipe}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    )
}
