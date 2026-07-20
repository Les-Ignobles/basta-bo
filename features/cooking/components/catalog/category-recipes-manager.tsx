"use client"
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle, Loader2, UtensilsCrossed } from 'lucide-react'
import { RecipeOrderList } from '@/features/cooking/components/recipe-order-list'
import { RecipeSelector } from '@/features/cooking/components/recipe-selector'
import type { RecipeOrderItem } from '@/features/cooking/types/recipe-category'
import type { Diet } from '@/features/cooking/types/diet'
import type { Allergy } from '@/features/cooking/types/allergy'

type Props = {
    categoryId: number
    categoryColor: string
}

/**
 * Gestion du contenu d'une catégorie statique : ajout (multi-sélection),
 * ordre (drag & drop) et retrait des recettes, avec badges de compatibilité.
 */
export function CategoryRecipesManager({ categoryId, categoryColor }: Props) {
    const [recipes, setRecipes] = useState<RecipeOrderItem[]>([])
    const [diets, setDiets] = useState<Diet[]>([])
    const [allergies, setAllergies] = useState<Allergy[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const [recipesRes, dietsRes, allergiesRes] = await Promise.all([
                    fetch(`/api/recipe-categories/${categoryId}/recipes`),
                    fetch('/api/diets'),
                    fetch('/api/allergies'),
                ])
                const { data: recipesData } = await recipesRes.json()
                setRecipes(recipesData || [])
                setDiets((await dietsRes.json()).data || [])
                setAllergies((await allergiesRes.json()).data || [])
            } catch (err) {
                console.error('Error fetching category recipes:', err)
            } finally {
                setLoading(false)
            }
        }
        if (categoryId) fetchData()
    }, [categoryId])

    const handleOrderChange = async (recipeIds: number[]) => {
        try {
            const response = await fetch(`/api/recipe-categories/${categoryId}/recipes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipe_ids: recipeIds }),
            })
            const { data, error } = await response.json()
            if (error) throw new Error(error)
            setRecipes(data)
        } catch (err) {
            console.error('Error updating order:', err)
        }
    }

    const addRecipe = async (recipeId: number) => {
        const response = await fetch(`/api/recipe-categories/${categoryId}/recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipe_id: recipeId }),
        })
        const { data, error } = await response.json()
        if (error) throw new Error(error)
        return data as RecipeOrderItem
    }

    const handleAddRecipe = async (recipeId: number) => {
        const added = await addRecipe(recipeId)
        setRecipes(prev => [...prev, added])
    }

    const handleAddMultiple = async (recipeIds: number[]) => {
        // Séquentiel : la position est calculée côté serveur (max + 1),
        // des POST concurrents produiraient des doublons de position
        const added: RecipeOrderItem[] = []
        for (const recipeId of recipeIds) {
            added.push(await addRecipe(recipeId))
        }
        setRecipes(prev => [...prev, ...added])
    }

    const handleRemoveRecipe = async (recipeId: number) => {
        const response = await fetch(`/api/recipe-categories/${categoryId}/recipes/${recipeId}`, {
            method: 'DELETE',
        })
        if (!response.ok) {
            const { error } = await response.json()
            throw new Error(error || 'Erreur lors de la suppression')
        }
        setRecipes(prev => prev.filter(r => r.id !== recipeId))
    }

    return (
        <TooltipProvider>
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
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                    <p className="font-medium mb-1">Comment ça fonctionne ?</p>
                                    <ul className="text-xs space-y-1">
                                        <li><strong>Ajouter :</strong> Sélection multiple possible</li>
                                        <li><strong>Réordonner :</strong> Glissez-déposez les recettes</li>
                                        <li><strong>Retirer :</strong> Cliquez sur la corbeille</li>
                                        <li>Les badges indiquent pour quels profils chaque recette sera (in)visible</li>
                                    </ul>
                                </TooltipContent>
                            </Tooltip>
                            <RecipeSelector
                                excludeRecipeIds={recipes.map(r => r.id)}
                                onSelect={handleAddRecipe}
                                multiple
                                onSelectMultiple={handleAddMultiple}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="p-1 rounded-lg" style={{ backgroundColor: `${categoryColor}15` }}>
                            <div className="bg-background rounded-md p-4">
                                <RecipeOrderList
                                    recipes={recipes}
                                    onOrderChange={handleOrderChange}
                                    onRemove={handleRemoveRecipe}
                                    diets={diets}
                                    allergies={allergies}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}
