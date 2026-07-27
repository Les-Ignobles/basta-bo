"use client"
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import type { Recipe } from '@/features/cooking/types'
import { DishType, DISH_TYPE_LABELS, QuantificationType, QUANTIFICATION_TYPE_LABELS } from '@/features/cooking/types'
import { useRecipeStore } from '@/features/cooking/stores/recipe-store'
import { RecipesTable } from '@/features/cooking/components/recipes-table'
import { BulkActionsBar } from '@/features/cooking/components/bulk-actions-bar'
import { searchByRelevance } from '@/features/cooking/utils/recipe-search'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BookOpen, ImageOff, ChefHat, Search, X, SlidersHorizontal, Calendar } from 'lucide-react'

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]
const MONTHS_SHORT = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
]

const PAGE_SIZE = 50

export default function RecipesIndexPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
    const {
        fetchAllRecipes,
        fetchKitchenEquipments,
        fetchDiets,
        allRecipes,
        kitchenEquipments,
        diets,
        deleteRecipe,
        bulkDeleteRecipes,
        bulkUpdateDishType,
        bulkUpdateSeasonality,
        bulkUpdateDietMask,
        bulkUpdateKitchenEquipmentsMask,
        bulkUpdateVisibility,
        toggleRecipeIsNew,
        loading,
        recipesLoading,
        selectedRecipes,
        toggleRecipeSelection,
        setSelectedRecipes,
        clearSelection,
        search,
        setSearch,
        noImage,
        setNoImage,
        dishType,
        setDishType,
        selectedDiets,
        setSelectedDiets,
        selectedKitchenEquipments,
        setSelectedKitchenEquipments,
        quantificationType,
        setQuantificationType,
        isVisible,
        setIsVisible,
        isFolklore,
        setIsFolklore,
        selectedMonths,
        setSelectedMonths,
    } = useRecipeStore()

    const [page, setPage] = useState(() => {
        const p = Number(searchParams.get('page'))
        return Number.isFinite(p) && p > 0 ? p : 1
    })

    // Charger le catalogue complet + référentiels une seule fois au montage
    useEffect(() => {
        fetchAllRecipes()
        fetchKitchenEquipments()
        fetchDiets()
    }, [fetchAllRecipes, fetchKitchenEquipments, fetchDiets])

    // Nombre de filtres avancés actifs (hors recherche / type / saisonnalité)
    const advancedFilterCount = useMemo(() => {
        let n = 0
        if (quantificationType !== 'all') n++
        if (selectedDiets.length > 0) n++
        if (selectedKitchenEquipments.length > 0) n++
        if (noImage) n++
        if (isVisible !== null) n++
        if (isFolklore !== null) n++
        return n
    }, [quantificationType, selectedDiets, selectedKitchenEquipments, noImage, isVisible, isFolklore])

    const hasAnyFilter = Boolean(search) || dishType !== 'all' || selectedMonths.length > 0 || advancedFilterCount > 0

    // Filtrage + recherche 100% côté client
    const filteredRecipes = useMemo(() => {
        let list = allRecipes

        if (dishType !== 'all') {
            list = list.filter((r) => String(r.dish_type) === String(dishType))
        }

        if (quantificationType !== 'all') {
            list = list.filter((r) => String(r.quantification_type) === String(quantificationType))
        }

        if (noImage) {
            list = list.filter((r) => !r.img_path)
        }

        if (isVisible !== null) {
            list = list.filter((r) => r.is_visible === isVisible)
        }

        if (isFolklore !== null) {
            list = list.filter((r) => r.is_folklore === isFolklore)
        }

        if (selectedDiets.length > 0) {
            list = list.filter((r) =>
                r.diet_mask != null &&
                selectedDiets.every((dietId) => (r.diet_mask! & (1 << (dietId - 1))) > 0)
            )
        }

        if (selectedKitchenEquipments.length > 0) {
            list = list.filter((r) =>
                r.kitchen_equipments_mask != null &&
                selectedKitchenEquipments.every((equipId) => (r.kitchen_equipments_mask! & (1 << (equipId - 1))) > 0)
            )
        }

        if (selectedMonths.length > 0) {
            const monthsMask = selectedMonths.reduce((acc, m) => acc | (1 << m), 0)
            // Les recettes "toute l'année" (masque nul) restent disponibles chaque mois ;
            // on n'exclut que les recettes saisonnières hors des mois sélectionnés.
            list = list.filter((r) => !r.seasonality_mask || (r.seasonality_mask & monthsMask) !== 0)
        }

        if (search.trim()) {
            list = searchByRelevance(list, search, (r) => r.title)
        }

        return list
    }, [allRecipes, dishType, quantificationType, noImage, isVisible, isFolklore, selectedDiets, selectedKitchenEquipments, selectedMonths, search])

    const total = filteredRecipes.length
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)

    const paginatedRecipes = useMemo(() => {
        const from = (currentPage - 1) * PAGE_SIZE
        return filteredRecipes.slice(from, from + PAGE_SIZE)
    }, [filteredRecipes, currentPage])

    // Revenir à la page 1 dès qu'un filtre change
    useEffect(() => {
        setPage(1)
    }, [search, dishType, quantificationType, noImage, isVisible, isFolklore, selectedDiets, selectedKitchenEquipments, selectedMonths])

    const goToPage = (newPage: number) => {
        const clamped = Math.min(Math.max(1, newPage), totalPages)
        setPage(clamped)
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', clamped.toString())
        router.replace(`/dashboard/recipes?${params.toString()}`, { scroll: false })
    }

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            setSelectedRecipes(paginatedRecipes.map((r) => Number(r.id)))
        } else {
            clearSelection()
        }
    }

    const resetFilters = () => {
        setSearch('')
        setDishType('all')
        setQuantificationType('all')
        setSelectedDiets([])
        setSelectedKitchenEquipments([])
        setNoImage(false)
        setIsVisible(null)
        setIsFolklore(null)
        setSelectedMonths([])
    }

    const confirmBulkDelete = async () => {
        await bulkDeleteRecipes(selectedRecipes)
        setBulkDeleteDialogOpen(false)
    }

    const confirmDeleteRecipe = async () => {
        if (recipeToDelete) {
            await deleteRecipe(Number(recipeToDelete.id))
            setDeleteDialogOpen(false)
            setRecipeToDelete(null)
        }
    }

    const handleDuplicateRecipe = (recipe: Recipe) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...recipeWithoutId } = recipe
        const duplicatedRecipe = {
            ...recipeWithoutId,
            title: `${recipe.title} (copie)`,
            created_at: new Date().toISOString(),
        }
        sessionStorage.setItem('duplicatedRecipe', JSON.stringify(duplicatedRecipe))
        router.push(`/dashboard/recipes/new?returnPage=${currentPage}`)
    }

    const toggleDiet = (dietId: number) => {
        setSelectedDiets(
            selectedDiets.includes(dietId)
                ? selectedDiets.filter((id) => id !== dietId)
                : [...selectedDiets, dietId]
        )
    }

    const toggleEquipment = (equipmentId: number) => {
        setSelectedKitchenEquipments(
            selectedKitchenEquipments.includes(equipmentId)
                ? selectedKitchenEquipments.filter((id) => id !== equipmentId)
                : [...selectedKitchenEquipments, equipmentId]
        )
    }

    const toggleMonth = (monthIndex: number) => {
        setSelectedMonths(
            selectedMonths.includes(monthIndex)
                ? selectedMonths.filter((m) => m !== monthIndex)
                : [...selectedMonths, monthIndex]
        )
    }

    const dietLabel = (id: number) => {
        const d = diets.find((diet) => diet.id === id)
        return d ? (d.title as { fr?: string })?.fr || String(d.title) : `#${id}`
    }
    const equipmentLabel = (id: number) => {
        const e = kitchenEquipments.find((eq) => eq.id === id)
        return e ? (e.name as { fr?: string })?.fr || String(e.name) : `#${id}`
    }

    return (
        <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-background border-b py-4 space-y-3">
                {/* Ligne principale : recherche + filtres clés */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-96 max-w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une recette (accents et fautes tolérés)…"
                            className="pl-9 pr-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Effacer la recherche"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <Select
                        value={dishType.toString()}
                        onValueChange={(value) => setDishType(value as DishType | 'all')}
                    >
                        <SelectTrigger className="w-[160px]">
                            <div className="flex items-center gap-2">
                                <ChefHat className="h-4 w-4" />
                                <SelectValue placeholder="Type de plat" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les types</SelectItem>
                            {Object.entries(DISH_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Saisonnalité */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Saisonnalité
                                {selectedMonths.length > 0 && (
                                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                        {selectedMonths.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">Filtrer par mois de saison</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setSelectedMonths([new Date().getMonth()])}
                                    >
                                        Mois courant
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {MONTHS.map((month, index) => (
                                        <label key={index} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <Checkbox
                                                checked={selectedMonths.includes(index)}
                                                onCheckedChange={() => toggleMonth(index)}
                                            />
                                            <span>{month}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Les recettes « toute l&apos;année » restent affichées.
                                </p>
                                {selectedMonths.length > 0 && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedMonths([])}>
                                        Effacer
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Filtres avancés */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                Filtres avancés
                                {advancedFilterCount > 0 && (
                                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                        {advancedFilterCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96" align="start">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Quantification</h4>
                                    <Select
                                        value={quantificationType.toString()}
                                        onValueChange={(value) => setQuantificationType(value as QuantificationType | 'all')}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Quantification" />
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
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Visibilité</h4>
                                    <div className="flex gap-2">
                                        {([['all', 'Toutes'], ['true', 'Visibles'], ['false', 'Cachées']] as const).map(([val, label]) => {
                                            const active = (val === 'all' && isVisible === null) || (val !== 'all' && String(isVisible) === val)
                                            return (
                                                <Button
                                                    key={val}
                                                    variant={active ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => setIsVisible(val === 'all' ? null : val === 'true')}
                                                >
                                                    {label}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Folklore</h4>
                                    <div className="flex gap-2">
                                        {([['all', 'Toutes'], ['true', 'Folklore'], ['false', 'Normales']] as const).map(([val, label]) => {
                                            const active = (val === 'all' && isFolklore === null) || (val !== 'all' && String(isFolklore) === val)
                                            return (
                                                <Button
                                                    key={val}
                                                    variant={active ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => setIsFolklore(val === 'all' ? null : val === 'true')}
                                                >
                                                    {label}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Régimes alimentaires</h4>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {diets.map((diet) => (
                                            <label key={diet.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <Checkbox
                                                    checked={selectedDiets.includes(diet.id)}
                                                    onCheckedChange={() => toggleDiet(diet.id)}
                                                />
                                                <span className="flex items-center gap-2">
                                                    <span>{diet.emoji}</span>
                                                    <span>{dietLabel(diet.id)}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Ustensiles de cuisine</h4>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {kitchenEquipments.map((equipment) => (
                                            <label key={equipment.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <Checkbox
                                                    checked={selectedKitchenEquipments.includes(equipment.id)}
                                                    onCheckedChange={() => toggleEquipment(equipment.id)}
                                                />
                                                <span className="flex items-center gap-2">
                                                    <span>{equipment.emoji}</span>
                                                    <span>{equipmentLabel(equipment.id)}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1 border-t">
                                    <Checkbox checked={noImage} onCheckedChange={(v) => setNoImage(Boolean(v))} />
                                    <ImageOff className="h-4 w-4" />
                                    Sans image uniquement
                                </label>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {hasAnyFilter && (
                        <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground" onClick={resetFilters}>
                            <X className="h-4 w-4" />
                            Réinitialiser
                        </Button>
                    )}
                </div>

                {/* Chips de filtres actifs */}
                {hasAnyFilter && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {dishType !== 'all' && (
                            <FilterChip
                                label={`Type : ${DISH_TYPE_LABELS[dishType as keyof typeof DISH_TYPE_LABELS]}`}
                                onRemove={() => setDishType('all')}
                            />
                        )}
                        {selectedMonths.length > 0 && (
                            <FilterChip
                                label={`Saison : ${selectedMonths.slice().sort((a, b) => a - b).map((m) => MONTHS_SHORT[m]).join(', ')}`}
                                onRemove={() => setSelectedMonths([])}
                            />
                        )}
                        {quantificationType !== 'all' && (
                            <FilterChip
                                label={`Quantif. : ${QUANTIFICATION_TYPE_LABELS[quantificationType as keyof typeof QUANTIFICATION_TYPE_LABELS]}`}
                                onRemove={() => setQuantificationType('all')}
                            />
                        )}
                        {isVisible !== null && (
                            <FilterChip label={isVisible ? 'Visibles' : 'Cachées'} onRemove={() => setIsVisible(null)} />
                        )}
                        {isFolklore !== null && (
                            <FilterChip label={isFolklore ? 'Folklore' : 'Normales'} onRemove={() => setIsFolklore(null)} />
                        )}
                        {noImage && <FilterChip label="Sans image" onRemove={() => setNoImage(false)} />}
                        {selectedDiets.map((id) => (
                            <FilterChip key={`diet-${id}`} label={`Régime : ${dietLabel(id)}`} onRemove={() => toggleDiet(id)} />
                        ))}
                        {selectedKitchenEquipments.map((id) => (
                            <FilterChip key={`equip-${id}`} label={`Ustensile : ${equipmentLabel(id)}`} onRemove={() => toggleEquipment(id)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Header avec compteur + pagination */}
            <div className="flex items-center justify-between py-3 border-b bg-muted/30">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-semibold font-christmas">Recettes</h1>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {total} recette{total > 1 ? 's' : ''}
                        {hasAnyFilter && <span className="text-muted-foreground">/ {allRecipes.length}</span>}
                    </Badge>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                            Précédent
                        </Button>
                        <span className="text-muted-foreground">
                            Page {currentPage} / {totalPages}
                        </span>
                        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
                            Suivant
                        </Button>
                    </div>
                    <Button
                        disabled={loading}
                        onClick={() => router.push(`/dashboard/recipes/new?returnPage=${currentPage}`)}
                    >
                        Nouvelle recette
                    </Button>
                </div>
            </div>

            {selectedRecipes.length > 0 && (
                <BulkActionsBar
                    selectedCount={selectedRecipes.length}
                    onClearSelection={clearSelection}
                    onBulkDelete={() => setBulkDeleteDialogOpen(true)}
                    onBulkUpdateDishType={(dt) => bulkUpdateDishType(selectedRecipes, dt)}
                    onBulkUpdateSeasonality={(mask) => bulkUpdateSeasonality(selectedRecipes, mask)}
                    onBulkUpdateDietMask={(mask) => bulkUpdateDietMask(selectedRecipes, mask)}
                    onBulkUpdateKitchenEquipmentsMask={(mask) => bulkUpdateKitchenEquipmentsMask(selectedRecipes, mask)}
                    onBulkUpdateVisibility={(v) => bulkUpdateVisibility(selectedRecipes, v)}
                    diets={diets}
                    kitchenEquipments={kitchenEquipments}
                />
            )}

            <RecipesTable
                recipes={paginatedRecipes}
                loading={recipesLoading}
                selectedRecipes={selectedRecipes}
                onSelectRecipe={(id) => toggleRecipeSelection(id)}
                onSelectAll={handleSelectAll}
                onEdit={(recipe) => {
                    const params = new URLSearchParams()
                    params.set('returnPage', currentPage.toString())
                    if (search) params.set('search', search)
                    if (noImage) params.set('noImage', 'true')
                    if (dishType !== 'all') params.set('dishType', dishType.toString())
                    if (selectedDiets.length > 0) params.set('diets', selectedDiets.join(','))
                    if (selectedKitchenEquipments.length > 0) params.set('kitchenEquipments', selectedKitchenEquipments.join(','))
                    if (quantificationType !== 'all') params.set('quantificationType', quantificationType.toString())
                    if (isVisible !== null) params.set('isVisible', isVisible.toString())
                    if (isFolklore !== null) params.set('isFolklore', isFolklore.toString())
                    router.push(`/dashboard/recipes/edit/${recipe.id}?${params.toString()}`)
                }}
                onDuplicate={handleDuplicateRecipe}
                onDelete={(recipe) => { setRecipeToDelete(recipe); setDeleteDialogOpen(true) }}
                onToggleNew={toggleRecipeIsNew}
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

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 pl-3 pr-1.5 py-1 text-xs">
            {label}
            <button
                type="button"
                onClick={onRemove}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Retirer ${label}`}
            >
                <X className="h-3 w-3" />
            </button>
        </span>
    )
}
