"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TranslationTextField } from '@/components/translation-text'
import { ImageUpload } from '@/components/image-upload'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    const [categoryOpen, setCategoryOpen] = useState(false)

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
                            <PopoverContent className="w-full p-0">
                                <Command>
                                    <CommandInput placeholder="Rechercher une catégorie..." />
                                    <CommandList className="max-h-[200px] overflow-y-auto">
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


