'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Loader2 } from 'lucide-react'
import { usePromoCodeStore } from '../stores/promo-code-store'

export function PromoCodesTable() {
  const { promoCodes, loading, copyToClipboard } = usePromoCodeStore()
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const handleCopy = async (id: number, code: string) => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (promoCodes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun code promo trouvé
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Code</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead>Durée</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date d'utilisation</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promoCodes.map((code) => {
            const isUsed = !!code.used_at
            return (
              <TableRow key={code.id}>
                <TableCell>
                  <code className="font-mono font-medium bg-muted px-2 py-1 rounded text-sm">
                    {code.code}
                  </code>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(code.created_at)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{code.duration_label}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={isUsed ? 'secondary' : 'default'}>
                    {isUsed ? 'Utilisé' : 'Disponible'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {code.used_at ? formatDate(code.used_at) : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(code.id, code.code)}
                  >
                    {copiedId === code.id ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
