"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IngredientForm, type IngredientFormValues } from '@/features/cooking/components/ingredient-form'
import { useCookingStore } from '@/features/cooking/store'

export default function IngredientsIndexPage() {
    const [open, setOpen] = useState(false)
    const { fetchIngredients, fetchCategories, ingredients, categories, createIngredient, loading } = useCookingStore()

    // simple init fetch
    useState(() => {
        fetchIngredients()
        fetchCategories()
        return undefined
    })

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
                        <IngredientForm onSubmit={handleCreate} categories={categories.map((c: any) => ({ id: Number(c.id), label: `${c.emoji ?? ''} ${c.title?.fr ?? ''}`.trim() }))} />
                    </DialogContent>
                </Dialog>
            </div>
            <p className="text-sm text-muted-foreground">
                La liste des ingrédients ({ingredients.length}) s’affichera ici (mock API pour l’instant).
            </p>
        </div>
    )
}


