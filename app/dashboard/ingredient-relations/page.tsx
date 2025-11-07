'use client'

import { useEffect, useState } from 'react'
import { FamiliesTable } from '@/features/cooking/components/families-table'
import { IngredientRelationForm } from '@/features/cooking/components/ingredient-relation-form'

type Family = {
  id: number
  name: { fr: string }
  childrenCount: number
}

export default function IngredientRelationsPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(false)

  // Charger les familles
  useEffect(() => {
    const fetchFamilies = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/ingredient-relations/families')
        if (!res.ok) {
          throw new Error(`Erreur ${res.status}`)
        }
        const data = await res.json()
        setFamilies(data.families || [])
      } catch (error) {
        console.error('Error fetching families:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFamilies()
  }, [])

  const handleRelationCreated = () => {
    // Recharger les familles après création d'une relation
    const fetchFamilies = async () => {
      try {
        const res = await fetch('/api/ingredient-relations/families')
        const data = await res.json()
        setFamilies(data.families || [])
      } catch (error) {
        console.error('Error fetching families:', error)
      }
    }
    fetchFamilies()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Familles d&apos;ingrédients</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les familles d&apos;ingrédients et leurs relations
          </p>
        </div>
        <IngredientRelationForm
          onSubmit={async (payload, bidirectional) => {
            // Appel API pour créer la relation
            const res = await fetch('/api/ingredient-relations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...payload, bidirectional }),
            })

            if (!res.ok) {
              const error = await res.json()
              throw new Error(error.error || 'Erreur lors de la création')
            }

            // Recharger les familles
            handleRelationCreated()
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {families.length} famille{families.length > 1 ? 's' : ''} trouvée
          {families.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Table des familles */}
      <FamiliesTable families={families} loading={loading} />
    </div>
  )
}
