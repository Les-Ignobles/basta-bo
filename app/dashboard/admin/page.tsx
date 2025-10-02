"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    Zap
} from 'lucide-react'

interface AdminStats {
    cache: {
        recipeGeneration: {
            hits: number
            misses: number
            total: number
            hitRate: number
        }
        ingredientGeneration: {
            hits: number
            misses: number
            total: number
            hitRate: number
        }
    }
    algorithms: {
        recipeGeneration: {
            totalRequests: number
            successRate: number
            averageResponseTime: number
            lastUsed: string
        }
        ingredientGeneration: {
            totalRequests: number
            successRate: number
            averageResponseTime: number
            lastUsed: string
        }
    }
    system: {
        uptime: string
        memoryUsage: number
        activeConnections: number
        lastBackup: string
    }
}

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    const fetchStats = async () => {
        setLoading(true)
        try {
            // Simulation de données - à remplacer par un vrai appel API
            const mockStats: AdminStats = {
                cache: {
                    recipeGeneration: {
                        hits: 1247,
                        misses: 156,
                        total: 1403,
                        hitRate: 88.7
                    },
                    ingredientGeneration: {
                        hits: 892,
                        misses: 98,
                        total: 990,
                        hitRate: 90.1
                    }
                },
                algorithms: {
                    recipeGeneration: {
                        totalRequests: 1403,
                        successRate: 96.2,
                        averageResponseTime: 1.8,
                        lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString()
                    },
                    ingredientGeneration: {
                        totalRequests: 990,
                        successRate: 98.5,
                        averageResponseTime: 1.2,
                        lastUsed: new Date(Date.now() - 2 * 60 * 1000).toISOString()
                    }
                },
                system: {
                    uptime: "7j 12h 34m",
                    memoryUsage: 68.5,
                    activeConnections: 23,
                    lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
                }
            }
            
            setStats(mockStats)
            setLastRefresh(new Date())
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        // Rafraîchir automatiquement toutes les 30 secondes
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    const formatTime = (timestamp: string) => {
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

    const getHitRateColor = (rate: number) => {
        if (rate >= 90) return 'bg-green-100 text-green-800'
        if (rate >= 80) return 'bg-yellow-100 text-yellow-800'
        return 'bg-red-100 text-red-800'
    }

    const getSuccessRateColor = (rate: number) => {
        if (rate >= 95) return 'bg-green-100 text-green-800'
        if (rate >= 90) return 'bg-yellow-100 text-yellow-800'
        return 'bg-red-100 text-red-800'
    }

    if (loading && !stats) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-christmas">Recipe Batch</h1>
                        <p className="text-muted-foreground">
                            Surveillance des algorithmes et du cache système
                        </p>
                    </div>
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Chargement des statistiques...</p>
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
                        Surveillance des algorithmes et du cache système
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
                        onClick={fetchStats}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                </div>
            </div>

            {stats && (
                <>
                    {/* Cache Statistics */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-blue-500" />
                                    Cache - Génération Recettes
                                </CardTitle>
                                <CardDescription>
                                    Performance du cache pour la génération de recettes
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {stats.cache.recipeGeneration.hits.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Hits</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {stats.cache.recipeGeneration.misses.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Misses</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Taux de réussite</span>
                                    <Badge className={getHitRateColor(stats.cache.recipeGeneration.hitRate)}>
                                        {stats.cache.recipeGeneration.hitRate}%
                                    </Badge>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${stats.cache.recipeGeneration.hitRate}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-purple-500" />
                                    Cache - Génération Ingrédients
                                </CardTitle>
                                <CardDescription>
                                    Performance du cache pour la génération d'ingrédients
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {stats.cache.ingredientGeneration.hits.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Hits</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {stats.cache.ingredientGeneration.misses.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Misses</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Taux de réussite</span>
                                    <Badge className={getHitRateColor(stats.cache.ingredientGeneration.hitRate)}>
                                        {stats.cache.ingredientGeneration.hitRate}%
                                    </Badge>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${stats.cache.ingredientGeneration.hitRate}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Algorithm Performance */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="h-5 w-5 text-orange-500" />
                                    Algorithme - Génération Recettes
                                </CardTitle>
                                <CardDescription>
                                    Performance de l'algorithme de génération de recettes
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold">
                                            {stats.algorithms.recipeGeneration.totalRequests.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Requêtes</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {stats.algorithms.recipeGeneration.averageResponseTime}s
                                        </div>
                                        <div className="text-sm text-muted-foreground">Temps moyen</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Taux de succès</span>
                                    <Badge className={getSuccessRateColor(stats.algorithms.recipeGeneration.successRate)}>
                                        {stats.algorithms.recipeGeneration.successRate}%
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Dernière utilisation: {formatTime(stats.algorithms.recipeGeneration.lastUsed)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-green-500" />
                                    Algorithme - Génération Ingrédients
                                </CardTitle>
                                <CardDescription>
                                    Performance de l'algorithme de génération d'ingrédients
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold">
                                            {stats.algorithms.ingredientGeneration.totalRequests.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Requêtes</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {stats.algorithms.ingredientGeneration.averageResponseTime}s
                                        </div>
                                        <div className="text-sm text-muted-foreground">Temps moyen</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Taux de succès</span>
                                    <Badge className={getSuccessRateColor(stats.algorithms.ingredientGeneration.successRate)}>
                                        {stats.algorithms.ingredientGeneration.successRate}%
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Dernière utilisation: {formatTime(stats.algorithms.ingredientGeneration.lastUsed)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* System Status */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-gray-500" />
                                État du Système
                            </CardTitle>
                            <CardDescription>
                                Informations sur l'état général du système
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {stats.system.uptime}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Temps de fonctionnement</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">
                                        {stats.system.memoryUsage}%
                                    </div>
                                    <div className="text-sm text-muted-foreground">Utilisation mémoire</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {stats.system.activeConnections}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Connexions actives</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground">
                                        {formatTime(stats.system.lastBackup)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Dernière sauvegarde</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
