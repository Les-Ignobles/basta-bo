'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'
import {
  CreateIngredientRelationPayload,
  IngredientRelationType,
} from '../types/ingredient-relation'
import { SmartIngredientSearch } from './smart-ingredient-search'

type IngredientRelationFormProps = {
  onSubmit: (payload: CreateIngredientRelationPayload, bidirectional: boolean) => Promise<void>
}

export function IngredientRelationForm({ onSubmit }: IngredientRelationFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ingredientId, setIngredientId] = useState<string>('')
  const [ingredientName, setIngredientName] = useState<string>('')
  const [relatedIngredientId, setRelatedIngredientId] = useState<string>('')
  const [relatedIngredientName, setRelatedIngredientName] = useState<string>('')
  const [relationType, setRelationType] = useState<IngredientRelationType>(
    IngredientRelationType.FAMILY
  )
  const [bidirectional, setBidirectional] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ingredientId || !relatedIngredientId) {
      alert('Veuillez sélectionner les deux ingrédients')
      return
    }

    if (ingredientId === relatedIngredientId) {
      alert('Vous ne pouvez pas créer une relation avec le même ingrédient')
      return
    }

    setLoading(true)

    try {
      const payload: CreateIngredientRelationPayload = {
        ingredient_id: parseInt(ingredientId, 10),
        related_ingredient_id: parseInt(relatedIngredientId, 10),
        relation_type: relationType,
      }

      await onSubmit(payload, bidirectional)

      // Reset form
      setIngredientId('')
      setIngredientName('')
      setRelatedIngredientId('')
      setRelatedIngredientName('')
      setRelationType(IngredientRelationType.FAMILY)
      setBidirectional(true)
      setOpen(false)
    } catch (error) {
      console.error('Error creating relation:', error)
      alert('Erreur lors de la création de la relation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle relation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une relation entre ingrédients</DialogTitle>
          <DialogDescription>
            Liez deux ingrédients ensemble. Une relation bidirectionnelle créera automatiquement les
            deux sens (A → B et B → A).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Ingrédient 1 - Recherche intelligente */}
            <SmartIngredientSearch
              label="Ingrédient principal"
              selectedIngredientId={ingredientId}
              onSelect={(id, name) => {
                setIngredientId(id)
                setIngredientName(name)
              }}
              placeholder="Ex: pâtes, nouilles, spaghetti..."
            />

            {/* Ingrédient 2 - Recherche intelligente */}
            <SmartIngredientSearch
              label="Ingrédient lié"
              selectedIngredientId={relatedIngredientId}
              onSelect={(id, name) => {
                setRelatedIngredientId(id)
                setRelatedIngredientName(name)
              }}
              excludeId={ingredientId}
              placeholder="Ex: coquillettes, penne, farfalle..."
            />

            {/* Type de relation */}
            <div className="grid gap-2">
              <Label htmlFor="relation-type">Type de relation</Label>
              <Select
                value={relationType}
                onValueChange={(value) => setRelationType(value as IngredientRelationType)}
              >
                <SelectTrigger id="relation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IngredientRelationType.FAMILY}>
                    Famille (même groupe d'ingrédients)
                  </SelectItem>
                  <SelectItem value={IngredientRelationType.SUBSTITUTE}>
                    Substitut (peut remplacer)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bidirectionnelle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bidirectional"
                checked={bidirectional}
                onCheckedChange={(checked) => setBidirectional(checked as boolean)}
              />
              <Label
                htmlFor="bidirectional"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Créer une relation bidirectionnelle (A → B et B → A)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
