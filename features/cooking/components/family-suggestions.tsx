'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, RefreshCw } from 'lucide-react'

type Ingredient = {
  id: number
  name: { fr: string }
}

type FamilySuggestionsProps = {
  familyId: number
  familyName: string
  existingChildrenIds: number[]
  onChildAdded: (childId: number, childName: string) => void
}

export function FamilySuggestions({
  familyId,
  familyName,
  existingChildrenIds,
  onChildAdded,
}: FamilySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<number | null>(null)

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/firebase/ingredients/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: familyName,
          is_test_mode: false,
        }),
      })

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`)
      }

      const data = await res.json()
      const ingredients = data.data?.ingredients || []

      // Filtrer les ingrédients déjà dans la famille et la famille elle-même
      const filtered = ingredients.filter(
        (ing: Ingredient) => ing.id !== familyId && !existingChildrenIds.includes(ing.id)
      )

      // Limiter à 10 suggestions
      setSuggestions(filtered.slice(0, 10))
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuggestions()
  }, [familyId, familyName, existingChildrenIds.length])

  const handleAddSuggestion = async (ingredientId: number, ingredientName: string) => {
    setAdding(ingredientId)
    try {
      const res = await fetch('/api/ingredient-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient_id: familyId,
          related_ingredient_id: ingredientId,
          relation_type: 'family',
        }),
      })

      if (!res.ok) {
        throw new Error('Erreur lors de l\'ajout')
      }

      // Mise à jour optimiste
      onChildAdded(ingredientId, ingredientName)
    } catch (error) {
      console.error('Error adding suggestion:', error)
      alert('Erreur lors de l\'ajout de la suggestion')
    } finally {
      setAdding(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Suggestions d&apos;ingrédients</CardTitle>
            <CardDescription>
              Suggestions basées sur la recherche sémantique pour &quot;{familyName}&quot;
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && suggestions.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-4 border rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Aucune suggestion trouvée. Tous les ingrédients similaires sont déjà dans la famille.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">{suggestion.name.fr}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddSuggestion(suggestion.id, suggestion.name.fr)}
                  disabled={adding === suggestion.id}
                >
                  {adding === suggestion.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
