"use client"
import { useDroppable } from '@dnd-kit/core'

export function DroppableZone({
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
