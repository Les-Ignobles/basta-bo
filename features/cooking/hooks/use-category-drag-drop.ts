import { useState, useCallback, useMemo } from 'react'
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { RecipeCategory, DragState, DragZone } from '@/features/cooking/types/recipe-category'

/**
 * Extract zone from sortable ID (chip-123 -> 'chip', section-456 -> 'section')
 */
export function getZoneFromId(id: string | number): DragZone | null {
    const idStr = String(id)
    if (idStr.startsWith('chip-')) return 'chip'
    if (idStr.startsWith('section-')) return 'section'
    return null
}

/**
 * Extract category ID from sortable ID (chip-123 -> 123)
 */
export function getCategoryIdFromDragId(id: string | number): number {
    const idStr = String(id)
    const match = idStr.match(/^(?:chip|section)-(\d+)$/)
    return match ? parseInt(match[1], 10) : -1
}

interface UseCategoryDragDropOptions {
    categories: RecipeCategory[]
    onReorderChips: (reordered: RecipeCategory[]) => Promise<void>
    onReorderSections: (reordered: RecipeCategory[]) => Promise<void>
    onCrossZoneDrag: (categoryId: number, fromZone: DragZone, toZone: DragZone) => Promise<void>
}

/**
 * Hook for managing drag & drop state and handlers for category zones
 */
export function useCategoryDragDrop({
    categories,
    onReorderChips,
    onReorderSections,
    onCrossZoneDrag,
}: UseCategoryDragDropOptions) {
    const [dragState, setDragState] = useState<DragState>({
        activeId: null,
        activeCategory: null,
        sourceZone: null,
        overZone: null,
    })

    // Computed filtered/sorted categories
    const chipCategories = useMemo(() =>
        categories
            .filter(c => c.display_as_chip)
            .sort((a, b) => a.chip_order - b.chip_order),
        [categories]
    )

    const sectionCategories = useMemo(() =>
        categories
            .filter(c => c.display_as_section)
            .sort((a, b) => a.section_order - b.section_order),
        [categories]
    )

    const availableForChips = useMemo(() =>
        categories
            .filter(c => !c.display_as_chip)
            .sort((a, b) => a.name.fr.localeCompare(b.name.fr)),
        [categories]
    )

    const availableForSections = useMemo(() =>
        categories
            .filter(c => !c.display_as_section)
            .sort((a, b) => a.name.fr.localeCompare(b.name.fr)),
        [categories]
    )

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event
        const zone = getZoneFromId(active.id)
        const categoryId = getCategoryIdFromDragId(active.id)
        const category = categories.find(c => c.id === categoryId) || null

        setDragState({
            activeId: String(active.id),
            activeCategory: category,
            sourceZone: zone,
            overZone: zone,
        })
    }, [categories])

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { over } = event
        if (!over) {
            setDragState(prev => ({ ...prev, overZone: null }))
            return
        }

        // Check if over a zone container or an item
        const overId = String(over.id)
        let overZone: DragZone | null = null

        if (overId === 'chips-zone') {
            overZone = 'chip'
        } else if (overId === 'sections-zone') {
            overZone = 'section'
        } else {
            overZone = getZoneFromId(over.id)
        }

        setDragState(prev => ({ ...prev, overZone }))
    }, [])

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event
        const { sourceZone, activeCategory } = dragState

        // Reset drag state
        setDragState({
            activeId: null,
            activeCategory: null,
            sourceZone: null,
            overZone: null,
        })

        if (!over || !sourceZone || !activeCategory) return

        const overId = String(over.id)
        let targetZone: DragZone | null = null

        // Determine target zone
        if (overId === 'chips-zone') {
            targetZone = 'chip'
        } else if (overId === 'sections-zone') {
            targetZone = 'section'
        } else {
            targetZone = getZoneFromId(over.id)
        }

        if (!targetZone) return

        // Cross-zone drag
        if (sourceZone !== targetZone) {
            await onCrossZoneDrag(activeCategory.id, sourceZone, targetZone)
            return
        }

        // Same-zone reorder
        if (active.id === over.id) return

        if (sourceZone === 'chip') {
            const oldIndex = chipCategories.findIndex(c => `chip-${c.id}` === active.id)
            const newIndex = chipCategories.findIndex(c => `chip-${c.id}` === over.id)
            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(chipCategories, oldIndex, newIndex)
                await onReorderChips(reordered)
            }
        } else if (sourceZone === 'section') {
            const oldIndex = sectionCategories.findIndex(c => `section-${c.id}` === active.id)
            const newIndex = sectionCategories.findIndex(c => `section-${c.id}` === over.id)
            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(sectionCategories, oldIndex, newIndex)
                await onReorderSections(reordered)
            }
        }
    }, [dragState, chipCategories, sectionCategories, onReorderChips, onReorderSections, onCrossZoneDrag])

    const handleDragCancel = useCallback(() => {
        setDragState({
            activeId: null,
            activeCategory: null,
            sourceZone: null,
            overZone: null,
        })
    }, [])

    return {
        dragState,
        chipCategories,
        sectionCategories,
        availableForChips,
        availableForSections,
        handlers: {
            onDragStart: handleDragStart,
            onDragOver: handleDragOver,
            onDragEnd: handleDragEnd,
            onDragCancel: handleDragCancel,
        },
    }
}
