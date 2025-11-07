'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

type Ingredient = {
  id: number
  name: any
  isInNamespace: boolean
}

type NamespaceIngredientManagerProps = {
  namespaceName: string
  bitIndex: number
  ingredients: Ingredient[]
  loading?: boolean
  onToggle: (ingredientId: number, isCurrentlyInNamespace: boolean) => Promise<void>
}

export function NamespaceIngredientManager({
  namespaceName,
  bitIndex,
  ingredients,
  loading,
  onToggle,
}: NamespaceIngredientManagerProps) {
  const [search, setSearch] = useState('')

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name?.fr?.toLowerCase().includes(search.toLowerCase())
  )

  const includedCount = filteredIngredients.filter((ing) => ing.isInNamespace).length
  const totalCount = filteredIngredients.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize">{namespaceName}</CardTitle>
            <CardDescription>
              Gérez les ingrédients disponibles dans le namespace "{namespaceName}"
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {includedCount} / {totalCount} ingrédients
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Recherche */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un ingrédient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des ingrédients */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Chargement...</p>
          ) : filteredIngredients.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Aucun ingrédient trouvé</p>
          ) : (
            filteredIngredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md transition-colors"
              >
                <Checkbox
                  id={`ingredient-${ingredient.id}`}
                  checked={ingredient.isInNamespace}
                  onCheckedChange={async () => {
                    await onToggle(ingredient.id, ingredient.isInNamespace)
                  }}
                />
                <label
                  htmlFor={`ingredient-${ingredient.id}`}
                  className="flex-1 text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {ingredient.name?.fr || 'Sans nom'}
                </label>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
