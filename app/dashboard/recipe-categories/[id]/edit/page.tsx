"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { RecipeCategoryForm } from '@/features/cooking/components/recipe-category-form'
import { CategoryLivePreview } from '@/features/cooking/components/catalog/category-live-preview'
import type { RecipeCategory, RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'

const toFormValues = (category: RecipeCategory): RecipeCategoryFormValues => ({
    name_fr: category.name.fr,
    name_en: category.name.en || '',
    emoji: category.emoji,
    color: category.color,
    is_pinned: category.is_pinned,
    display_as_chip: category.display_as_chip,
    display_as_section: category.display_as_section,
    chip_order: category.chip_order,
    section_order: category.section_order,
    is_dynamic: category.is_dynamic,
    dynamic_type: category.dynamic_type,
})

export default function EditRecipeCategoryPage() {
    const params = useParams()
    const router = useRouter()
    const categoryId = Number(params.id)

    const [category, setCategory] = useState<RecipeCategory | null>(null)
    const [liveValues, setLiveValues] = useState<RecipeCategoryFormValues | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchCategory() {
            try {
                setLoading(true)
                const response = await fetch('/api/recipe-categories')
                const { data } = await response.json()
                const found = (data || []).find((c: RecipeCategory) => c.id === categoryId) || null
                setCategory(found)
                if (found) setLiveValues(toFormValues(found))
            } catch (error) {
                console.error('Error fetching category:', error)
            } finally {
                setLoading(false)
            }
        }
        if (categoryId) fetchCategory()
    }, [categoryId])

    const handleSubmit = async (values: RecipeCategoryFormValues) => {
        const response = await fetch('/api/recipe-categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: categoryId, ...values }),
        })
        if (!response.ok) {
            console.error('Error updating category')
            return
        }
        router.push('/dashboard/recipe-categories')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!category) {
        return (
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/recipe-categories')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold font-christmas text-destructive">Catégorie non trouvée</h1>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/recipe-categories')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: category.color + '20' }}
                    >
                        {category.emoji}
                    </div>
                    <h1 className="text-xl font-semibold font-christmas">Modifier : {category.name.fr}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <RecipeCategoryForm
                        defaultValues={toFormValues(category)}
                        onSubmit={handleSubmit}
                        onChange={setLiveValues}
                        onCancel={() => router.push('/dashboard/recipe-categories')}
                        submittingLabel="Mise à jour..."
                    />
                </div>
                {liveValues && <CategoryLivePreview values={liveValues} />}
            </div>
        </div>
    )
}
