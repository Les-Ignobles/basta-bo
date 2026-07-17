"use client"
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus } from 'lucide-react'
import type { RecipeCategory, DragZone } from '@/features/cooking/types/recipe-category'

export function AddCategoryPopover({
    zone,
    availableCategories,
    onSelect,
    disabled,
}: {
    zone: DragZone
    availableCategories: RecipeCategory[]
    onSelect: (category: RecipeCategory) => void
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)

    const handleSelect = (category: RecipeCategory) => {
        onSelect(category)
        setOpen(false)
    }

    const zoneLabel = zone === 'chip' ? 'filtre rapide' : 'bloc'

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
                        Ajouter comme {zoneLabel}
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
