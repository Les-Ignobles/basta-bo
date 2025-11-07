'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Ingredient = {
  id: number
  name: {
    fr: string
  }
}

type SmartIngredientSearchProps = {
  label: string
  selectedIngredientId?: string
  onSelect: (ingredientId: string, ingredientName: string) => void
  excludeId?: string
  placeholder?: string
}

export function SmartIngredientSearch({
  label,
  selectedIngredientId,
  onSelect,
  excludeId,
  placeholder = 'Rechercher par nom ou description...',
}: SmartIngredientSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      searchIngredients(query)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [query])

  const searchIngredients = async (searchQuery: string) => {
    setLoading(true)
    setError(undefined)

    try {
      const res = await fetch('/api/firebase/ingredients/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: searchQuery,
          is_test_mode: false,
        }),
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }

      const data = await res.json()
      const ingredients = data.ingredients || []

      // Filtrer l'ingrédient exclu
      const filtered = excludeId
        ? ingredients.filter((ing: Ingredient) => String(ing.id) !== excludeId)
        : ingredients

      setResults(filtered)
    } catch (err) {
      console.error('Search error:', err)
      setError('Erreur lors de la recherche')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const selectedIngredient = results.find((ing) => String(ing.id) === selectedIngredientId)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Affichage de l'ingrédient sélectionné */}
      {selectedIngredient && (
        <div className="p-3 bg-primary/10 border border-primary rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="font-medium">{selectedIngredient.name.fr}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect('', '')
              setQuery('')
              setResults([])
            }}
          >
            Changer
          </Button>
        </div>
      )}

      {/* Champ de recherche */}
      {!selectedIngredient && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Message d'erreur */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Résultats */}
          {results.length > 0 && (
            <Card>
              <CardContent className="p-2 max-h-[300px] overflow-y-auto">
                <div className="space-y-1">
                  {results.map((ingredient) => (
                    <button
                      key={ingredient.id}
                      onClick={() => {
                        onSelect(String(ingredient.id), ingredient.name.fr)
                        setQuery('')
                        setResults([])
                      }}
                      className={cn(
                        'w-full text-left p-2 rounded-md hover:bg-muted transition-colors',
                        'text-sm'
                      )}
                    >
                      {ingredient.name.fr}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aucun résultat */}
          {query && !loading && results.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
          )}
        </>
      )}
    </div>
  )
}
