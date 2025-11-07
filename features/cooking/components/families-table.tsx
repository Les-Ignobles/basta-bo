'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Settings, Loader2 } from 'lucide-react'

type Family = {
  id: number
  name: { fr: string }
  childrenCount: number
}

type FamiliesTableProps = {
  families: Family[]
  loading?: boolean
}

export function FamiliesTable({ families, loading }: FamiliesTableProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (families.length === 0) {
    return (
      <div className="p-8 text-center border rounded-md bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Aucune famille trouvée. Créez une première relation de type &quot;Famille&quot; pour
          commencer.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Famille</TableHead>
            <TableHead className="text-center">Nombre d&apos;enfants</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {families.map((family) => (
            <TableRow key={family.id}>
              <TableCell className="font-medium">{family.name.fr}</TableCell>
              <TableCell className="text-center">{family.childrenCount}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/ingredient-relations/${family.id}`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Gérer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
