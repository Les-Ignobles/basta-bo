"use client"
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, X } from 'lucide-react'
import { DISH_TYPE_LABELS, DishType } from '@/features/cooking/types'
import { useState } from 'react'

type Props = {
    selectedCount: number
    onClearSelection: () => void
    onBulkDelete: () => void
    onBulkUpdateDishType: (dishType: DishType) => void
}

export function BulkActionsBar({ selectedCount, onClearSelection, onBulkDelete, onBulkUpdateDishType }: Props) {
    const [selectedDishType, setSelectedDishType] = useState<DishType | ''>('')

    const handleDishTypeChange = (value: string) => {
        if (value === '1' || value === '2' || value === '3') {
            const dishType = Number(value) as DishType
            setSelectedDishType(dishType)
            onBulkUpdateDishType(dishType)
        }
    }

    return (
        <div className="sticky top-0 z-20 bg-blue-50 border-b border-blue-200 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-blue-900">
                        {selectedCount} recette{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="h-8 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Désélectionner
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={selectedDishType.toString()} onValueChange={handleDishTypeChange}>
                        <SelectTrigger className="w-[200px] h-8 bg-white">
                            <SelectValue placeholder="Changer le type..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">{DISH_TYPE_LABELS[1]}</SelectItem>
                            <SelectItem value="2">{DISH_TYPE_LABELS[2]}</SelectItem>
                            <SelectItem value="3">{DISH_TYPE_LABELS[3]}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onBulkDelete}
                        className="h-8"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                    </Button>
                </div>
            </div>
        </div>
    )
}
