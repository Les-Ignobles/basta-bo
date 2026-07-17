"use client"
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BookOpen, HelpCircle, LayoutGrid, Loader2, Plus, Tags } from 'lucide-react'
import { RecipeCategoryForm } from '@/features/cooking/components/recipe-category-form'
import { CatalogItemCard } from '@/features/cooking/components/catalog/catalog-item-card'
import { CategoryCard } from '@/features/cooking/components/catalog/category-card'
import { AddCategoryPopover } from '@/features/cooking/components/catalog/add-category-popover'
import { DroppableZone } from '@/features/cooking/components/catalog/droppable-zone'
import { CategoryPreviewDialog, type PreviewRecipe } from '@/features/cooking/components/catalog/category-preview-dialog'
import { useCatalogDnd } from '@/features/cooking/hooks/use-catalog-dnd'
import type { RecipeCategory, RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'

export default function RecipeCategoriesPage() {
    const [categories, setCategories] = useState<RecipeCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [open, setOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<RecipeCategory | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<RecipeCategory | null>(null)

    // Preview state
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
    const [previewCategory, setPreviewCategory] = useState<RecipeCategory | null>(null)
    const [previewRecipes, setPreviewRecipes] = useState<PreviewRecipe[]>([])
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewError, setPreviewError] = useState<string | null>(null)

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/recipe-categories')
            const { data } = await response.json()
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const saveOrder = useCallback(async (
        updates: { id: number; chip_order?: number; section_order?: number }[]
    ) => {
        setSaving(true)
        try {
            for (const update of updates) {
                await fetch('/api/recipe-categories', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(update),
                })
            }
        } catch (error) {
            console.error('Error saving order:', error)
            fetchCategories()
        } finally {
            setSaving(false)
        }
    }, [])

    const updateCategory = useCallback(async (
        id: number,
        updates: Partial<RecipeCategoryFormValues>
    ) => {
        setSaving(true)
        try {
            await fetch('/api/recipe-categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates }),
            })
        } catch (error) {
            console.error('Error updating category:', error)
            fetchCategories()
        } finally {
            setSaving(false)
        }
    }, [])

    const dnd = useCatalogDnd({ categories, setCategories, saveOrder, updateCategory })

    const availableForChips = categories
        .filter(c => !c.display_as_chip)
        .sort((a, b) => a.name.fr.localeCompare(b.name.fr))

    const availableForSections = categories
        .filter(c => !c.display_as_section)
        .sort((a, b) => a.name.fr.localeCompare(b.name.fr))

    const handleSubmit = async (values: RecipeCategoryFormValues) => {
        try {
            if (editingCategory) {
                await fetch('/api/recipe-categories', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingCategory.id, ...values }),
                })
            } else {
                await fetch('/api/recipe-categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(values),
                })
            }
            setOpen(false)
            setEditingCategory(null)
            fetchCategories()
        } catch (error) {
            console.error('Error saving category:', error)
        }
    }

    const handleDelete = async () => {
        if (!categoryToDelete) return
        try {
            await fetch(`/api/recipe-categories?id=${categoryToDelete.id}`, {
                method: 'DELETE',
            })
            setDeleteDialogOpen(false)
            setCategoryToDelete(null)
            fetchCategories()
        } catch (error) {
            console.error('Error deleting category:', error)
        }
    }

    const handleEdit = (category: RecipeCategory) => {
        setEditingCategory(category)
        setOpen(true)
    }

    const handlePreview = async (category: RecipeCategory) => {
        setPreviewCategory(category)
        setPreviewDialogOpen(true)
        setPreviewLoading(true)
        setPreviewError(null)
        setPreviewRecipes([])

        try {
            const response = await fetch(`/api/recipe-categories/${category.id}/preview?limit=10`)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de la prévisualisation')
            }

            setPreviewRecipes(result.data?.recipes || [])
        } catch (error) {
            console.error('Error previewing category:', error)
            setPreviewError(error instanceof Error ? error.message : 'Erreur inconnue')
        } finally {
            setPreviewLoading(false)
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setEditingCategory(null)
        }
    }

    const getFormDefaultValues = (): Partial<RecipeCategoryFormValues> | undefined => {
        if (!editingCategory) return undefined
        return {
            name_fr: editingCategory.name.fr,
            name_en: editingCategory.name.en || '',
            emoji: editingCategory.emoji,
            color: editingCategory.color,
            is_pinned: editingCategory.is_pinned,
            display_as_chip: editingCategory.display_as_chip,
            display_as_section: editingCategory.display_as_section,
            chip_order: editingCategory.chip_order,
            section_order: editingCategory.section_order,
            is_dynamic: editingCategory.is_dynamic,
            dynamic_type: editingCategory.dynamic_type,
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold font-christmas">Catégories de recettes</h1>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <Tags className="h-4 w-4" />
                        {categories.length} catégorie{categories.length > 1 ? 's' : ''}
                    </Badge>
                    {saving && (
                        <Badge variant="outline" className="animate-pulse gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Sauvegarde...
                        </Badge>
                    )}
                </div>
                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nouvelle catégorie
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="font-christmas">
                                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                            </DialogTitle>
                        </DialogHeader>
                        <RecipeCategoryForm
                            key={editingCategory?.id || 'new'}
                            onSubmit={handleSubmit}
                            defaultValues={getFormDefaultValues()}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main content with Tabs */}
            <Tabs defaultValue="preview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="preview" className="gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Aperçu du catalogue
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Toutes les catégories
                    </TabsTrigger>
                </TabsList>

                {/* Layout Tab */}
                <TabsContent value="preview">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        Prévisualisation du catalogue
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Organisez les catégories. Glissez-déposez pour réordonner.
                                    </CardDescription>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="shrink-0">
                                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-xs">
                                            <p className="font-medium mb-1">Comment ça fonctionne ?</p>
                                            <ul className="text-xs space-y-1">
                                                <li><strong>Filtres rapides :</strong> Petits boutons en haut du catalogue</li>
                                                <li><strong>Blocs :</strong> Sections avec leurs recettes sur la page</li>
                                                <li>Une catégorie peut apparaître aux deux endroits</li>
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <DndContext
                                sensors={dnd.sensors}
                                collisionDetection={closestCenter}
                                onDragStart={dnd.handleDragStart}
                                onDragOver={dnd.handleDragOver}
                                onDragEnd={dnd.handleDragEnd}
                                onDragCancel={dnd.handleDragCancel}
                            >
                                {/* Chips zone */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-medium">Filtres rapides</h3>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Petits boutons affichés en haut du catalogue pour filtrer rapidement les recettes</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <DroppableZone
                                        id="chips-zone"
                                        isOver={dnd.overZone === 'chip' && dnd.sourceZone !== 'chip'}
                                        className="min-h-[160px] p-3 bg-muted/30 border border-dashed rounded-lg"
                                    >
                                        <SortableContext
                                            items={dnd.chipCategories.map(c => `chip-${c.id}`)}
                                            strategy={horizontalListSortingStrategy}
                                        >
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {dnd.chipCategories.map((category) => (
                                                    <CatalogItemCard
                                                        key={category.id}
                                                        category={category}
                                                        zone="chip"
                                                        onEdit={handleEdit}
                                                        onRemove={(c) => dnd.removeFromZone(c, 'chip')}
                                                        onAddToOtherZone={(c) => dnd.addToZone(c, 'section')}
                                                        disabled={saving}
                                                    />
                                                ))}
                                                <AddCategoryPopover
                                                    zone="chip"
                                                    availableCategories={availableForChips}
                                                    onSelect={(c) => dnd.addToZone(c, 'chip')}
                                                    disabled={saving}
                                                />
                                            </div>
                                        </SortableContext>
                                        {dnd.chipCategories.length === 0 && (
                                            <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm">
                                                Glissez une catégorie ici ou cliquez sur + pour ajouter
                                            </div>
                                        )}
                                    </DroppableZone>
                                </div>

                                {/* Sections zone */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-medium">Blocs du catalogue</h3>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Sections affichées sur la page catalogue avec leurs recettes</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <DroppableZone
                                        id="sections-zone"
                                        isOver={dnd.overZone === 'section' && dnd.sourceZone !== 'section'}
                                        className="min-h-[100px] p-3 bg-muted/30 border border-dashed rounded-lg"
                                    >
                                        <SortableContext
                                            items={dnd.sectionCategories.map(c => `section-${c.id}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="space-y-2">
                                                {dnd.sectionCategories.map((category) => (
                                                    <CatalogItemCard
                                                        key={category.id}
                                                        category={category}
                                                        zone="section"
                                                        onEdit={handleEdit}
                                                        onRemove={(c) => dnd.removeFromZone(c, 'section')}
                                                        onAddToOtherZone={(c) => dnd.addToZone(c, 'chip')}
                                                        disabled={saving}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                        <div className="mt-2">
                                            <AddCategoryPopover
                                                zone="section"
                                                availableCategories={availableForSections}
                                                onSelect={(c) => dnd.addToZone(c, 'section')}
                                                disabled={saving}
                                            />
                                        </div>
                                        {dnd.sectionCategories.length === 0 && (
                                            <div className="flex items-center justify-center h-[60px] text-muted-foreground text-sm">
                                                Glissez une catégorie ici ou cliquez sur + pour ajouter
                                            </div>
                                        )}
                                    </DroppableZone>
                                </div>

                                {/* Drag Overlay */}
                                <DragOverlay>
                                    {dnd.activeCategory && dnd.sourceZone && (
                                        <CatalogItemCard
                                            category={dnd.activeCategory}
                                            zone={dnd.sourceZone}
                                            onEdit={() => {}}
                                            isDragOverlay
                                        />
                                    )}
                                </DragOverlay>
                            </DndContext>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* List Tab */}
                <TabsContent value="list">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Toutes les catégories</CardTitle>
                            <CardDescription>
                                Créez, modifiez ou supprimez des catégories. Cliquez sur une catégorie pour la modifier.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {categories.length === 0 ? (
                                <div className="text-center py-12">
                                    <Tags className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground mb-4">Aucune catégorie pour le moment</p>
                                    <Button onClick={() => setOpen(true)} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Créer une catégorie
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {categories.map((category) => (
                                        <CategoryCard
                                            key={category.id}
                                            category={category}
                                            onEdit={handleEdit}
                                            onDelete={(cat) => {
                                                setCategoryToDelete(cat)
                                                setDeleteDialogOpen(true)
                                            }}
                                            onPreview={category.is_dynamic ? handlePreview : undefined}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera la catégorie &quot;{categoryToDelete?.emoji} {categoryToDelete?.name.fr}&quot;.
                            Les recettes associées ne seront pas supprimées, seul le lien sera retiré.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Preview Dialog */}
            <CategoryPreviewDialog
                open={previewDialogOpen}
                onOpenChange={setPreviewDialogOpen}
                category={previewCategory}
                recipes={previewRecipes}
                loading={previewLoading}
                error={previewError}
            />
        </div>
    )
}
