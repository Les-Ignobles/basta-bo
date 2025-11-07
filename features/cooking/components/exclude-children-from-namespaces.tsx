'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

type Family = {
  id: number
  name: { fr: string }
  childrenCount: number
}

type ExcludeChildrenFromNamespacesProps = {
  preselectedFamilyId?: number
}

export function ExcludeChildrenFromNamespaces({
  preselectedFamilyId,
}: ExcludeChildrenFromNamespacesProps = {}) {
  const [families, setFamilies] = useState<Family[]>([])
  const [loadingFamilies, setLoadingFamilies] = useState(false)
  const [parentIngredientId, setParentIngredientId] = useState<string>(
    preselectedFamilyId ? String(preselectedFamilyId) : ''
  )
  const [selectedNamespaces, setSelectedNamespaces] = useState<{
    allergie: boolean
    like: boolean
    dislike: boolean
  }>({
    allergie: false,
    like: false,
    dislike: false,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    excludedCount: number
    childrenIds: number[]
  } | null>(null)
  const [error, setError] = useState<string>()

  // Charger la liste des familles au montage
  useEffect(() => {
    const fetchFamilies = async () => {
      setLoadingFamilies(true)
      try {
        const res = await fetch('/api/ingredient-relations/families')
        if (!res.ok) {
          throw new Error(`Erreur ${res.status}`)
        }
        const data = await res.json()
        setFamilies(data.families || [])
      } catch (err) {
        console.error('Error fetching families:', err)
        setError('Erreur lors du chargement des familles')
      } finally {
        setLoadingFamilies(false)
      }
    }

    fetchFamilies()
  }, [])

  const handleExclude = async () => {
    if (!parentIngredientId) {
      setError('Veuillez sélectionner un ingrédient principal')
      return
    }

    // Vérifier qu'au moins un namespace est sélectionné
    if (!selectedNamespaces.allergie && !selectedNamespaces.like && !selectedNamespaces.dislike) {
      setError('Veuillez sélectionner au moins un namespace à exclure')
      return
    }

    setLoading(true)
    setError(undefined)
    setResult(null)

    try {
      // Convertir les checkboxes en bit indexes
      const namespaceBitIndexes: number[] = []
      if (selectedNamespaces.allergie) namespaceBitIndexes.push(0)
      if (selectedNamespaces.like) namespaceBitIndexes.push(1)
      if (selectedNamespaces.dislike) namespaceBitIndexes.push(2)

      const res = await fetch('/api/ingredient-search-namespaces/exclude-children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentIngredientId: parseInt(parentIngredientId, 10),
          namespaceBitIndexes,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Erreur ${res.status}`)
      }

      const data = await res.json()
      setResult({
        success: data.success,
        excludedCount: data.excludedCount,
        childrenIds: data.childrenIds,
      })
    } catch (err) {
      console.error('Error excluding children:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'exclusion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exclure les enfants des namespaces</CardTitle>
        <CardDescription>
          Sélectionnez une famille d&apos;ingrédients et les namespaces dont vous voulez exclure
          tous ses enfants (ex: pour Pâtes → exclure Coquillettes, Spaghetti, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélection de la famille */}
        <div className="space-y-2">
          <Label>Famille d&apos;ingrédients</Label>
          {loadingFamilies ? (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Chargement des familles...</span>
            </div>
          ) : families.length === 0 ? (
            <div className="p-3 border border-yellow-500 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-600">
                Aucune famille trouvée. Créez d&apos;abord des relations de type &quot;Famille&quot;.
              </p>
            </div>
          ) : (
            <Select
              value={parentIngredientId}
              onValueChange={(value) => {
                setParentIngredientId(value)
                setResult(null)
                setError(undefined)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une famille..." />
              </SelectTrigger>
              <SelectContent>
                {families.map((family) => (
                  <SelectItem key={family.id} value={String(family.id)}>
                    {family.name.fr} ({family.childrenCount} enfant
                    {family.childrenCount > 1 ? 's' : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Sélection des namespaces */}
        <div className="space-y-3">
          <Label>Namespaces à exclure</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allergie"
                checked={selectedNamespaces.allergie}
                onCheckedChange={(checked) =>
                  setSelectedNamespaces((prev) => ({ ...prev, allergie: checked as boolean }))
                }
              />
              <Label
                htmlFor="allergie"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allergie
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="like"
                checked={selectedNamespaces.like}
                onCheckedChange={(checked) =>
                  setSelectedNamespaces((prev) => ({ ...prev, like: checked as boolean }))
                }
              />
              <Label
                htmlFor="like"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Like
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dislike"
                checked={selectedNamespaces.dislike}
                onCheckedChange={(checked) =>
                  setSelectedNamespaces((prev) => ({ ...prev, dislike: checked as boolean }))
                }
              />
              <Label
                htmlFor="dislike"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Dislike
              </Label>
            </div>
          </div>
        </div>

        {/* Bouton d'action */}
        <Button onClick={handleExclude} disabled={loading || !parentIngredientId}>
          {loading ? 'Exclusion en cours...' : 'Exclure les enfants'}
        </Button>

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 border border-red-500 bg-red-50 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Message de succès */}
        {result && result.success && (
          <div className="p-3 border border-green-500 bg-green-50 rounded-md flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-600">
              <p className="font-medium">Exclusion réussie !</p>
              <p className="mt-1">
                {result.excludedCount} enfant{result.excludedCount > 1 ? 's' : ''} de{' '}
                <strong>
                  {families.find((f) => String(f.id) === parentIngredientId)?.name.fr}
                </strong>{' '}
                ont été exclus des namespaces sélectionnés.
              </p>
              {result.childrenIds.length > 0 && (
                <p className="text-xs mt-1 text-muted-foreground">
                  IDs exclus: {result.childrenIds.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Aucun enfant trouvé */}
        {result && result.excludedCount === 0 && (
          <div className="p-3 border border-yellow-500 bg-yellow-50 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-600">
              Aucun enfant trouvé pour{' '}
              <strong>
                {families.find((f) => String(f.id) === parentIngredientId)?.name.fr}
              </strong>
              . Assurez-vous que des relations de type &quot;Famille&quot; existent.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
