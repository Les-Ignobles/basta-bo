"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Recipe } from '@/features/cooking/types'
import { DISH_TYPE_LABELS } from '@/features/cooking/types'

type Props = {
    recipes: Recipe[]
    loading?: boolean
    onEdit?: (recipe: Recipe) => void
    onDelete?: (recipe: Recipe) => void
}

const MONTHS = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
]

export function RecipesTable({ recipes, loading = false, onEdit, onDelete }: Props) {
    const getSeasonalityMonths = (mask: number | null) => {
        if (!mask) return []
        const months = []
        for (let i = 0; i < 12; i++) {
            if (mask & (1 << i)) {
                months.push(MONTHS[i])
            }
        }
        return months
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Ingrédients</TableHead>
                        <TableHead>Saisonnalité</TableHead>
                        <TableHead className="text-right">Créé le</TableHead>
                        <TableHead className="w-[60px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Chargement des recettes...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {recipes.map((recipe) => (
                                <TableRow
                                    key={recipe.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => onEdit?.(recipe)}
                                >
                                    <TableCell>{recipe.id}</TableCell>
                                    <TableCell className="font-medium">{recipe.title}</TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {DISH_TYPE_LABELS[recipe.dish_type as keyof typeof DISH_TYPE_LABELS]}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {recipe.img_path ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={recipe.img_path} alt={recipe.title} className="h-8 w-8 rounded object-cover" />
                                        ) : (
                                            <div className="h-8 w-8 rounded bg-muted" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                            {recipe.ingredients_name.length} ingrédient{recipe.ingredients_name.length > 1 ? 's' : ''}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {recipe.seasonality_mask ? (
                                            <div className="flex flex-wrap gap-1">
                                                {getSeasonalityMonths(recipe.seasonality_mask).map((month, index) => (
                                                    <span key={index} className="text-xs bg-muted px-1 py-0.5 rounded">
                                                        {month}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Toute l'année</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {new Date(recipe.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-accent"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(recipe); }}>Éditer</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete?.(recipe); }}>Supprimer</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {recipes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                                        Aucune recette trouvée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
