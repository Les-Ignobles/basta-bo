"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TranslationTextField } from '@/components/translation-text'
import { ImageUpload } from '@/components/image-upload'
// Plus besoin d'imports pour Check, ChevronsUpDown et cn
import type { TranslationText } from '@/lib/i18n'

export type IngredientFormValues = {
    id?: number
    name: TranslationText
    suffix_singular: TranslationText
    suffix_plural: TranslationText
    img_path?: string | null
    category_id?: number | null
}

type Props = {
    defaultValues?: Partial<IngredientFormValues>
    onSubmit: (values: IngredientFormValues) => Promise<void> | void
    submittingLabel?: string
    categories: Array<{ id: number; label: string }>
}

export function IngredientForm({ defaultValues, onSubmit, submittingLabel = 'Enregistrement...', categories }: Props) {
    // Trier les catégories par ordre alphabétique (en retirant l'emoji du tri)
    const sortedCategories = [...categories].sort((a, b) => {
        // Extraire le nom sans l'emoji (tout ce qui vient après le premier espace)
        const nameA = a.label.replace(/^[^\s]*\s/, '').trim()
        const nameB = b.label.replace(/^[^\s]*\s/, '').trim()
        return nameA.localeCompare(nameB)
    })

    const [values, setValues] = useState<IngredientFormValues>({
        name: { fr: '' },
        suffix_singular: { fr: '' },
        suffix_plural: { fr: '' },
        img_path: '',
        category_id: null,
        ...defaultValues,
    } as IngredientFormValues)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit(values)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
                <TranslationTextField
                    label="Nom"
                    value={values.name}
                    onChange={(v) => setValues((s) => ({ ...s, name: v }))}
                />
                <div className="grid gap-4">
                    <TranslationTextField
                        label="Suffixe singulier"
                        value={values.suffix_singular}
                        onChange={(v) => setValues((s) => ({ ...s, suffix_singular: v }))}
                    />
                    <TranslationTextField
                        label="Suffixe pluriel"
                        value={values.suffix_plural}
                        onChange={(v) => setValues((s) => ({ ...s, suffix_plural: v }))}
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {values.name?.fr && values.name.fr.trim() ? (
                        <ImageUpload
                            value={values.img_path ?? undefined}
                            onChange={(url) => setValues((s) => ({ ...s, img_path: url }))}
                            bucket="ingredients"
                            ingredientName={values.name?.fr}
                        />
                    ) : (
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Image</div>
                            <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-md h-32 bg-muted/50">
                                <div className="text-center text-sm text-muted-foreground">
                                    <div className="mb-1">📝</div>
                                    <div>Saisissez d'abord le nom de l'ingrédient</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Catégorie</div>
                        <Select
                            value={values.category_id?.toString() || "none"}
                            onValueChange={(value) => {
                                setValues((s) => ({ 
                                    ...s, 
                                    category_id: value === "none" ? null : parseInt(value) 
                                }))
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionner une catégorie..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                <SelectItem value="none">Aucune catégorie</SelectItem>
                                {sortedCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={loading}>
                    {loading ? submittingLabel : 'Enregistrer'}
                </Button>
            </div>
        </form>
    )
}


