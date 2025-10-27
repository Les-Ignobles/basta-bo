"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    ChefHat,
    Search,
    Eye,
    Trash2,
    Plus,
    ChevronRight
} from 'lucide-react'
import { BatchCookingSession } from '@/features/cooking/types/batch-cooking-session'
import { useBatchCookingSessionStore } from '@/features/cooking/stores/batch-cooking-session-store'
import { useDebounce } from '@/hooks/use-debounce'

export default function BatchCookingSessionsPage() {
    const {
        sessions,
        total,
        page,
        pageSize,
        loading,
        error,
        filters,
        setPage,
        setPageSize,
        setFilters,
        clearFilters,
        fetchOriginalSessions,
        deleteSession,
        fetchChildrenByParentId
    } = useBatchCookingSessionStore()

    const [searchInput, setSearchInput] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [sessionToDelete, setSessionToDelete] = useState<BatchCookingSession | null>(null)
    const [selectedSession, setSelectedSession] = useState<BatchCookingSession | null>(null)
    const [childrenSessions, setChildrenSessions] = useState<BatchCookingSession[]>([])
    const [loadingChildren, setLoadingChildren] = useState(false)

    const debouncedSearch = useDebounce(searchInput, 400)

    // Charger les sessions au montage
    useEffect(() => {
        fetchOriginalSessions()
    }, [fetchOriginalSessions])

    // Mettre à jour les filtres quand la recherche change
    useEffect(() => {
        setFilters({ search: debouncedSearch })
        fetchOriginalSessions()
    }, [debouncedSearch, setFilters, fetchOriginalSessions])

    // Mettre à jour les sessions quand les filtres changent
    useEffect(() => {
        fetchOriginalSessions()
    }, [page, pageSize, filters, fetchOriginalSessions])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const handleDeleteSession = (session: BatchCookingSession) => {
        setSessionToDelete(session)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (sessionToDelete) {
            await deleteSession(sessionToDelete.id)
            setDeleteDialogOpen(false)
            setSessionToDelete(null)
        }
    }

    const handleRowClick = async (session: BatchCookingSession) => {
        console.log('Clic sur la session:', session.id)
        setSelectedSession(session)
        setLoadingChildren(true)
        try {
            console.log('Chargement des sessions enfants pour:', session.id)
            const children = await fetchChildrenByParentId(session.id)
            console.log('Sessions enfants reçues:', children)
            setChildrenSessions(children)
        } catch (error) {
            console.error('Erreur lors du chargement des sessions enfants:', error)
        } finally {
            setLoadingChildren(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-christmas">Batch Cooking Sessions</h1>
                    <p className="text-muted-foreground">
                        Gestion des sessions de batch cooking originales
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Session
                </Button>
            </div>

            {/* Barre de recherche */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Rechercher par seed..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pl-10 w-80"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tableau des sessions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ChefHat className="h-5 w-5" />
                        Sessions Originales ({total})
                    </CardTitle>
                    <CardDescription>
                        Cliquez sur une ligne pour voir les sessions enfants
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-8 text-red-600">
                            {error}
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Seed</TableHead>
                                        <TableHead>Recettes</TableHead>
                                        <TableHead>Algo Name</TableHead>
                                        <TableHead>Enfants</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => (
                                        <TableRow
                                            key={session.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleRowClick(session)}
                                        >
                                            <TableCell className="font-medium">{session.id}</TableCell>
                                            <TableCell>
                                                {session.seed ? (
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                                        {session.seed.substring(0, 20)}...
                                                    </code>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {session.recipes?.slice(0, 3).map((recipe, index) => (
                                                        <Badge key={index} variant="secondary" className="mr-1 text-xs">
                                                            {recipe.title}
                                                        </Badge>
                                                    ))}
                                                    {session.recipes && session.recipes.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{session.recipes.length - 3} autres
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {session.algo_name || (
                                                    <span className="text-muted-foreground">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {session.children_count || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRowClick(session)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteSession(session)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, total)} sur {total}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page <= 1}
                                    >
                                        Précédent
                                    </Button>
                                    <span className="text-sm">
                                        Page {page} sur {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= totalPages}
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Modal des sessions enfants */}
            <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ChevronRight className="h-5 w-5" />
                            Sessions Enfants - Session #{selectedSession?.id}
                        </DialogTitle>
                        <DialogDescription>
                            Sessions générées à partir de la session originale
                        </DialogDescription>
                    </DialogHeader>
                    
                    {loadingChildren ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : childrenSessions.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            Aucune session enfant trouvée pour cette session originale
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Seed</TableHead>
                                    <TableHead>Recettes</TableHead>
                                    <TableHead>Algo Name</TableHead>
                                    <TableHead>Créé le</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {childrenSessions.map((child) => (
                                    <TableRow key={child.id}>
                                        <TableCell className="font-medium">{child.id}</TableCell>
                                        <TableCell>
                                            {child.seed ? (
                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                    {child.seed.substring(0, 20)}...
                                                </code>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {child.recipes?.map((recipe, index) => (
                                                    <Badge key={index} variant="secondary" className="mr-1">
                                                        {recipe.title}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {child.algo_name || (
                                                <span className="text-muted-foreground">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDate(child.created_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog de suppression */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la session #{sessionToDelete?.id}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette session de batch cooking ?
                            Cette action est irréversible et supprimera définitivement toutes les données associées.
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
