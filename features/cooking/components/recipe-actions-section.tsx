"use client"
import { useState, useEffect, useCallback } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    MeasuringStrategy,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import { Wand2, Loader2, Trash2, AlertCircle, Plus, X, ChefHat, GripVertical } from 'lucide-react'
import type { RecipeActionBO, RecipeActionIngredientBO, Ingredient } from '@/features/cooking/types'
import { RecipeActionType, RECIPE_ACTION_TYPE_LABELS, CookingEquipmentBO, COOKING_EQUIPMENT_LABELS } from '@/features/cooking/types'

type Props = {
    recipeId: number
}

export function RecipeActionsSection({ recipeId }: Props) {
    const [actions, setActions] = useState<RecipeActionBO[]>([])
    const [recipeIngredients, setRecipeIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)
    const [converting, setConverting] = useState(false)
    const [convertError, setConvertError] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const fetchActions = useCallback(async () => {
        try {
            const res = await fetch(`/api/recipes/${recipeId}/actions`)
            if (res.ok) {
                const data = await res.json()
                setActions(data.data ?? [])
            }
        } catch (error) {
            console.error('Failed to fetch actions:', error)
        } finally {
            setLoading(false)
        }
    }, [recipeId])

    const fetchIngredients = useCallback(async () => {
        try {
            const res = await fetch(`/api/recipes/${recipeId}/ingredients`)
            if (res.ok) {
                const data = await res.json()
                setRecipeIngredients(data.data ?? [])
            }
        } catch (error) {
            console.error('Failed to fetch ingredients:', error)
        }
    }, [recipeId])

    useEffect(() => {
        fetchActions()
        fetchIngredients()
    }, [fetchActions, fetchIngredients])

    const handleConvert = async () => {
        setConverting(true)
        setConvertError(null)

        try {
            const res = await fetch('/api/firebase/recipes/normalize-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipe_ids: [recipeId],
                    force: true,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erreur lors de la conversion')
            }

            const result = data.data?.results?.[0]
            if (result?.status === 'error') {
                throw new Error(result.error || 'Erreur lors de la conversion')
            }

            await fetchActions()
        } catch (error) {
            setConvertError(error instanceof Error ? error.message : 'Erreur inconnue')
        } finally {
            setConverting(false)
        }
    }

    const handleAddAction = async () => {
        const nextStepIndex = actions.length > 0
            ? Math.max(...actions.map(a => a.step_index)) + 1
            : 0

        try {
            const res = await fetch(`/api/recipes/${recipeId}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step_index: nextStepIndex,
                    action_type: RecipeActionType.CUT,
                    normalized_instruction: '',
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setActions(prev => [...prev, data.data])
            }
        } catch (error) {
            console.error('Failed to add action:', error)
        }
    }

    const handleDeleteAll = async () => {
        if (!confirm('Supprimer toutes les etapes de cette recette ?')) return

        try {
            await fetch(`/api/recipes/${recipeId}/actions`, { method: 'DELETE' })
            setActions([])
        } catch (error) {
            console.error('Failed to delete all actions:', error)
        }
    }

    const handleDeleteAction = async (actionId: number) => {
        try {
            await fetch(`/api/recipes/${recipeId}/actions/${actionId}`, { method: 'DELETE' })
            setActions(prev => prev.filter(a => a.id !== actionId))
        } catch (error) {
            console.error('Failed to delete action:', error)
        }
    }

    const handleUpdateAction = (actionId: number, field: string, value: unknown) => {
        // Optimistic update
        setActions(prev => prev.map(a => a.id === actionId ? { ...a, [field]: value } : a))

        // Sync in background
        fetch(`/api/recipes/${recipeId}/actions/${actionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value }),
        }).catch(error => {
            console.error('Failed to update action:', error)
        })
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = actions.findIndex(a => a.id === active.id)
        const newIndex = actions.findIndex(a => a.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(actions, oldIndex, newIndex)
        const updated = reordered.map((action, i) => ({ ...action, step_index: i }))
        setActions(updated)

        // Persist new order in background
        for (const action of updated) {
            if (action.step_index !== actions.find(a => a.id === action.id)?.step_index) {
                handleUpdateAction(action.id, 'step_index', action.step_index)
            }
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Etapes de preparation</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-foreground">Etapes de preparation</h3>
                    {actions.length > 0 && (
                        <Badge variant="secondary">{actions.length} etapes</Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {actions.length > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteAll}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Tout supprimer
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleConvert}
                        disabled={converting}
                    >
                        {converting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Conversion...
                            </>
                        ) : (
                            <>
                                <Wand2 className="h-4 w-4 mr-1" />
                                {actions.length > 0 ? 'Reconvertir (IA)' : 'Convertir depuis texte (IA)'}
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleAddAction}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                    </Button>
                </div>
            </div>

            {/* Error */}
            {convertError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {convertError}
                </div>
            )}

            {/* Empty state */}
            {actions.length === 0 && !converting && (
                <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <ChefHat className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Aucune etape pour cette recette.</p>
                    <p className="text-xs mt-1">Ajoutez des etapes manuellement ou convertissez les instructions textuelles via l&apos;IA.</p>
                </div>
            )}

            {/* Actions table with drag & drop */}
            {actions.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                >
                    <SortableContext
                        items={actions.map(a => a.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="border rounded-lg overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="w-8"></th>
                                        <th className="px-3 py-2 text-left font-medium w-10">#</th>
                                        <th className="px-3 py-2 text-left font-medium w-36">Action</th>
                                        <th className="px-3 py-2 text-left font-medium">Instruction</th>
                                        <th className="px-3 py-2 text-left font-medium w-44">Equipement</th>
                                        <th className="px-3 py-2 text-left font-medium w-24">Tps actif</th>
                                        <th className="px-3 py-2 text-left font-medium w-24">Tps passif</th>
                                        <th className="px-3 py-2 text-left font-medium w-52">Ingredients</th>
                                        <th className="px-3 py-2 text-left font-medium w-28">Phase</th>
                                        <th className="px-3 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {actions.map((action) => (
                                        <SortableActionRow
                                            key={action.id}
                                            action={action}
                                            recipeIngredients={recipeIngredients}
                                            onUpdate={handleUpdateAction}
                                            onDelete={handleDeleteAction}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    )
}

function SortableActionRow({
    action,
    recipeIngredients,
    onUpdate,
    onDelete,
}: {
    action: RecipeActionBO
    recipeIngredients: Ingredient[]
    onUpdate: (actionId: number, field: string, value: unknown) => void
    onDelete: (actionId: number) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: action.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className="border-b last:border-b-0 hover:bg-muted/30"
        >
            <td className="pl-2 py-2">
                <button
                    className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4" />
                </button>
            </td>
            <td className="px-3 py-2">
                <span className="text-xs font-mono text-muted-foreground">{action.step_index}</span>
            </td>
            <td className="px-3 py-2">
                <SearchableSelect
                    value={action.action_type}
                    options={Object.values(RecipeActionType).map(t => ({
                        value: t,
                        label: RECIPE_ACTION_TYPE_LABELS[t],
                    }))}
                    onSelect={(val) => onUpdate(action.id, 'action_type', val)}
                    placeholder="Type..."
                />
            </td>
            <td className="px-3 py-2">
                <EditableText
                    value={action.normalized_instruction}
                    onSave={(val) => onUpdate(action.id, 'normalized_instruction', val)}
                    placeholder="Instruction..."
                />
            </td>
            <td className="px-3 py-2">
                <SearchableSelect
                    value={action.equipment ?? 'none'}
                    options={Object.values(CookingEquipmentBO).map(eq => ({
                        value: eq,
                        label: COOKING_EQUIPMENT_LABELS[eq],
                    }))}
                    onSelect={(val) => onUpdate(action.id, 'equipment', val === 'none' ? null : val)}
                    placeholder="Equipement..."
                />
            </td>
            <td className="px-3 py-2">
                <EditableNumber
                    value={action.duration_minutes}
                    onSave={(val) => onUpdate(action.id, 'duration_minutes', val)}
                    suffix="min"
                />
            </td>
            <td className="px-3 py-2">
                <EditableNumber
                    value={action.passive_time_minutes}
                    onSave={(val) => onUpdate(action.id, 'passive_time_minutes', val)}
                    suffix="min"
                />
            </td>
            <td className="px-3 py-2">
                <IngredientMultiSelect
                    selected={action.ingredients ?? []}
                    recipeIngredients={recipeIngredients}
                    onSave={(ingredients) => onUpdate(action.id, 'ingredients', ingredients)}
                />
            </td>
            <td className="px-3 py-2">
                <Select
                    value={action.phase ?? 'cooking'}
                    onValueChange={(val) => onUpdate(action.id, 'phase', val)}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cooking" className="text-xs">Cuisson</SelectItem>
                        <SelectItem value="assembly" className="text-xs">Assemblage</SelectItem>
                    </SelectContent>
                </Select>
            </td>
            <td className="px-3 py-2">
                <button
                    onClick={() => onDelete(action.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Supprimer"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </td>
        </tr>
    )
}

function SearchableSelect({
    value,
    options,
    onSelect,
    placeholder,
}: {
    value: string
    options: { value: string; label: string }[]
    onSelect: (value: string) => void
    placeholder?: string
}) {
    const [open, setOpen] = useState(false)
    const selectedLabel = options.find(o => o.value === value)?.label

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs w-full justify-between font-normal"
                >
                    <span className="truncate">{selectedLabel || placeholder}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Rechercher..." className="text-xs h-8" />
                    <CommandList>
                        <CommandEmpty className="text-xs p-2 text-center">Aucun resultat</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onSelect(option.value)
                                        setOpen(false)
                                    }}
                                    className="text-xs"
                                >
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function IngredientMultiSelect({
    selected,
    recipeIngredients,
    onSave,
}: {
    selected: RecipeActionIngredientBO[]
    recipeIngredients: Ingredient[]
    onSave: (ingredients: RecipeActionIngredientBO[]) => void
}) {
    const [open, setOpen] = useState(false)
    const selectedIds = new Set(selected.map(s => s.ingredient_id))

    const toggleIngredient = (ingredient: Ingredient) => {
        const id = ingredient.id
        let updated: RecipeActionIngredientBO[]

        if (selectedIds.has(id)) {
            updated = selected.filter(s => s.ingredient_id !== id)
        } else {
            updated = [...selected, { name: ingredient.name.fr, ingredient_id: id }]
        }

        onSave(updated)
    }

    const removeIngredient = (ingredientId: number) => {
        onSave(selected.filter(s => s.ingredient_id !== ingredientId))
    }

    if (recipeIngredients.length === 0) {
        return (
            <span className="text-xs text-muted-foreground/50 italic">
                Aucun ingredient lie
            </span>
        )
    }

    return (
        <div className="flex flex-col gap-1">
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selected.map((ing) => (
                        <Badge key={ing.ingredient_id} variant="secondary" className="text-[10px] py-0 px-1.5 gap-0.5">
                            {ing.name}
                            <button
                                onClick={(e) => { e.stopPropagation(); removeIngredient(ing.ingredient_id) }}
                                className="ml-0.5 hover:text-destructive"
                            >
                                <X className="h-2.5 w-2.5" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 w-fit">
                        <Plus className="h-3 w-3 mr-1" />
                        {selected.length === 0 ? 'Ajouter' : '+'}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Chercher un ingredient..."
                            className="text-xs h-8"
                        />
                        <CommandList>
                            <CommandEmpty className="text-xs p-2 text-center">Aucun resultat</CommandEmpty>
                            <CommandGroup>
                                {recipeIngredients.map((ingredient) => (
                                    <CommandItem
                                        key={ingredient.id}
                                        value={ingredient.name.fr}
                                        onSelect={() => toggleIngredient(ingredient)}
                                        className="text-xs flex items-center gap-2"
                                    >
                                        <Checkbox
                                            checked={selectedIds.has(ingredient.id)}
                                            className="h-3.5 w-3.5"
                                        />
                                        {ingredient.name.fr}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

function EditableText({ value, onSave, placeholder }: { value: string; onSave: (val: string) => void; placeholder?: string }) {
    const [editing, setEditing] = useState(false)
    const [localValue, setLocalValue] = useState(value)

    if (!editing) {
        return (
            <span
                className="text-xs cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 block min-h-[20px]"
                onClick={() => { setLocalValue(value); setEditing(true) }}
                title="Cliquer pour modifier"
            >
                {value || <span className="text-muted-foreground/50 italic">{placeholder || 'Vide'}</span>}
            </span>
        )
    }

    return (
        <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
                setEditing(false)
                if (localValue !== value) onSave(localValue)
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    setEditing(false)
                    if (localValue !== value) onSave(localValue)
                }
                if (e.key === 'Escape') {
                    setEditing(false)
                    setLocalValue(value)
                }
            }}
            className="h-7 text-xs"
            placeholder={placeholder}
            autoFocus
        />
    )
}

function EditableNumber({ value, onSave, suffix }: { value: number; onSave: (val: number) => void; suffix?: string }) {
    const [editing, setEditing] = useState(false)
    const [localValue, setLocalValue] = useState(String(value))

    if (!editing) {
        return (
            <span
                className="text-xs cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 block"
                onClick={() => { setLocalValue(String(value)); setEditing(true) }}
                title="Cliquer pour modifier"
            >
                {value}{suffix ? ` ${suffix}` : ''}
            </span>
        )
    }

    return (
        <Input
            type="number"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
                setEditing(false)
                const num = parseInt(localValue) || 0
                if (num !== value) onSave(num)
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    setEditing(false)
                    const num = parseInt(localValue) || 0
                    if (num !== value) onSave(num)
                }
                if (e.key === 'Escape') {
                    setEditing(false)
                    setLocalValue(String(value))
                }
            }}
            className="h-7 text-xs w-16"
            min={0}
            autoFocus
        />
    )
}
