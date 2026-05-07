"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, Loader2 } from 'lucide-react'
import type { PremiumFilter } from '../types'

function toDateInput(date: Date): string {
    return date.toISOString().split('T')[0]
}

function defaultRegisteredFrom(): string {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return toDateInput(d)
}

function defaultRegisteredTo(): string {
    return toDateInput(new Date())
}

export function UsersExportDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [registeredFrom, setRegisteredFrom] = useState(defaultRegisteredFrom)
    const [registeredTo, setRegisteredTo] = useState(defaultRegisteredTo)
    const [lastSessionFrom, setLastSessionFrom] = useState('')
    const [lastSessionTo, setLastSessionTo] = useState('')
    const [premium, setPremium] = useState<PremiumFilter>('all')
    const [minSessions, setMinSessions] = useState('')
    const [hasEmail, setHasEmail] = useState(true)

    function reset() {
        setRegisteredFrom(defaultRegisteredFrom())
        setRegisteredTo(defaultRegisteredTo())
        setLastSessionFrom('')
        setLastSessionTo('')
        setPremium('all')
        setMinSessions('')
        setHasEmail(true)
        setError(null)
    }

    async function handleExport() {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams()
            if (registeredFrom) params.set('registeredFrom', new Date(registeredFrom).toISOString())
            if (registeredTo) {
                const to = new Date(registeredTo)
                to.setHours(23, 59, 59, 999)
                params.set('registeredTo', to.toISOString())
            }
            if (lastSessionFrom) params.set('lastSessionFrom', new Date(lastSessionFrom).toISOString())
            if (lastSessionTo) {
                const to = new Date(lastSessionTo)
                to.setHours(23, 59, 59, 999)
                params.set('lastSessionTo', to.toISOString())
            }
            if (premium !== 'all') params.set('premium', premium)
            if (minSessions) params.set('minSessions', minSessions)
            if (hasEmail) params.set('hasEmail', 'true')

            const res = await fetch(`/api/users/export?${params}`)
            if (!res.ok) throw new Error("Échec de l'export")

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            const dateStr = new Date().toISOString().split('T')[0]
            link.download = `utilisateurs-${dateStr}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            setOpen(false)
            reset()
        } catch (e) {
            console.error(e)
            setError("Erreur lors de l'export")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="size-4 mr-2" />
                    Exporter
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Exporter les utilisateurs</DialogTitle>
                    <DialogDescription>
                        Exporte la liste des utilisateurs actifs au format CSV. Par défaut, les inscrits des 30 derniers jours — vide chaque champ pour le désactiver.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <Label className="text-sm font-medium">Date d&apos;inscription</Label>
                            <span className="text-xs text-muted-foreground">optionnel · pré-rempli sur 30 jours</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="date"
                                value={registeredFrom}
                                onChange={(e) => setRegisteredFrom(e.target.value)}
                                placeholder="Du"
                            />
                            <Input
                                type="date"
                                value={registeredTo}
                                onChange={(e) => setRegisteredTo(e.target.value)}
                                placeholder="Au"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <Label className="text-sm font-medium">Dernière session</Label>
                            <span className="text-xs text-muted-foreground">optionnel</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="date"
                                value={lastSessionFrom}
                                onChange={(e) => setLastSessionFrom(e.target.value)}
                                placeholder="Du"
                            />
                            <Input
                                type="date"
                                value={lastSessionTo}
                                onChange={(e) => setLastSessionTo(e.target.value)}
                                placeholder="Au"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <Label className="text-sm font-medium">Statut Premium</Label>
                            <span className="text-xs text-muted-foreground">optionnel</span>
                        </div>
                        <Select value={premium} onValueChange={(v) => setPremium(v as PremiumFilter)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="premium">Premium uniquement</SelectItem>
                                <SelectItem value="non_premium">Non premium uniquement</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <Label htmlFor="minSessions" className="text-sm font-medium">Sessions minimum</Label>
                            <span className="text-xs text-muted-foreground">optionnel</span>
                        </div>
                        <Input
                            id="minSessions"
                            type="number"
                            min={0}
                            value={minSessions}
                            onChange={(e) => setMinSessions(e.target.value)}
                            placeholder="ex: 1"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <Checkbox
                            id="hasEmail"
                            checked={hasEmail}
                            onCheckedChange={(v) => setHasEmail(v === true)}
                        />
                        <Label htmlFor="hasEmail" className="text-sm font-medium cursor-pointer">
                            Uniquement les utilisateurs avec un email
                        </Label>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                        Annuler
                    </Button>
                    <Button onClick={handleExport} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Export en cours...
                            </>
                        ) : (
                            <>
                                <Download className="size-4 mr-2" />
                                Télécharger CSV
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
