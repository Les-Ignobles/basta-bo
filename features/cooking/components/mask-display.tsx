import { Badge } from '@/components/ui/badge'
import { decodeMask } from '@/lib/utils/mask-utils'

interface MaskDisplayProps {
    mask: number | null
    items: Array<{ id: number; displayText: string }>
    maxItems?: number
    className?: string
}

export function MaskDisplay({ mask, items, maxItems = 3, className = '' }: MaskDisplayProps) {
    const decodedItems = decodeMask(mask, items)

    if (decodedItems.length === 0) {
        return <span className="text-muted-foreground text-sm">Aucun</span>
    }

    const displayItems = decodedItems.slice(0, maxItems)
    const remainingCount = decodedItems.length - maxItems

    return (
        <div className={`flex flex-wrap gap-1 ${className}`}>
            {displayItems.map((item) => (
                <Badge key={item.id} variant="outline" className="text-xs">
                    {item.displayText}
                </Badge>
            ))}
            {remainingCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                    +{remainingCount}
                </Badge>
            )}
        </div>
    )
}
