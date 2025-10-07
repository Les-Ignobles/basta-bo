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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react'
import { useAdviceArticleStore } from '@/features/advice/stores/advice-article-store'
import { useAdviceArticleCategoryStore } from '@/features/advice/stores/advice-article-category-store'
import { TranslationTextField } from '@/components/translation-text'
import { ImageUpload } from '@/components/image-upload'
import type { AdviceArticleFormValues, PublicationState } from '@/features/advice/types'
import { MarkdownEditor } from '@/features/advice/components/markdown-editor'

export default function AdviceArticlesPage() {
    const {
        articles,
        loading,
        error,
        total,
        page,
        pageSize,
        searchInput,
        selectedCategoryId,
        selectedPublicationState,
        translationFilter,
        setSearchInput,
        setSelectedCategoryId,
        setSelectedPublicationState,
        setTranslationFilter,
        setPage,
        fetchArticles,
        createArticle,
        updateArticle,
        deleteArticle,
    } = useAdviceArticleStore()

    const { categories, fetchCategories } = useAdviceArticleCategoryStore()

    const [open, setOpen] = useState(false)
    const [editingArticle, setEditingArticle] = useState<AdviceArticleFormValues | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [articleToDelete, setArticleToDelete] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Debounced search
    const fetchAllData = useCallback(() => {
        fetchArticles()
        fetchCategories()
    }, [fetchArticles, fetchCategories])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchArticles()
        }, 400)
        return () => clearTimeout(timer)
    }, [searchInput, selectedCategoryId, selectedPublicationState, translationFilter, page, pageSize, fetchArticles])

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    const handleSubmit = async (values: AdviceArticleFormValues) => {
        setSubmitting(true)
        try {
            if (values.id) {
                await updateArticle(values.id, values)
            } else {
                await createArticle(values)
            }
            setOpen(false)
            setEditingArticle(null)
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (article: { id: number; title: { fr: string }; content: { fr: string }; is_featured: boolean; publication_state: PublicationState; category_id: number; cover_url: string }) => {
        setEditingArticle({
            id: article.id,
            title: article.title,
            content: article.content,
            is_featured: article.is_featured,
            publication_state: article.publication_state,
            category_id: article.category_id,
            cover_url: article.cover_url,
        })
        setOpen(true)
    }

    const handleDelete = (id: number) => {
        setArticleToDelete(id)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (articleToDelete) {
            try {
                await deleteArticle(articleToDelete)
                setDeleteDialogOpen(false)
                setArticleToDelete(null)
            } catch (error) {
                console.error('Erreur lors de la suppression:', error)
            }
        }
    }

    const handleNewArticle = () => {
        setEditingArticle({
            title: { fr: '' },
            content: { fr: '' },
            is_featured: false,
            publication_state: 'draft',
            category_id: 1,
            cover_url: '',
        })
        setOpen(true)
    }

    const getPublicationStateBadge = (state: PublicationState) => {
        switch (state) {
            case 'published':
                return <Badge variant="default">Publié</Badge>
            case 'draft':
                return <Badge variant="secondary">Brouillon</Badge>
            case 'archived':
                return <Badge variant="outline">Archivé</Badge>
            default:
                return <Badge variant="secondary">{state}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Articles de conseils</h1>
                    <Badge variant="secondary">{total}</Badge>
                </div>
                <Button onClick={handleNewArticle}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel article
                </Button>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Rechercher par titre ou ID..."
                        className="w-80 pl-10"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                <Select value={selectedCategoryId?.toString() || 'all'} onValueChange={(value) => setSelectedCategoryId(value === 'all' ? null : Number(value))}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                                {category.title.fr}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedPublicationState || 'all'} onValueChange={(value) => setSelectedPublicationState(value === 'all' ? null : value)}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="État" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les états</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                </Select>

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

                <Button variant="outline" onClick={() => fetchArticles()} disabled={loading}>
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

            {/* Liste des articles */}
            <div className="grid gap-4">
                {loading && (
                    <div className="flex justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                )}

                {!loading && articles.length === 0 && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">
                                {searchInput ? 'Aucun article trouvé pour cette recherche.' : 'Aucun article trouvé.'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {!loading && articles.map((article) => (
                    <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-medium text-lg">
                                            {article.title.fr}
                                        </h3>
                                        {article.is_featured && <Badge variant="default">⭐ Mis en avant</Badge>}
                                        {getPublicationStateBadge(article.publication_state)}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {article.content.fr.length > 200
                                            ? `${article.content.fr.substring(0, 200)}...`
                                            : article.content.fr
                                        }
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>ID: {article.id}</span>
                                        <span>Catégorie: {categories.find(c => c.id === article.category_id)?.title?.fr || `ID ${article.category_id}`}</span>
                                        <span>Créé le {new Date(article.created_at).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(article)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(article.id)}
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
                <DialogContent className="sm:max-w-[1200px] max-w-[95vw] w-full h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingArticle?.id ? 'Modifier l&apos;article' : 'Nouvel article'}
                        </DialogTitle>
                    </DialogHeader>
                    <ArticleForm
                        defaultValues={editingArticle}
                        onSubmit={handleSubmit}
                        submittingLabel={submitting ? 'Enregistrement...' : 'Enregistrer'}
                        categories={categories}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer l&apos;article</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
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

// Composant formulaire pour les articles
function ArticleForm({
    defaultValues,
    onSubmit,
    submittingLabel,
    categories
}: {
    defaultValues?: AdviceArticleFormValues | null
    onSubmit: (values: AdviceArticleFormValues) => void
    submittingLabel?: string
    categories: { id: number; title: { fr: string } }[]
}) {
    const [values, setValues] = useState<AdviceArticleFormValues>({
        title: { fr: '' },
        content: { fr: '' },
        is_featured: false,
        publication_state: 'draft',
        category_id: 1,
        cover_url: '',
        ...defaultValues,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(values)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <TranslationTextField
                        label="Titre"
                        value={values.title}
                        onChange={(v) => setValues((s) => ({ ...s, title: v }))}
                    />

                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Catégorie</Label>
                        <Select value={values.category_id.toString()} onValueChange={(value) => setValues((s) => ({ ...s, category_id: Number(value) }))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.title.fr}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-sm font-medium">État de publication</Label>
                        <Select value={values.publication_state} onValueChange={(value: PublicationState) => setValues((s) => ({ ...s, publication_state: value }))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Brouillon</SelectItem>
                                <SelectItem value="published">Publié</SelectItem>
                                <SelectItem value="archived">Archivé</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_featured"
                            checked={values.is_featured}
                            onCheckedChange={(checked: boolean) => setValues((s) => ({ ...s, is_featured: checked }))}
                        />
                        <Label htmlFor="is_featured" className="text-sm font-medium">
                            Article mis en avant
                        </Label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">Image de couverture</Label>
                        <ImageUpload
                            value={values.cover_url || undefined}
                            onChange={(url) => setValues((s) => ({ ...s, cover_url: url || '' }))}
                            bucket="recipes"
                            targetSize={300}
                            allowSizeSelection={true}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <Label className="text-sm font-medium">Contenu</Label>
                <MarkdownEditor
                    value={values.content}
                    onChange={(content) => setValues((s) => ({ ...s, content }))}
                    height={400}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={submittingLabel?.includes('...')}>
                    {submittingLabel || 'Enregistrer'}
                </Button>
            </div>
        </form>
    )
}

