"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'

type Props = {
    defaultValues?: Partial<RecipeCategoryFormValues>
    onSubmit: (values: RecipeCategoryFormValues) => Promise<void> | void
    submittingLabel?: string
}

const DEFAULT_COLORS = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33F5',
    '#F5FF33', '#33FFF5', '#8B5CF6', '#F97316',
    '#10B981', '#EF4444', '#6366F1', '#EC4899',
]

export function RecipeCategoryForm({ defaultValues, onSubmit, submittingLabel = 'Enregistrement...' }: Props) {
    const [values, setValues] = useState<RecipeCategoryFormValues>({
        name_fr: '',
        name_en: '',
        emoji: '',
        color: '#FF5733',
        is_pinned: false,
        ...defaultValues,
    })
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
            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name_fr">Nom (FR) *</Label>
                    <Input
                        id="name_fr"
                        value={values.name_fr}
                        onChange={(e) => setValues((s) => ({ ...s, name_fr: e.target.value }))}
                        placeholder="Ex: Plats végétariens"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name_en">Nom (EN)</Label>
                    <Input
                        id="name_en"
                        value={values.name_en}
                        onChange={(e) => setValues((s) => ({ ...s, name_en: e.target.value }))}
                        placeholder="Ex: Vegetarian dishes"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="emoji">Emoji *</Label>
                    <Input
                        id="emoji"
                        value={values.emoji}
                        onChange={(e) => setValues((s) => ({ ...s, emoji: e.target.value }))}
                        placeholder="Ex: 🥗"
                        required
                        className="text-2xl"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Couleur *</Label>
                    <div className="flex items-center gap-4">
                        <Input
                            type="color"
                            value={values.color}
                            onChange={(e) => setValues((s) => ({ ...s, color: e.target.value }))}
                            className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                            value={values.color}
                            onChange={(e) => setValues((s) => ({ ...s, color: e.target.value }))}
                            placeholder="#FF5733"
                            pattern="^#[0-9A-Fa-f]{6}$"
                            className="w-28 font-mono"
                        />
                        <div
                            className="w-10 h-10 rounded-md border"
                            style={{ backgroundColor: values.color }}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {DEFAULT_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setValues((s) => ({ ...s, color }))}
                                className={`w-8 h-8 rounded-md border-2 transition-all ${
                                    values.color === color ? 'border-foreground scale-110' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    <Switch
                        id="is_pinned"
                        checked={values.is_pinned}
                        onCheckedChange={(checked: boolean) => setValues((s) => ({ ...s, is_pinned: checked }))}
                    />
                    <Label htmlFor="is_pinned" className="text-sm font-medium">
                        Épingler dans le menu bibliothèque
                    </Label>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="submit" disabled={loading || !values.name_fr || !values.emoji || !values.color}>
                    {loading ? submittingLabel : 'Enregistrer'}
                </Button>
            </div>
        </form>
    )
}
