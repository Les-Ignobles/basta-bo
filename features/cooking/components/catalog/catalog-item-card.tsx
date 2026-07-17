"use client"
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { GripVertical, Pin, Plus, UtensilsCrossed, X } from 'lucide-react'
import { DYNAMIC_TYPE_LABELS, type RecipeCategory, type DragZone } from '@/features/cooking/types/recipe-category'

type Props = {
    category: RecipeCategory
    zone: DragZone
    onEdit: (category: RecipeCategory) => void
    onRemove?: (category: RecipeCategory) => void
    /** Ajoute la catégorie à l'autre zone (chip → bloc ou bloc → filtre) */
    onAddToOtherZone?: (category: RecipeCategory) => void
    disabled?: boolean
    isDragOverlay?: boolean
}

/**
 * Carte de catégorie du plan du catalogue, sortable dans sa zone.
 * `zone === 'chip'` : tuile verticale (comme les filtres rapides in-app).
 * `zone === 'section'` : rangée horizontale (comme les blocs in-app).
 */
export function CatalogItemCard({ category, zone, onEdit, onRemove, onAddToOtherZone, disabled, isDragOverlay = false }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `${zone}-${category.id}`,
        disabled,
    })

    const style = isDragOverlay ? {} : {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const inOtherZone = zone === 'chip' ? category.display_as_section : category.display_as_chip
    const canAddToOtherZone = onAddToOtherZone && !inOtherZone
    const otherZoneLabel = zone === 'chip' ? 'Ajouter aussi comme bloc' : 'Ajouter aussi comme filtre rapide'

    const dragHandle = (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className={`touch-none ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'} ${
                        zone === 'chip' ? 'absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity' : ''
                    }`}
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className={zone === 'chip' ? 'h-4 w-4 text-white/80' : 'h-5 w-5 text-muted-foreground'} />
                </button>
            </TooltipTrigger>
            <TooltipContent side={zone === 'chip' ? 'top' : 'left'}>
                <p>Glisser pour réordonner</p>
            </TooltipContent>
        </Tooltip>
    )

    const addToOtherZoneButton = canAddToOtherZone && !isDragOverlay && (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                        zone === 'chip' ? 'absolute bottom-0 right-0 h-6 w-6 text-white hover:text-white hover:bg-white/20' : ''
                    }`}
                    onClick={(e) => {
                        e.stopPropagation()
                        onAddToOtherZone?.(category)
                    }}
                >
                    <Plus className={zone === 'chip' ? 'h-3 w-3' : 'h-4 w-4'} />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{otherZoneLabel}</p>
            </TooltipContent>
        </Tooltip>
    )

    const removeButton = onRemove && !isDragOverlay && (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                        zone === 'chip'
                            ? 'absolute top-0 right-0 h-6 w-6 text-white hover:text-white hover:bg-white/20'
                            : 'text-destructive hover:text-destructive'
                    }`}
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove(category)
                    }}
                >
                    <X className={zone === 'chip' ? 'h-3 w-3' : 'h-4 w-4'} />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
                <p>{zone === 'chip' ? 'Retirer des filtres rapides' : 'Retirer des blocs'}</p>
            </TooltipContent>
        </Tooltip>
    )

    if (zone === 'chip') {
        // Tuile colorée fidèle aux filtres rapides in-app (fond couleur catégorie, emoji, texte clair)
        return (
            <TooltipProvider>
                <div
                    ref={!isDragOverlay ? setNodeRef : undefined}
                    style={{ ...style, backgroundColor: category.color }}
                    className={`relative flex flex-col items-start justify-between p-4 rounded-2xl min-w-[140px] min-h-[110px] cursor-pointer group ${
                        isDragging && !isDragOverlay ? 'opacity-30' : ''
                    } ${isDragOverlay ? 'shadow-lg ring-2 ring-primary' : ''} ${disabled ? 'opacity-60' : ''}`}
                    onClick={() => !isDragOverlay && onEdit(category)}
                >
                    {dragHandle}
                    {removeButton}
                    {addToOtherZoneButton}
                    <span className="text-3xl drop-shadow-sm">{category.emoji}</span>
                    <div className="mt-2">
                        <span className="block text-sm font-semibold text-white drop-shadow-sm">{category.name.fr}</span>
                        <span className="text-[10px] text-white/70">Position {category.chip_order}</span>
                    </div>
                </div>
            </TooltipProvider>
        )
    }

    return (
        <TooltipProvider>
            <div
                ref={!isDragOverlay ? setNodeRef : undefined}
                style={style}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer group ${
                    isDragging && !isDragOverlay ? 'opacity-30' : ''
                } ${isDragOverlay ? 'shadow-lg ring-2 ring-primary' : ''} ${disabled ? 'opacity-60' : ''} bg-background`}
                onClick={() => !isDragOverlay && onEdit(category)}
            >
                {dragHandle}

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
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="secondary" className="gap-1 cursor-help">
                                    <Pin className="h-3 w-3" />
                                    Badge
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Affiché comme badge sur les cartes de recettes</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {category.display_as_chip && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-help">Filtre</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Visible comme filtre rapide en haut du catalogue</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {category.is_dynamic && category.dynamic_type && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="default" className="text-xs cursor-help">
                                    {DYNAMIC_TYPE_LABELS[category.dynamic_type].emoji} Auto
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{DYNAMIC_TYPE_LABELS[category.dynamic_type].description}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {addToOtherZoneButton}

                    {!category.is_dynamic && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`/dashboard/recipe-categories/${category.id}/order`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button variant="outline" size="sm" className="gap-1.5">
                                        <UtensilsCrossed className="h-4 w-4" />
                                        <span className="hidden sm:inline">Recettes</span>
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ajouter ou organiser les recettes de cette catégorie</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {removeButton}
                </div>
            </div>
        </TooltipProvider>
    )
}
