"use client"
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RecipeSelector } from '@/features/cooking/components/recipe-selector'
import type { Recipe } from '@/features/cooking/types'
import { Sparkles, X, EyeOff, Info, Loader2, Trash2 } from 'lucide-react'

export default function NewRecipesPopupPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [clearDialogOpen, setClearDialogOpen] = useState(false)
    const [clearing, setClearing] = useState(false)

    const fetchWave = useCallback(async () => {
        try {
            const response = await fetch('/api/recipes?isNew=true&pageSize=200')
            const { data } = await response.json()
            setRecipes(data || [])
        } catch (error) {
            console.error('Error fetching new recipes wave:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchWave()
    }, [fetchWave])

    const setIsNew = async (recipeId: number, isNew: boolean) => {
        await fetch('/api/recipes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: recipeId, is_new: isNew }),
        })
    }

    const handleAdd = async (recipeId: number) => {
        await setIsNew(recipeId, true)
        await fetchWave()
    }

    const handleAddMultiple = async (recipeIds: number[]) => {
        await Promise.all(recipeIds.map(id => setIsNew(id, true)))
        await fetchWave()
    }

    const handleRemove = async (recipeId: number) => {
        setRecipes(prev => prev.filter(r => Number(r.id) !== recipeId))
        await setIsNew(recipeId, false)
        fetchWave()
    }

    const handleClearWave = async () => {
        setClearing(true)
        try {
            await Promise.all(recipes.map(r => setIsNew(Number(r.id), false)))
            await fetchWave()
        } finally {
            setClearing(false)
            setClearDialogOpen(false)
        }
    }

    const hiddenCount = recipes.filter(r => !r.is_visible).length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-semibold font-christmas">Popup nouveautés</h1>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {recipes.length} recette{recipes.length > 1 ? 's' : ''} dans la vague
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    {recipes.length > 0 && (
                        <Button variant="outline" onClick={() => setClearDialogOpen(true)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Vider la vague
                        </Button>
                    )}
                    <RecipeSelector
                        excludeRecipeIds={recipes.map(r => Number(r.id))}
                        onSelect={handleAdd}
                        multiple
                        onSelectMultiple={handleAddMultiple}
                    />
                </div>
            </div>

            <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                    Les recettes listées ici apparaissent dans la popup « Nouvelles recettes ajoutées ! » de
                    l&apos;app. Toute modification de cette liste change la clé de vague : la popup se
                    réaffichera <strong>une fois</strong> à tous les utilisateurs. Videz la vague pour
                    désactiver la popup.
                </p>
            </div>

            {hiddenCount > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    <EyeOff className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                        {hiddenCount} recette{hiddenCount > 1 ? 's' : ''} de la vague {hiddenCount > 1 ? 'sont cachées' : 'est cachée'} (non
                        visible{hiddenCount > 1 ? 's' : ''}) : elle{hiddenCount > 1 ? 's' : ''} n&apos;apparaîtr{hiddenCount > 1 ? 'ont' : 'a'} pas dans la popup.
                    </p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Chargement de la vague...</span>
                </div>
            ) : recipes.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <Sparkles className="h-8 w-8" />
                    <p>Aucune recette dans la vague — la popup est désactivée.</p>
                    <p className="text-sm">Ajoutez des recettes avec le bouton ci-dessus.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {recipes.map(recipe => (
                        <Card key={recipe.id} className="overflow-hidden py-0">
                            <CardContent className="p-0">
                                <div className="relative">
                                    {recipe.img_path ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={recipe.img_path}
                                            alt={recipe.title}
                                            className="h-36 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-36 w-full bg-muted" />
                                    )}
                                    <button
                                        title="Retirer de la vague"
                                        onClick={() => handleRemove(Number(recipe.id))}
                                        className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    {!recipe.is_visible && (
                                        <Badge
                                            variant="secondary"
                                            className="absolute bottom-2 left-2 flex items-center gap-1 bg-amber-100 text-amber-800"
                                        >
                                            <EyeOff className="h-3 w-3" />
                                            Cachée
                                        </Badge>
                                    )}
                                </div>
                                <div className="p-3">
                                    <Link
                                        href={`/dashboard/recipes/edit/${recipe.id}`}
                                        className="font-medium text-sm line-clamp-2 hover:underline"
                                    >
                                        {recipe.title}
                                    </Link>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Créée le {new Date(recipe.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Vider la vague de nouveautés</AlertDialogTitle>
                        <AlertDialogDescription>
                            Les {recipes.length} recette{recipes.length > 1 ? 's' : ''} ne seront plus marquées comme
                            nouveautés et la popup sera désactivée dans l&apos;app. Les recettes elles-mêmes ne sont pas
                            supprimées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={clearing}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearWave} disabled={clearing}>
                            {clearing ? 'Suppression...' : 'Vider la vague'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
