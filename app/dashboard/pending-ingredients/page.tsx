"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { usePendingIngredientStore } from '@/features/cooking/stores/pending-ingredient-store'
import { useCookingStore } from '@/features/cooking/store'
import type { PendingIngredient } from '@/features/cooking/types'
import type { IngredientFormValues } from '@/features/cooking/components/ingredient-form'
import type { TranslationText } from '@/lib/i18n'
import { IngredientForm } from '@/features/cooking/components/ingredient-form'
import { PendingIngredientsBulkActionsBar } from '@/features/cooking/components/pending-ingredients-bulk-actions-bar'
import { Clock, Search, Trash2, Plus, Sparkles, Eye, Check, X } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

export default function PendingIngredientsPage() {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [bulkProcessing, setBulkProcessing] = useState(false)
    const [bulkResult, setBulkResult] = useState<{ message: string; processed: number; created: Record<string, unknown>[]; errors?: string[] } | null>(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewData, setPreviewData] = useState<{ ingredients: Record<string, unknown>[]; errors?: string[] } | null>(null)
    const [generatedData, setGeneratedData] = useState<Map<number, Record<string, unknown>>>(new Map())
    const [generatingStates, setGeneratingStates] = useState<Map<number, boolean>>(new Map())
    const [bulkProgress, setBulkProgress] = useState<{ completed: number; total: number } | null>(null)
    const [bulkResults, setBulkResults] = useState<{ success: boolean; ingredientName: string }[]>([])
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
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
        selectedPendingIngredients,
        fetchPendingIngredients,
        fetchPendingCount,
        deletePendingIngredient,
        bulkDeletePendingIngredients,
        bulkProcessWithAI,
        generateIngredientData,
        setSearch,
        setPage,
        setEditingPendingIngredient,
        togglePendingIngredientSelection,
        selectAllPendingIngredients,
        clearPendingIngredientSelection
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

    const handleBulkDelete = () => {
        setBulkDeleteDialogOpen(true)
    }

    const confirmBulkDelete = async () => {
        await bulkDeletePendingIngredients(selectedPendingIngredients)
        setBulkDeleteDialogOpen(false)
        // Rafraîchir le compteur dans la sidebar
        fetchPendingCount()
    }

    const allSelected = selectedPendingIngredients.length === pendingIngredients.length && pendingIngredients.length > 0

    const handlePreviewBulkProcess = async () => {
        if (pendingIngredients.length === 0) {
            alert('Aucun ingrédient en attente à traiter')
            return
        }

        setBulkProcessing(true)
        setPreviewData(null)
        setBulkProgress({ completed: 0, total: pendingIngredients.length })

        try {
            const result = await usePendingIngredientStore.getState().previewBulkProcess((completed, total, ingredientResult) => {
                setBulkProgress({ completed, total })

                // Si on a un résultat, l'ajouter immédiatement aux données générées
                if (ingredientResult && ingredientResult.pendingId) {
                    setGeneratedData(prev => new Map(prev).set(ingredientResult.pendingId as number, ingredientResult))
                }
            })

            setPreviewData({ ingredients: result.ingredients, errors: result.errors })
            setPreviewOpen(true)
        } catch (error) {
            console.error('Erreur lors de la prévisualisation:', error)
            alert('Erreur lors de la prévisualisation')
        } finally {
            setBulkProcessing(false)
            setBulkProgress(null)
        }
    }

    const handleGenerateForIngredient = async (pendingId: number) => {
        setGeneratingStates(prev => new Map(prev).set(pendingId, true))

        try {
            const result = await generateIngredientData(pendingId)
            if (result.success) {
                setGeneratedData(prev => new Map(prev).set(pendingId, result.ingredient))
            } else {
                console.error('Erreur génération:', result.error)
                alert(`Erreur lors de la génération: ${result.error}`)
            }
        } catch (error) {
            console.error('Erreur lors de la génération:', error)
            alert('Erreur lors de la génération')
        } finally {
            setGeneratingStates(prev => new Map(prev).set(pendingId, false))
        }
    }

    const handleConfirmBulkProcess = async () => {
        if (!previewData) return

        setBulkProcessing(true)
        setBulkResult(null)
        setBulkResults([])
        setBulkProgress({ completed: 0, total: previewData.ingredients.length })

        try {
            const result = await bulkProcessWithAI(previewData.ingredients, (completed, total, success, ingredientName) => {
                setBulkProgress({ completed, total })
                setBulkResults(prev => [...prev, { success, ingredientName }])
            })
            setBulkResult(result)
            setPreviewOpen(false)
            setPreviewData(null)
        } catch (error) {
            console.error('Erreur lors du traitement en lot:', error)
            alert('Erreur lors du traitement en lot')
        } finally {
            setBulkProcessing(false)
            setBulkProgress(null)
        }
    }

    const handleCreateFromAI = async (pendingId: number) => {
        const aiData = generatedData.get(pendingId)
        if (!aiData) return

        try {
            // Convertir les données IA en format IngredientFormValues
            const ingredientData: IngredientFormValues = {
                name: aiData.name as TranslationText,
                suffix_singular: aiData.suffix_singular as TranslationText,
                suffix_plural: aiData.suffix_plural as TranslationText,
                category_id: aiData.category_id as number | null,
                img_path: null,
                is_basic: false // Par défaut, les ingrédients générés par IA ne sont pas de base
            }

            // Créer l'ingrédient
            await usePendingIngredientStore.getState().convertToIngredient(pendingId, ingredientData)

            // Rafraîchir le compteur dans la sidebar
            fetchPendingCount()

            // Supprimer les données générées pour cet ingrédient
            setGeneratedData(prev => {
                const newMap = new Map(prev)
                newMap.delete(pendingId)
                return newMap
            })

            alert('Ingrédient créé avec succès !')
        } catch (error) {
            console.error('Erreur lors de la création:', error)
            alert('Erreur lors de la création de l\'ingrédient')
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
                <div className="flex items-center gap-4">
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
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    selectAllPendingIngredients()
                                } else {
                                    clearPendingIngredientSelection()
                                }
                            }}
                            className="shrink-0"
                        />
                    )}
                </div>

                {pendingIngredients.length > 0 && (
                    <Button
                        onClick={handlePreviewBulkProcess}
                        disabled={bulkProcessing || loading}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                        {bulkProcessing ? (
                            <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Génération prévisualisation...
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-2" />
                                Prévisualiser ({pendingIngredients.length})
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Progression du traitement en lot */}
            {bulkProgress && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                            <h3 className="text-lg font-semibold text-blue-800">Traitement en cours...</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Ingrédients traités</span>
                                <span>{bulkProgress.completed} / {bulkProgress.total}</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${(bulkProgress.completed / bulkProgress.total) * 100}%` }}
                                />
                            </div>
                            <p className="text-sm text-blue-700">
                                {bulkProgress.completed === bulkProgress.total
                                    ? 'Traitement terminé !'
                                    : `Traitement de ${bulkProgress.completed} ingrédient(s) sur ${bulkProgress.total}...`
                                }
                            </p>
                        </div>

                        {/* Feedback en temps réel */}
                        {bulkResults.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                                <h4 className="text-sm font-semibold text-blue-800 mb-2">Résultats en temps réel :</h4>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {bulkResults.map((result, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            {result.success ? (
                                                <>
                                                    <Check className="h-4 w-4 text-green-600" />
                                                    <span className="text-green-700">{result.ingredientName}</span>
                                                    <span className="text-green-600 text-xs">✓ Créé</span>
                                                </>
                                            ) : (
                                                <>
                                                    <X className="h-4 w-4 text-red-600" />
                                                    <span className="text-red-700">{result.ingredientName}</span>
                                                    <span className="text-red-600 text-xs">✗ Échec</span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

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
                    pendingIngredients.map((pendingIngredient) => {
                        const isGenerating = generatingStates.get(pendingIngredient.id) || false
                        const hasGeneratedData = generatedData.has(pendingIngredient.id)
                        const isInBulkProcessing = bulkProcessing && bulkProgress

                        return (
                            <Card
                                key={pendingIngredient.id}
                                className={`hover:shadow-md transition-shadow ${isGenerating ? 'border-blue-300 bg-blue-50' :
                                    hasGeneratedData ? 'border-green-300 bg-green-50' :
                                        isInBulkProcessing ? 'border-purple-300 bg-purple-50' : ''
                                    }`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedPendingIngredients.includes(pendingIngredient.id)}
                                                onCheckedChange={() => togglePendingIngredientSelection(pendingIngredient.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <div>
                                                <CardTitle className="text-lg">{pendingIngredient.name}</CardTitle>
                                                <CardDescription>
                                                    Ajouté le {new Date(pendingIngredient.created_at).toLocaleDateString('fr-FR')}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleGenerateForIngredient(pendingIngredient.id)}
                                                disabled={generatingStates.get(pendingIngredient.id) || false}
                                            >
                                                {generatingStates.get(pendingIngredient.id) ? (
                                                    <>
                                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                        Génération...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                        Générer IA
                                                    </>
                                                )}
                                            </Button>
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

                                {/* Affichage des données générées par l'IA */}
                                {generatedData.has(pendingIngredient.id) && (
                                    <CardContent className="pt-0">
                                        <div className="border-t pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-purple-500" />
                                                    Données générées par l&apos;IA
                                                </h4>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleCreateFromAI(pendingIngredient.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Créer cet ingrédient
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="font-medium">Nom FR:</span> {(generatedData.get(pendingIngredient.id)?.name as TranslationText)?.fr}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Nom EN:</span> {(generatedData.get(pendingIngredient.id)?.name as TranslationText)?.en}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Nom ES:</span> {(generatedData.get(pendingIngredient.id)?.name as TranslationText)?.es}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="font-medium">Suffixe singulier:</span> {(generatedData.get(pendingIngredient.id)?.suffix_singular as TranslationText)?.fr}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Suffixe pluriel:</span> {(generatedData.get(pendingIngredient.id)?.suffix_plural as TranslationText)?.fr}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Catégorie:</span>
                                                        <span className={`ml-1 px-2 py-1 rounded text-xs ${generatedData.get(pendingIngredient.id)?.category_name ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {(generatedData.get(pendingIngredient.id)?.category_name as string) || 'Aucune catégorie'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })
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

            {/* Modal de prévisualisation */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="sm:max-w-[1000px] max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-christmas flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            Prévisualisation du traitement IA
                        </DialogTitle>
                    </DialogHeader>

                    {previewData && (
                        <div className="space-y-4">
                            {/* Barre de progression */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Ingrédients traités</span>
                                    <span>{previewData.ingredients.length} / {pendingIngredients.length}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(previewData.ingredients.length / pendingIngredients.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Erreurs */}
                            {previewData.errors && previewData.errors.length > 0 && (
                                <Card className="border-red-200 bg-red-50">
                                    <CardContent className="pt-4">
                                        <h4 className="font-semibold text-red-800 mb-2">Erreurs détectées :</h4>
                                        <ul className="text-sm text-red-700 space-y-1">
                                            {previewData.errors.map((error, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    {error}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Liste des ingrédients */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {previewData.ingredients.map((ingredient, index) => (
                                    <Card key={index} className="border-gray-200">
                                        <CardContent className="pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-semibold text-lg mb-2">
                                                        {ingredient.pendingName as string}
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-medium">Nom FR:</span> {(ingredient.name as Record<string, string>)?.fr}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Nom EN:</span> {(ingredient.name as Record<string, string>)?.en}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Nom ES:</span> {(ingredient.name as Record<string, string>)?.es}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="font-medium">Suffixe singulier:</span> {(ingredient.suffix_singular as Record<string, string>)?.fr}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Suffixe pluriel:</span> {(ingredient.suffix_plural as Record<string, string>)?.fr}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Catégorie:</span>
                                                        <span className={`ml-1 px-2 py-1 rounded text-xs ${ingredient.category_name ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {(ingredient.category_name as string) || 'Aucune catégorie'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Feedback en temps réel pendant le traitement */}
                            {bulkProcessing && bulkProgress && (
                                <Card className="border-blue-200 bg-blue-50">
                                    <CardContent className="pt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                                            <h4 className="text-sm font-semibold text-blue-800">Traitement en cours...</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Ingrédients traités</span>
                                                <span>{bulkProgress.completed} / {bulkProgress.total}</span>
                                            </div>
                                            <div className="w-full bg-blue-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${(bulkProgress.completed / bulkProgress.total) * 100}%` }}
                                                />
                                            </div>

                                            {/* Résultats en temps réel */}
                                            {bulkResults.length > 0 && (
                                                <div className="mt-3 border-t pt-3">
                                                    <h5 className="text-xs font-semibold text-blue-800 mb-2">Résultats en temps réel :</h5>
                                                    <div className="max-h-24 overflow-y-auto space-y-1">
                                                        {bulkResults.map((result, index) => (
                                                            <div key={index} className="flex items-center gap-2 text-xs">
                                                                {result.success ? (
                                                                    <>
                                                                        <Check className="h-3 w-3 text-green-600" />
                                                                        <span className="text-green-700">{result.ingredientName}</span>
                                                                        <span className="text-green-600 text-xs">✓</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <X className="h-3 w-3 text-red-600" />
                                                                        <span className="text-red-700">{result.ingredientName}</span>
                                                                        <span className="text-red-600 text-xs">✗</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setPreviewOpen(false)}
                                    disabled={bulkProcessing}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleConfirmBulkProcess}
                                    disabled={bulkProcessing}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                >
                                    {bulkProcessing ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Traitement...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Confirmer et traiter ({previewData.ingredients.length})
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Barre d'actions en masse */}
            <PendingIngredientsBulkActionsBar
                selectedCount={selectedPendingIngredients.length}
                onClearSelection={clearPendingIngredientSelection}
                onBulkDelete={handleBulkDelete}
            />

            {/* Modal de confirmation de suppression en masse */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer les ingrédients en attente</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer {selectedPendingIngredients.length} ingrédient{selectedPendingIngredients.length > 1 ? 's' : ''} en attente ?
                            Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBulkDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
