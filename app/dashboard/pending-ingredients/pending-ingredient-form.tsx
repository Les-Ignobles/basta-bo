"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TranslationTextField } from '@/components/translation-text'
import { ImageUpload } from '@/components/image-upload'
import type { PendingIngredient, PendingIngredientFormValues } from '@/features/cooking/types'
import { Loader2 } from 'lucide-react'

type Props = {
    pendingIngredient: PendingIngredient
    categories: Array<{ id: number; label: string }>
    onSubmit: (data: PendingIngredientFormValues) => Promise<void>
    onCancel: () => void
}

export function PendingIngredientForm({ pendingIngredient, categories, onSubmit, onCancel }: Props) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<PendingIngredientFormValues>({
        name: {
            fr: pendingIngredient.name,
            en: '',
            es: ''
        },
        suffix_singular: {
            fr: '',
            en: '',
            es: ''
        },
        suffix_plural: {
            fr: '',
            en: '',
            es: ''
        },
        category_id: null,
        img_path: null
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit(formData)
        } finally {
            setLoading(false)
        }
    }

    const handleFieldChange = (field: keyof PendingIngredientFormValues, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Informations de base</CardTitle>
                    <CardDescription>
                        L&apos;ingrédient &quot;{pendingIngredient.name}&quot; sera converti en ingrédient officiel
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nom de l&apos;ingrédient *</Label>
                        <TranslationTextField
                            value={formData.name}
                            onChange={(value) => handleFieldChange('name', value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="suffix_singular">Suffixe au singulier</Label>
                        <TranslationTextField
                            value={formData.suffix_singular}
                            onChange={(value) => handleFieldChange('suffix_singular', value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="suffix_plural">Suffixe au pluriel</Label>
                        <TranslationTextField
                            value={formData.suffix_plural}
                            onChange={(value) => handleFieldChange('suffix_plural', value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="category">Catégorie</Label>
                        <Select
                            value={formData.category_id?.toString() || 'none'}
                            onValueChange={(value) => handleFieldChange('category_id', value === 'none' ? null : parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Aucune catégorie</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="image">Image</Label>
                        <ImageUpload
                            value={formData.img_path ?? undefined}
                            onChange={(value) => handleFieldChange('img_path', value)}
                            bucket="ingredients"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Conversion...
                        </>
                    ) : (
                        'Convertir en ingrédient'
                    )}
                </Button>
            </div>
        </form>
    )
}
