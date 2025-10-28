"use client"
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react'

type AnalysisResult = {
    id: number
    title: string
    allergies: string[]
    status: string
}

export default function AdminPage() {
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

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const data = await response.json()
            setResults(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
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

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const data = await response.json()
            setResults(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        } finally {
            setCompleteLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-christmas">Analyse des Allergies</h1>
                <p className="text-muted-foreground">
                    Analyse automatique des allergies dans les recettes avec l&apos;IA
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Analyse par batch
                        </CardTitle>
                        <CardDescription>
                            Analyse un batch spécifique de recettes
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
                        </div>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Analyse complète
                        </CardTitle>
                        <CardDescription>
                            Analyse toutes les recettes automatiquement
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleCompleteAnalysis}
                            disabled={loading || completeLoading}
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
                                    Analyser toutes les recettes
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

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Erreur</span>
                        </div>
                        <p className="text-red-600 mt-2">{error}</p>
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
                                <div className="text-2xl font-bold text-green-600">{results.processed}</div>
                                <div className="text-sm text-muted-foreground">Réussies</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                                <div className="text-sm text-muted-foreground">Échouées</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                                <div className="text-sm text-muted-foreground">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{results.successRate}</div>
                                <div className="text-sm text-muted-foreground">Taux de réussite</div>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <p><strong>Message:</strong> {results.message}</p>
                            {results.hasMore && (
                                <p><strong>Prochain batch:</strong> Commencer à partir de {results.nextStart}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
