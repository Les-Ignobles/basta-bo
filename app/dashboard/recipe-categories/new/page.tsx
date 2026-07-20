"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { RecipeCategoryForm } from '@/features/cooking/components/recipe-category-form'
import { CategoryLivePreview } from '@/features/cooking/components/catalog/category-live-preview'
import type { RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'

const EMPTY_VALUES: RecipeCategoryFormValues = {
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
}

export default function NewRecipeCategoryPage() {
    const router = useRouter()
    const [liveValues, setLiveValues] = useState<RecipeCategoryFormValues>(EMPTY_VALUES)

    const handleSubmit = async (values: RecipeCategoryFormValues) => {
        const response = await fetch('/api/recipe-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        })
        if (!response.ok) {
            console.error('Error creating category')
            return
        }
        const { data } = await response.json()
        // Enchaîner directement sur la gestion du contenu de la catégorie créée
        router.push(data?.id ? `/dashboard/recipe-categories/${data.id}/edit` : '/dashboard/recipe-categories')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/recipe-categories')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold font-christmas">Nouvelle catégorie</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <RecipeCategoryForm
                        onSubmit={handleSubmit}
                        onChange={setLiveValues}
                        onCancel={() => router.push('/dashboard/recipe-categories')}
                        submittingLabel="Création..."
                    />
                </div>
                <CategoryLivePreview values={liveValues} />
            </div>
        </div>
    )
}
