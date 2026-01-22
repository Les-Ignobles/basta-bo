"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle, Eye, Filter, LayoutList, Sparkles } from 'lucide-react'
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
        <TooltipProvider>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations de base */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Informations de base</CardTitle>
                        <CardDescription className="text-xs">
                            Nom et apparence de la catégorie
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name_fr">Nom (français) *</Label>
                                <Input
                                    id="name_fr"
                                    value={values.name_fr}
                                    onChange={(e) => setValues((s) => ({ ...s, name_fr: e.target.value }))}
                                    placeholder="Ex: Plats végétariens"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <Label htmlFor="name_en">Nom (anglais)</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Pour les utilisateurs qui ont l'app en anglais</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    id="name_en"
                                    value={values.name_en}
                                    onChange={(e) => setValues((s) => ({ ...s, name_en: e.target.value }))}
                                    placeholder="Ex: Vegetarian dishes"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                    <Label htmlFor="emoji">Emoji *</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>L'icône qui représente cette catégorie</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    id="emoji"
                                    value={values.emoji}
                                    onChange={(e) => setValues((s) => ({ ...s, emoji: e.target.value }))}
                                    placeholder="🥗"
                                    required
                                    className="text-2xl text-center"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Couleur *</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        value={values.color}
                                        onChange={(e) => setValues((s) => ({ ...s, color: e.target.value }))}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={values.color}
                                        onChange={(e) => setValues((s) => ({ ...s, color: e.target.value }))}
                                        placeholder="#FF5733"
                                        pattern="^#[0-9A-Fa-f]{6}$"
                                        className="flex-1 font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {DEFAULT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setValues((s) => ({ ...s, color }))}
                                    className={`w-6 h-6 rounded-md border-2 transition-all ${
                                        values.color === color ? 'border-foreground scale-110 ring-2 ring-offset-1 ring-primary' : 'border-transparent hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Où afficher cette catégorie */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Où afficher cette catégorie ?
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Choisissez où cette catégorie sera visible dans l'application
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Badge sur les recettes */}
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                            <Switch
                                id="is_pinned"
                                checked={values.is_pinned}
                                onCheckedChange={(checked: boolean) => setValues((s) => ({ ...s, is_pinned: checked }))}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <Label htmlFor="is_pinned" className="text-sm font-medium cursor-pointer">
                                    Badge sur les cartes de recettes
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Affiche un petit badge avec l'emoji sur chaque recette de cette catégorie
                                </p>
                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-background border">
                                    <span>{values.emoji || '🏷️'}</span>
                                    <span className="text-muted-foreground">Exemple de badge</span>
                                </div>
                            </div>
                        </div>

                        {/* Filtre rapide */}
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                            <Switch
                                id="display_as_chip"
                                checked={values.display_as_chip}
                                onCheckedChange={(checked: boolean) => setValues((s) => ({ ...s, display_as_chip: checked }))}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <Label htmlFor="display_as_chip" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5" />
                                    Filtre rapide en haut du catalogue
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Ajoute un bouton de filtre en haut de la page catalogue
                                </p>
                                {values.display_as_chip && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <Label htmlFor="chip_order" className="text-xs shrink-0">Position :</Label>
                                        <Input
                                            id="chip_order"
                                            type="number"
                                            min="0"
                                            value={values.chip_order}
                                            onChange={(e) => setValues((s) => ({ ...s, chip_order: parseInt(e.target.value) || 0 }))}
                                            className="w-16 h-7 text-xs"
                                        />
                                        <span className="text-xs text-muted-foreground">(1 = premier)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bloc sur la page */}
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                            <Switch
                                id="display_as_section"
                                checked={values.display_as_section}
                                onCheckedChange={(checked: boolean) => setValues((s) => ({ ...s, display_as_section: checked }))}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <Label htmlFor="display_as_section" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                    <LayoutList className="h-3.5 w-3.5" />
                                    Bloc sur la page catalogue
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Affiche une section complète avec le titre et les recettes de cette catégorie
                                </p>
                                {values.display_as_section && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <Label htmlFor="section_order" className="text-xs shrink-0">Position :</Label>
                                        <Input
                                            id="section_order"
                                            type="number"
                                            min="0"
                                            value={values.section_order}
                                            onChange={(e) => setValues((s) => ({ ...s, section_order: parseInt(e.target.value) || 0 }))}
                                            className="w-16 h-7 text-xs"
                                        />
                                        <span className="text-xs text-muted-foreground">(1 = premier)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Catégorie automatique */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Catégorie automatique
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Laissez le système choisir automatiquement les recettes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
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
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <Label htmlFor="is_dynamic" className="text-sm font-medium cursor-pointer">
                                    Activer le contenu automatique
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Les recettes seront sélectionnées automatiquement. Vous n'aurez pas à les ajouter manuellement.
                                </p>
                            </div>
                        </div>

                        {values.is_dynamic && (
                            <div className="space-y-3 pl-3 border-l-2 border-primary/30">
                                <div className="space-y-2">
                                    <Label htmlFor="dynamic_type" className="text-sm">Comment choisir les recettes ?</Label>
                                    <Select
                                        value={values.dynamic_type || 'seasonality'}
                                        onValueChange={(value: DynamicCategoryType) => setValues((s) => ({ ...s, dynamic_type: value }))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sélectionner un mode" />
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

                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                    {values.dynamic_type === 'seasonality' && (
                                        <div className="text-xs space-y-1">
                                            <p className="font-medium">🍂 Recettes de saison</p>
                                            <p className="text-muted-foreground">
                                                Affiche les recettes dont les ingrédients sont de saison ce mois-ci.
                                                Le contenu change automatiquement chaque mois.
                                            </p>
                                        </div>
                                    )}
                                    {values.dynamic_type === 'user_recommendations' && (
                                        <div className="text-xs space-y-1">
                                            <p className="font-medium">⭐ Recommandations personnalisées</p>
                                            <p className="text-muted-foreground">
                                                Affiche des recettes adaptées à chaque utilisateur selon son profil
                                                (allergies, régimes alimentaires, équipements disponibles).
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="submit" disabled={loading || !values.name_fr || !values.emoji || !values.color}>
                        {loading ? submittingLabel : 'Enregistrer'}
                    </Button>
                </div>
            </form>
        </TooltipProvider>
    )
}
