"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TranslationTextField } from '@/components/translation-text'
import { ImageUpload } from '@/components/image-upload'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
// Imports pour le composant Command amélioré
import type { TranslationText } from '@/lib/i18n'
import type { Allergy } from '@/features/cooking/types/allergy'

export type IngredientFormValues = {
    id?: number
    name: TranslationText
    suffix_singular: TranslationText
    suffix_plural: TranslationText
    img_path?: string | null
    category_id?: number | null
    is_basic: boolean
    calories_per_100g?: number | null
    proteins_per_100g?: number | null
    fats_per_100g?: number | null
    carbs_per_100g?: number | null
    price_per_100g?: number | null
    allergy_mask?: number
}

type Props = {
    defaultValues?: Partial<IngredientFormValues>
    onSubmit: (values: IngredientFormValues) => Promise<void> | void
    submittingLabel?: string
    categories: Array<{ id: number; label: string }>
    allergies?: Allergy[]
    /**
     * Quand fourni, le form expose `id={formId}` et masque son bouton "Enregistrer" interne.
     * Le parent doit alors fournir un bouton externe `<button type="submit" form={formId}>`.
     */
    formId?: string
    /**
     * Contenu affiché en bas de la colonne principale (ex : recettes utilisant
     * l'ingrédient sur la page détail) — donne le contexte d'impact des
     * modifications sans quitter le formulaire.
     */
    recipesSlot?: React.ReactNode
}

export function IngredientForm({ defaultValues, onSubmit, submittingLabel = 'Enregistrement...', categories, allergies, formId, recipesSlot }: Props) {
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
        is_basic: false,
        ...defaultValues,
    } as IngredientFormValues)
    const [loading, setLoading] = useState(false)
    const [categoryOpen, setCategoryOpen] = useState(false)
    const [aiGenerating, setAiGenerating] = useState(false)

    const toggleAllergy = (bitIndex: number) => {
        setValues((s) => ({ ...s, allergy_mask: (s.allergy_mask ?? 0) ^ (1 << bitIndex) }))
    }

    const handleAIGeneration = async () => {
        if (!values.name.fr?.trim()) return

        setAiGenerating(true)
        try {
            const response = await fetch('/api/ingredients/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ingredientName: values.name.fr.trim()
                })
            })

            if (!response.ok) {
                throw new Error('Erreur lors de la génération IA')
            }

            const result = await response.json()
            if (result.success && result.ingredient) {
                const generatedData = result.ingredient

                setValues(prev => ({
                    ...prev,
                    name: {
                        fr: values.name.fr,
                        en: generatedData.name?.en || '',
                        es: generatedData.name?.es || ''
                    },
                    suffix_singular: {
                        fr: generatedData.suffix_singular?.fr || '',
                        en: generatedData.suffix_singular?.en || '',
                        es: generatedData.suffix_singular?.es || ''
                    },
                    suffix_plural: {
                        fr: generatedData.suffix_plural?.fr || '',
                        en: generatedData.suffix_plural?.en || '',
                        es: generatedData.suffix_plural?.es || ''
                    },
                    category_id: generatedData.category_id || null
                }))
            }
        } catch (error) {
            console.error('Erreur lors de la génération IA:', error)
            alert('Erreur lors de la génération des données')
        } finally {
            setAiGenerating(false)
        }
    }

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
        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
              {/* Colonne principale : identité, allergènes, contexte recettes */}
              <div className="space-y-6 min-w-0">
                <div className="space-y-4">
                    <h3 className="text-base font-semibold text-foreground">Informations principales</h3>
                    <TranslationTextField
                        label="Nom"
                        value={values.name}
                        onChange={(v) => setValues((s) => ({ ...s, name: v }))}
                    />
                    <div className="grid md:grid-cols-2 gap-4">
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
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Catégorie</div>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={categoryOpen}
                                className="w-full justify-between"
                            >
                                {values.category_id
                                    ? sortedCategories.find(c => c.id === values.category_id)?.label || "Catégorie inconnue"
                                    : "Sélectionner une catégorie..."
                                }
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Rechercher une catégorie..." />
                                <CommandList className="max-h-[200px]">
                                    <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value=""
                                            onSelect={() => {
                                                setValues((s) => ({ ...s, category_id: null }))
                                                setCategoryOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    values.category_id === null ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            Aucune catégorie
                                        </CommandItem>
                                        {sortedCategories.map((category) => (
                                            <CommandItem
                                                key={category.id}
                                                value={category.label}
                                                onSelect={() => {
                                                    setValues((s) => ({ ...s, category_id: category.id }))
                                                    setCategoryOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        values.category_id === category.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {category.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_basic"
                            checked={values.is_basic}
                            onCheckedChange={(checked: boolean) => setValues((s) => ({ ...s, is_basic: checked }))}
                        />
                        <Label htmlFor="is_basic" className="text-sm font-medium">
                            Ingrédient de base
                        </Label>
                    </div>
                </div>

                {allergies && allergies.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-foreground">Allergènes contenus</h3>
                        <div className="text-xs text-muted-foreground">
                            Ces allergènes sont automatiquement reportés sur toutes les recettes utilisant cet ingrédient.
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
                            {allergies.map((allergy) => (
                                <label key={allergy.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={((values.allergy_mask ?? 0) & (1 << allergy.bit_index)) !== 0}
                                        onCheckedChange={() => toggleAllergy(allergy.bit_index)}
                                    />
                                    <span>{allergy.emoji} {allergy.name.fr}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {recipesSlot}
              </div>

              {/* Sidebar sticky : image, autocomplétion IA, nutrition, prix */}
              <aside className="space-y-4 lg:sticky lg:top-24">
                <div className="rounded-lg border p-4 space-y-3">
                    {values.name?.fr && values.name.fr.trim() ? (
                        <ImageUpload
                            value={values.img_path ?? undefined}
                            onChange={(url) => setValues((s) => ({ ...s, img_path: url }))}
                            bucket="ingredients"
                            ingredientName={values.name?.fr}
                            defaultSize={100}
                            allowSizeSelection={true}
                        />
                    ) : (
                        <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-md h-32 bg-muted/50">
                            <div className="text-center text-sm text-muted-foreground">
                                <div className="mb-1">📝</div>
                                <div>Saisissez d&apos;abord le nom de l&apos;ingrédient</div>
                            </div>
                        </div>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAIGeneration}
                        disabled={!values.name.fr?.trim() || aiGenerating}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                        title="Remplit les suffixes, traductions et la catégorie à partir du nom"
                    >
                        {aiGenerating ? (
                            <>
                                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Autocomplétion IA
                            </>
                        )}
                    </Button>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Nutrition (pour 100 g)</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Calories (kcal)</Label>
                            <Input
                                type="number"
                                step="1"
                                min="0"
                                value={values.calories_per_100g ?? ''}
                                onChange={(e) => setValues((s) => ({ ...s, calories_per_100g: e.target.value ? parseInt(e.target.value) : null }))}
                                placeholder="-"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Protéines (g)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={values.proteins_per_100g ?? ''}
                                onChange={(e) => setValues((s) => ({ ...s, proteins_per_100g: e.target.value ? parseFloat(e.target.value) : null }))}
                                placeholder="-"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Lipides (g)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={values.fats_per_100g ?? ''}
                                onChange={(e) => setValues((s) => ({ ...s, fats_per_100g: e.target.value ? parseFloat(e.target.value) : null }))}
                                placeholder="-"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Glucides (g)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={values.carbs_per_100g ?? ''}
                                onChange={(e) => setValues((s) => ({ ...s, carbs_per_100g: e.target.value ? parseFloat(e.target.value) : null }))}
                                placeholder="-"
                            />
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Reporté automatiquement sur les valeurs par portion des recettes.
                    </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Prix indicatif (pour 100 g)</h4>
                    <div className="space-y-1">
                        <Label className="text-xs">Prix (€)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={values.price_per_100g ?? ''}
                            onChange={(e) => setValues((s) => ({ ...s, price_per_100g: e.target.value ? parseFloat(e.target.value) : null }))}
                            placeholder="-"
                        />
                    </div>
                </div>
              </aside>
            </div>
            {!formId && (
                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={loading}>
                        {loading ? submittingLabel : 'Enregistrer'}
                    </Button>
                </div>
            )}
        </form>
    )
}


