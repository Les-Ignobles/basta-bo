"use client"
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, X, Calendar, Utensils } from 'lucide-react'
import { DISH_TYPE_LABELS, DishType } from '@/features/cooking/types'
import type { Diet } from '@/features/cooking/types/diet'
import { useState } from 'react'

type Props = {
    selectedCount: number
    onClearSelection: () => void
    onBulkDelete: () => void
    onBulkUpdateDishType: (dishType: DishType) => void
    onBulkUpdateSeasonality: (mask: number) => void
    onBulkUpdateDietMask: (mask: number) => void
    diets: Diet[]
}

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export function BulkActionsBar({ selectedCount, onClearSelection, onBulkDelete, onBulkUpdateDishType, onBulkUpdateSeasonality, onBulkUpdateDietMask, diets }: Props) {
    const [selectedDishType, setSelectedDishType] = useState<DishType | ''>('')
    const [selectedMonths, setSelectedMonths] = useState<number[]>([])
    const [selectedDiets, setSelectedDiets] = useState<number[]>([])
    const [seasonalityOpen, setSeasonalityOpen] = useState(false)
    const [dietOpen, setDietOpen] = useState(false)

    const handleDishTypeChange = (value: string) => {
        if (value === '1' || value === '2' || value === '3') {
            const dishType = Number(value) as DishType
            setSelectedDishType(dishType)
            onBulkUpdateDishType(dishType)
        }
    }

    const handleMonthToggle = (monthIndex: number) => {
        setSelectedMonths(prev =>
            prev.includes(monthIndex)
                ? prev.filter(m => m !== monthIndex)
                : [...prev, monthIndex]
        )
    }

    const handleApplySeasonality = () => {
        let mask = 0
        for (const monthIndex of selectedMonths) {
            mask |= (1 << monthIndex)
        }
        onBulkUpdateSeasonality(mask)
        setSeasonalityOpen(false)
        setSelectedMonths([])
    }

    const handleDietToggle = (dietIndex: number) => {
        setSelectedDiets(prev =>
            prev.includes(dietIndex)
                ? prev.filter(i => i !== dietIndex)
                : [...prev, dietIndex]
        )
    }

    const handleApplyDiets = () => {
        let mask = 0
        for (const dietIndex of selectedDiets) {
            const diet = diets[dietIndex]
            if (diet) {
                mask |= (1 << diet.bit_index)
            }
        }
        onBulkUpdateDietMask(mask)
        setDietOpen(false)
        setSelectedDiets([])
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

                    <Popover open={seasonalityOpen} onOpenChange={setSeasonalityOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 bg-white"
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Mois compatibles
                                {selectedMonths.length > 0 && (
                                    <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                                        {selectedMonths.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-medium mb-2">Sélectionnez les mois</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {MONTHS.map((month, index) => (
                                            <label
                                                key={index}
                                                className="flex items-center gap-2 text-sm cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={selectedMonths.includes(index)}
                                                    onCheckedChange={() => handleMonthToggle(index)}
                                                />
                                                <span>{month}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedMonths([])
                                            setSeasonalityOpen(false)
                                        }}
                                        className="flex-1"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleApplySeasonality}
                                        disabled={selectedMonths.length === 0}
                                        className="flex-1"
                                    >
                                        Appliquer
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover open={dietOpen} onOpenChange={setDietOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 bg-white"
                            >
                                <Utensils className="h-4 w-4 mr-2" />
                                Régimes
                                {selectedDiets.length > 0 && (
                                    <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                                        {selectedDiets.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-medium mb-2">Sélectionnez les régimes</h4>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                        {diets.map((diet, index) => (
                                            <label
                                                key={diet.id}
                                                className="flex items-center gap-2 text-sm cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={selectedDiets.includes(index)}
                                                    onCheckedChange={() => handleDietToggle(index)}
                                                />
                                                <span>{diet.emoji} {diet.title.fr}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedDiets([])
                                            setDietOpen(false)
                                        }}
                                        className="flex-1"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleApplyDiets}
                                        disabled={selectedDiets.length === 0}
                                        className="flex-1"
                                    >
                                        Appliquer
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

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
