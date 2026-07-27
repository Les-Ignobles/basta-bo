"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import type { Ingredient, IngredientCategory } from '@/features/cooking/types'
import type { ReadonlyURLSearchParams } from 'next/navigation'

type Props = {
    ingredients: Ingredient[]
    categories: IngredientCategory[]
    loading?: boolean
    currentPage?: number
    searchParams?: ReadonlyURLSearchParams
    onEdit?: (ingredient: Ingredient) => void
    onDelete?: (ingredient: Ingredient) => void
}

export function IngredientsTable({ ingredients, categories, loading = false, currentPage, searchParams, onEdit, onDelete }: Props) {
    const router = useRouter()

    const buildIngredientUrl = (ingredientId: number) => {
        const params = new URLSearchParams()
        if (currentPage) params.set('returnPage', currentPage.toString())

        // Préserver les filtres de recherche
        if (searchParams) {
            const search = searchParams.get('search')
            const noImage = searchParams.get('noImage')
            const categories = searchParams.get('categories')
            const translationFilter = searchParams.get('translationFilter')

            if (search) params.set('search', search)
            if (noImage) params.set('noImage', noImage)
            if (categories) params.set('categories', categories)
            if (translationFilter) params.set('translationFilter', translationFilter)
        }

        return `/dashboard/ingredients/${ingredientId}?${params.toString()}`
    }

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
                        <TableHead className="w-[90px]">Image</TableHead>
                        <TableHead>Nom (fr)</TableHead>
                        <TableHead>Catégorie</TableHead>
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
                            {ingredients.map((ing) => (
                                <TableRow
                                    key={ing.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => router.push(buildIngredientUrl(ing.id))}
                                >
                                    <TableCell className="text-muted-foreground">{ing.id}</TableCell>
                                    <TableCell>
                                        {ing.img_path ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={ing.img_path} alt={ing.name?.fr ?? ''} className="h-16 w-16 rounded-md object-cover" />
                                        ) : (
                                            <div className="h-16 w-16 rounded-md bg-muted" />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{ing.name?.fr ?? ''}</TableCell>
                                    <TableCell>{categoryLabel(ing.category_id)}</TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {new Date(ing.created_at).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(buildIngredientUrl(ing.id)); }}>Voir les détails</DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(ing); }}>Éditer</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete?.(ing); }}>Supprimer</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {ingredients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                                        Aucun ingrédient trouvé.
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
