"use client"
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FullScreenSheet } from '@/components/ui/full-screen-sheet'
import { Badge } from '@/components/ui/badge'
import { IngredientForm, type IngredientFormValues } from '@/features/cooking/components/ingredient-form'
import { useCookingStore } from '@/features/cooking/store'
import { IngredientsTable } from '@/features/cooking/components/ingredients-table'
import { searchByRelevance } from '@/features/cooking/utils/recipe-search'
import type { Ingredient } from '@/features/cooking/types'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChefHat, Search, X, SlidersHorizontal, Filter } from 'lucide-react'

const PAGE_SIZE = 50
const TRANSLATION_LANGS = ['en', 'es'] as const
const TRANSLATION_FIELDS = ['name', 'suffix_singular', 'suffix_plural'] as const

/** Pourcentage de champs traduits (langues × champs). 100 = traductions complètes. */
function translationProgress(ing: Ingredient): number {
    let total = 0
    let filled = 0
    for (const lang of TRANSLATION_LANGS) {
        for (const field of TRANSLATION_FIELDS) {
            total++
            const value = ing[field] as Record<string, string> | null | undefined
            if (value?.[lang] && value[lang].trim().length > 0) filled++
        }
    }
    return total > 0 ? Math.round((filled / total) * 100) : 0
}

export default function IngredientsIndexPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [open, setOpen] = useState(false)
    const {
        fetchAllIngredientsForListing,
        fetchCategories,
        allIngredients,
        categories,
        createIngredient,
        updateIngredient,
        deleteIngredient,
        loading,
        ingredientsLoading,
        editingIngredient,
        search,
        setSearch,
        noImage,
        setNoImage,
        selectedCategories,
        setSelectedCategories,
        translationFilter,
        setTranslationFilter,
        setEditingIngredient,
    } = useCookingStore()

    const [page, setPage] = useState(() => {
        const p = Number(searchParams.get('page'))
        return Number.isFinite(p) && p > 0 ? p : 1
    })

    useEffect(() => {
        fetchAllIngredientsForListing()
        fetchCategories()
    }, [fetchAllIngredientsForListing, fetchCategories])

    const advancedFilterCount = useMemo(() => {
        let n = 0
        if (translationFilter !== 'all') n++
        if (noImage) n++
        return n
    }, [translationFilter, noImage])

    const hasAnyFilter = Boolean(search) || selectedCategories.length > 0 || advancedFilterCount > 0

    const filteredIngredients = useMemo(() => {
        let list = allIngredients

        if (selectedCategories.length > 0) {
            list = list.filter((ing) => ing.category_id != null && selectedCategories.includes(ing.category_id))
        }

        if (noImage) {
            list = list.filter((ing) => !ing.img_path)
        }

        if (translationFilter !== 'all') {
            list = list.filter((ing) => {
                const complete = translationProgress(ing) === 100
                return translationFilter === 'complete' ? complete : !complete
            })
        }

        const term = search.trim()
        if (term) {
            if (/^\d+$/.test(term)) {
                list = list.filter((ing) => String(ing.id).includes(term))
            } else {
                list = searchByRelevance(list, term, (ing) => ing.name?.fr ?? '')
            }
        }

        return list
    }, [allIngredients, selectedCategories, noImage, translationFilter, search])

    const total = filteredIngredients.length
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)

    const paginatedIngredients = useMemo(() => {
        const from = (currentPage - 1) * PAGE_SIZE
        return filteredIngredients.slice(from, from + PAGE_SIZE)
    }, [filteredIngredients, currentPage])

    useEffect(() => {
        setPage(1)
    }, [search, selectedCategories, noImage, translationFilter])

    const goToPage = (newPage: number) => {
        const clamped = Math.min(Math.max(1, newPage), totalPages)
        setPage(clamped)
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', clamped.toString())
        router.replace(`/dashboard/ingredients?${params.toString()}`, { scroll: false })
    }

    const resetFilters = () => {
        setSearch('')
        setSelectedCategories([])
        setNoImage(false)
        setTranslationFilter('all')
    }

    const toggleCategory = (categoryId: number) => {
        setSelectedCategories(
            selectedCategories.includes(categoryId)
                ? selectedCategories.filter((id) => id !== categoryId)
                : [...selectedCategories, categoryId]
        )
    }

    const categoryLabel = (id: number) => {
        const c = categories.find((cat) => Number(cat.id) === id)
        return c ? `${c.emoji ?? ''} ${c.title?.fr ?? ''}`.trim() : `#${id}`
    }

    async function handleSubmit(values: IngredientFormValues) {
        const payload = {
            name: values.name,
            suffix_singular: values.suffix_singular,
            suffix_plural: values.suffix_plural,
            img_path: values.img_path ?? null,
            category_id: values.category_id ?? null,
            is_basic: values.is_basic,
            calories_per_100g: values.calories_per_100g ?? null,
            proteins_per_100g: values.proteins_per_100g ?? null,
            fats_per_100g: values.fats_per_100g ?? null,
            carbs_per_100g: values.carbs_per_100g ?? null,
            price_per_100g: values.price_per_100g ?? null,
        }
        if (values.id) {
            await updateIngredient(values.id, payload)
        } else {
            await createIngredient(payload)
        }
        setOpen(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold font-christmas">Ingrédients</h1>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        {total} ingrédient{total > 1 ? 's' : ''}
                        {hasAnyFilter && <span className="text-muted-foreground">/ {allIngredients.length}</span>}
                    </Badge>
                </div>
                <Button disabled={loading} onClick={() => { setEditingIngredient(null); setOpen(true) }}>Nouvel ingrédient</Button>
                <FullScreenSheet
                    open={open}
                    onOpenChange={setOpen}
                    title={editingIngredient ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}
                >
                    <IngredientForm
                        onSubmit={handleSubmit}
                        defaultValues={editingIngredient || undefined}
                        categories={categories.map((c) => ({ id: Number(c.id), label: `${c.emoji ?? ''} ${c.title?.fr ?? ''}`.trim() }))}
                    />
                </FullScreenSheet>
            </div>

            <div className="sticky top-0 z-10 bg-background border-b py-4 space-y-3">
                {/* Ligne principale : recherche + filtres clés */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-96 max-w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un ingrédient (nom ou ID, accents et fautes tolérés)…"
                            className="pl-9 pr-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="Effacer la recherche"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Catégories */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Catégories
                                {selectedCategories.length > 0 && (
                                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                        {selectedCategories.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72" align="start">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Filtrer par catégories</h4>
                                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                    {categories.map((category) => (
                                        <label key={String(category.id)} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <Checkbox
                                                checked={selectedCategories.includes(Number(category.id))}
                                                onCheckedChange={() => toggleCategory(Number(category.id))}
                                            />
                                            <span>{category.emoji} {category.title?.fr}</span>
                                        </label>
                                    ))}
                                </div>
                                {selectedCategories.length > 0 && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedCategories([])}>
                                        Effacer
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Filtres avancés */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                Filtres avancés
                                {advancedFilterCount > 0 && (
                                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                        {advancedFilterCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72" align="start">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Traductions</h4>
                                    <div className="flex gap-2">
                                        {([['all', 'Toutes'], ['complete', 'Complètes'], ['incomplete', 'Incomplètes']] as const).map(([val, label]) => (
                                            <Button
                                                key={val}
                                                variant={translationFilter === val ? 'default' : 'outline'}
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => setTranslationFilter(val)}
                                            >
                                                {label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1 border-t">
                                    <Checkbox checked={noImage} onCheckedChange={(v) => setNoImage(Boolean(v))} />
                                    Sans image uniquement
                                </label>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {hasAnyFilter && (
                        <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground" onClick={resetFilters}>
                            <X className="h-4 w-4" />
                            Réinitialiser
                        </Button>
                    )}

                    <div className="ml-auto flex items-center gap-2 text-sm">
                        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                            Précédent
                        </Button>
                        <span className="text-muted-foreground">
                            Page {currentPage} / {totalPages}
                        </span>
                        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
                            Suivant
                        </Button>
                    </div>
                </div>

                {/* Récap compact des filtres actifs */}
                {hasAnyFilter && (
                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">Filtres :</span>
                        {search && (
                            <FilterChip label={`Recherche : « ${search} »`} onRemove={() => setSearch('')} />
                        )}
                        {translationFilter !== 'all' && (
                            <FilterChip
                                label={`Traductions : ${translationFilter === 'complete' ? 'Complètes' : 'Incomplètes'}`}
                                onRemove={() => setTranslationFilter('all')}
                            />
                        )}
                        {noImage && <FilterChip label="Sans image" onRemove={() => setNoImage(false)} />}
                        {selectedCategories.map((id) => (
                            <FilterChip key={`cat-${id}`} label={`Catégorie : ${categoryLabel(id)}`} onRemove={() => toggleCategory(id)} />
                        ))}
                    </div>
                )}
            </div>

            <IngredientsTable
                ingredients={paginatedIngredients}
                categories={categories}
                loading={ingredientsLoading}
                currentPage={currentPage}
                searchParams={searchParams}
                onEdit={(ing) => {
                    setEditingIngredient(ing)
                    setOpen(true)
                }}
                onDelete={async (ing) => {
                    await deleteIngredient(Number(ing.id))
                }}
            />
        </div>
    )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    const sep = label.indexOf(' : ')
    const name = sep >= 0 ? label.slice(0, sep) : label
    const value = sep >= 0 ? label.slice(sep + 3) : null
    return (
        <span className="inline-flex items-center gap-1">
            <span className="text-foreground/80">
                <span className="font-semibold">{name}</span>
                {value !== null && <> : {value}</>}
            </span>
            <button
                type="button"
                onClick={onRemove}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label={`Retirer ${label}`}
            >
                <X className="h-3 w-3" />
            </button>
        </span>
    )
}
