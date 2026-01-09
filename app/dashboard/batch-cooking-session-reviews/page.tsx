"use client"
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBatchCookingSessionReviewStore } from '@/features/cooking/stores/batch-cooking-session-review-store'
import { BatchCookingSessionReview } from '@/features/cooking/types/batch-cooking-session-review'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { ThumbsUp, ThumbsDown, MessageSquare, Users, UtensilsCrossed, ChefHat, Calendar, ShoppingCart, Eye, Sparkles, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { AnalysisResult } from '@/app/api/batch-cooking-session-reviews/analyze/route'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function BatchCookingSessionReviewsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { reviews, total, page, pageSize, loading, error, setPage, fetchReviews } = useBatchCookingSessionReviewStore()
    const [selectedReview, setSelectedReview] = useState<BatchCookingSessionReview | null>(null)
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
    const [analyzing, setAnalyzing] = useState(false)

    const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / (pageSize || 20))), [total, pageSize])

    // Synchroniser la page avec l'URL
    useEffect(() => {
        const pageParam = searchParams.get('page')
        if (pageParam && !isNaN(Number(pageParam))) {
            const pageNumber = Number(pageParam)
            if (pageNumber !== page) {
                setPage(pageNumber)
            }
        }
    }, [searchParams, page, setPage])

    useEffect(() => {
        fetchReviews()
    }, [fetchReviews, page])

    // Synchroniser la modal avec l'URL (review=id)
    useEffect(() => {
        const reviewId = searchParams.get('review')
        if (reviewId && reviews.length > 0) {
            const review = reviews.find(r => r.id === Number(reviewId))
            if (review && selectedReview?.id !== review.id) {
                setSelectedReview(review)
            }
        }
    }, [searchParams, reviews, selectedReview?.id])

    const updateUrlWithPage = (newPage: number) => {
        if (newPage === page) return
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`/dashboard/batch-cooking-session-reviews?${params.toString()}`, { scroll: false })
    }

    const openReview = (review: BatchCookingSessionReview) => {
        setSelectedReview(review)
        const params = new URLSearchParams(searchParams.toString())
        params.set('review', review.id.toString())
        router.push(`/dashboard/batch-cooking-session-reviews?${params.toString()}`, { scroll: false })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const analyzeReview = async (review: BatchCookingSessionReview) => {
        if (!review.comment || !review.session) return

        setAnalyzing(true)
        setAnalysisResult(null)

        try {
            const response = await fetch('/api/batch-cooking-session-reviews/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('Analysis API error:', response.status, errorData)
                throw new Error(errorData.error || 'Analysis failed')
            }

            const result = await response.json()
            setAnalysisResult(result)
        } catch (err) {
            console.error('Analysis error:', err)
            alert(`Erreur d'analyse: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
        } finally {
            setAnalyzing(false)
        }
    }

    const handleCloseDialog = () => {
        setSelectedReview(null)
        setAnalysisResult(null)
        const params = new URLSearchParams(searchParams.toString())
        params.delete('review')
        router.push(`/dashboard/batch-cooking-session-reviews?${params.toString()}`, { scroll: false })
    }

    const renderRating = (rating: number | null) => {
        if (rating === null) return <span className="text-muted-foreground">-</span>
        if (rating === 1) {
            return <ThumbsUp className="h-5 w-5 text-green-500" />
        }
        return <ThumbsDown className="h-5 w-5 text-red-500" />
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold font-christmas">Reviews des Sessions</h1>
                    <Badge variant="secondary" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {total} review{total > 1 ? 's' : ''}
                    </Badge>
                </div>
            </div>

            <div className="flex items-center justify-end py-2 gap-4 sticky top-0 z-10 bg-background border-b">
                <div className="flex items-center gap-2 text-sm">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateUrlWithPage(page - 1)}>
                        Precedent
                    </Button>
                    <span className="text-muted-foreground">
                        Page {page} / {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateUrlWithPage(page + 1)}>
                        Suivant
                    </Button>
                </div>
            </div>

            {error && (
                <div className="text-red-500 p-4 bg-red-50 rounded-md">
                    Erreur: {error}
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Session ID</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead className="max-w-md">Commentaire</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                                Chargement...
                            </TableCell>
                        </TableRow>
                    ) : reviews.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                Aucune review pour le moment
                            </TableCell>
                        </TableRow>
                    ) : (
                        reviews.map((review) => (
                            <TableRow key={review.id}>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(review.created_at)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{review.user_profile?.firstname || '-'}</span>
                                        <span className="text-xs text-muted-foreground">{review.user_profile?.email || '-'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <HoverCard>
                                        <HoverCardTrigger asChild>
                                            <Badge variant="outline" className="cursor-help">
                                                #{review.session_id}
                                            </Badge>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-72">
                                            {review.session ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">Session #{review.session_id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-1.5">
                                                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                                                            <span>{review.session.meal_count} repas</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                            <span>{review.session.people_count} pers.</span>
                                                        </div>
                                                    </div>
                                                    {review.session.recipes && review.session.recipes.length > 0 && (
                                                        <div className="space-y-1.5">
                                                            <span className="text-xs text-muted-foreground">Recettes :</span>
                                                            <ul className="text-sm space-y-1">
                                                                {review.session.recipes.map((recipe, idx) => (
                                                                    <li key={idx} className="truncate">
                                                                        {recipe.title}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Session non trouvee</span>
                                            )}
                                        </HoverCardContent>
                                    </HoverCard>
                                </TableCell>
                                <TableCell>
                                    {renderRating(review.rating)}
                                </TableCell>
                                <TableCell className="max-w-md">
                                    {review.comment ? (
                                        <span className="text-left truncate block w-full">
                                            {review.comment}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openReview(review)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {!loading && reviews.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Affichage de {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, total)} sur {total} reviews
                    </span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateUrlWithPage(page - 1)}>
                            Precedent
                        </Button>
                        <span>Page {page} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateUrlWithPage(page + 1)}>
                            Suivant
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={!!selectedReview} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="w-[800px] max-w-[90%] sm:max-w-[90%] max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {selectedReview && renderRating(selectedReview.rating)}
                            <span>Review de {selectedReview?.user_profile?.firstname || 'Utilisateur'}</span>
                            <Badge variant="outline">Session #{selectedReview?.session_id}</Badge>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedReview && (
                        <div className="space-y-4">
                            {/* Info header */}
                            <div className="flex items-center gap-6 text-sm text-muted-foreground border-b pb-4">
                                <span>{formatDate(selectedReview.created_at)}</span>
                                {selectedReview.session && (
                                    <>
                                        <div className="flex items-center gap-1.5">
                                            <UtensilsCrossed className="h-4 w-4" />
                                            <span>{selectedReview.session.meal_count} repas</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4" />
                                            <span>{selectedReview.session.people_count} personnes</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Comment section */}
                            {selectedReview.comment && (
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <MessageSquare className="h-4 w-4" />
                                            Commentaire
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => analyzeReview(selectedReview)}
                                            disabled={analyzing || !selectedReview.session}
                                        >
                                            {analyzing ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Analyse en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                    Analyser avec IA
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm">{selectedReview.comment}</p>

                                    {/* AI Analysis Result */}
                                    {analysisResult && (
                                        <div className="mt-4 pt-4 border-t space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-purple-500" />
                                                <span className="text-sm font-medium">Analyse IA</span>
                                            </div>

                                            <div className="p-3 rounded-lg bg-background">
                                                <p className="text-sm">{analysisResult.explanation}</p>
                                            </div>

                                            {analysisResult.relevant_steps && analysisResult.relevant_steps.length > 0 && (
                                                <div className="space-y-1">
                                                    <span className="text-xs text-muted-foreground">Etapes pertinentes:</span>
                                                    <ul className="text-xs space-y-1 pl-4">
                                                        {analysisResult.relevant_steps.map((step, idx) => (
                                                            <li key={idx} className="list-disc">{step}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {analysisResult.suggestion && (
                                                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                                                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                                                    <div>
                                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Suggestion:</span>
                                                        <p className="text-sm">{analysisResult.suggestion}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tabs for session details */}
                            {selectedReview.session && (
                                <Tabs defaultValue="recipes" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="recipes" className="flex items-center gap-2">
                                            <UtensilsCrossed className="h-4 w-4" />
                                            Recettes
                                        </TabsTrigger>
                                        <TabsTrigger value="cooking" className="flex items-center gap-2">
                                            <ChefHat className="h-4 w-4" />
                                            Cuisine
                                        </TabsTrigger>
                                        <TabsTrigger value="assembly" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Assemblage
                                        </TabsTrigger>
                                        <TabsTrigger value="shopping" className="flex items-center gap-2">
                                            <ShoppingCart className="h-4 w-4" />
                                            Courses
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="h-[500px] mt-4 overflow-y-auto">
                                        {/* Recipes Tab */}
                                        <TabsContent value="recipes" className="mt-0">
                                            {selectedReview.session.recipes && selectedReview.session.recipes.length > 0 ? (
                                                <div className="space-y-2">
                                                    {selectedReview.session.recipes.map((recipe, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                                            <Badge variant="secondary">{idx + 1}</Badge>
                                                            {recipe.original_recipe_id ? (
                                                                <Link
                                                                    href={`/dashboard/recipes/edit/${recipe.original_recipe_id}`}
                                                                    className="font-medium text-primary hover:underline"
                                                                >
                                                                    {recipe.title}
                                                                </Link>
                                                            ) : (
                                                                <span className="font-medium">{recipe.title}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-center py-8">Aucune recette</p>
                                            )}
                                        </TabsContent>

                                        {/* Cooking Steps Tab */}
                                        <TabsContent value="cooking" className="mt-0">
                                            {selectedReview.session.cooking_steps && selectedReview.session.cooking_steps.length > 0 ? (
                                                <Accordion type="single" collapsible className="w-full">
                                                    {selectedReview.session.cooking_steps
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((step, idx) => (
                                                        <AccordionItem key={step.id || idx} value={`step-${idx}`}>
                                                            <AccordionTrigger className="text-left">
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="outline">{step.order}</Badge>
                                                                    <span>{step.text}</span>
                                                                    {step.cooking_time && (
                                                                        <span className="text-xs text-muted-foreground">({Math.round(step.cooking_time / 60)} min)</span>
                                                                    )}
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                {step.ingredients && step.ingredients.length > 0 && (
                                                                    <div className="pl-10 mb-2">
                                                                        <span className="text-xs text-muted-foreground">Ingredients: </span>
                                                                        <span className="text-sm">
                                                                            {step.ingredients.map((ing) => ing.text).join(', ')}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            ) : (
                                                <p className="text-muted-foreground text-center py-8">Aucune etape de cuisine</p>
                                            )}
                                        </TabsContent>

                                        {/* Assembly Steps Tab */}
                                        <TabsContent value="assembly" className="mt-0">
                                            {selectedReview.session.assembly_steps && selectedReview.session.assembly_steps.length > 0 ? (
                                                <Accordion type="single" collapsible className="w-full">
                                                    {selectedReview.session.assembly_steps
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((step, idx) => (
                                                        <AccordionItem key={step.id || idx} value={`assembly-${idx}`}>
                                                            <AccordionTrigger className="text-left">
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="outline">{step.order}</Badge>
                                                                    <span>{step.text}</span>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <p className="whitespace-pre-wrap text-sm text-muted-foreground pl-10">
                                                                    {step.desc}
                                                                </p>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            ) : (
                                                <p className="text-muted-foreground text-center py-8">Aucune etape d&apos;assemblage</p>
                                            )}
                                        </TabsContent>

                                        {/* Shopping List Tab */}
                                        <TabsContent value="shopping" className="mt-0">
                                            {selectedReview.session.ingredients && selectedReview.session.ingredients.length > 0 ? (
                                                <div className="space-y-2">
                                                    {selectedReview.session.ingredients
                                                        .filter((ing) => !ing.is_basic)
                                                        .sort((a, b) => a.text.localeCompare(b.text))
                                                        .map((ing, idx) => (
                                                        <div key={ing.id || idx} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                                            <div className="flex items-center gap-2">
                                                                {ing.img_path && (
                                                                    <img src={ing.img_path} alt={ing.text} className="w-6 h-6 rounded object-cover" />
                                                                )}
                                                                <span>{ing.text}</span>
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">
                                                                {ing.quantity !== null ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}` : '-'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {/* Basic ingredients section */}
                                                    {selectedReview.session.ingredients.some((ing) => ing.is_basic) && (
                                                        <div className="mt-4 pt-4 border-t">
                                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Ingredients de base</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {selectedReview.session.ingredients
                                                                    .filter((ing) => ing.is_basic)
                                                                    .map((ing, idx) => (
                                                                    <Badge key={ing.id || idx} variant="secondary">{ing.text}</Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-center py-8">Aucun ingredient</p>
                                            )}
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
