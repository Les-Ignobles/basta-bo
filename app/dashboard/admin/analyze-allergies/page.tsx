"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

type AnalysisResult = {
    id: number
    title: string
    allergies: string[]
    status: string
    error?: string
    incompatibleAllergies?: string[]
}

export default function AnalyzeAllergiesPage() {
    const [batchSize, setBatchSize] = useState(10)
    const [startFrom, setStartFrom] = useState(0)
    const [loading, setLoading] = useState(false)
    const [completeLoading, setCompleteLoading] = useState(false)
    const [results, setResults] = useState<{
        message: string
        processed: number
        failed: number
        total: number
        successRate: string
        nextStart: number
        hasMore: boolean
        results: AnalysisResult[]
    } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleBatchAnalysis = async () => {
        setLoading(true)
        setError(null)
        setResults(null)

        try {
            const response = await fetch('/api/recipes/analyze-allergies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batchSize: parseInt(batchSize.toString()),
                    startFrom: parseInt(startFrom.toString())
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erreur inconnue')
            }

            setResults(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue')
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteAnalysis = async () => {
        setCompleteLoading(true)
        setError(null)
        setResults(null)

        try {
            const response = await fetch('/api/recipes/analyze-allergies/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batchSize: parseInt(batchSize.toString())
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erreur inconnue')
            }

            setResults(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue')
        } finally {
            setCompleteLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Brain className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Analyse IA des Allergies</h1>
                    <p className="text-muted-foreground">
                        Utilise l&apos;IA pour analyser les recettes et remplir automatiquement les allergies non compatibles
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>
                            Paramètres pour l&apos;analyse des recettes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="batchSize">Taille du batch</Label>
                            <Input
                                id="batchSize"
                                type="number"
                                value={batchSize}
                                onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                                min="1"
                                max="50"
                            />
                            <p className="text-sm text-muted-foreground">
                                Nombre de recettes à traiter en parallèle (recommandé: 10)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startFrom">Commencer à partir de</Label>
                            <Input
                                id="startFrom"
                                type="number"
                                value={startFrom}
                                onChange={(e) => setStartFrom(parseInt(e.target.value) || 0)}
                                min="0"
                            />
                            <p className="text-sm text-muted-foreground">
                                Index de départ pour l&apos;analyse (0 = depuis le début)
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>
                            Lancer l&apos;analyse des allergies
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleBatchAnalysis}
                            disabled={loading || completeLoading}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyse en cours...
                                </>
                            ) : (
                                <>
                                    <Brain className="mr-2 h-4 w-4" />
                                    Analyser un batch
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleCompleteAnalysis}
                            disabled={loading || completeLoading}
                            variant="outline"
                            className="w-full"
                        >
                            {completeLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyse complète en cours...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Analyse complète
                                </>
                            )}
                        </Button>

                        <p className="text-sm text-muted-foreground">
                            <strong>Analyse par batch:</strong> Traite seulement un batch de recettes<br />
                            <strong>Analyse complète:</strong> Traite toutes les recettes automatiquement
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Résultats */}
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

            {results && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Résultats de l&apos;analyse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{results.processed || 0}</div>
                                <div className="text-sm text-muted-foreground">Réussies</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{results.failed || 0}</div>
                                <div className="text-sm text-muted-foreground">Échouées</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{results.total || 0}</div>
                                <div className="text-sm text-muted-foreground">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {results.successRate || '0%'}
                                </div>
                                <div className="text-sm text-muted-foreground">Taux de réussite</div>
                            </div>
                        </div>

                        {results.message && (
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm">{results.message}</p>
                            </div>
                        )}

                        {results.hasMore && (
                            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm text-yellow-800">
                                    Il reste des recettes à traiter. Prochaine position: {results.nextStart}
                                </span>
                            </div>
                        )}

                        {results.results && results.results.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium">Détails des recettes traitées:</h4>
                                <div className="max-h-60 overflow-y-auto space-y-1">
                                    {results.results.map((result: AnalysisResult, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                            <span className="font-medium">{result.title}</span>
                                            {result.error ? (
                                                <Badge variant="destructive">Erreur</Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    {result.incompatibleAllergies?.length || 0} allergies
                                                </Badge>
                                            )}
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
