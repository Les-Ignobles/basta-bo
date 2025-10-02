"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, X } from 'lucide-react'

interface PendingIngredientsBulkActionsBarProps {
    selectedCount: number
    onClearSelection: () => void
    onBulkDelete: () => void
}

export function PendingIngredientsBulkActionsBar({
    selectedCount,
    onClearSelection,
    onBulkDelete
}: PendingIngredientsBulkActionsBarProps) {
    if (selectedCount === 0) return null

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                </Badge>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearSelection}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Désélectionner
                    </Button>
                    
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onBulkDelete}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer ({selectedCount})
                    </Button>
                </div>
            </div>
        </div>
    )
}
