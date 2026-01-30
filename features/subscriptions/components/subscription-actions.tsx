'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Loader2, Plus, Calendar, History } from 'lucide-react'
import { useSubscriptionStore } from '../stores/subscription-store'
import type { ActionType } from '../types'

export function SubscriptionActions() {
  const {
    userProfile,
    updateSubscription,
    updating,
    auditLogs,
    loadingAuditLogs
  } = useSubscriptionStore()

  const [customDate, setCustomDate] = useState('')

  if (!userProfile) return null

  const handleQuickAdd = async (action: ActionType) => {
    await updateSubscription(action)
  }

  const handleCustomDate = async () => {
    if (!customDate) return
    await updateSubscription('custom_date', customDate)
    setCustomDate('')
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'add_1_month':
        return '+1 mois'
      case 'add_1_year':
        return '+1 an'
      case 'custom_date':
        return 'Date perso.'
      default:
        return action
    }
  }

  // Check if custom date is in the past
  const isDateInPast = customDate ? new Date(customDate) < new Date() : false

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Modifier l'abonnement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Actions rapides</Label>
          <div className="flex gap-3">
            <Button
              onClick={() => handleQuickAdd('add_1_month')}
              disabled={updating}
              variant="outline"
              className="flex-1"
            >
              {updating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Ajouter 1 mois
                </>
              )}
            </Button>
            <Button
              onClick={() => handleQuickAdd('add_1_year')}
              disabled={updating}
              variant="outline"
              className="flex-1"
            >
              {updating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Ajouter 1 an
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Custom Date */}
        <div className="space-y-3">
          <Label htmlFor="customDate" className="text-sm font-medium">
            Date personnalisée
          </Label>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                id="customDate"
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                disabled={updating}
              />
              {isDateInPast && customDate && (
                <p className="text-xs text-amber-600 mt-1">
                  Attention: cette date est dans le passé
                </p>
              )}
            </div>
            <Button
              onClick={handleCustomDate}
              disabled={updating || !customDate}
              variant="secondary"
            >
              {updating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Calendar className="size-4 mr-2" />
                  Appliquer
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Audit History */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history" className="border-none">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2 text-sm">
                <History className="size-4" />
                Historique des modifications ({auditLogs.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {loadingAuditLogs ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Aucune modification enregistrée
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="text-xs p-2 bg-muted rounded-md space-y-1"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{getActionLabel(log.action_type)}</span>
                        <span className="text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {formatDate(log.previous_end_date)} → {formatDate(log.new_end_date)}
                      </div>
                      <div className="text-muted-foreground">
                        par {log.admin_email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
