"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IngredientForm, type IngredientFormValues } from '@/features/cooking/components/ingredient-form'
import { useCookingStore } from '@/features/cooking/store'
import { IngredientsTable } from '@/features/cooking/components/ingredients-table'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, Filter } from 'lucide-react'

export default function IngredientsIndexPage() {
    const [open, setOpen] = useState(false)
    const { fetchIngredients, fetchCategories, ingredients, categories, createIngredient, updateIngredient, loading, setSearch, setPage, page, pageSize, total, setNoImage, noImage, selectedCategories, setSelectedCategories, translationFilter, setTranslationFilter } = useCookingStore()

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    useEffect(() => {
        fetchIngredients()
    }, [fetchIngredients, page])

    const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / (pageSize || 10))), [total, pageSize])

    // debounce search
    const [searchInput, setSearchInput] = useState('')
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput)
            setPage(1)
            fetchIngredients()
        }, 400)
        return () => clearTimeout(t)
    }, [searchInput, setSearch, fetchIngredients, setPage])

    useEffect(() => {
        fetchIngredients()
    }, [fetchIngredients, selectedCategories, translationFilter])


    async function handleSubmit(values: IngredientFormValues) {
        if (values.id) {
            // Update existing ingredient
            await updateIngredient(values.id, {
                name: values.name,
                suffix_singular: values.suffix_singular,
                suffix_plural: values.suffix_plural,
                img_path: values.img_path ?? null,
                category_id: values.category_id ?? null,
            } as any)
        } else {
            // Create new ingredient
            await createIngredient({
                name: values.name,
                suffix_singular: values.suffix_singular,
                suffix_plural: values.suffix_plural,
                img_path: values.img_path ?? null,
                category_id: values.category_id ?? null,
            } as any)
        }
        setOpen(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Ingrédients</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={loading} onClick={() => {
                            if (typeof window !== 'undefined') {
                                (window as any).__editIngredient = undefined; // Clear edit state
                            }
                        }}>Nouvel ingrédient</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-w-[95vw] w-full">
                        <DialogHeader>
                            <DialogTitle>{(typeof window !== 'undefined' && (window as any).__editIngredient) ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}</DialogTitle>
                        </DialogHeader>
                        <IngredientForm
                            onSubmit={handleSubmit}
                            defaultValues={(typeof window !== 'undefined' && (window as any).__editIngredient) || undefined}
                            categories={categories.map((c: any) => ({ id: Number(c.id), label: `${c.emoji ?? ''} ${c.title?.fr ?? ''}`.trim() }))}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex items-center justify-between py-2 gap-4 sticky top-0 z-10 bg-background border-b">
                <div className="flex items-center gap-3">
                    <Input
                        placeholder="Rechercher par nom..."
                        className="w-80"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <Filter className="h-4 w-4 mr-2" />
                                Catégories
                                {selectedCategories.length > 0 && (
                                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                        {selectedCategories.length}
                                    </span>
                                )}
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="start">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Filtrer par catégories</div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {categories.map((category: any) => (
                                        <label key={category.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={selectedCategories.includes(category.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedCategories([...selectedCategories, category.id])
                                                    } else {
                                                        setSelectedCategories(selectedCategories.filter(id => id !== category.id))
                                                    }
                                                }}
                                            />
                                            <span>{category.emoji} {category.title?.fr}</span>
                                        </label>
                                    ))}
                                </div>
                                {selectedCategories.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedCategories([])}
                                        className="w-full"
                                    >
                                        Effacer les filtres
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <Filter className="h-4 w-4 mr-2" />
                                Traductions
                                {translationFilter !== 'all' && (
                                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                        {translationFilter === 'complete' ? 'Complètes' : 'Incomplètes'}
                                    </span>
                                )}
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="start">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Filtrer par traduction</div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={translationFilter === 'all'}
                                            onCheckedChange={(checked) => {
                                                if (checked) setTranslationFilter('all')
                                            }}
                                        />
                                        <span>Toutes</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={translationFilter === 'incomplete'}
                                            onCheckedChange={(checked) => {
                                                if (checked) setTranslationFilter('incomplete')
                                            }}
                                        />
                                        <span>Incomplètes</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={translationFilter === 'complete'}
                                            onCheckedChange={(checked) => {
                                                if (checked) setTranslationFilter('complete')
                                            }}
                                        />
                                        <span>Complètes</span>
                                    </label>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                        <Checkbox checked={noImage} onCheckedChange={(v) => { setNoImage(Boolean(v)); setPage(1); fetchIngredients(); }} />
                        Sans image
                    </label>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        Précédent
                    </Button>
                    <span className="text-muted-foreground">
                        Page {page} / {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        Suivant
                    </Button>
                </div>
            </div>
            <IngredientsTable
                ingredients={ingredients as any}
                categories={categories as any}
                loading={loading}
                onEdit={(ing) => {
                    ; (window as any).__editIngredient = ing
                    setOpen(true)
                }}
                onDelete={async (ing) => {
                    await (useCookingStore.getState().deleteIngredient)(Number(ing.id))
                }}
            />
        </div>
    )
}


