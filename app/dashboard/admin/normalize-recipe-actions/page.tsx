"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Wand2, CheckCircle, XCircle, SkipForward } from 'lucide-react'

type RecipeResult = {
    recipeId: number
    recipeTitle: string
    status: 'success' | 'skipped' | 'error'
    actionsCreated?: number
    error?: string
}

type NormalizationResponse = {
    data: {
        total_processed: number
        successful: number
        skipped: number
        failed: number
        results: RecipeResult[]
    }
}

export default function NormalizeRecipeActionsPage() {
    const [limit, setLimit] = useState(5)
    const [recipeIdsInput, setRecipeIdsInput] = useState('')
    const [force, setForce] = useState(false)
    const [dryRun, setDryRun] = useState(true)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<NormalizationResponse['data'] | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleNormalize = async () => {
        setLoading(true)
        setError(null)
        setResults(null)

        try {
            const recipeIds = recipeIdsInput.trim()
                ? recipeIdsInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                : undefined

            const response = await fetch('/api/firebase/recipes/normalize-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipe_ids: recipeIds,
                    limit: recipeIds ? undefined : limit,
                    dry_run: dryRun,
                    force,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erreur inconnue')
            }

            setResults(data.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Wand2 className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Normalisation des Recettes</h1>
                    <p className="text-muted-foreground">
                        Decompose les instructions de recettes en actions atomiques typees (V6)
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>
                            Parametres pour la normalisation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="recipeIds">IDs de recettes (optionnel)</Label>
                            <Input
                                id="recipeIds"
                                type="text"
                                value={recipeIdsInput}
                                onChange={(e) => setRecipeIdsInput(e.target.value)}
                                placeholder="Ex: 42, 56, 78"
                            />
                            <p className="text-sm text-muted-foreground">
                                IDs separes par des virgules. Laisser vide pour traiter automatiquement.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="limit">Limite</Label>
                            <Input
                                id="limit"
                                type="number"
                                value={limit}
                                onChange={(e) => setLimit(parseInt(e.target.value) || 5)}
                                min="1"
                                max="50"
                            />
                            <p className="text-sm text-muted-foreground">
                                Nombre max de recettes a traiter (ignore si des IDs sont specifies)
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="dryRun"
                                checked={dryRun}
                                onCheckedChange={(checked) => setDryRun(checked === true)}
                            />
                            <Label htmlFor="dryRun" className="cursor-pointer">
                                Dry run (simulation, pas d&apos;ecriture en base)
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="force"
                                checked={force}
                                onCheckedChange={(checked) => setForce(checked === true)}
                            />
                            <Label htmlFor="force" className="cursor-pointer">
                                Force (re-normaliser meme si deja fait)
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>
                            Lancer la normalisation des recettes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleNormalize}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Normalisation en cours...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    {dryRun ? 'Lancer la simulation' : 'Lancer la normalisation'}
                                </>
                            )}
                        </Button>

                        {dryRun && (
                            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                                Mode simulation actif : aucune donnee ne sera ecrite en base.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Error */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span className="font-medium">Erreur</span>
                        </div>
                        <p className="mt-2 text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {results && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Resultats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{results.total_processed}</div>
                                <div className="text-sm text-muted-foreground">Traitees</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{results.successful}</div>
                                <div className="text-sm text-muted-foreground">Reussies</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">{results.skipped}</div>
                                <div className="text-sm text-muted-foreground">Ignorees</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                                <div className="text-sm text-muted-foreground">Echouees</div>
                            </div>
                        </div>

                        {results.results && results.results.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium">Details par recette :</h4>
                                <div className="max-h-80 overflow-y-auto space-y-1">
                                    {results.results.map((result, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                            <div className="flex items-center gap-2">
                                                {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                {result.status === 'skipped' && <SkipForward className="h-4 w-4 text-yellow-600" />}
                                                {result.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                                                <span className="font-medium">[{result.recipeId}] {result.recipeTitle}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {result.actionsCreated !== undefined && (
                                                    <Badge variant="secondary">
                                                        {result.actionsCreated} actions
                                                    </Badge>
                                                )}
                                                {result.error && (
                                                    <Badge variant="destructive" title={result.error}>
                                                        Erreur
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
