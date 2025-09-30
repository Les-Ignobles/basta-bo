"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePendingIngredientStore } from '@/features/cooking/stores/pending-ingredient-store'
import { useCookingStore } from '@/features/cooking/store'
import type { PendingIngredient } from '@/features/cooking/types'
import type { IngredientFormValues } from '@/features/cooking/components/ingredient-form'
import { IngredientForm } from '@/features/cooking/components/ingredient-form'
import { Clock, Search, Trash2, Plus, Sparkles } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

export default function PendingIngredientsPage() {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [bulkProcessing, setBulkProcessing] = useState(false)
    const [bulkResult, setBulkResult] = useState<{ message: string; processed: number; created: Record<string, unknown>[]; errors?: string[] } | null>(null)
    const debouncedSearch = useDebounce(searchTerm, 400)

    const {
        pendingIngredients,
        loading,
        error,
        page,
        pageSize,
        total,
        search,
        editingPendingIngredient,
        fetchPendingIngredients,
        fetchPendingCount,
        deletePendingIngredient,
        bulkProcessWithAI,
        setSearch,
        setPage,
        setEditingPendingIngredient
    } = usePendingIngredientStore()

    const { categories, fetchCategories } = useCookingStore()

    useEffect(() => {
        fetchPendingIngredients()
        fetchCategories()
    }, [fetchPendingIngredients, fetchCategories])

    useEffect(() => {
        setSearch(debouncedSearch)
    }, [debouncedSearch, setSearch])

    useEffect(() => {
        fetchPendingIngredients()
    }, [page, search, fetchPendingIngredients])

    const handleConvert = async (ingredientData: IngredientFormValues) => {
        if (!editingPendingIngredient) return

        await usePendingIngredientStore.getState().convertToIngredient(editingPendingIngredient.id, ingredientData)
        // Rafraîchir le compteur dans la sidebar
        fetchPendingCount()
        setOpen(false)
        setEditingPendingIngredient(null)
    }

    const handleEdit = (pendingIngredient: PendingIngredient) => {
        setEditingPendingIngredient(pendingIngredient)
        setOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient en attente ?')) {
            await deletePendingIngredient(id)
            // Rafraîchir le compteur dans la sidebar
            fetchPendingCount()
        }
    }

    const handleBulkProcess = async () => {
        if (pendingIngredients.length === 0) {
            alert('Aucun ingrédient en attente à traiter')
            return
        }

        if (!confirm(`Êtes-vous sûr de vouloir traiter automatiquement ${pendingIngredients.length} ingrédient(s) avec l'IA ?`)) {
            return
        }

        setBulkProcessing(true)
        setBulkResult(null)
        
        try {
            const result = await bulkProcessWithAI()
            setBulkResult(result)
        } catch (error) {
            console.error('Erreur lors du traitement en lot:', error)
            alert('Erreur lors du traitement en lot')
        } finally {
            setBulkProcessing(false)
        }
    }

    const totalPages = Math.ceil(total / pageSize)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-christmas">Ingrédients en attente</h1>
                    <p className="text-muted-foreground">
                        Transformez les ingrédients suggérés par les utilisateurs en ingrédients officiels
                    </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {total} en attente
                </Badge>
            </div>

            {/* Barre de recherche et bouton magique */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Rechercher un ingrédient..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                
                {pendingIngredients.length > 0 && (
                    <Button
                        onClick={handleBulkProcess}
                        disabled={bulkProcessing || loading}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                        {bulkProcessing ? (
                            <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Traitement IA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Traitement magique ({pendingIngredients.length})
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Résultat du traitement en lot */}
            {bulkResult && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-green-800">Traitement terminé !</h3>
                        </div>
                        <p className="text-green-700 mb-2">{bulkResult.message}</p>
                        <p className="text-sm text-green-600">
                            {bulkResult.created.length} ingrédient(s) créé(s) sur {bulkResult.processed} traité(s)
                        </p>
                        {bulkResult.errors && bulkResult.errors.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm font-medium text-red-600 mb-1">Erreurs :</p>
                                <ul className="text-sm text-red-600 list-disc list-inside">
                                    {bulkResult.errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Liste des pending ingredients */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-2">Chargement...</p>
                    </div>
                ) : error ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-destructive">Erreur: {error}</p>
                        </CardContent>
                    </Card>
                ) : pendingIngredients.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Aucun ingrédient en attente</h3>
                                <p className="text-muted-foreground">
                                    Tous les ingrédients suggérés ont été traités !
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    pendingIngredients.map((pendingIngredient) => (
                        <Card key={pendingIngredient.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{pendingIngredient.name}</CardTitle>
                                        <CardDescription>
                                            Ajouté le {new Date(pendingIngredient.created_at).toLocaleDateString('fr-FR')}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(pendingIngredient)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Convertir
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(pendingIngredient.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {page} sur {totalPages} ({total} ingrédients)
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            Précédent
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal de conversion */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[800px] max-w-[95vw] w-full">
                    <DialogHeader>
                        <DialogTitle className="font-christmas">
                            {editingPendingIngredient ? 'Convertir en ingrédient' : 'Nouvel ingrédient'}
                        </DialogTitle>
                    </DialogHeader>
                    {editingPendingIngredient && (
                        <IngredientForm
                            defaultValues={{
                                name: { fr: editingPendingIngredient.name, en: '', es: '' },
                                suffix_singular: { fr: '', en: '', es: '' },
                                suffix_plural: { fr: '', en: '', es: '' },
                                category_id: null,
                                img_path: null
                            }}
                            categories={categories.map((c: Record<string, unknown>) => ({
                                id: Number(c.id),
                                label: `${c.emoji ?? ''} ${(c.title as Record<string, string>)?.fr ?? ''}`.trim()
                            }))}
                            onSubmit={handleConvert}
                            submittingLabel="Conversion..."
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
