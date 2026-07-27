"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal, Loader2, Sparkles } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import type { Recipe } from '@/features/cooking/types'

type Props = {
    recipes: Recipe[]
    loading?: boolean
    onEdit?: (recipe: Recipe) => void
    onDelete?: (recipe: Recipe) => void
    onDuplicate?: (recipe: Recipe) => void
    selectedRecipes?: number[]
    onSelectRecipe?: (recipeId: number, selected: boolean) => void
    onSelectAll?: (selected: boolean) => void
    onToggleNew?: (recipeId: number, isNew: boolean) => void
    duplicatingId?: number | null
}

export function RecipesTable({ recipes, loading = false, onEdit, onDelete, onDuplicate, selectedRecipes = [], onSelectRecipe, onSelectAll, onToggleNew, duplicatingId }: Props) {
    const allSelected = recipes.length > 0 && selectedRecipes.length === recipes.length
    const someSelected = selectedRecipes.length > 0 && selectedRecipes.length < recipes.length

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={allSelected || someSelected}
                                onCheckedChange={(checked) => onSelectAll?.(checked === true)}
                            />
                        </TableHead>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead className="w-[90px]">Image</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead className="text-right">Créé le</TableHead>
                        <TableHead className="w-[60px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>Chargement en cours…</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {recipes.map((recipe) => {
                                const isSelected = selectedRecipes.includes(Number(recipe.id))
                                return (
                                    <TableRow
                                        key={recipe.id}
                                        className="hover:bg-muted/50"
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => onSelectRecipe?.(Number(recipe.id), checked === true)}
                                            />
                                        </TableCell>
                                        <TableCell className="cursor-pointer text-muted-foreground" onClick={() => onEdit?.(recipe)}>{recipe.id}</TableCell>
                                        <TableCell className="cursor-pointer" onClick={() => onEdit?.(recipe)}>
                                            {recipe.img_path ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={recipe.img_path} alt={recipe.title} className="h-16 w-16 rounded-md object-cover" />
                                            ) : (
                                                <div className="h-16 w-16 rounded-md bg-muted" />
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium cursor-pointer" onClick={() => onEdit?.(recipe)}>
                                            <div className="flex items-center gap-2">
                                                <span>{recipe.title}</span>
                                                {recipe.is_new && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                                        <Sparkles className="h-3 w-3" />
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground cursor-pointer" onClick={() => onEdit?.(recipe)}>
                                            {new Date(recipe.created_at).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {duplicatingId === Number(recipe.id) ? (
                                                <Loader2 className="h-4 w-4 animate-spin inline-block text-muted-foreground" />
                                            ) : (
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
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleNew?.(Number(recipe.id), !recipe.is_new); }}>
                                                        {recipe.is_new ? 'Retirer des nouveautés' : 'Marquer comme nouveauté'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(recipe); }}>Créer à partir de cette recette</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete?.(recipe); }}>Supprimer</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {recipes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
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
