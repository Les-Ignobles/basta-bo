"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl font-semibold font-christmas">Chargement...</h1>
                </div>
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/recipe-categories')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{category.emoji}</span>
                        <div>
                            <h1 className="text-xl font-semibold font-christmas">{category.name.fr}</h1>
                            <p className="text-sm text-muted-foreground">
                                {recipes.length} recette{recipes.length > 1 ? 's' : ''} · Glissez-déposez pour réordonner
                            </p>
                        </div>
                    </div>
                </div>

                <RecipeSelector
                    excludeRecipeIds={recipes.map(r => r.id)}
                    onSelect={handleAddRecipe}
                />
            </div>

            <div
                className="p-1 rounded-lg"
                style={{ backgroundColor: `${category.color}20` }}
            >
                <div className="bg-background rounded-md p-4">
                    <RecipeOrderList
                        recipes={recipes}
                        onOrderChange={handleOrderChange}
                    />
                </div>
            </div>
        </div>
    )
}
