"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
    Search,
    ChefHat,
    Clock,
    Users,
    Calendar,
    Utensils,
    Package,
    PlayCircle,
    Layers
} from 'lucide-react'

// Types basés sur les définitions fournies
type SessionRecipe = {
    expiration_days: number
    id: string
    img_path: string | null
    ingredients: string[]
    is_adapted: boolean
    meal_count: number
    original_recipe_id: number | null
    quantification_type: string
    remaining_meal_count: number
    meals: any[]
    title: string
    conservation: any | null
    warming: any | null
}

type SessionCookingStep = {
    action: string
    cooking_time: number | null
    step_time: number
    id: string
    img: string
    ingredients: any[]
    order: number
    text: string
}

type SessionAssemblyStep = {
    desc: string
    id: string
    img: string | null
    order: number
    original_recipe_id: number
    recipe_id: string
    text: string
}

type SessionIngredient = {
    category_id: number | null
    id: string
    img_path: string | null
    is_basic: boolean
    is_ordered: boolean
    original_id: number
    quantity: number | null
    text: string
    unit: string | null
}

type BatchCookingSessionDetails = {
    id: number
    created_at: string
    recipes: SessionRecipe[]
    ingredients: SessionIngredient[]
    cooking_steps: SessionCookingStep[]
    assembly_steps: SessionAssemblyStep[]
    meal_count: number
    people_count: number
    is_cooked: boolean
    recipe_count: number
    seed: string | null
    algo_version: string | null
    is_original: boolean
    parent_id: number | null
    cooked_at: string | null
    time_saved: number
    money_saved: number
}

export default function BatchCookingSessionDetailsPage() {
    const [sessionId, setSessionId] = useState('')
    const [session, setSession] = useState<BatchCookingSessionDetails | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchSessionDetails = async () => {
        if (!sessionId.trim()) {
            setError('Veuillez entrer un ID de session')
            return
        }

        setLoading(true)
        setError('')
        
        try {
            const response = await fetch(`/api/batch-cooking-sessions/${sessionId}`)
            
            if (!response.ok) {
                throw new Error(`Session non trouvée (${response.status})`)
            }
            
            const data = await response.json()
            setSession(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
            setSession(null)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
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

    const formatSeconds = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        
        if (hours > 0) {
            return `${hours}h ${minutes}min ${secs}s`
        } else if (minutes > 0) {
            return `${minutes}min ${secs}s`
        } else {
            return `${secs}s`
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-christmas">Détails Session Batch Cooking</h1>
                    <p className="text-muted-foreground">
                        Consultez les détails d'une session en entrant son ID
                    </p>
                </div>
            </div>

            {/* Recherche par ID */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Rechercher une session
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Entrez l'ID de la session..."
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && fetchSessionDetails()}
                        />
                        <Button onClick={fetchSessionDetails} disabled={loading}>
                            {loading ? 'Chargement...' : 'Rechercher'}
                        </Button>
                    </div>
                    {error && (
                        <p className="text-red-600 mt-2">{error}</p>
                    )}
                </CardContent>
            </Card>

            {/* Détails de la session */}
            {session && (
                <div className="space-y-6">
                    {/* Informations générales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ChefHat className="h-5 w-5" />
                                Session #{session.id}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Seed</p>
                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                        {session.seed || 'N/A'}
                                    </code>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Algo Version</p>
                                    <p className="text-sm">{session.algo_version || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Repas</p>
                                    <p className="text-sm">{session.meal_count}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Personnes</p>
                                    <p className="text-sm">{session.people_count}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                                    <p className="text-sm">{formatDate(session.created_at)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Cuisiné</p>
                                    <Badge variant={session.is_cooked ? "default" : "secondary"}>
                                        {session.is_cooked ? 'Oui' : 'Non'}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Temps économisé</p>
                                    <p className="text-sm">{session.time_saved > 0 ? formatDuration(session.time_saved) : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Argent économisé</p>
                                    <p className="text-sm">{session.money_saved > 0 ? `${session.money_saved.toFixed(2)}€` : 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contenu organisé en tabs */}
                    <Tabs defaultValue="recipes" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="recipes" className="flex items-center gap-2">
                                <Utensils className="h-4 w-4" />
                                Recettes ({session.recipes.length})
                            </TabsTrigger>
                            <TabsTrigger value="ingredients" className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Ingrédients ({session.ingredients.length})
                            </TabsTrigger>
                            <TabsTrigger value="cooking" className="flex items-center gap-2">
                                <PlayCircle className="h-4 w-4" />
                                Cuisson ({session.cooking_steps.length})
                            </TabsTrigger>
                            <TabsTrigger value="assembly" className="flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Assemblage ({session.assembly_steps.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab Recettes */}
                        <TabsContent value="recipes" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Utensils className="h-5 w-5" />
                                        Recettes ({session.recipes.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {session.recipes.map((recipe, index) => (
                                            <div key={recipe.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-semibold">{recipe.title}</h3>
                                                    <Badge variant="outline">#{index + 1}</Badge>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="font-medium text-muted-foreground">Repas</p>
                                                        <p>{recipe.meal_count}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-muted-foreground">Quantification</p>
                                                        <p>{recipe.quantification_type}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-muted-foreground">Adapté</p>
                                                        <Badge variant={recipe.is_adapted ? "default" : "secondary"}>
                                                            {recipe.is_adapted ? 'Oui' : 'Non'}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-muted-foreground">Expiration</p>
                                                        <p>{recipe.expiration_days} jours</p>
                                                    </div>
                                                </div>
                                                {recipe.ingredients.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="font-medium text-muted-foreground mb-2">Ingrédients:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {recipe.ingredients.map((ingredient, i) => (
                                                                <Badge key={i} variant="secondary" className="text-xs">
                                                                    {ingredient}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab Ingrédients */}
                        <TabsContent value="ingredients" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Ingrédients ({session.ingredients.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {session.ingredients.map((ingredient) => (
                                            <div key={ingredient.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-medium">{ingredient.text}</p>
                                                    <p className="text-sm text-muted-foreground">ID: {ingredient.original_id}</p>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    {ingredient.quantity && (
                                                        <div>
                                                            <p className="font-medium text-muted-foreground">Quantité</p>
                                                            <p>{ingredient.quantity} {ingredient.unit || ''}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-muted-foreground">Basique</p>
                                                        <Badge variant={ingredient.is_basic ? "default" : "secondary"}>
                                                            {ingredient.is_basic ? 'Oui' : 'Non'}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-muted-foreground">Commandé</p>
                                                        <Badge variant={ingredient.is_ordered ? "default" : "secondary"}>
                                                            {ingredient.is_ordered ? 'Oui' : 'Non'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab Étapes de cuisson */}
                        <TabsContent value="cooking" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PlayCircle className="h-5 w-5" />
                                        Étapes de Cuisson ({session.cooking_steps.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {session.cooking_steps
                                            .sort((a, b) => a.order - b.order)
                                            .map((step) => (
                                            <div key={step.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-semibold">Étape {step.order}</h3>
                                                    <Badge variant="outline">{step.action}</Badge>
                                                </div>
                                                <p className="text-sm mb-3">{step.text}</p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="font-medium text-muted-foreground">Temps étape</p>
                                                        <p>{formatSeconds(step.step_time)}</p>
                                                    </div>
                                                    {step.cooking_time && (
                                                        <div>
                                                            <p className="font-medium text-muted-foreground">Temps cuisson</p>
                                                            <p>{formatSeconds(step.cooking_time)}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-muted-foreground">Ingrédients</p>
                                                        <p>{step.ingredients.length}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab Étapes d'assemblage */}
                        <TabsContent value="assembly" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Layers className="h-5 w-5" />
                                        Étapes d'Assemblage ({session.assembly_steps.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {session.assembly_steps
                                            .sort((a, b) => a.order - b.order)
                                            .map((step) => (
                                            <div key={step.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-semibold">Étape {step.order}</h3>
                                                    <Badge variant="outline">Recette #{step.original_recipe_id}</Badge>
                                                </div>
                                                <p className="text-sm mb-2">{step.text}</p>
                                                {step.desc && (
                                                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    )
}
