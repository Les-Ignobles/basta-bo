"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IngredientForm, type IngredientFormValues } from '@/features/cooking/components/ingredient-form'
import { useCookingStore } from '@/features/cooking/store'
import { IngredientsTable } from '@/features/cooking/components/ingredients-table'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

export default function IngredientsIndexPage() {
    const [open, setOpen] = useState(false)
    const { fetchIngredients, fetchCategories, ingredients, categories, createIngredient, loading, setSearch, setPage, page, pageSize, total, setNoImage, noImage } = useCookingStore()

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

    async function handleCreate(values: IngredientFormValues) {
        await createIngredient({
            name: values.name,
            suffix_singular: values.suffix_singular,
            suffix_plural: values.suffix_plural,
            img_path: values.img_path ?? null,
            category_id: values.category_id ?? null,
        } as any)
        setOpen(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Ingrédients</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={loading}>Nouvel ingrédient</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-w-[95vw] w-full">
                        <DialogHeader>
                            <DialogTitle>Nouvel ingrédient</DialogTitle>
                        </DialogHeader>
                        <IngredientForm
                            onSubmit={handleCreate}
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
                        className="max-w-xs"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
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


