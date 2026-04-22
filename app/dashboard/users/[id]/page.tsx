"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Loader2, Check, X } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface UserProfile {
    id: number
    firstname: string
    email: string | null
    created_at: string
    appetite: number
    diets: number[]
    allergies: number[]
    kitchen_equipment: number[]
    liked_ingredients: number[]
    disliked_ingredients: number[]
    batch_cooking_frequency: number
    batch_cooking_goals: number[]
    meal_people_quantity: number
    time_saved: number
    money_saved: number
    premium_sub_end_at: string | null
    allergies_labels: string[]
    diets_labels: string[]
    kitchen_equipment_labels: string[]
    liked_ingredients_labels: string[]
    disliked_ingredients_labels: string[]
}

interface Session {
    id: number
    created_at: string
    meal_count: number
    people_count: number
    recipe_count: number
    is_cooked: boolean
    cooked_at: string | null
    total_cooking_time: number | null
}

const APPETITE_LABELS: Record<number, string> = {
    1: 'Petit',
    2: 'Normal',
    3: 'Grand',
}

export default function UserDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const res = await fetch(`/api/users/${id}`)
                const json = await res.json()
                setProfile(json.profile)
                setSessions(json.sessions)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin size-8 text-muted-foreground" />
            </div>
        )
    }

    if (!profile) {
        return <p className="text-center py-20 text-muted-foreground">Utilisateur introuvable</p>
    }

    function formatCookingTime(seconds: number | null) {
        if (!seconds) return '—'
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/users')}>
                    <ArrowLeft className="size-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{profile.firstname}</h1>
                    <p className="text-sm text-muted-foreground">{profile.email ?? "Pas d'email"}</p>
                    {profile.premium_sub_end_at && new Date(profile.premium_sub_end_at) > new Date() && (
                        <Badge variant="default" className="mt-1 bg-yellow-500 text-black">Premium</Badge>
                    )}
                </div>
            </div>

            {/* Profil */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Inscrit le</span>
                            <span>{format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Appétit</span>
                            <span>{APPETITE_LABELS[profile.appetite] ?? profile.appetite}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Personnes / repas</span>
                            <span>{profile.meal_people_quantity}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sessions totales</span>
                            <span className="font-medium">{sessions.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Temps économisé</span>
                            <span>{profile.time_saved}min</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Argent économisé</span>
                            <span>{profile.money_saved}€</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Régimes & Allergies</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Régimes</p>
                            <div className="flex flex-wrap gap-1">
                                {profile.diets_labels.length > 0
                                    ? profile.diets_labels.map((d) => <Badge key={d} variant="secondary">{d}</Badge>)
                                    : <span className="text-muted-foreground">Aucun</span>
                                }
                            </div>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Allergies</p>
                            <div className="flex flex-wrap gap-1">
                                {profile.allergies_labels.length > 0
                                    ? profile.allergies_labels.map((a) => <Badge key={a} variant="destructive">{a}</Badge>)
                                    : <span className="text-muted-foreground">Aucune</span>
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Équipements & Préférences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1">Équipements</p>
                            <div className="flex flex-wrap gap-1">
                                {profile.kitchen_equipment_labels.length > 0
                                    ? profile.kitchen_equipment_labels.map((e) => <Badge key={e} variant="outline">{e}</Badge>)
                                    : <span className="text-muted-foreground">Aucun</span>
                                }
                            </div>
                        </div>
                        {profile.liked_ingredients_labels.length > 0 && (
                            <div>
                                <p className="text-muted-foreground mb-1">Ingrédients aimés</p>
                                <div className="flex flex-wrap gap-1">
                                    {profile.liked_ingredients_labels.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}
                                </div>
                            </div>
                        )}
                        {profile.disliked_ingredients_labels.length > 0 && (
                            <div>
                                <p className="text-muted-foreground mb-1">Ingrédients détestés</p>
                                <div className="flex flex-wrap gap-1">
                                    {profile.disliked_ingredients_labels.map((i) => <Badge key={i} variant="destructive">{i}</Badge>)}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Historique sessions */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Historique des sessions ({sessions.length})</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Recettes</TableHead>
                            <TableHead className="text-center">Repas</TableHead>
                            <TableHead className="text-center">Personnes</TableHead>
                            <TableHead className="text-center">Temps</TableHead>
                            <TableHead className="text-center">Cuisiné</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Aucune session
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions.map((s) => (
                                <TableRow key={s.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/batch-cooking-sessions/details?id=${s.id}`)}>
                                    <TableCell>
                                        <div>{format(new Date(s.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: fr })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">{s.recipe_count}</TableCell>
                                    <TableCell className="text-center">{s.meal_count}</TableCell>
                                    <TableCell className="text-center">{s.people_count}</TableCell>
                                    <TableCell className="text-center">{formatCookingTime(s.total_cooking_time)}</TableCell>
                                    <TableCell className="text-center">
                                        {s.is_cooked
                                            ? <Check className="size-4 text-green-500 mx-auto" />
                                            : <X className="size-4 text-muted-foreground mx-auto" />
                                        }
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
