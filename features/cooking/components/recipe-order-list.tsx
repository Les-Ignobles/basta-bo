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
import { GripVertical } from 'lucide-react'
import type { RecipeOrderItem } from '@/features/cooking/types/recipe-category'

type Props = {
    recipes: RecipeOrderItem[]
    onOrderChange: (recipeIds: number[]) => Promise<void>
    disabled?: boolean
}

function SortableRecipeItem({ recipe, disabled }: { recipe: RecipeOrderItem; disabled?: boolean }) {
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
        </div>
    )
}

export function RecipeOrderList({ recipes: initialRecipes, onOrderChange, disabled = false }: Props) {
    const [recipes, setRecipes] = useState(initialRecipes)
    const [saving, setSaving] = useState(false)

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
                                disabled={disabled || saving}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    )
}
