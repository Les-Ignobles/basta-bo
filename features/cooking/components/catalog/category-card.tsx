"use client"
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye, Pencil, Pin, Sparkles, Trash2, UtensilsCrossed } from 'lucide-react'
import type { RecipeCategory } from '@/features/cooking/types/recipe-category'

type Props = {
    category: RecipeCategory
    onEdit: (category: RecipeCategory) => void
    onDelete: (category: RecipeCategory) => void
    onPreview?: (category: RecipeCategory) => void
}

/** Rangée de la bibliothèque « Toutes les catégories » : infos, statuts, actions CRUD. */
export function CategoryCard({ category, onEdit, onDelete, onPreview }: Props) {
    return (
        <TooltipProvider>
            <div
                className="flex items-center gap-4 p-4 bg-background border rounded-lg hover:bg-muted/30 cursor-pointer group transition-colors"
                onClick={() => onEdit(category)}
            >
                <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: category.color + '20' }}
                >
                    {category.emoji}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="font-medium">{category.name.fr}</div>
                    <div className="text-sm text-muted-foreground">
                        {category.name.en || 'Pas de traduction anglaise'}
                    </div>
                </div>

                {/* Statuts, groupés : affichage catalogue puis métier */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {category.display_as_chip && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-help">Filtre</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Visible comme filtre rapide en haut du catalogue</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {category.display_as_section && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-help">Bloc</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Affiché comme bloc sur la page catalogue</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {category.is_pinned && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="secondary" className="gap-1 cursor-help text-xs">
                                    <Pin className="h-3 w-3" />
                                    Badge
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ce badge apparaît sur les cartes de recettes</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                    {category.is_dynamic && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="default" className="text-xs cursor-help gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Auto
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {category.dynamic_type === 'seasonality'
                                        ? 'Recettes sélectionnées automatiquement selon la saison'
                                        : 'Recettes personnalisées selon le profil utilisateur'}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!category.is_dynamic && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Link href={`/dashboard/recipe-categories/${category.id}/order`}>
                                        <UtensilsCrossed className="h-4 w-4" />
                                        <span className="hidden lg:inline">Recettes</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ajouter ou organiser les recettes</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {onPreview && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onPreview(category)
                                    }}
                                >
                                    <Eye className="h-4 w-4" />
                                    <span className="hidden lg:inline">Aperçu</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Voir quelles recettes seront affichées</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit(category)
                                }}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Modifier la catégorie</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(category)
                                }}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Supprimer la catégorie</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    )
}
