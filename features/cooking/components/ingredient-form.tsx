"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TranslationTextField } from '@/components/translation-text'
import type { TranslationText } from '@/lib/i18n'

export type IngredientFormValues = {
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
                <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Image (URL)</div>
                        <Input
                            value={values.img_path ?? ''}
                            onChange={(e) => setValues((s) => ({ ...s, img_path: e.target.value }))}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Catégorie</div>
                        <Select
                            value={values.category_id ? String(values.category_id) : ''}
                            onValueChange={(val) =>
                                setValues((s) => ({ ...s, category_id: val ? Number(val) : null }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.label}
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


