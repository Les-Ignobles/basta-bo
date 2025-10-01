"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { RecipeForm } from '@/features/cooking/components/recipe-form'
import type { RecipeFormValues, Recipe } from '@/features/cooking/types'
import { DishType, DISH_TYPE_LABELS } from '@/features/cooking/types'
import { useRecipeStore } from '@/features/cooking/stores/recipe-store'
import { RecipesTable } from '@/features/cooking/components/recipes-table'
import { BulkActionsBar } from '@/features/cooking/components/bulk-actions-bar'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function RecipesIndexPage() {
    const [open, setOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
    const {
        fetchRecipes,
        fetchKitchenEquipments,
        recipes,
        kitchenEquipments,
        createRecipe,
        updateRecipe,
        deleteRecipe, 
        bulkDeleteRecipes,
        bulkUpdateDishType,
        bulkUpdateSeasonality,
        loading,
        editingRecipe,
        selectedRecipes,
        toggleRecipeSelection,
        selectAllRecipes,
        clearSelection,
        setSearch,
        setPage,
        page,
        pageSize,
        total,
        setNoImage,
        noImage,
        setDishType,
        dishType,
        setEditingRecipe
    } = useRecipeStore()
    // Plus besoin de charger tous les ingrédients, la recherche se fait côté serveur

    useEffect(() => {
        fetchKitchenEquipments()
    }, [fetchKitchenEquipments])

    useEffect(() => {
        fetchRecipes()
    }, [fetchRecipes, page, noImage, dishType])

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
                dish_type: values.dish_type,
            })
        } else {
            // Create new recipe
            await createRecipe({
                title: values.title,
                ingredients_name: values.ingredients_name,
                img_path: values.img_path ?? null,
                seasonality_mask: values.seasonality_mask ?? null,
                kitchen_equipments_mask: values.kitchen_equipments_mask ?? null,
                instructions: values.instructions ?? null,
                dish_type: values.dish_type,
            })
        }
        setOpen(false)
    }

    const handleSelectRecipe = (recipeId: number, selected: boolean) => {
        toggleRecipeSelection(recipeId)
    }

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            selectAllRecipes()
        } else {
            clearSelection()
        }
    }

    const handleBulkDelete = async () => {
        setBulkDeleteDialogOpen(true)
    }

    const confirmBulkDelete = async () => {
        await bulkDeleteRecipes(selectedRecipes)
        setBulkDeleteDialogOpen(false)
    }

    const handleDeleteRecipe = (recipe: Recipe) => {
        setRecipeToDelete(recipe)
        setDeleteDialogOpen(true)
    }

    const confirmDeleteRecipe = async () => {
        if (recipeToDelete) {
            await deleteRecipe(Number(recipeToDelete.id))
            setDeleteDialogOpen(false)
            setRecipeToDelete(null)
        }
    }

    const handleBulkUpdateDishType = async (dishType: DishType) => {
        await bulkUpdateDishType(selectedRecipes, dishType)
    }

    const handleBulkUpdateSeasonality = async (mask: number) => {
        await bulkUpdateSeasonality(selectedRecipes, mask)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold font-christmas">Recettes</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={loading} onClick={() => {
                            setEditingRecipe(null) // Clear edit state
                        }}>Nouvelle recette</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-w-[95vw] w-full">
                        <DialogHeader>
                            <DialogTitle className="font-christmas">{editingRecipe ? 'Modifier la recette' : 'Nouvelle recette'}</DialogTitle>
                        </DialogHeader>
                        <RecipeForm
                            onSubmit={handleSubmit}
                            defaultValues={editingRecipe || undefined}
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
                    <Select
                        value={dishType.toString()}
                        onValueChange={(value) => {
                            setDishType(value as DishType | 'all')
                            fetchRecipes()
                        }}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Type de plat" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            {Object.entries(DISH_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
            {selectedRecipes.length > 0 && (
                <BulkActionsBar
                    selectedCount={selectedRecipes.length}
                    onClearSelection={clearSelection}
                    onBulkDelete={handleBulkDelete}
                    onBulkUpdateDishType={handleBulkUpdateDishType}
                    onBulkUpdateSeasonality={handleBulkUpdateSeasonality}
                />
            )}
            <RecipesTable
                recipes={recipes}
                loading={loading}
                selectedRecipes={selectedRecipes}
                onSelectRecipe={handleSelectRecipe}
                onSelectAll={handleSelectAll}
                onEdit={(recipe) => {
                    setEditingRecipe(recipe)
                    setOpen(true)
                }}
                onDelete={handleDeleteRecipe}
            />

            {/* Modal de confirmation pour suppression individuelle */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la recette <strong>&quot;{recipeToDelete?.title}&quot;</strong> ?
                            <br />
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteRecipe}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal de confirmation pour suppression en masse */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression en masse</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{selectedRecipes.length} recette(s)</strong> ?
                            <br />
                            Cette action est irréversible et supprimera toutes les recettes sélectionnées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBulkDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer {selectedRecipes.length} recette(s)
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
