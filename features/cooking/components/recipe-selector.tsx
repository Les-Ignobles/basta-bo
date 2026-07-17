"use client"
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Loader2 } from 'lucide-react'
import type { Recipe } from '@/features/cooking/types'

type Props = {
    excludeRecipeIds: number[]
    onSelect: (recipeId: number) => Promise<void>
    disabled?: boolean
    /** Mode multi-sélection : coche des recettes puis validation en une fois via onSelectMultiple */
    multiple?: boolean
    onSelectMultiple?: (recipeIds: number[]) => Promise<void>
}

export function RecipeSelector({ excludeRecipeIds, onSelect, disabled = false, multiple = false, onSelectMultiple }: Props) {
    const [open, setOpen] = useState(false)
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [adding, setAdding] = useState<number | null>(null)
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [submitting, setSubmitting] = useState(false)

    // Fetch recipes when dialog opens
    useEffect(() => {
        if (open) {
            fetchRecipes()
        }
    }, [open])

    const fetchRecipes = async () => {
        try {
            setLoading(true)
            // Fetch a good amount of recipes for selection
            const response = await fetch('/api/recipes?pageSize=200')
            const { data } = await response.json()
            setRecipes(data || [])
        } catch (error) {
            console.error('Error fetching recipes:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter recipes: exclude already-in-category and apply search
    const filteredRecipes = useMemo(() => {
        const excludeSet = new Set(excludeRecipeIds)
        return recipes
            .filter(recipe => !excludeSet.has(recipe.id))
            .filter(recipe =>
                search === '' ||
                recipe.title.toLowerCase().includes(search.toLowerCase())
            )
    }, [recipes, excludeRecipeIds, search])

    const handleSelect = async (recipeId: number) => {
        if (multiple) {
            setSelectedIds(prev =>
                prev.includes(recipeId)
                    ? prev.filter(id => id !== recipeId)
                    : [...prev, recipeId]
            )
            return
        }

        try {
            setAdding(recipeId)
            await onSelect(recipeId)
            setOpen(false)
            setSearch('')
        } catch (error) {
            console.error('Error adding recipe:', error)
        } finally {
            setAdding(null)
        }
    }

    const handleSubmitMultiple = async () => {
        if (selectedIds.length === 0 || !onSelectMultiple) return
        try {
            setSubmitting(true)
            await onSelectMultiple(selectedIds)
            setOpen(false)
            setSearch('')
            setSelectedIds([])
        } catch (error) {
            console.error('Error adding recipes:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setSelectedIds([])
            setSearch('')
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une recette
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-christmas">Ajouter une recette</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une recette..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px] border rounded-md">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredRecipes.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            {search ? 'Aucune recette trouvée' : 'Toutes les recettes sont déjà dans cette catégorie'}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredRecipes.map((recipe) => {
                                const isChecked = selectedIds.includes(recipe.id)
                                return (
                                    <button
                                        key={recipe.id}
                                        type="button"
                                        onClick={() => handleSelect(recipe.id)}
                                        disabled={adding !== null || submitting}
                                        className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left disabled:opacity-50 ${multiple && isChecked ? 'bg-muted/50' : ''}`}
                                    >
                                        {multiple && (
                                            <Checkbox checked={isChecked} className="pointer-events-none" />
                                        )}
                                        {recipe.img_path ? (
                                            <img
                                                src={recipe.img_path}
                                                alt={recipe.title}
                                                className="w-10 h-10 object-cover rounded-md"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs">
                                                ?
                                            </div>
                                        )}
                                        <span className="flex-1 font-medium truncate">{recipe.title}</span>
                                        {adding === recipe.id && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''} disponible{filteredRecipes.length > 1 ? 's' : ''}
                    </span>
                    {multiple && (
                        <Button
                            onClick={handleSubmitMultiple}
                            disabled={selectedIds.length === 0 || submitting}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            Ajouter ({selectedIds.length})
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
