"use client"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import type { RecipeCategory } from '@/features/cooking/types/recipe-category'

export type PreviewRecipe = {
    id: number
    title: string
    img_path: string | null
    dish_type: string
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    category: RecipeCategory | null
    recipes: PreviewRecipe[]
    loading: boolean
    error: string | null
}

/** Aperçu des recettes qu'une catégorie affichera dans l'app. */
export function CategoryPreviewDialog({ open, onOpenChange, category, recipes, loading, error }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
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
                    ) : recipes.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Aucune recette trouvée pour cette catégorie.</p>
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
                        {recipes.length} recette{recipes.length > 1 ? 's' : ''} affichée{recipes.length > 1 ? 's' : ''}
                    </p>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
