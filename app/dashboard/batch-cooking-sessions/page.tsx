"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { 
    ChefHat, 
    Users, 
    Clock, 
    DollarSign, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Search,
    Filter,
    Eye,
    Trash2,
    Plus
} from 'lucide-react'
import { BatchCookingSession, CreationStatus } from '@/features/cooking/types/batch-cooking-session'
import { useBatchCookingSessionStore } from '@/features/cooking/stores/batch-cooking-session-store'
import { useDebounce } from '@/hooks/use-debounce'

const CREATION_STATUS_LABELS: Record<CreationStatus, string> = {
    pending: 'En attente',
    processing: 'En cours',
    completed: 'Terminé',
    failed: 'Échoué'
}

const CREATION_STATUS_COLORS: Record<CreationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
}

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
        markAsCooked
    } = useBatchCookingSessionStore()

    const [searchInput, setSearchInput] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [sessionToDelete, setSessionToDelete] = useState<BatchCookingSession | null>(null)
    const [showFilters, setShowFilters] = useState(false)

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

    const handleMarkAsCooked = async (session: BatchCookingSession) => {
        await markAsCooked(session.id)
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

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}min`
        }
        return `${mins}min`
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

            {/* Barre de recherche et filtres */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Rechercher par seed ou version d'algorithme..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pl-10 w-80"
                                />
                            </div>
                        </div>
                        
                        <Popover open={showFilters} onOpenChange={setShowFilters}>
                            <PopoverTrigger asChild>
                                <Button variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filtres
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Statut de cuisson</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="is_cooked_all"
                                                    checked={filters.is_cooked === undefined}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setFilters({ is_cooked: undefined })
                                                        }
                                                    }}
                                                />
                                                <label htmlFor="is_cooked_all" className="text-sm">Tous</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="is_cooked_true"
                                                    checked={filters.is_cooked === true}
                                                    onCheckedChange={(checked) => {
                                                        setFilters({ is_cooked: checked ? true : undefined })
                                                    }}
                                                />
                                                <label htmlFor="is_cooked_true" className="text-sm">Cuisinées</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="is_cooked_false"
                                                    checked={filters.is_cooked === false}
                                                    onCheckedChange={(checked) => {
                                                        setFilters({ is_cooked: checked ? false : undefined })
                                                    }}
                                                />
                                                <label htmlFor="is_cooked_false" className="text-sm">Non cuisinées</label>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={clearFilters}>
                                            Effacer
                                        </Button>
                                        <Button size="sm" onClick={() => setShowFilters(false)}>
                                            Appliquer
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
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
                        Liste des sessions de batch cooking originales avec leurs enfants
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-8 text-red-600">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {error}
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Seed</TableHead>
                                        <TableHead>Algo Version</TableHead>
                                        <TableHead>Repas</TableHead>
                                        <TableHead>Personnes</TableHead>
                                        <TableHead>Enfants</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Temps Économisé</TableHead>
                                        <TableHead>Argent Économisé</TableHead>
                                        <TableHead>Créé le</TableHead>
                                        <TableHead>Cuisiné</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => (
                                        <TableRow key={session.id} className="cursor-pointer">
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
                                                {session.algo_version || (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{session.meal_count}</TableCell>
                                            <TableCell>{session.people_count}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {session.children_count || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge className={CREATION_STATUS_COLORS[session.recipe_generation_status]}>
                                                        {CREATION_STATUS_LABELS[session.recipe_generation_status]}
                                                    </Badge>
                                                    <Badge className={CREATION_STATUS_COLORS[session.ingredient_generation_status]}>
                                                        {CREATION_STATUS_LABELS[session.ingredient_generation_status]}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {session.time_saved > 0 ? formatDuration(session.time_saved) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {session.money_saved > 0 ? `${session.money_saved.toFixed(2)}€` : '-'}
                                            </TableCell>
                                            <TableCell>{formatDate(session.created_at)}</TableCell>
                                            <TableCell>
                                                {session.is_cooked ? (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Oui
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        <XCircle className="mr-1 h-3 w-3" />
                                                        Non
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {/* TODO: Voir les détails */}}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {!session.is_cooked && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkAsCooked(session)}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
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
