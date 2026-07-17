"use client"
import { useCallback, useState } from 'react'
import {
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { DragZone, RecipeCategory, RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'

const ZONE_FLAG: Record<DragZone, 'display_as_chip' | 'display_as_section'> = {
    chip: 'display_as_chip',
    section: 'display_as_section',
}

const ZONE_ORDER: Record<DragZone, 'chip_order' | 'section_order'> = {
    chip: 'chip_order',
    section: 'section_order',
}

export function getZoneFromId(id: string | number): DragZone | null {
    const idStr = String(id)
    if (idStr.startsWith('chip-')) return 'chip'
    if (idStr.startsWith('section-')) return 'section'
    return null
}

/**
 * Logique du plan du catalogue : zones chips/sections, drag & drop
 * (réordonnancement même zone + déplacement inter-zones), ajout/retrait.
 * Toute la logique est paramétrée par la zone — une seule implémentation.
 */
export function useCatalogDnd({
    categories,
    setCategories,
    saveOrder,
    updateCategory,
}: {
    categories: RecipeCategory[]
    setCategories: (categories: RecipeCategory[]) => void
    saveOrder: (updates: { id: number; chip_order?: number; section_order?: number }[]) => Promise<void>
    updateCategory: (id: number, updates: Partial<RecipeCategoryFormValues>) => Promise<void>
}) {
    const [activeId, setActiveId] = useState<string | null>(null)
    const [overZone, setOverZone] = useState<DragZone | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const zoneCategories = useCallback(
        (zone: DragZone) =>
            categories
                .filter(c => c[ZONE_FLAG[zone]])
                .sort((a, b) => a[ZONE_ORDER[zone]] - b[ZONE_ORDER[zone]]),
        [categories]
    )

    const chipCategories = zoneCategories('chip')
    const sectionCategories = zoneCategories('section')

    const activeCategory = activeId
        ? categories.find(c => `chip-${c.id}` === activeId || `section-${c.id}` === activeId) ?? null
        : null
    const sourceZone = activeId ? getZoneFromId(activeId) : null

    const nextOrderInZone = (zone: DragZone) =>
        Math.max(0, ...zoneCategories(zone).map(c => c[ZONE_ORDER[zone]])) + 1

    /** Ajoute une catégorie à une zone (fin de liste), avec update optimiste. */
    const addToZone = async (category: RecipeCategory, zone: DragZone) => {
        if (category[ZONE_FLAG[zone]]) return
        const newOrder = nextOrderInZone(zone)

        setCategories(categories.map(c =>
            c.id === category.id
                ? { ...c, [ZONE_FLAG[zone]]: true, [ZONE_ORDER[zone]]: newOrder }
                : c
        ))
        await updateCategory(category.id, {
            [ZONE_FLAG[zone]]: true,
            [ZONE_ORDER[zone]]: newOrder,
        })
    }

    /** Retire une catégorie d'une zone, avec update optimiste. */
    const removeFromZone = async (category: RecipeCategory, zone: DragZone) => {
        setCategories(categories.map(c =>
            c.id === category.id ? { ...c, [ZONE_FLAG[zone]]: false } : c
        ))
        await updateCategory(category.id, { [ZONE_FLAG[zone]]: false })
    }

    const resolveTargetZone = (overId: string): DragZone | null => {
        if (overId === 'chips-zone') return 'chip'
        if (overId === 'sections-zone') return 'section'
        return getZoneFromId(overId)
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id))
        setOverZone(getZoneFromId(event.active.id))
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event
        setOverZone(over ? resolveTargetZone(String(over.id)) : null)
    }

    const handleDragCancel = () => {
        setActiveId(null)
        setOverZone(null)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        setActiveId(null)
        setOverZone(null)

        if (!over || !sourceZone || !activeCategory) return

        const targetZone = resolveTargetZone(String(over.id))
        if (!targetZone) return

        // Déplacement inter-zones : quitte la zone source, rejoint la cible en fin de liste
        if (sourceZone !== targetZone) {
            if (activeCategory[ZONE_FLAG[targetZone]]) {
                // Déjà présente dans la cible : on la retire juste de la source
                await removeFromZone(activeCategory, sourceZone)
                return
            }

            const newOrder = nextOrderInZone(targetZone)
            setCategories(categories.map(c =>
                c.id === activeCategory.id
                    ? {
                        ...c,
                        [ZONE_FLAG.chip]: targetZone === 'chip',
                        [ZONE_FLAG.section]: targetZone === 'section',
                        [ZONE_ORDER[targetZone]]: newOrder,
                    }
                    : c
            ))
            await updateCategory(activeCategory.id, {
                display_as_chip: targetZone === 'chip',
                display_as_section: targetZone === 'section',
                [ZONE_ORDER[targetZone]]: newOrder,
            })
            return
        }

        // Réordonnancement dans la même zone
        if (active.id === over.id) return

        const zoneList = zoneCategories(sourceZone)
        const oldIndex = zoneList.findIndex(c => `${sourceZone}-${c.id}` === active.id)
        const newIndex = zoneList.findIndex(c => `${sourceZone}-${c.id}` === over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(zoneList, oldIndex, newIndex)
        const orderKey = ZONE_ORDER[sourceZone]

        setCategories(categories.map(cat => {
            const newOrder = reordered.findIndex(c => c.id === cat.id)
            return newOrder !== -1 ? { ...cat, [orderKey]: newOrder + 1 } : cat
        }))
        await saveOrder(reordered.map((c, i) => ({ id: c.id, [orderKey]: i + 1 })))
    }

    return {
        sensors,
        activeId,
        activeCategory,
        sourceZone,
        overZone,
        chipCategories,
        sectionCategories,
        addToZone,
        removeFromZone,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragCancel,
    }
}
