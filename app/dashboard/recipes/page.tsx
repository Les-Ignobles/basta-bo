"use client"
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import type { Recipe } from '@/features/cooking/types'
import { DishType, DISH_TYPE_LABELS, QuantificationType, QUANTIFICATION_TYPE_LABELS } from '@/features/cooking/types'
import { useRecipeStore } from '@/features/cooking/stores/recipe-store'
import { RecipesTable } from '@/features/cooking/components/recipes-table'
import { BulkActionsBar } from '@/features/cooking/components/bulk-actions-bar'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BookOpen, Utensils, Users, Hash, ImageOff, ChefHat, Scale, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function RecipesIndexPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
    const {
        fetchRecipes,
        fetchKitchenEquipments,
        fetchDiets,
        recipes,
        kitchenEquipments,
        diets,
        deleteRecipe,
        bulkDeleteRecipes,
        bulkUpdateDishType,
        bulkUpdateSeasonality,
        bulkUpdateDietMask,
        bulkUpdateKitchenEquipmentsMask,
        bulkUpdateVisibility,
        loading,
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
        selectedDiets,
        setSelectedDiets,
        selectedKitchenEquipments,
        setSelectedKitchenEquipments,
        quantificationType,
        setQuantificationType,
        isVisible,
        setIsVisible,
        isFolklore,
        setIsFolklore
    } = useRecipeStore()
    // Plus besoin de charger tous les ingrédients, la recherche se fait côté serveur
    const isInitialized = useRef(false)

    // Charger les données une seule fois au montage
    useEffect(() => {
        fetchKitchenEquipments()
        fetchDiets()
    }, [fetchKitchenEquipments, fetchDiets])

    // Synchroniser la page avec l'URL
    useEffect(() => {
        const pageParam = searchParams.get('page')
        if (pageParam && !isNaN(Number(pageParam))) {
            const pageNumber = Number(pageParam)
            if (pageNumber !== page) {
                setPage(pageNumber)
            }
        }
    }, [searchParams, page, setPage])

    // Fetch recipes quand les filtres changent (séparé de la synchronisation URL)
    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true
            return
        }
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


    const handleSelectRecipe = (recipeId: number) => {
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

    const handleBulkUpdateDietMask = async (mask: number) => {
        await bulkUpdateDietMask(selectedRecipes, mask)
    }

    const handleBulkUpdateKitchenEquipmentsMask = async (mask: number) => {
        await bulkUpdateKitchenEquipmentsMask(selectedRecipes, mask)
    }

    const handleBulkUpdateVisibility = async (isVisible: boolean) => {
        await bulkUpdateVisibility(selectedRecipes, isVisible)
    }

    const handleDuplicateRecipe = (recipe: Recipe) => {
        // Créer une copie de la recette sans l'ID pour la duplication
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...recipeWithoutId } = recipe
        const duplicatedRecipe = {
            ...recipeWithoutId,
            title: `${recipe.title} (copie)`, // Ajouter "(copie)" au titre
            created_at: new Date().toISOString(), // Nouvelle date de création
        }

        // Stocker la recette dupliquée dans sessionStorage pour la page de création
        sessionStorage.setItem('duplicatedRecipe', JSON.stringify(duplicatedRecipe))
        router.push(`/dashboard/recipes/new?returnPage=${page}`)
    }

    // Fonction pour mettre à jour l'URL avec la page actuelle
    const updateUrlWithPage = (newPage: number) => {
        // Éviter les mises à jour inutiles
        if (newPage === page) return

        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`/dashboard/recipes?${params.toString()}`, { scroll: false })
    }

    const handleDietToggle = (dietId: number) => {
        const newSelectedDiets = selectedDiets.includes(dietId)
            ? selectedDiets.filter(id => id !== dietId)
            : [...selectedDiets, dietId]
        setSelectedDiets(newSelectedDiets)
        setPage(1)
        fetchRecipes()
    }

    const handleKitchenEquipmentToggle = (equipmentId: number) => {
        const newSelectedEquipments = selectedKitchenEquipments.includes(equipmentId)
            ? selectedKitchenEquipments.filter(id => id !== equipmentId)
            : [...selectedKitchenEquipments, equipmentId]
        setSelectedKitchenEquipments(newSelectedEquipments)
        setPage(1)
        fetchRecipes()
    }

    return (
        <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-background border-b py-4">
                {/* Filtres sur une seule ligne avec flex-wrap intelligent */}
                <div className="flex items-center gap-3 flex-wrap">
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
                        <SelectTrigger className="w-[160px]">
                            <div className="flex items-center gap-2">
                                <ChefHat className="h-4 w-4" />
                                <SelectValue placeholder="Type de plat" />
                            </div>
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
                    <Select
                        value={quantificationType.toString()}
                        onValueChange={(value) => {
                            setQuantificationType(value as QuantificationType | 'all')
                            setPage(1)
                            fetchRecipes()
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <div className="flex items-center gap-2">
                                {quantificationType === 'all' ? (
                                    <Scale className="h-4 w-4" />
                                ) : quantificationType === QuantificationType.PER_PERSON ? (
                                    <Users className="h-4 w-4" />
                                ) : (
                                    <Hash className="h-4 w-4" />
                                )}
                                <SelectValue placeholder="Quantification" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            {Object.entries(QUANTIFICATION_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Utensils className="h-4 w-4" />
                                Régimes
                                {selectedDiets.length > 0 && (
                                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                        {selectedDiets.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Filtrer par régimes alimentaires</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {diets.map((diet) => (
                                        <label key={diet.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={selectedDiets.includes(diet.id)}
                                                onCheckedChange={() => handleDietToggle(diet.id)}
                                            />
                                            <span className="flex items-center gap-2">
                                                <span>{diet.emoji}</span>
                                                <span>{(diet.title as { fr?: string })?.fr || String(diet.title)}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {selectedDiets.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedDiets([])
                                            setPage(1)
                                            fetchRecipes()
                                        }}
                                        className="w-full"
                                    >
                                        Effacer les filtres
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Utensils className="h-4 w-4" />
                                Ustensiles
                                {selectedKitchenEquipments.length > 0 && (
                                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                        {selectedKitchenEquipments.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Filtrer par ustensiles de cuisine</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {kitchenEquipments.map((equipment) => (
                                        <label key={equipment.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={selectedKitchenEquipments.includes(equipment.id)}
                                                onCheckedChange={() => handleKitchenEquipmentToggle(equipment.id)}
                                            />
                                            <span className="flex items-center gap-2">
                                                <span>{equipment.emoji}</span>
                                                <span>{(equipment.name as { fr?: string })?.fr || String(equipment.name)}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {selectedKitchenEquipments.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedKitchenEquipments([])
                                            setPage(1)
                                            fetchRecipes()
                                        }}
                                        className="w-full"
                                    >
                                        Effacer les filtres
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                        <Checkbox checked={noImage} onCheckedChange={(v) => { setNoImage(Boolean(v)); setPage(1); fetchRecipes(); }} />
                        <ImageOff className="h-4 w-4" />
                        Sans image
                    </label>
                    <Select
                        value={isVisible === null ? 'all' : isVisible.toString()}
                        onValueChange={(value) => {
                            const newValue = value === 'all' ? null : value === 'true'
                            setIsVisible(newValue)
                            setPage(1)
                            fetchRecipes()
                        }}
                    >
                        <SelectTrigger className="w-[140px]">
                            <div className="flex items-center gap-2">
                                {isVisible === null ? (
                                    <Eye className="h-4 w-4" />
                                ) : isVisible ? (
                                    <Eye className="h-4 w-4" />
                                ) : (
                                    <EyeOff className="h-4 w-4" />
                                )}
                                <SelectValue placeholder="Visibilité" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="true">Visibles</SelectItem>
                            <SelectItem value="false">Cachées</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={isFolklore === null ? 'all' : isFolklore.toString()}
                        onValueChange={(value) => {
                            const newValue = value === 'all' ? null : value === 'true'
                            setIsFolklore(newValue)
                            setPage(1)
                            fetchRecipes()
                        }}
                    >
                        <SelectTrigger className="w-[140px]">
                            <div className="flex items-center gap-2">
                                {isFolklore === null ? (
                                    <Sparkles className="h-4 w-4" />
                                ) : isFolklore ? (
                                    <Sparkles className="h-4 w-4" />
                                ) : (
                                    <Sparkles className="h-4 w-4 opacity-50" />
                                )}
                                <SelectValue placeholder="Folklore" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="true">Folklore</SelectItem>
                            <SelectItem value="false">Normales</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Header avec pagination alignée */}
            <div className="flex items-center justify-between py-3 border-b bg-muted/30">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-semibold font-christmas">Recettes</h1>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {total} recette{total > 1 ? 's' : ''}
                    </Badge>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateUrlWithPage(page - 1)}>
                            Précédent
                        </Button>
                        <span className="text-muted-foreground">
                            Page {page} / {totalPages}
                        </span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateUrlWithPage(page + 1)}>
                            Suivant
                        </Button>
                    </div>
                    <Button
                        disabled={loading}
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString())
                            params.set('page', page.toString())
                            router.push(`/dashboard/recipes/new?returnPage=${page}`)
                        }}
                    >
                        Nouvelle recette
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
                    onBulkUpdateDietMask={handleBulkUpdateDietMask}
                    onBulkUpdateKitchenEquipmentsMask={handleBulkUpdateKitchenEquipmentsMask}
                    onBulkUpdateVisibility={handleBulkUpdateVisibility}
                    diets={diets}
                    kitchenEquipments={kitchenEquipments}
                />
            )}
            <RecipesTable
                recipes={recipes}
                loading={loading}
                selectedRecipes={selectedRecipes}
                onSelectRecipe={handleSelectRecipe}
                onSelectAll={handleSelectAll}
                onEdit={(recipe) => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', page.toString())
                    router.push(`/dashboard/recipes/edit/${recipe.id}?returnPage=${page}`)
                }}
                onDuplicate={handleDuplicateRecipe}
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
