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
// Imports pour le composant Command amélioré
import type { TranslationText } from '@/lib/i18n'

export type IngredientFormValues = {
    id?: number
    name: TranslationText
    suffix_singular: TranslationText
    suffix_plural: TranslationText
    img_path?: string | null
    category_id?: number | null
    is_basic: boolean
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
        is_basic: false,
        ...defaultValues,
    } as IngredientFormValues)
    const [loading, setLoading] = useState(false)
    const [categoryOpen, setCategoryOpen] = useState(false)
    const [aiGenerating, setAiGenerating] = useState(false)

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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bouton d'autocomplétion IA en haut */}
            <div className="flex justify-end pb-4 border-b">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIGeneration}
                    disabled={!values.name.fr?.trim() || aiGenerating}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
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
                <div className="space-y-1">
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
                                <div>Saisissez d'abord le nom de l'ingrédient</div>
                            </div>
                        </div>
                    )}
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


