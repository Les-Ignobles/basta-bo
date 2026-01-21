"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DynamicCategoryType, RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'

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
        display_as_chip: false,
        display_as_section: false,
        chip_order: 0,
        section_order: 0,
        is_dynamic: false,
        dynamic_type: null,
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

                {/* Configuration d'affichage */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Configuration d'affichage
                    </h3>

                    {/* Tag sur les recettes (isPinned) */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_pinned"
                            checked={values.is_pinned}
                            onCheckedChange={(checked: boolean) => setValues((s) => ({ ...s, is_pinned: checked }))}
                        />
                        <Label htmlFor="is_pinned" className="text-sm font-medium">
                            Afficher comme tag sur les cartes de recettes
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-10">
                        Le badge de cette catégorie sera affiché sur l'image des recettes qui la composent
                    </p>

                    {/* Chip dans le header */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="display_as_chip"
                            checked={values.display_as_chip}
                            onCheckedChange={(checked: boolean) => setValues((s) => ({ ...s, display_as_chip: checked }))}
                        />
                        <Label htmlFor="display_as_chip" className="text-sm font-medium">
                            Afficher comme chip dans le header du catalogue
                        </Label>
                    </div>
                    {values.display_as_chip && (
                        <div className="ml-10 flex items-center gap-2">
                            <Label htmlFor="chip_order" className="text-sm">Ordre :</Label>
                            <Input
                                id="chip_order"
                                type="number"
                                min="0"
                                value={values.chip_order}
                                onChange={(e) => setValues((s) => ({ ...s, chip_order: parseInt(e.target.value) || 0 }))}
                                className="w-20"
                            />
                        </div>
                    )}

                    {/* Section sur la page */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="display_as_section"
                            checked={values.display_as_section}
                            onCheckedChange={(checked: boolean) => setValues((s) => ({ ...s, display_as_section: checked }))}
                        />
                        <Label htmlFor="display_as_section" className="text-sm font-medium">
                            Afficher comme section sur la page catalogue
                        </Label>
                    </div>
                    {values.display_as_section && (
                        <div className="ml-10 flex items-center gap-2">
                            <Label htmlFor="section_order" className="text-sm">Ordre :</Label>
                            <Input
                                id="section_order"
                                type="number"
                                min="0"
                                value={values.section_order}
                                onChange={(e) => setValues((s) => ({ ...s, section_order: parseInt(e.target.value) || 0 }))}
                                className="w-20"
                            />
                        </div>
                    )}
                </div>

                {/* Configuration dynamique */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Catégorie dynamique
                    </h3>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_dynamic"
                            checked={values.is_dynamic}
                            onCheckedChange={(checked: boolean) => {
                                setValues((s) => ({
                                    ...s,
                                    is_dynamic: checked,
                                    dynamic_type: checked ? 'seasonality' : null,
                                }))
                            }}
                        />
                        <Label htmlFor="is_dynamic" className="text-sm font-medium">
                            Catégorie dynamique
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-10">
                        Le contenu de cette catégorie sera calculé automatiquement au lieu d'être lié manuellement aux recettes
                    </p>

                    {values.is_dynamic && (
                        <div className="ml-10 space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="dynamic_type" className="text-sm">Type de calcul</Label>
                                <Select
                                    value={values.dynamic_type || 'seasonality'}
                                    onValueChange={(value: DynamicCategoryType) => setValues((s) => ({ ...s, dynamic_type: value }))}
                                >
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="seasonality">
                                            🍂 Recettes de saison
                                        </SelectItem>
                                        <SelectItem value="user_recommendations">
                                            ⭐ Recommandations personnalisées
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                                {values.dynamic_type === 'seasonality' && (
                                    <p>Les recettes seront filtrées selon leur saisonnalité par rapport au mois en cours.</p>
                                )}
                                {values.dynamic_type === 'user_recommendations' && (
                                    <p>Les recettes seront personnalisées selon le profil de l'utilisateur (allergies, régimes, équipements). Requiert une authentification.</p>
                                )}
                            </div>
                        </div>
                    )}
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
