'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import type { PromoDuration } from '../types'

export function PromoCodeForm() {
  const { generating, newCode, error, generateCode, copyToClipboard, clearNewCode } = usePromoCodeStore()
  const [duration, setDuration] = useState<PromoDuration>('1_month')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    await generateCode(duration)
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
        <CardTitle className="text-lg">Générer un code promo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="duration">Durée de l'abonnement</Label>
            <Select
              value={duration}
              onValueChange={(v) => setDuration(v as PromoDuration)}
              disabled={generating}
            >
              <SelectTrigger id="duration">
                <SelectValue placeholder="Sélectionner une durée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_month">1 mois (30 jours)</SelectItem>
                <SelectItem value="1_year">1 an (365 jours)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                Générer
              </>
            )}
          </Button>
        </div>

        {/* Generated Code Display */}
        {newCode && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Code généré avec succès !
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
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Durée: {newCode.duration_label} | Expire le{' '}
              {new Date(newCode.premium_end_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
