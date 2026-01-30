'use client'

import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Ticket, ChevronLeft, ChevronRight } from 'lucide-react'
import { PromoCodeForm } from '@/features/subscriptions/components/promo-code-form'
import { PromoCodesTable } from '@/features/subscriptions/components/promo-codes-table'
import { usePromoCodeStore } from '@/features/subscriptions/stores/promo-code-store'
import type { PromoCodeStatus } from '@/features/subscriptions/types'

export default function PromoCodesPage() {
  const {
    fetchPromoCodes,
    total,
    page,
    pageSize,
    status,
    setPage,
    setFilter
  } = usePromoCodeStore()

  // Fetch promo codes on mount
  useEffect(() => {
    fetchPromoCodes()
  }, [fetchPromoCodes])

  const totalPages = Math.ceil(total / pageSize)
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Codes Promo</h1>
        <Badge variant="secondary">
          <Ticket className="size-3 mr-1" />
          {total} code{total > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-muted-foreground">
        Générez des codes promo pour les jeux-concours et opérations marketing.
        Chaque code permet d&apos;obtenir un abonnement premium d&apos;un mois ou d&apos;un an.
      </p>

      {/* Generate Form */}
      <PromoCodeForm />

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filtrer par statut:</span>
          <Select
            value={status}
            onValueChange={(v) => setFilter(v as PromoCodeStatus)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="unused">Non utilisés</SelectItem>
              <SelectItem value="used">Utilisés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page - 1)}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page + 1)}
              disabled={!canGoNext}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <PromoCodesTable />
    </div>
  )
}
