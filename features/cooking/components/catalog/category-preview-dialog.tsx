"use client"
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Users, Globe, UserRound, X } from 'lucide-react'
import type { RecipeCategory } from '@/features/cooking/types/recipe-category'
import type { TranslationText } from '@/lib/i18n'

export type PreviewRecipe = {
    id: number
    title: string
    img_path: string | null
    dish_type: string
}

type Referential = { id: number; title?: TranslationText; name?: TranslationText; emoji?: string }
type UserLite = { id: number; email: string | null; firstname: string | null }
type PreviewMode = 'everyone' | 'user' | 'profile'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    category: RecipeCategory | null
}

const refLabel = (ref: Referential) => ref.title?.fr ?? ref.name?.fr ?? `#${ref.id}`

/**
 * Aperçu « Voir comme » : les recettes que la catégorie affichera dans l'app,
 * pour tout le monde, pour un utilisateur réel, ou pour un profil type composé.
 */
export function CategoryPreviewDialog({ open, onOpenChange, category }: Props) {
    const [mode, setMode] = useState<PreviewMode>('everyone')
    const [diets, setDiets] = useState<Referential[]>([])
    const [allergies, setAllergies] = useState<Referential[]>([])
    const [selectedDietIds, setSelectedDietIds] = useState<number[]>([])
    const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[]>([])

    const [userSearch, setUserSearch] = useState('')
    const [userResults, setUserResults] = useState<UserLite[]>([])
    const [searchingUsers, setSearchingUsers] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserLite | null>(null)

    const [recipes, setRecipes] = useState<PreviewRecipe[]>([])
    const [totalInCategory, setTotalInCategory] = useState<number | null>(null)
    const [requiresRealUser, setRequiresRealUser] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Référentiels chargés à la première ouverture
    useEffect(() => {
        if (!open || diets.length > 0) return
        Promise.all([
            fetch('/api/diets').then(r => r.json()),
            fetch('/api/allergies').then(r => r.json()),
        ])
            .then(([dietsRes, allergiesRes]) => {
                setDiets(dietsRes.data || [])
                setAllergies(allergiesRes.data || [])
            })
            .catch(err => console.error('Error loading referentials:', err))
    }, [open, diets.length])

    // Reset à chaque changement de catégorie
    useEffect(() => {
        if (open) {
            setMode('everyone')
            setSelectedDietIds([])
            setSelectedAllergyIds([])
            setSelectedUser(null)
            setUserSearch('')
            setUserResults([])
        }
    }, [open, category?.id])

    // Recherche utilisateur (debounce)
    useEffect(() => {
        if (mode !== 'user' || !userSearch.trim()) {
            setUserResults([])
            return
        }
        const t = setTimeout(async () => {
            try {
                setSearchingUsers(true)
                const response = await fetch(`/api/users?search=${encodeURIComponent(userSearch)}&pageSize=5`)
                const { data } = await response.json()
                setUserResults(data || [])
            } catch (err) {
                console.error('Error searching users:', err)
            } finally {
                setSearchingUsers(false)
            }
        }, 300)
        return () => clearTimeout(t)
    }, [mode, userSearch])

    const fetchPreview = useCallback(async () => {
        if (!category) return
        // En mode utilisateur réel, attendre qu'un utilisateur soit choisi
        if (mode === 'user' && !selectedUser) return

        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams({ limit: '30' })
            if (mode === 'user' && selectedUser) {
                params.set('user_profile_id', String(selectedUser.id))
            }
            if (mode === 'profile') {
                if (selectedDietIds.length > 0) params.set('diet_ids', selectedDietIds.join(','))
                if (selectedAllergyIds.length > 0) params.set('allergy_ids', selectedAllergyIds.join(','))
            }

            const response = await fetch(`/api/recipe-categories/${category.id}/preview?${params}`)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de la prévisualisation')
            }

            setRecipes(result.data?.recipes || [])
            setTotalInCategory(result.data?.total_in_category ?? null)
            setRequiresRealUser(result.data?.requires_real_user ?? false)
        } catch (err) {
            console.error('Error previewing category:', err)
            setError(err instanceof Error ? err.message : 'Erreur inconnue')
        } finally {
            setLoading(false)
        }
    }, [category, mode, selectedUser, selectedDietIds, selectedAllergyIds])

    useEffect(() => {
        if (open) fetchPreview()
    }, [open, fetchPreview])

    const toggleId = (ids: number[], id: number) =>
        ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]

    const modeButton = (value: PreviewMode, icon: React.ReactNode, label: string) => (
        <Button
            variant={mode === value ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setMode(value)}
        >
            {icon}
            {label}
        </Button>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                            style={{ backgroundColor: (category?.color || '#000') + '20' }}
                        >
                            {category?.emoji}
                        </span>
                        Aperçu : {category?.name.fr}
                    </DialogTitle>
                    {category?.is_dynamic && (
                        <p className="text-sm text-muted-foreground">
                            {category?.dynamic_type === 'seasonality'
                                ? '🍂 Recettes sélectionnées automatiquement selon la saison'
                                : '⭐ Recettes personnalisées selon le profil utilisateur'}
                        </p>
                    )}
                </DialogHeader>

                {/* Sélecteur « Voir comme » */}
                <div className="space-y-3 border-b pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Voir comme :</span>
                        {modeButton('everyone', <Globe className="h-3.5 w-3.5" />, 'Tout le monde')}
                        {modeButton('user', <UserRound className="h-3.5 w-3.5" />, 'Utilisateur réel')}
                        {modeButton('profile', <Users className="h-3.5 w-3.5" />, 'Profil type')}
                    </div>

                    {mode === 'user' && (
                        <div className="space-y-2">
                            {selectedUser ? (
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="gap-1.5">
                                        {selectedUser.email || `Profil #${selectedUser.id}`}
                                        <button onClick={() => setSelectedUser(null)}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher un utilisateur par email..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                    {searchingUsers && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                    {userResults.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-md max-h-[160px] overflow-y-auto">
                                            {userResults.map(user => (
                                                <button
                                                    key={user.id}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setUserResults([])
                                                    }}
                                                >
                                                    {user.email || `Profil #${user.id}`}
                                                    {user.firstname && (
                                                        <span className="text-muted-foreground ml-2">({user.firstname})</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'profile' && (
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Régimes</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                    {diets.map(diet => (
                                        <label key={diet.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                            <Checkbox
                                                checked={selectedDietIds.includes(diet.id)}
                                                onCheckedChange={() => setSelectedDietIds(prev => toggleId(prev, diet.id))}
                                            />
                                            <span>{diet.emoji} {refLabel(diet)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Allergies</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                    {allergies.map(allergy => (
                                        <label key={allergy.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                            <Checkbox
                                                checked={selectedAllergyIds.includes(allergy.id)}
                                                onCheckedChange={() => setSelectedAllergyIds(prev => toggleId(prev, allergy.id))}
                                            />
                                            <span>{allergy.emoji} {refLabel(allergy)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-destructive">{error}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Vérifiez que le backend est en cours d&apos;exécution.
                            </p>
                        </div>
                    ) : mode === 'user' && !selectedUser ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Recherchez et sélectionnez un utilisateur pour voir son catalogue.</p>
                        </div>
                    ) : requiresRealUser ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Cette catégorie est personnalisée par utilisateur.</p>
                            <p className="text-sm mt-2">Choisissez « Utilisateur réel » pour la prévisualiser.</p>
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Aucune recette visible pour ce profil.</p>
                            {category?.dynamic_type === 'seasonality' && (
                                <p className="text-sm mt-2">
                                    Aucune recette n&apos;a de saisonnalité définie pour ce mois.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {recipes.map((recipe) => (
                                <div
                                    key={recipe.id}
                                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                                >
                                    {recipe.img_path ? (
                                        <Image
                                            src={recipe.img_path}
                                            alt={recipe.title}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                            ?
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{recipe.title}</p>
                                        <p className="text-xs text-muted-foreground">ID: {recipe.id}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                        {totalInCategory !== null
                            ? `${recipes.length} recette${recipes.length > 1 ? 's' : ''} visible${recipes.length > 1 ? 's' : ''} sur ${totalInCategory} dans la catégorie`
                            : `${recipes.length} recette${recipes.length > 1 ? 's' : ''} affichée${recipes.length > 1 ? 's' : ''}`}
                    </p>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
