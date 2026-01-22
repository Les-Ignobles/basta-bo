"use client"
import { useState, useEffect } from 'react'
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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { RecipeOrderItem } from '@/features/cooking/types/recipe-category'

type Props = {
    recipes: RecipeOrderItem[]
    onOrderChange: (recipeIds: number[]) => Promise<void>
    onRemove?: (recipeId: number) => Promise<void>
    disabled?: boolean
}

function SortableRecipeItem({
    recipe,
    disabled,
    onRemove,
    isRemoving,
}: {
    recipe: RecipeOrderItem
    disabled?: boolean
    onRemove?: (recipeId: number) => Promise<void>
    isRemoving?: boolean
}) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: recipe.id, disabled })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    async function handleConfirmRemove() {
        if (onRemove) {
            await onRemove(recipe.id)
            setIsConfirmOpen(false)
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 bg-background border rounded-lg ${
                isDragging ? 'opacity-50 shadow-lg z-50' : ''
            } ${disabled ? 'opacity-60' : ''}`}
        >
            <button
                type="button"
                className={`touch-none ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            <span className="w-8 h-8 flex items-center justify-center bg-muted rounded-full text-sm font-medium">
                {recipe.position}
            </span>

            {recipe.img_path ? (
                <img
                    src={recipe.img_path}
                    alt={recipe.title}
                    className="w-12 h-12 object-cover rounded-md"
                />
            ) : (
                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    ?
                </div>
            )}

            <span className="font-medium flex-1">{recipe.title}</span>

            {onRemove && !isDragging && (
                <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={disabled || isRemoving}
                        >
                            {isRemoving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Retirer la recette</AlertDialogTitle>
                            <AlertDialogDescription>
                                Voulez-vous vraiment retirer « {recipe.title} » de cette catégorie ?
                                La recette ne sera pas supprimée, elle sera simplement retirée de cette catégorie.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isRemoving}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmRemove}
                                disabled={isRemoving}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isRemoving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Suppression...
                                    </>
                                ) : (
                                    'Retirer'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    )
}

export function RecipeOrderList({ recipes: initialRecipes, onOrderChange, onRemove, disabled = false }: Props) {
    const [recipes, setRecipes] = useState(initialRecipes)
    const [saving, setSaving] = useState(false)
    const [removingId, setRemovingId] = useState<number | null>(null)

    // Sync internal state when prop changes (e.g., after adding a recipe)
    useEffect(() => {
        setRecipes(initialRecipes)
    }, [initialRecipes])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = recipes.findIndex((r) => r.id === active.id)
            const newIndex = recipes.findIndex((r) => r.id === over.id)

            const newRecipes = arrayMove(recipes, oldIndex, newIndex).map((r, index) => ({
                ...r,
                position: index + 1,
            }))

            setRecipes(newRecipes)

            // Save to backend
            setSaving(true)
            try {
                await onOrderChange(newRecipes.map((r) => r.id))
            } finally {
                setSaving(false)
            }
        }
    }

    async function handleRemove(recipeId: number) {
        if (!onRemove) return

        setRemovingId(recipeId)
        try {
            await onRemove(recipeId)
            // Remove from local state immediately for optimistic UI
            setRecipes((prev) => prev.filter((r) => r.id !== recipeId))
        } finally {
            setRemovingId(null)
        }
    }

    if (recipes.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Aucune recette dans cette catégorie
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {saving && (
                <div className="text-sm text-muted-foreground text-center py-2">
                    Sauvegarde en cours...
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={recipes.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {recipes.map((recipe) => (
                            <SortableRecipeItem
                                key={recipe.id}
                                recipe={recipe}
                                disabled={disabled || saving || removingId !== null}
                                onRemove={onRemove ? handleRemove : undefined}
                                isRemoving={removingId === recipe.id}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    )
}
