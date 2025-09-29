"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Ingredient, IngredientCategory } from '@/features/cooking/types'

type Props = {
    ingredients: Ingredient[]
    categories: IngredientCategory[]
    onEdit?: (ingredient: Ingredient) => void
    onDelete?: (ingredient: Ingredient) => void
}

export function IngredientsTable({ ingredients, categories, onEdit, onDelete }: Props) {
    const categoryLabel = (categoryId: number | null) => {
        if (!categoryId) return '-'
        const c = categories.find((x) => Number(x.id) === Number(categoryId))
        if (!c) return String(categoryId)
        return `${c.emoji ?? ''} ${c.title?.fr ?? ''}`.trim()
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead>Nom (fr)</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Créé le</TableHead>
                        <TableHead className="w-[60px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ingredients.map((ing) => (
                        <TableRow key={ing.id}>
                            <TableCell>{ing.id}</TableCell>
                            <TableCell>{ing.name?.fr ?? ''}</TableCell>
                            <TableCell>
                                {ing.img_path ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={ing.img_path} alt={ing.name?.fr ?? ''} className="h-8 w-8 rounded object-cover" />
                                ) : (
                                    <div className="h-8 w-8 rounded bg-muted" />
                                )}
                            </TableCell>
                            <TableCell>{categoryLabel(ing.category_id)}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                                {new Date(ing.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-accent">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit?.(ing)}>Éditer</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(ing)}>Supprimer</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {ingredients.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                                Aucun ingrédient.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
