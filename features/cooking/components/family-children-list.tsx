'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Ingredient = {
  id: number
  name: { fr: string }
}

type FamilyChildrenListProps = {
  familyId: number
  familyName: string
  childrenList: Ingredient[]
  onChildAdded: (childId: number, childName: string) => void
  onChildRemoved: (childId: number) => void
}

export function FamilyChildrenList({
  familyId,
  familyName,
  childrenList,
  onChildAdded,
  onChildRemoved,
}: FamilyChildrenListProps) {
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [selectedChildName, setSelectedChildName] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<number | null>(null)

  // Charger tous les ingrédients
  useEffect(() => {
    const fetchAllIngredients = async () => {
      setLoadingIngredients(true)
      try {
        const res = await fetch('/api/ingredients?pageSize=9999')
        const json = await res.json()
        setAllIngredients(json.data || [])
      } catch (error) {
        console.error('Error fetching ingredients:', error)
      } finally {
        setLoadingIngredients(false)
      }
    }
    fetchAllIngredients()
  }, [])

  const handleAddChild = async () => {
    if (!selectedChildId) return

    setAdding(true)
    try {
      const res = await fetch('/api/ingredient-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient_id: familyId,
          related_ingredient_id: parseInt(selectedChildId, 10),
          relation_type: 'family',
        }),
      })

      if (!res.ok) {
        throw new Error('Erreur lors de l\'ajout')
      }

      // Mise à jour optimiste
      onChildAdded(parseInt(selectedChildId, 10), selectedChildName)

      setSelectedChildId('')
      setSelectedChildName('')
      setOpen(false)
    } catch (error) {
      console.error('Error adding child:', error)
      alert('Erreur lors de l\'ajout de l\'enfant')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveChild = async (childId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cet enfant de la famille ?')) {
      return
    }

    setRemoving(childId)
    try {
      // Trouver l'ID de la relation
      const relationsRes = await fetch(`/api/ingredient-relations?ingredientId=${familyId}`)
      const relationsData = await relationsRes.json()

      const relation = relationsData.data.find(
        (rel: { id: number; ingredient_id: number; related_ingredient_id: number; relation_type: string }) =>
          rel.ingredient_id === familyId &&
          rel.related_ingredient_id === childId &&
          rel.relation_type === 'family'
      )

      if (!relation) {
        throw new Error('Relation introuvable')
      }

      const deleteRes = await fetch(`/api/ingredient-relations?id=${relation.id}`, {
        method: 'DELETE',
      })

      if (!deleteRes.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      // Mise à jour optimiste
      onChildRemoved(childId)
    } catch (error) {
      console.error('Error removing child:', error)
      alert('Erreur lors de la suppression de l\'enfant')
    } finally {
      setRemoving(null)
    }
  }

  // Filtrer les ingrédients disponibles (exclure famille + enfants déjà ajoutés)
  const availableIngredients = allIngredients.filter(
    (ing) => ing.id !== familyId && !childrenList.find((c) => c.id === ing.id)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enfants de la famille</CardTitle>
        <CardDescription>
          Gérez les ingrédients qui font partie de la famille &quot;{familyName}&quot;
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des enfants */}
        {childrenList.length === 0 ? (
          <div className="p-4 border rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Aucun enfant pour cette famille. Ajoutez-en un ci-dessous.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {childrenList.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">{child.name.fr}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveChild(child.id)}
                  disabled={removing === child.id}
                >
                  {removing === child.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-600" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Ajouter un enfant */}
        <div className="pt-4 border-t space-y-3">
          <h3 className="font-medium">Ajouter un enfant</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={loadingIngredients}
                  >
                    {selectedChildId
                      ? availableIngredients.find((ing) => String(ing.id) === selectedChildId)?.name
                          .fr
                      : loadingIngredients
                        ? 'Chargement...'
                        : 'Sélectionner un ingrédient...'}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher un ingrédient..." />
                    <CommandList>
                      <CommandEmpty>Aucun ingrédient trouvé.</CommandEmpty>
                      <CommandGroup>
                        {availableIngredients.map((ingredient) => (
                          <CommandItem
                            key={ingredient.id}
                            value={ingredient.name.fr}
                            onSelect={() => {
                              setSelectedChildId(String(ingredient.id))
                              setSelectedChildName(ingredient.name.fr)
                              setOpen(false)
                            }}
                          >
                            {ingredient.name.fr}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleAddChild} disabled={!selectedChildId || adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ajouter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
