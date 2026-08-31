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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Copy, Check, Loader2, Users } from 'lucide-react'
import { usePromoCodeStore } from '../stores/promo-code-store'
import { computePromoCodeStatus } from '../types'
import type { PromoCodeWithLabel, PromoCodeComputedStatus } from '../types'

const STATUS_BADGE: Record<
  PromoCodeComputedStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  active: { label: 'Actif', variant: 'default' },
  exhausted: { label: 'Épuisé', variant: 'secondary' },
  expired: { label: 'Expiré', variant: 'destructive' },
  inactive: { label: 'Désactivé', variant: 'outline' }
}

export function PromoCodesTable() {
  const {
    promoCodes,
    loading,
    copyToClipboard,
    toggleActive,
    redemptions,
    redemptionsLoading,
    fetchRedemptions
  } = usePromoCodeStore()
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [detailCode, setDetailCode] = useState<PromoCodeWithLabel | null>(null)

  const handleCopy = async (id: number, code: string) => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const openDetail = (code: PromoCodeWithLabel) => {
    setDetailCode(code)
    fetchRedemptions(code.id)
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

  const validityLabel = (code: PromoCodeWithLabel) => {
    if (!code.valid_from && !code.valid_until) return 'Toujours'
    const from = code.valid_from ? formatDate(code.valid_from) : '…'
    const until = code.valid_until ? formatDate(code.valid_until) : '…'
    return `${from} → ${until}`
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
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead>Premium offert</TableHead>
              <TableHead>Utilisations</TableHead>
              <TableHead>Activable</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promoCodes.map((code) => {
              const status = computePromoCodeStatus(code)
              const badge = STATUS_BADGE[status]
              const quotaPct =
                code.max_uses != null
                  ? Math.min(100, (code.uses_count / code.max_uses) * 100)
                  : null

              return (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold">{code.code}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleCopy(code.id, code.code)}
                      >
                        {copiedId === code.id ? (
                          <Check className="size-3.5 text-green-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                    {code.only_never_subscribed && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Jamais abonnés
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[180px] truncate">
                    {code.label ?? '—'}
                  </TableCell>
                  <TableCell>{code.duration_label}</TableCell>
                  <TableCell>
                    <button
                      className="text-left w-full cursor-pointer"
                      onClick={() => openDetail(code)}
                      title="Voir les activations"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className="text-sm">
                          {code.uses_count}
                          {code.max_uses != null ? ` / ${code.max_uses}` : ''}
                        </span>
                      </div>
                      {quotaPct != null && (
                        <Progress value={quotaPct} className="h-1.5 mt-1 w-24" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {validityLabel(code)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={code.is_active}
                      onCheckedChange={(v) => toggleActive(code.id, v)}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Détail : activations d'un code */}
      <Dialog open={detailCode != null} onOpenChange={(open) => !open && setDetailCode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">{detailCode?.code}</DialogTitle>
            <DialogDescription>
              {detailCode?.label ?? 'Activations de ce code'}
            </DialogDescription>
          </DialogHeader>
          {redemptionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : redemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Personne n&apos;a encore activé ce code.
            </p>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Activé le</TableHead>
                    <TableHead>Premium jusqu&apos;au</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">
                        {r.user_firstname || r.user_email || `Profil #${r.user_profile_id}`}
                        {r.user_firstname && r.user_email && (
                          <span className="block text-xs text-muted-foreground">
                            {r.user_email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(r.redeemed_at)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.premium_end_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
