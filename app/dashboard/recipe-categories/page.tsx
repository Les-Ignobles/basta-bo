"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RecipeCategoryForm } from '@/features/cooking/components/recipe-category-form'
import type { RecipeCategory, RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'
import { Pencil, Trash2, Pin, Tags, ListOrdered, GripVertical, Rows3, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Chip Item
function SortableChipItem({
    category,
    onEdit,
    disabled
}: {
    category: RecipeCategory
    onEdit: (category: RecipeCategory) => void
    disabled?: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `chip-${category.id}`, disabled })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 min-w-[120px] cursor-pointer group ${
                isDragging ? 'opacity-50 shadow-lg z-50' : ''
            } ${disabled ? 'opacity-60' : ''}`}
            onClick={() => onEdit(category)}
        >
            <button
                type="button"
                className={`absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity touch-none ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl mb-2"
                style={{ backgroundColor: category.color + '20' }}
            >
                {category.emoji}
            </div>
            <span className="text-sm font-medium text-center">{category.name.fr}</span>
            <span className="text-xs text-muted-foreground">#{category.chip_order}</span>
        </div>
    )
}

// Sortable Section Item
function SortableSectionItem({
    category,
    onEdit,
    disabled
}: {
    category: RecipeCategory
    onEdit: (category: RecipeCategory) => void
    disabled?: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `section-${category.id}`, disabled })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-4 bg-background border rounded-lg cursor-pointer group ${
                isDragging ? 'opacity-50 shadow-lg z-50' : ''
            } ${disabled ? 'opacity-60' : ''}`}
            onClick={() => onEdit(category)}
        >
            <button
                type="button"
                className={`touch-none ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            <span className="w-8 h-8 flex items-center justify-center bg-muted rounded-full text-sm font-medium">
                {category.section_order}
            </span>

            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: category.color + '20' }}
            >
                {category.emoji}
            </div>

            <div className="flex-1">
                <span className="font-medium">{category.name.fr}</span>
                {category.name.en && (
                    <span className="text-sm text-muted-foreground ml-2">({category.name.en})</span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {category.is_pinned && (
                    <Badge variant="secondary" className="gap-1">
                        <Pin className="h-3 w-3" />
                        Tag
                    </Badge>
                )}
                <Link
                    href={`/dashboard/recipe-categories/${category.id}/order`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button variant="ghost" size="icon" title="Gérer l'ordre des recettes">
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}

// All Categories Card Item
function CategoryCardItem({
    category,
    onEdit,
    onDelete
}: {
    category: RecipeCategory
    onEdit: (category: RecipeCategory) => void
    onDelete: (category: RecipeCategory) => void
}) {
    return (
        <div
            className="flex items-center gap-3 p-3 bg-background border rounded-lg hover:bg-muted/50 cursor-pointer group"
            onClick={() => onEdit(category)}
        >
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: category.color + '20' }}
            >
                {category.emoji}
            </div>

            <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{category.name.fr}</div>
                <div className="text-xs text-muted-foreground">
                    {category.name.en || 'Pas de traduction EN'}
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {category.is_pinned && (
                    <Badge variant="outline" className="text-xs">Tag</Badge>
                )}
                {category.display_as_chip && (
                    <Badge variant="outline" className="text-xs">Chip</Badge>
                )}
                {category.display_as_section && (
                    <Badge variant="outline" className="text-xs">Section</Badge>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                >
                    <Link href={`/dashboard/recipe-categories/${category.id}/order`}>
                        <ListOrdered className="h-4 w-4" />
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation()
                        onEdit(category)
                    }}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(category)
                    }}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        </div>
    )
}

export default function RecipeCategoriesPage() {
    const [categories, setCategories] = useState<RecipeCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [open, setOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<RecipeCategory | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<RecipeCategory | null>(null)

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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Filter categories
    const chipCategories = categories
        .filter(c => c.display_as_chip)
        .sort((a, b) => a.chip_order - b.chip_order)

    const sectionCategories = categories
        .filter(c => c.display_as_section)
        .sort((a, b) => a.section_order - b.section_order)

    const handleChipDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = chipCategories.findIndex(c => `chip-${c.id}` === active.id)
        const newIndex = chipCategories.findIndex(c => `chip-${c.id}` === over.id)

        const reordered = arrayMove(chipCategories, oldIndex, newIndex)

        // Update local state immediately
        const updatedCategories = categories.map(cat => {
            const newOrder = reordered.findIndex(c => c.id === cat.id)
            if (newOrder !== -1) {
                return { ...cat, chip_order: newOrder + 1 }
            }
            return cat
        })
        setCategories(updatedCategories)

        // Save to backend
        setSaving(true)
        try {
            for (let i = 0; i < reordered.length; i++) {
                await fetch('/api/recipe-categories', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: reordered[i].id, chip_order: i + 1 }),
                })
            }
        } finally {
            setSaving(false)
        }
    }

    const handleSectionDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = sectionCategories.findIndex(c => `section-${c.id}` === active.id)
        const newIndex = sectionCategories.findIndex(c => `section-${c.id}` === over.id)

        const reordered = arrayMove(sectionCategories, oldIndex, newIndex)

        // Update local state immediately
        const updatedCategories = categories.map(cat => {
            const newOrder = reordered.findIndex(c => c.id === cat.id)
            if (newOrder !== -1) {
                return { ...cat, section_order: newOrder + 1 }
            }
            return cat
        })
        setCategories(updatedCategories)

        // Save to backend
        setSaving(true)
        try {
            for (let i = 0; i < reordered.length; i++) {
                await fetch('/api/recipe-categories', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: reordered[i].id, section_order: i + 1 }),
                })
            }
        } finally {
            setSaving(false)
        }
    }

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
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="text-muted-foreground">Chargement...</span>
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
                        <span className="text-sm text-muted-foreground animate-pulse">
                            Sauvegarde...
                        </span>
                    )}
                </div>
                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button>Nouvelle catégorie</Button>
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

            {/* Aperçu style App */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Aperçu catalogue (style app)
                    </CardTitle>
                    <CardDescription>
                        Glissez-déposez pour réorganiser l&apos;ordre d&apos;affichage
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Chips Section */}
                    {chipCategories.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Chips (Header du catalogue)
                            </h3>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleChipDragEnd}
                            >
                                <SortableContext
                                    items={chipCategories.map(c => `chip-${c.id}`)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {chipCategories.map((category) => (
                                            <SortableChipItem
                                                key={category.id}
                                                category={category}
                                                onEdit={handleEdit}
                                                disabled={saving}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* Sections */}
                    {sectionCategories.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Sections (Page catalogue)
                            </h3>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleSectionDragEnd}
                            >
                                <SortableContext
                                    items={sectionCategories.map(c => `section-${c.id}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2">
                                        {sectionCategories.map((category) => (
                                            <SortableSectionItem
                                                key={category.id}
                                                category={category}
                                                onEdit={handleEdit}
                                                disabled={saving}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {chipCategories.length === 0 && sectionCategories.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Aucune catégorie configurée pour l&apos;affichage.
                            <br />
                            Activez &quot;Afficher comme chip&quot; ou &quot;Afficher comme section&quot; dans les paramètres d&apos;une catégorie.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Toutes les catégories */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Rows3 className="h-4 w-4" />
                        Toutes les catégories
                    </CardTitle>
                    <CardDescription>
                        Cliquez sur une catégorie pour la modifier
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {categories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Aucune catégorie. Créez-en une !
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <CategoryCardItem
                                    key={category.id}
                                    category={category}
                                    onEdit={handleEdit}
                                    onDelete={(cat) => {
                                        setCategoryToDelete(cat)
                                        setDeleteDialogOpen(true)
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

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
        </div>
    )
}
