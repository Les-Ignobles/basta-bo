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
import { useAdviceFaqStore } from '@/features/advice/stores/advice-faq-store'
import { TranslationTextField } from '@/components/translation-text'
import type { AdviceFaqFormValues } from '@/features/advice/types'

export default function AdviceFaqPage() {
    const {
        faqs,
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
        fetchFaqs,
        createFaq,
        updateFaq,
        deleteFaq,
    } = useAdviceFaqStore()

    const [open, setOpen] = useState(false)
    const [editingFaq, setEditingFaq] = useState<AdviceFaqFormValues | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [faqToDelete, setFaqToDelete] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Debounced search
    const fetchData = useCallback(() => {
        fetchFaqs()
    }, [fetchFaqs])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFaqs()
        }, 400)
        return () => clearTimeout(timer)
    }, [searchInput, translationFilter, page, pageSize, fetchFaqs])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSubmit = async (values: AdviceFaqFormValues) => {
        setSubmitting(true)
        try {
            if (values.id) {
                await updateFaq(values.id, values)
            } else {
                await createFaq(values)
            }
            setOpen(false)
            setEditingFaq(null)
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (faq: { id: number; question: { fr: string }; answer: { fr: string } }) => {
        setEditingFaq({
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
        })
        setOpen(true)
    }

    const handleDelete = (id: number) => {
        setFaqToDelete(id)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (faqToDelete) {
            try {
                await deleteFaq(faqToDelete)
                setDeleteDialogOpen(false)
                setFaqToDelete(null)
            } catch (error) {
                console.error('Erreur lors de la suppression:', error)
            }
        }
    }

    const handleNewFaq = () => {
        setEditingFaq({
            question: { fr: '' },
            answer: { fr: '' },
        })
        setOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">FAQ</h1>
                    <Badge variant="secondary">{total}</Badge>
                </div>
                <Button onClick={handleNewFaq}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle FAQ
                </Button>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Rechercher par question ou ID..."
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

                <Button variant="outline" onClick={() => fetchFaqs()} disabled={loading}>
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

            {/* Liste des FAQ */}
            <div className="grid gap-4">
                {loading && (
                    <div className="flex justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                )}

                {!loading && faqs.length === 0 && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">
                                {searchInput ? 'Aucune FAQ trouvée pour cette recherche.' : 'Aucune FAQ trouvée.'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {!loading && faqs.map((faq) => (
                    <Card key={faq.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg mb-2">
                                        {faq.question.fr}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {faq.answer.fr.length > 200
                                            ? `${faq.answer.fr.substring(0, 200)}...`
                                            : faq.answer.fr
                                        }
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        ID: {faq.id} • Créé le {new Date(faq.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(faq)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(faq.id)}
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
                <DialogContent className="sm:max-w-[800px] max-w-[95vw] w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {editingFaq?.id ? 'Modifier la FAQ' : 'Nouvelle FAQ'}
                        </DialogTitle>
                    </DialogHeader>
                    <FaqForm
                        defaultValues={editingFaq}
                        onSubmit={handleSubmit}
                        submittingLabel={submitting ? 'Enregistrement...' : 'Enregistrer'}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la FAQ</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette FAQ ? Cette action est irréversible.
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

// Composant formulaire pour les FAQ
function FaqForm({
    defaultValues,
    onSubmit,
    submittingLabel
}: {
    defaultValues?: AdviceFaqFormValues | null
    onSubmit: (values: AdviceFaqFormValues) => void
    submittingLabel?: string
}) {
    const [values, setValues] = useState<AdviceFaqFormValues>({
        question: { fr: '' },
        answer: { fr: '' },
        ...defaultValues,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(values)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <TranslationTextField
                label="Question"
                value={values.question}
                onChange={(v) => setValues((s) => ({ ...s, question: v }))}
            />

            <TranslationTextField
                label="Réponse"
                value={values.answer}
                onChange={(v) => setValues((s) => ({ ...s, answer: v }))}
            />

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={submittingLabel?.includes('...')}>
                    {submittingLabel || 'Enregistrer'}
                </Button>
            </div>
        </form>
    )
}
