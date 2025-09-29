"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RecipeForm, type RecipeFormValues } from '@/features/cooking/components/recipe-form'
import { useRecipeStore } from '@/features/cooking/stores/recipe-store'
import { RecipesTable } from '@/features/cooking/components/recipes-table'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

export default function RecipesIndexPage() {
    const [open, setOpen] = useState(false)
    const { fetchRecipes, fetchKitchenEquipments, recipes, kitchenEquipments, createRecipe, updateRecipe, loading, setSearch, setPage, page, pageSize, total, setNoImage, noImage } = useRecipeStore()

    useEffect(() => {
        fetchKitchenEquipments()
    }, [fetchKitchenEquipments])

    useEffect(() => {
        fetchRecipes()
    }, [fetchRecipes, page, noImage])

    const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / (pageSize || 10))), [total, pageSize])

    // debounce search
    const [searchInput, setSearchInput] = useState('')
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput)
            setPage(1)
            fetchRecipes()
        }, 400)
        return () => clearTimeout(t)
    }, [searchInput, setSearch, fetchRecipes, setPage])

    async function handleSubmit(values: RecipeFormValues) {
        if (values.id) {
            // Update existing recipe
            await updateRecipe(values.id, {
                title: values.title,
                ingredients_name: values.ingredients_name,
                img_path: values.img_path ?? null,
                seasonality_mask: values.seasonality_mask ?? null,
                kitchen_equipments_mask: values.kitchen_equipments_mask ?? null,
                instructions: values.instructions ?? null,
            } as any)
        } else {
            // Create new recipe
            await createRecipe({
                title: values.title,
                ingredients_name: values.ingredients_name,
                img_path: values.img_path ?? null,
                seasonality_mask: values.seasonality_mask ?? null,
                kitchen_equipments_mask: values.kitchen_equipments_mask ?? null,
                instructions: values.instructions ?? null,
            } as any)
        }
        setOpen(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Recettes</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={loading} onClick={() => {
                            if (typeof window !== 'undefined') {
                                (window as any).__editRecipe = undefined; // Clear edit state
                            }
                        }}>Nouvelle recette</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-w-[95vw] w-full">
                        <DialogHeader>
                            <DialogTitle>{(typeof window !== 'undefined' && (window as any).__editRecipe) ? 'Modifier la recette' : 'Nouvelle recette'}</DialogTitle>
                        </DialogHeader>
                        <RecipeForm
                            onSubmit={handleSubmit}
                            defaultValues={(typeof window !== 'undefined' && (window as any).__editRecipe) || undefined}
                            kitchenEquipments={kitchenEquipments}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex items-center justify-between py-2 gap-4 sticky top-0 z-10 bg-background border-b">
                <div className="flex items-center gap-3">
                    <Input
                        placeholder="Rechercher par titre..."
                        className="w-80"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                        <Checkbox checked={noImage} onCheckedChange={(v) => { setNoImage(Boolean(v)); setPage(1); fetchRecipes(); }} />
                        Sans image
                    </label>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        Précédent
                    </Button>
                    <span className="text-muted-foreground">
                        Page {page} / {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        Suivant
                    </Button>
                </div>
            </div>
            <RecipesTable
                recipes={recipes as any}
                loading={loading}
                onEdit={(recipe) => {
                    ; (window as any).__editRecipe = recipe
                    setOpen(true)
                }}
                onDelete={async (recipe) => {
                    await (useRecipeStore.getState().deleteRecipe)(Number(recipe.id))
                }}
            />
        </div>
    )
}
