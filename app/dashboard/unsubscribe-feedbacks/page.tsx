'use client'

import { useEffect } from 'react'
import { Loader2, Download, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useUnsubscribeFeedbackStore } from '@/features/unsubscribe-feedbacks/store'
import { REASON_LABELS, FEEDBACK_OPTION_LABELS } from '@/features/unsubscribe-feedbacks/types'
import { exportUnsubscribeFeedbacksCSV } from '@/features/unsubscribe-feedbacks/csv-export'

export default function UnsubscribeFeedbacksPage() {
    const { feedbacks, isLoading, error, fetchFeedbacks } = useUnsubscribeFeedbackStore()

    useEffect(() => {
        fetchFeedbacks()
    }, [fetchFeedbacks])

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Chargement des retours...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-destructive">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <UserX className="size-6" />
                    <h1 className="text-2xl font-semibold">Retours de désabonnement</h1>
                    <Badge variant="secondary">
                        {feedbacks.length} retour{feedbacks.length > 1 ? 's' : ''}
                    </Badge>
                </div>
                <Button
                    onClick={() => exportUnsubscribeFeedbacksCSV(feedbacks)}
                    disabled={feedbacks.length === 0}
                    variant="outline"
                >
                    <Download className="size-4 mr-2" />
                    Exporter CSV
                </Button>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead>Texte libre</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {feedbacks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Aucun retour pour le moment
                            </TableCell>
                        </TableRow>
                    ) : (
                        feedbacks.map((feedback) => (
                            <TableRow key={feedback.id}>
                                <TableCell className="text-muted-foreground whitespace-nowrap">
                                    {formatDate(feedback.created_at)}
                                </TableCell>
                                <TableCell>
                                    {feedback.user_profile ? (
                                        <div>
                                            <div className="font-medium">{feedback.user_profile.firstname ?? '-'}</div>
                                            <div className="text-xs text-muted-foreground">{feedback.user_profile.email ?? '-'}</div>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">#{feedback.user_profile_id}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {REASON_LABELS[feedback.reason_slug] ?? feedback.reason_slug}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {feedback.feedback_options && feedback.feedback_options.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {feedback.feedback_options.map((option) => (
                                                <Badge key={option} variant="secondary" className="text-xs">
                                                    {FEEDBACK_OPTION_LABELS[option] ?? option}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="max-w-md">
                                    {feedback.feedback_text ? (
                                        <span className="text-sm">{feedback.feedback_text}</span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
