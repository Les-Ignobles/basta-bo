'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Loader2, Sparkles, Copy, Check, AlertTriangle } from 'lucide-react'
import { usePromoCodeStore } from '../stores/promo-code-store'

type DurationMode = 'days' | 'fixed_date'

const DAY_PRESETS = [
  { value: '7', label: '1 semaine (7 j)' },
  { value: '30', label: '1 mois (30 j)' },
  { value: '90', label: '3 mois (90 j)' },
  { value: '365', label: '1 an (365 j)' },
  { value: 'custom', label: 'Personnalisé…' }
]

export function PromoCodeForm() {
  const { creating, newCode, error, createCode, copyToClipboard, clearNewCode } =
    usePromoCodeStore()

  const [label, setLabel] = useState('')
  const [code, setCode] = useState('')
  const [durationMode, setDurationMode] = useState<DurationMode>('days')
  const [dayPreset, setDayPreset] = useState('30')
  const [customDays, setCustomDays] = useState('')
  const [fixedDate, setFixedDate] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [onlyNeverSubscribed, setOnlyNeverSubscribed] = useState(false)
  const [copied, setCopied] = useState(false)

  const effectiveDays =
    dayPreset === 'custom' ? parseInt(customDays, 10) || null : parseInt(dayPreset, 10)

  const canSubmit =
    !creating &&
    (durationMode === 'days' ? effectiveDays != null : fixedDate !== '')

  const handleCreate = async () => {
    const ok = await createCode({
      code: code.trim() || undefined,
      label: label.trim() || null,
      duration_days: durationMode === 'days' ? effectiveDays : null,
      premium_end_at:
        durationMode === 'fixed_date' && fixedDate
          ? new Date(fixedDate + 'T23:59:59').toISOString()
          : null,
      max_uses: maxUses ? parseInt(maxUses, 10) : null,
      valid_from: validFrom ? new Date(validFrom + 'T00:00:00').toISOString() : null,
      valid_until: validUntil ? new Date(validUntil + 'T23:59:59').toISOString() : null,
      only_never_subscribed: onlyNeverSubscribed
    })
    if (ok) {
      setCode('')
      setLabel('')
    }
  }

  const handleCopy = async () => {
    if (!newCode) return
    const success = await copyToClipboard(newCode.code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Créer un code promo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="promo-label">Libellé interne</Label>
            <Input
              id="promo-label"
              placeholder="Ex : Communauté Instagram — rentrée"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-code">Code (vide = généré automatiquement)</Label>
            <Input
              id="promo-code"
              placeholder="Ex : BASTA30"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={creating}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Accès premium offert</Label>
            <div className="flex gap-2">
              <Select
                value={durationMode}
                onValueChange={(v) => setDurationMode(v as DurationMode)}
                disabled={creating}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Durée (recommandé)</SelectItem>
                  <SelectItem value="fixed_date">Date de fin fixe</SelectItem>
                </SelectContent>
              </Select>

              {durationMode === 'days' ? (
                <>
                  <Select value={dayPreset} onValueChange={setDayPreset} disabled={creating}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {dayPreset === 'custom' && (
                    <Input
                      type="number"
                      min={1}
                      placeholder="jours"
                      className="w-24"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      disabled={creating}
                    />
                  )}
                </>
              ) : (
                <Input
                  type="date"
                  className="flex-1"
                  value={fixedDate}
                  onChange={(e) => setFixedDate(e.target.value)}
                  disabled={creating}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {durationMode === 'days'
                ? 'Chaque personne reçoit cette durée à partir du moment où elle active le code.'
                : 'Tout le monde est premium jusqu’à cette date, quelle que soit la date d’activation.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promo-quota">Quota d&apos;utilisations (vide = illimité)</Label>
            <Input
              id="promo-quota"
              type="number"
              min={1}
              placeholder="Ex : 100"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promo-from">Activable à partir du (optionnel)</Label>
            <Input
              id="promo-from"
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              disabled={creating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-until">Activable jusqu&apos;au (optionnel)</Label>
            <Input
              id="promo-until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              disabled={creating}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={onlyNeverSubscribed}
              onCheckedChange={(v) => setOnlyNeverSubscribed(v === true)}
              disabled={creating}
            />
            Réservé aux personnes n&apos;ayant jamais été abonnées
          </label>

          <Button onClick={handleCreate} disabled={!canSubmit}>
            {creating ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                Créer le code
              </>
            )}
          </Button>
        </div>

        {newCode && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Code créé avec succès !
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNewCode}
                className="text-green-700 hover:text-green-900 dark:text-green-300"
              >
                Fermer
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-2xl font-mono font-bold text-green-900 dark:text-green-100 bg-white dark:bg-green-900 px-4 py-2 rounded border">
                {newCode.code}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              {newCode.label ? `${newCode.label} — ` : ''}
              {newCode.duration_label}
              {newCode.max_uses != null ? ` | ${newCode.max_uses} utilisations max` : ' | utilisations illimitées'}
              {newCode.only_never_subscribed ? ' | jamais abonnés uniquement' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
