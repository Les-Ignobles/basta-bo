"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react'
import { useAdviceArticleCategoryStore } from '@/features/advice/stores/advice-article-category-store'
import { TranslationTextField } from '@/components/translation-text'
import type { AdviceArticleCategoryFormValues } from '@/features/advice/types'

export default function AdviceCategoriesPage() {
    const {
        categories,
        loading,
        error,
        total,
        page,
        pageSize,
        searchInput,
        translationFilter,
        setSearchInput,
        setTranslationFilter,
        setPage,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useAdviceArticleCategoryStore()

    const [open, setOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<AdviceArticleCategoryFormValues | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Debounced search
    const fetchData = useCallback(() => {
        fetchCategories()
    }, [fetchCategories])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCategories()
        }, 400)
        return () => clearTimeout(timer)
    }, [searchInput, translationFilter, page, pageSize, fetchCategories])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSubmit = async (values: AdviceArticleCategoryFormValues) => {
        setSubmitting(true)
        try {
            if (values.id) {
                await updateCategory(values.id, values)
            } else {
                await createCategory(values)
            }
            setOpen(false)
            setEditingCategory(null)
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (category: { id: number; title: { fr: string }; short_title: { fr: string } }) => {
        setEditingCategory({
            id: category.id,
            title: category.title,
            short_title: category.short_title,
        })
        setOpen(true)
    }

    const handleDelete = (id: number) => {
        setCategoryToDelete(id)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (categoryToDelete) {
            try {
                await deleteCategory(categoryToDelete)
                setDeleteDialogOpen(false)
                setCategoryToDelete(null)
            } catch (error) {
                console.error('Erreur lors de la suppression:', error)
            }
        }
    }

    const handleNewCategory = () => {
        setEditingCategory({
            title: { fr: '' },
            short_title: { fr: '' },
        })
        setOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Catégories d&apos;articles</h1>
                    <Badge variant="secondary">{total}</Badge>
                </div>
                <Button onClick={handleNewCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle catégorie
                </Button>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Rechercher par nom ou ID..."
                        className="w-80 pl-10"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            Traductions
                            {translationFilter && (
                                <Badge variant="secondary" className="ml-2">
                                    {translationFilter === 'complete' ? 'Complètes' : 'Incomplètes'}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="complete"
                                    checked={translationFilter === 'complete'}
                                    onCheckedChange={(checked) =>
                                        setTranslationFilter(checked ? 'complete' : null)
                                    }
                                />
                                <label htmlFor="complete" className="text-sm">
                                    Complètes
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="incomplete"
                                    checked={translationFilter === 'incomplete'}
                                    onCheckedChange={(checked) =>
                                        setTranslationFilter(checked ? 'incomplete' : null)
                                    }
                                />
                                <label htmlFor="incomplete" className="text-sm">
                                    Incomplètes
                                </label>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button variant="outline" onClick={() => fetchCategories()} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            {/* Affichage des erreurs */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Liste des catégories */}
            <div className="grid gap-4">
                {loading && (
                    <div className="flex justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                )}

                {!loading && categories.length === 0 && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">
                                {searchInput ? 'Aucune catégorie trouvée pour cette recherche.' : 'Aucune catégorie trouvée.'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {!loading && categories.map((category) => (
                    <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg">
                                        {category.title.fr}
                                    </h3>
                                    {category.short_title?.fr && (
                                        <p className="text-sm text-muted-foreground">
                                            Titre court: {category.short_title.fr}
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-1">
                                        ID: {category.id} • Créé le {new Date(category.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(category)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(category.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {total > pageSize && (
                <div className="flex justify-center">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1 || loading}
                        >
                            Précédent
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {page} sur {Math.ceil(total / pageSize)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page >= Math.ceil(total / pageSize) || loading}
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal de création/édition */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[600px] max-w-[95vw] w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory?.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                        </DialogTitle>
                    </DialogHeader>
                    <CategoryForm
                        defaultValues={editingCategory}
                        onSubmit={handleSubmit}
                        submittingLabel={submitting ? 'Enregistrement...' : 'Enregistrer'}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// Composant formulaire pour les catégories
function CategoryForm({
    defaultValues,
    onSubmit,
    submittingLabel
}: {
    defaultValues?: AdviceArticleCategoryFormValues | null
    onSubmit: (values: AdviceArticleCategoryFormValues) => void
    submittingLabel?: string
}) {
    const [values, setValues] = useState<AdviceArticleCategoryFormValues>({
        title: { fr: '' },
        short_title: { fr: '' },
        ...defaultValues,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(values)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <TranslationTextField
                label="Titre"
                value={values.title}
                onChange={(v) => setValues((s) => ({ ...s, title: v }))}
            />

            <TranslationTextField
                label="Titre court"
                value={values.short_title}
                onChange={(v) => setValues((s) => ({ ...s, short_title: v }))}
            />

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={submittingLabel?.includes('...')}>
                    {submittingLabel || 'Enregistrer'}
                </Button>
            </div>
        </form>
    )
}
