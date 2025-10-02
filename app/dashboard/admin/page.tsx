"use client"

import { useEffect, useState, Fragment } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { useRecipeGenerationResultStore } from '@/features/cooking/stores/recipe-generation-result-store'
import { useDietStore } from '@/features/cooking/stores/diet-store'
import {
    Settings,
    Database,
    Cpu,
    Clock,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Activity,
    Zap,
    Search,
    Trash2,
    Eye,
    Filter
} from 'lucide-react'

export default function AdminPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
    const [showDetails, setShowDetails] = useState<number | null>(null)
    const [selectedDiets, setSelectedDiets] = useState<number[]>([])

    const {
        results,
        stats,
        recentActivity,
        loading,
        error,
        page,
        pageSize,
        total,
        dietMask,
        fetchResults,
        fetchStats,
        fetchRecentActivity,
        setSearch,
        setDietMask,
        setPage,
        clearOldEntries,
        clearError
    } = useRecipeGenerationResultStore()

    const {
        diets,
        loading: dietsLoading,
        fetchDiets
    } = useDietStore()

    const fetchAllData = async () => {
        await Promise.all([
            fetchResults(),
            fetchStats(),
            fetchRecentActivity(),
            fetchDiets()
        ])
        setLastRefresh(new Date())
    }

    useEffect(() => {
        fetchAllData()
        // Rafraîchir automatiquement toutes les 30 secondes
        const interval = setInterval(fetchAllData, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchTerm)
            setPage(1)
            fetchResults()
        }, 400)
        return () => clearTimeout(timeout)
    }, [searchTerm, setSearch, setPage, fetchResults])

    useEffect(() => {
        fetchResults()
    }, [page, fetchResults])

    const handleDietToggle = (dietId: number) => {
        const newSelectedDiets = selectedDiets.includes(dietId)
            ? selectedDiets.filter(id => id !== dietId)
            : [...selectedDiets, dietId]
        
        setSelectedDiets(newSelectedDiets)
        
        // Calculer le diet_mask : somme des bit_index des régimes sélectionnés
        const newDietMask = newSelectedDiets.reduce((mask, dietId) => {
            const diet = diets.find(d => d.id === dietId)
            return diet && diet.bit_index ? mask | diet.bit_index : mask
        }, 0)
        
        setDietMask(newSelectedDiets.length > 0 ? newDietMask : null)
        setPage(1)
        fetchResults()
    }

    const clearDietFilters = () => {
        setSelectedDiets([])
        setDietMask(null)
        setPage(1)
        fetchResults()
    }

    const handleClearOldEntries = async () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer les entrées de plus de 30 jours ?')) {
            try {
                const deletedCount = await clearOldEntries(30)
                alert(`${deletedCount} entrées supprimées`)
            } catch (error) {
                alert('Erreur lors de la suppression')
            }
        }
    }

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return 'Jamais'
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'À l\'instant'
        if (diffMins < 60) return `Il y a ${diffMins}min`

        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `Il y a ${diffHours}h`

        const diffDays = Math.floor(diffHours / 24)
        return `Il y a ${diffDays}j`
    }

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-gray-500'
        if (score >= 0.8) return 'text-green-600'
        if (score >= 0.6) return 'text-yellow-600'
        return 'text-red-600'
    }

    const totalPages = Math.ceil(total / pageSize)

    if (loading && !stats) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-christmas">Recipe Batch</h1>
                        <p className="text-muted-foreground">
                            Surveillance du cache des résultats de génération de recettes
                        </p>
                    </div>
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Chargement des données...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-christmas">Recipe Batch</h1>
                    <p className="text-muted-foreground">
                        Surveillance du cache des résultats de génération de recettes
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Dernière MAJ: {formatTime(lastRefresh.toISOString())}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAllData}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span className="text-red-800">Erreur: {error}</span>
                            <Button variant="outline" size="sm" onClick={clearError} className="ml-auto">
                                Fermer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Overview */}
            {stats && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Database className="h-5 w-5 text-blue-500" />
                                Total Entrées
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Résultats en cache</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Eye className="h-5 w-5 text-green-500" />
                                Affichages
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalShown.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total montrés</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CheckCircle className="h-5 w-5 text-purple-500" />
                                Sélections
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalPicked.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total sélectionnés</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                                Activité 24h
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.recentActivity}</div>
                            <div className="text-sm text-muted-foreground">Utilisations récentes</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search and Controls */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Rechercher par ingrédients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    
                    {/* Filtre par régime */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Régimes
                                {selectedDiets.length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {selectedDiets.length}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Filtrer par régime alimentaire</h4>
                                    {selectedDiets.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearDietFilters}
                                            className="h-8 px-2 text-xs"
                                        >
                                            Effacer
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {dietsLoading ? (
                                        <div className="text-sm text-muted-foreground">
                                            Chargement des régimes...
                                        </div>
                                    ) : (
                                        diets?.map((diet) => (
                                            <div key={diet.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`diet-${diet.id}`}
                                                    checked={selectedDiets.includes(diet.id)}
                                                    onCheckedChange={() => handleDietToggle(diet.id)}
                                                />
                                                <label
                                                    htmlFor={`diet-${diet.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <span>{diet.emoji}</span>
                                                    {diet.title?.fr || diet.slug}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                
                <Button 
                    variant="outline" 
                    onClick={handleClearOldEntries}
                    disabled={loading}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Nettoyer ancien cache
                </Button>
            </div>

            {/* Results Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        Résultats de génération ({total.toLocaleString()})
                    </CardTitle>
                    <CardDescription>
                        Liste des résultats mis en cache avec leurs métriques
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-2">Chargement...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-8">
                            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Aucun résultat trouvé</h3>
                            <p className="text-muted-foreground">
                                {searchTerm ? 'Aucun résultat ne correspond à votre recherche.' : 'Aucun résultat de génération en cache.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Créé</TableHead>
                                        <TableHead>Dernière utilisation</TableHead>
                                        <TableHead>Recettes</TableHead>
                                        <TableHead>Affichages</TableHead>
                                        <TableHead>Sélections</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((result) => (
                                        <Fragment key={result.id}>
                                            <TableRow>
                                                <TableCell className="font-mono text-sm">
                                                    #{result.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatDate(result.created_at)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatTime(result.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatTime(result.last_used_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {result.recipe_count}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{result.shown_count}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{result.picked_count}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowDetails(showDetails === result.id ? null : result.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {showDetails === result.id && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="bg-muted/50">
                                                        <div className="p-4 space-y-4">
                                                            <h4 className="font-semibold">Détails du résultat #{result.id}</h4>
                                                            
                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                <div>
                                                                    <h5 className="font-medium text-sm mb-2">Informations générales</h5>
                                                                    <div className="space-y-1 text-sm">
                                                                        <div><span className="font-medium">Appétit:</span> {result.appetite || 'N/A'}</div>
                                                                        <div><span className="font-medium">Type de plat:</span> {result.dish_type}</div>
                                                                        <div><span className="font-medium">Signature pool:</span> <code className="bg-muted px-1 rounded text-xs">{result.pool_signature}</code></div>
                                                                        {result.exclusion_key && (
                                                                            <div><span className="font-medium">Clé d'exclusion:</span> <code className="bg-muted px-1 rounded text-xs">{result.exclusion_key}</code></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div>
                                                                    <h5 className="font-medium text-sm mb-2">Métriques</h5>
                                                                    <div className="space-y-1 text-sm">
                                                                        <div><span className="font-medium">Score compatibilité:</span> 
                                                                            <span className={`ml-1 ${getScoreColor(result.compatibility_score)}`}>
                                                                                {result.compatibility_score ? 
                                                                                    (result.compatibility_score * 100).toFixed(1) + '%' : 
                                                                                    'N/A'
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div><span className="font-medium">Compatibilité positive:</span> {result.compat_pos || 'N/A'}</div>
                                                                        <div><span className="font-medium">Compatibilité négative:</span> {result.compat_neg || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <h5 className="font-medium text-sm mb-2">Ingrédients ({result.ingredients.length})</h5>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {result.ingredients.map((ingredient, index) => (
                                                                        <Badge key={index} variant="outline" className="text-xs">
                                                                            {ingredient}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            {result.original_recipes.length > 0 && (
                                                                <div>
                                                                    <h5 className="font-medium text-sm mb-2">Recettes originales ({result.original_recipes.length})</h5>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {result.original_recipes.map((recipeId, index) => (
                                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                                #{recipeId}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Page {page} sur {totalPages} ({total} résultats)
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
                                            disabled={page >= totalPages}
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
