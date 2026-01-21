"use client"
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RecipeCategoryForm } from '@/features/cooking/components/recipe-category-form'
import type { RecipeCategory, RecipeCategoryFormValues, DragZone } from '@/features/cooking/types/recipe-category'
import { Pencil, Trash2, Pin, Tags, ListOrdered, GripVertical, Rows3, LayoutGrid, Plus, X, Eye, Loader2 } from 'lucide-react'
import Image from 'next/image'
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
    DragStartEvent,
    DragOverEvent,
    useDroppable,
    DragOverlay,
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Type for preview recipe
type PreviewRecipe = {
    id: number
    title: string
    img_path: string | null
    dish_type: string
}

// Helper functions for drag IDs
function getZoneFromId(id: string | number): DragZone | null {
    const idStr = String(id)
    if (idStr.startsWith('chip-')) return 'chip'
    if (idStr.startsWith('section-')) return 'section'
    return null
}

// Droppable Zone Wrapper
function DroppableZone({
    id,
    children,
    isOver,
    className = '',
}: {
    id: string
    children: React.ReactNode
    isOver?: boolean
    className?: string
}) {
    const { setNodeRef, isOver: dropIsOver } = useDroppable({ id })
    const highlighted = isOver ?? dropIsOver

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${highlighted ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''} transition-all duration-200 rounded-lg`}
        >
            {children}
        </div>
    )
}

// Sortable Chip Item with remove action
function SortableChipItem({
    category,
    onEdit,
    onRemove,
    onDuplicateToSection,
    disabled,
    isDragOverlay = false,
}: {
    category: RecipeCategory
    onEdit: (category: RecipeCategory) => void
    onRemove?: (category: RecipeCategory) => void
    onDuplicateToSection?: (category: RecipeCategory) => void
    disabled?: boolean
    isDragOverlay?: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `chip-${category.id}`, disabled })

    const style = isDragOverlay ? {} : {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const canDuplicate = onDuplicateToSection && !category.display_as_section

    return (
        <div
            ref={!isDragOverlay ? setNodeRef : undefined}
            style={style}
            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 min-w-[120px] cursor-pointer group ${
                isDragging && !isDragOverlay ? 'opacity-30' : ''
            } ${isDragOverlay ? 'shadow-lg ring-2 ring-primary' : ''} ${disabled ? 'opacity-60' : ''} bg-background`}
            onClick={() => !isDragOverlay && onEdit(category)}
        >
            {/* Drag handle */}
            <button
                type="button"
                className={`absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity touch-none ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Remove button */}
            {onRemove && !isDragOverlay && (
                <button
                    type="button"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove(category)
                    }}
                    title="Retirer des chips"
                >
                    <X className="h-3 w-3 text-destructive" />
                </button>
            )}

            {/* Duplicate action menu */}
            {canDuplicate && !isDragOverlay && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded text-xs"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onDuplicateToSection?.(category)}>
                            Ajouter aussi comme section
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

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

// Sortable Section Item with remove action
function SortableSectionItem({
    category,
    onEdit,
    onRemove,
    onDuplicateToChip,
    disabled,
    isDragOverlay = false,
}: {
    category: RecipeCategory
    onEdit: (category: RecipeCategory) => void
    onRemove?: (category: RecipeCategory) => void
    onDuplicateToChip?: (category: RecipeCategory) => void
    disabled?: boolean
    isDragOverlay?: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `section-${category.id}`, disabled })

    const style = isDragOverlay ? {} : {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const canDuplicate = onDuplicateToChip && !category.display_as_chip

    return (
        <div
            ref={!isDragOverlay ? setNodeRef : undefined}
            style={style}
            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer group ${
                isDragging && !isDragOverlay ? 'opacity-30' : ''
            } ${isDragOverlay ? 'shadow-lg ring-2 ring-primary' : ''} ${disabled ? 'opacity-60' : ''} bg-background`}
            onClick={() => !isDragOverlay && onEdit(category)}
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
                {category.display_as_chip && (
                    <Badge variant="outline" className="text-xs">Chip</Badge>
                )}
                {category.is_dynamic && (
                    <Badge variant="default" className="text-xs">
                        {category.dynamic_type === 'seasonality' ? '🍂 Dynamique' : '⭐ Dynamique'}
                    </Badge>
                )}

                {/* Duplicate action */}
                {canDuplicate && !isDragOverlay && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDuplicateToChip?.(category)
                        }}
                        title="Ajouter aussi comme chip"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                )}

                {/* Hide order button for dynamic categories */}
                {!category.is_dynamic && (
                    <Link
                        href={`/dashboard/recipe-categories/${category.id}/order`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button variant="ghost" size="icon" title="Gérer l'ordre des recettes">
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                    </Link>
                )}

                {/* Remove button */}
                {onRemove && !isDragOverlay && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove(category)
                        }}
                        title="Retirer des sections"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}

// Add Category Popover
function AddCategoryPopover({
    zone,
    availableCategories,
    onSelect,
    disabled,
}: {
    zone: 'chip' | 'section'
    availableCategories: RecipeCategory[]
    onSelect: (category: RecipeCategory) => void
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)

    const handleSelect = (category: RecipeCategory) => {
        onSelect(category)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed min-w-[120px] ${
                        zone === 'chip' ? 'min-h-[140px]' : 'h-full'
                    } hover:border-primary hover:bg-primary/5 transition-colors ${
                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                >
                    <Plus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mt-2">Ajouter</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-1">
                    <p className="text-sm font-medium px-2 py-1">
                        Ajouter comme {zone === 'chip' ? 'chip' : 'section'}
                    </p>
                    {availableCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                            Toutes les catégories sont déjà affichées
                        </p>
                    ) : (
                        <div className="max-h-[200px] overflow-y-auto">
                            {availableCategories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-muted rounded-md transition-colors text-left"
                                    onClick={() => handleSelect(category)}
                                >
                                    <span
                                        className="w-8 h-8 rounded flex items-center justify-center text-lg"
                                        style={{ backgroundColor: category.color + '20' }}
                                    >
                                        {category.emoji}
                                    </span>
                                    <span className="text-sm">{category.name.fr}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

// All Categories Card Item
function CategoryCardItem({
    category,
    onEdit,
    onDelete,
    onPreview,
}: {
    category: RecipeCategory
    onEdit: (category: RecipeCategory) => void
    onDelete: (category: RecipeCategory) => void
    onPreview?: (category: RecipeCategory) => void
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
                {category.is_dynamic && (
                    <Badge variant="default" className="text-xs">
                        {category.dynamic_type === 'seasonality' ? '🍂' : '⭐'} Dynamique
                    </Badge>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Hide order button for dynamic categories */}
                {!category.is_dynamic && (
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
                )}
                {/* Preview button for dynamic categories */}
                {category.is_dynamic && onPreview && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            onPreview(category)
                        }}
                        title="Prévisualiser les recettes"
                    >
                        <Eye className="h-4 w-4 text-primary" />
                    </Button>
                )}
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

    // Preview state
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
    const [previewCategory, setPreviewCategory] = useState<RecipeCategory | null>(null)
    const [previewRecipes, setPreviewRecipes] = useState<PreviewRecipe[]>([])
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewError, setPreviewError] = useState<string | null>(null)

    // Drag state
    const [activeId, setActiveId] = useState<string | null>(null)
    const [overZone, setOverZone] = useState<DragZone | null>(null)

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
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Computed categories
    const chipCategories = categories
        .filter(c => c.display_as_chip)
        .sort((a, b) => a.chip_order - b.chip_order)

    const sectionCategories = categories
        .filter(c => c.display_as_section)
        .sort((a, b) => a.section_order - b.section_order)

    const availableForChips = categories
        .filter(c => !c.display_as_chip)
        .sort((a, b) => a.name.fr.localeCompare(b.name.fr))

    const availableForSections = categories
        .filter(c => !c.display_as_section)
        .sort((a, b) => a.name.fr.localeCompare(b.name.fr))

    // Get active category for drag overlay
    const activeCategory = activeId
        ? categories.find(c => `chip-${c.id}` === activeId || `section-${c.id}` === activeId)
        : null
    const sourceZone = activeId ? getZoneFromId(activeId) : null

    // Save order helper with optimistic update
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
            // Refetch to restore correct state
            fetchCategories()
        } finally {
            setSaving(false)
        }
    }, [])

    // Update category helper
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

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id))
        const zone = getZoneFromId(event.active.id)
        setOverZone(zone)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event
        if (!over) {
            setOverZone(null)
            return
        }

        const overId = String(over.id)
        if (overId === 'chips-zone') {
            setOverZone('chip')
        } else if (overId === 'sections-zone') {
            setOverZone('section')
        } else {
            setOverZone(getZoneFromId(over.id))
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        setActiveId(null)
        setOverZone(null)

        if (!over || !sourceZone || !activeCategory) return

        const overId = String(over.id)
        let targetZone: DragZone | null = null

        if (overId === 'chips-zone') {
            targetZone = 'chip'
        } else if (overId === 'sections-zone') {
            targetZone = 'section'
        } else {
            targetZone = getZoneFromId(over.id)
        }

        if (!targetZone) return

        // Cross-zone drag: move category from one zone to another
        if (sourceZone !== targetZone) {
            // If already in target zone, just remove from source
            if (targetZone === 'chip' && activeCategory.display_as_chip) {
                // Already a chip, do nothing
                return
            }
            if (targetZone === 'section' && activeCategory.display_as_section) {
                // Already a section, just remove from chips
                const updatedCategories = categories.map(c =>
                    c.id === activeCategory.id
                        ? { ...c, display_as_chip: false }
                        : c
                )
                setCategories(updatedCategories)
                await updateCategory(activeCategory.id, { display_as_chip: false })
                return
            }

            // Move to new zone
            const maxOrder = targetZone === 'chip'
                ? Math.max(0, ...chipCategories.map(c => c.chip_order))
                : Math.max(0, ...sectionCategories.map(c => c.section_order))

            const newOrder = maxOrder + 1

            const updatedCategories = categories.map(c =>
                c.id === activeCategory.id
                    ? {
                        ...c,
                        display_as_chip: targetZone === 'chip',
                        display_as_section: targetZone === 'section',
                        chip_order: targetZone === 'chip' ? newOrder : c.chip_order,
                        section_order: targetZone === 'section' ? newOrder : c.section_order,
                    }
                    : c
            )
            setCategories(updatedCategories)

            await updateCategory(activeCategory.id, {
                display_as_chip: targetZone === 'chip',
                display_as_section: targetZone === 'section',
                chip_order: targetZone === 'chip' ? newOrder : undefined,
                section_order: targetZone === 'section' ? newOrder : undefined,
            })
            return
        }

        // Same-zone reorder
        if (active.id === over.id) return

        if (sourceZone === 'chip') {
            const oldIndex = chipCategories.findIndex(c => `chip-${c.id}` === active.id)
            const newIndex = chipCategories.findIndex(c => `chip-${c.id}` === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(chipCategories, oldIndex, newIndex)

                // Optimistic update
                const updatedCategories = categories.map(cat => {
                    const newOrder = reordered.findIndex(c => c.id === cat.id)
                    if (newOrder !== -1) {
                        return { ...cat, chip_order: newOrder + 1 }
                    }
                    return cat
                })
                setCategories(updatedCategories)

                // Save to backend
                await saveOrder(reordered.map((c, i) => ({ id: c.id, chip_order: i + 1 })))
            }
        } else if (sourceZone === 'section') {
            const oldIndex = sectionCategories.findIndex(c => `section-${c.id}` === active.id)
            const newIndex = sectionCategories.findIndex(c => `section-${c.id}` === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(sectionCategories, oldIndex, newIndex)

                // Optimistic update
                const updatedCategories = categories.map(cat => {
                    const newOrder = reordered.findIndex(c => c.id === cat.id)
                    if (newOrder !== -1) {
                        return { ...cat, section_order: newOrder + 1 }
                    }
                    return cat
                })
                setCategories(updatedCategories)

                // Save to backend
                await saveOrder(reordered.map((c, i) => ({ id: c.id, section_order: i + 1 })))
            }
        }
    }

    const handleDragCancel = () => {
        setActiveId(null)
        setOverZone(null)
    }

    // Add handlers
    const handleAddToChips = async (category: RecipeCategory) => {
        const maxOrder = Math.max(0, ...chipCategories.map(c => c.chip_order))
        const newOrder = maxOrder + 1

        const updatedCategories = categories.map(c =>
            c.id === category.id
                ? { ...c, display_as_chip: true, chip_order: newOrder }
                : c
        )
        setCategories(updatedCategories)

        await updateCategory(category.id, {
            display_as_chip: true,
            chip_order: newOrder,
        })
    }

    const handleAddToSections = async (category: RecipeCategory) => {
        const maxOrder = Math.max(0, ...sectionCategories.map(c => c.section_order))
        const newOrder = maxOrder + 1

        const updatedCategories = categories.map(c =>
            c.id === category.id
                ? { ...c, display_as_section: true, section_order: newOrder }
                : c
        )
        setCategories(updatedCategories)

        await updateCategory(category.id, {
            display_as_section: true,
            section_order: newOrder,
        })
    }

    // Remove handlers
    const handleRemoveFromChips = async (category: RecipeCategory) => {
        const updatedCategories = categories.map(c =>
            c.id === category.id
                ? { ...c, display_as_chip: false }
                : c
        )
        setCategories(updatedCategories)

        await updateCategory(category.id, { display_as_chip: false })
    }

    const handleRemoveFromSections = async (category: RecipeCategory) => {
        const updatedCategories = categories.map(c =>
            c.id === category.id
                ? { ...c, display_as_section: false }
                : c
        )
        setCategories(updatedCategories)

        await updateCategory(category.id, { display_as_section: false })
    }

    // Duplicate handlers
    const handleDuplicateToSection = async (category: RecipeCategory) => {
        if (category.display_as_section) return

        const maxOrder = Math.max(0, ...sectionCategories.map(c => c.section_order))
        const newOrder = maxOrder + 1

        const updatedCategories = categories.map(c =>
            c.id === category.id
                ? { ...c, display_as_section: true, section_order: newOrder }
                : c
        )
        setCategories(updatedCategories)

        await updateCategory(category.id, {
            display_as_section: true,
            section_order: newOrder,
        })
    }

    const handleDuplicateToChip = async (category: RecipeCategory) => {
        if (category.display_as_chip) return

        const maxOrder = Math.max(0, ...chipCategories.map(c => c.chip_order))
        const newOrder = maxOrder + 1

        const updatedCategories = categories.map(c =>
            c.id === category.id
                ? { ...c, display_as_chip: true, chip_order: newOrder }
                : c
        )
        setCategories(updatedCategories)

        await updateCategory(category.id, {
            display_as_chip: true,
            chip_order: newOrder,
        })
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
                        <Badge variant="outline" className="animate-pulse">
                            Sauvegarde...
                        </Badge>
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

            {/* Aperçu style App with Global DndContext */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        Aperçu catalogue (style app)
                    </CardTitle>
                    <CardDescription>
                        Glissez-déposez pour réorganiser ou déplacer entre zones
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        {/* Chips Section */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Chips (Header du catalogue)
                            </h3>
                            <DroppableZone
                                id="chips-zone"
                                isOver={overZone === 'chip' && sourceZone !== 'chip'}
                                className="min-h-[160px] p-2"
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
                                                onRemove={handleRemoveFromChips}
                                                onDuplicateToSection={handleDuplicateToSection}
                                                disabled={saving}
                                            />
                                        ))}
                                        <AddCategoryPopover
                                            zone="chip"
                                            availableCategories={availableForChips}
                                            onSelect={handleAddToChips}
                                            disabled={saving}
                                        />
                                    </div>
                                </SortableContext>
                                {chipCategories.length === 0 && (
                                    <div className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">
                                        Glissez une catégorie ici ou cliquez sur + pour ajouter
                                    </div>
                                )}
                            </DroppableZone>
                        </div>

                        {/* Sections */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Sections (Page catalogue)
                            </h3>
                            <DroppableZone
                                id="sections-zone"
                                isOver={overZone === 'section' && sourceZone !== 'section'}
                                className="min-h-[100px] p-2"
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
                                                onRemove={handleRemoveFromSections}
                                                onDuplicateToChip={handleDuplicateToChip}
                                                disabled={saving}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                                <div className="mt-2">
                                    <AddCategoryPopover
                                        zone="section"
                                        availableCategories={availableForSections}
                                        onSelect={handleAddToSections}
                                        disabled={saving}
                                    />
                                </div>
                                {sectionCategories.length === 0 && (
                                    <div className="flex items-center justify-center h-[60px] text-muted-foreground text-sm">
                                        Glissez une catégorie ici ou cliquez sur + pour ajouter
                                    </div>
                                )}
                            </DroppableZone>
                        </div>

                        {/* Drag Overlay */}
                        <DragOverlay>
                            {activeId && activeCategory && sourceZone === 'chip' && (
                                <SortableChipItem
                                    category={activeCategory}
                                    onEdit={() => {}}
                                    isDragOverlay
                                />
                            )}
                            {activeId && activeCategory && sourceZone === 'section' && (
                                <SortableSectionItem
                                    category={activeCategory}
                                    onEdit={() => {}}
                                    isDragOverlay
                                />
                            )}
                        </DragOverlay>
                    </DndContext>
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
                                    onPreview={handlePreview}
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

            {/* Preview Dialog */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                                style={{ backgroundColor: (previewCategory?.color || '#000') + '20' }}
                            >
                                {previewCategory?.emoji}
                            </span>
                            Prévisualisation : {previewCategory?.name.fr}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            {previewCategory?.dynamic_type === 'seasonality'
                                ? '🍂 Recettes de saison (mois actuel)'
                                : '⭐ Recommandations personnalisées'}
                        </p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        {previewLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : previewError ? (
                            <div className="text-center py-12">
                                <p className="text-destructive">{previewError}</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Vérifiez que le backend est en cours d&apos;exécution.
                                </p>
                            </div>
                        ) : previewRecipes.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Aucune recette trouvée pour cette catégorie.</p>
                                {previewCategory?.dynamic_type === 'seasonality' && (
                                    <p className="text-sm mt-2">
                                        Aucune recette n&apos;a de saisonnalité définie pour ce mois.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {previewRecipes.map((recipe) => (
                                    <div
                                        key={recipe.id}
                                        className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                                    >
                                        {recipe.img_path ? (
                                            <Image
                                                src={recipe.img_path}
                                                alt={recipe.title}
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                ?
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{recipe.title}</p>
                                            <p className="text-xs text-muted-foreground">ID: {recipe.id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                            {previewRecipes.length} recette{previewRecipes.length > 1 ? 's' : ''} affichée{previewRecipes.length > 1 ? 's' : ''}
                        </p>
                        <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
                            Fermer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
