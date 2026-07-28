"use client"
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Unlink, ExternalLink, CheckCircle } from 'lucide-react'

type OrphanRecipe = {
    recipe_id: number
    title: string
    total: number
    names: Array<{ name: string; count: number }>
}

export default function OrphanIngredientsPage() {
    const [recipes, setRecipes] = useState<OrphanRecipe[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/orphan-ingredients')
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erreur de chargement')
            setRecipes(data.data)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const totalRefs = recipes?.reduce((s, r) => s + r.total, 0) ?? 0

    return (
        <div className="p-6 max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Unlink className="size-6 text-red-500" />
                        Ingrédients à relier
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Étapes de recettes dont un ingrédient n&apos;est pas relié au catalogue
                        (pas de quantité affichable, pas de mutualisation possible dans les sessions).
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    {loading ? <Loader2 className="size-4 mr-1 animate-spin" /> : <RefreshCw className="size-4 mr-1" />}
                    Actualiser
                </Button>
            </div>

            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {error}
                </div>
            )}

            {loading && !recipes && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="size-4 animate-spin" /> Analyse des étapes de recettes...
                </div>
            )}

            {recipes && recipes.length === 0 && (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        <CheckCircle className="size-8 mx-auto mb-3 text-green-500" />
                        Aucun ingrédient orphelin — tout est relié 🎉
                    </CardContent>
                </Card>
            )}

            {recipes && recipes.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            {recipes.length} recette(s) à corriger
                            <Badge variant="secondary" className="ml-2">{totalRefs} références</Badge>
                        </CardTitle>
                        <CardDescription>
                            Ouvre la recette, section « Étapes de préparation » : les ingrédients en rouge
                            sont à re-sélectionner dans la colonne Ingrédients (ou à ajouter à la liste de
                            la recette s&apos;ils en sont absents).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-t border-b bg-muted/50 text-left">
                                    <th className="px-4 py-2 font-medium w-20">Réfs</th>
                                    <th className="px-4 py-2 font-medium">Recette</th>
                                    <th className="px-4 py-2 font-medium">Ingrédients non reliés</th>
                                    <th className="px-4 py-2 w-28"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipes.map((r) => (
                                    <tr key={r.recipe_id} className="border-b last:border-b-0 hover:bg-muted/30 align-top">
                                        <td className="px-4 py-2.5">
                                            <Badge variant="destructive">{r.total}</Badge>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="font-medium">{r.title}</div>
                                            <div className="text-xs text-muted-foreground">#{r.recipe_id}</div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex flex-wrap gap-1">
                                                {r.names.map((n) => (
                                                    <Badge
                                                        key={n.name}
                                                        variant="outline"
                                                        className="text-red-700 border-red-300 bg-red-50"
                                                    >
                                                        {n.name}{n.count > 1 ? ` ×${n.count}` : ''}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/dashboard/recipes/edit/${r.recipe_id}`}>
                                                    Corriger
                                                    <ExternalLink className="size-3.5 ml-1" />
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
