"use client"
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBatchCookingSessionReviewStore } from '@/features/cooking/stores/batch-cooking-session-review-store'
import { BatchCookingSessionReview } from '@/features/cooking/types/batch-cooking-session-review'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { ThumbsUp, ThumbsDown, MessageSquare, Users, UtensilsCrossed } from 'lucide-react'

export default function BatchCookingSessionReviewsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { reviews, total, page, pageSize, loading, error, setPage, fetchReviews } = useBatchCookingSessionReviewStore()
    const [selectedReview, setSelectedReview] = useState<BatchCookingSessionReview | null>(null)

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

    const updateUrlWithPage = (newPage: number) => {
        if (newPage === page) return
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                                Chargement...
                            </TableCell>
                        </TableRow>
                    ) : reviews.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                                        <button
                                            onClick={() => setSelectedReview(review)}
                                            className="text-left truncate block w-full hover:text-primary cursor-pointer"
                                        >
                                            {review.comment}
                                        </button>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
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

            <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {selectedReview && renderRating(selectedReview.rating)}
                            <span>Review de {selectedReview?.user_profile?.firstname || 'Utilisateur'}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Session #{selectedReview?.session_id} - {selectedReview && formatDate(selectedReview.created_at)}
                        </div>
                        <p className="whitespace-pre-wrap">{selectedReview?.comment}</p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
