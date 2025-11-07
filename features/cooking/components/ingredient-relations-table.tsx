'use client'

import { IngredientRelationWithNames, IngredientRelationType } from '../types/ingredient-relation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type IngredientRelationsTableProps = {
  relations: IngredientRelationWithNames[]
  loading?: boolean
  onDelete?: (id: number) => void
  onDeleteBidirectional?: (ingredientId: number, relatedIngredientId: number) => void
}

const relationTypeLabels: Record<IngredientRelationType, string> = {
  [IngredientRelationType.FAMILY]: 'Famille',
  [IngredientRelationType.SUBSTITUTE]: 'Substitut',
}

const relationTypeColors: Record<IngredientRelationType, 'default' | 'secondary' | 'outline'> = {
  [IngredientRelationType.FAMILY]: 'default',
  [IngredientRelationType.SUBSTITUTE]: 'secondary',
}

export function IngredientRelationsTable({
  relations,
  loading,
  onDelete,
  onDeleteBidirectional,
}: IngredientRelationsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (relations.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Aucune relation trouvée</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Ingrédient</TableHead>
            <TableHead className="w-[50px] text-center">→</TableHead>
            <TableHead>Ingrédient lié</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[150px]">Créé le</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {relations.map((relation) => (
            <TableRow key={relation.id}>
              <TableCell className="font-mono text-xs">{relation.id}</TableCell>
              <TableCell className="font-medium">{relation.ingredient_name}</TableCell>
              <TableCell className="text-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
              </TableCell>
              <TableCell className="font-medium">{relation.related_ingredient_name}</TableCell>
              <TableCell>
                <Badge variant={relationTypeColors[relation.relation_type]}>
                  {relationTypeLabels[relation.relation_type]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(relation.created_at), 'dd MMM yyyy', { locale: fr })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDelete?.(relation.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer cette relation
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onDeleteBidirectional?.(
                          relation.ingredient_id,
                          relation.related_ingredient_id
                        )
                      }
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer les deux sens
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
