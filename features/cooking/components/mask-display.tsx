import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { decodeMask } from '@/lib/utils/mask-utils'

interface MaskDisplayProps {
    mask: number | null
    items: Array<{ id: number; name: string; emoji?: string }>
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
                    {item.name}
                </Badge>
            ))}
            {remainingCount > 0 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="secondary" className="text-xs cursor-help">
                                +{remainingCount}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="space-y-1">
                                <div className="font-medium text-xs">Équipements restants :</div>
                                <div className="flex flex-wrap gap-1">
                                    {decodedItems.slice(maxItems).map((item) => (
                                        <Badge key={item.id} variant="outline" className="text-xs">
                                            {item.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    )
}
