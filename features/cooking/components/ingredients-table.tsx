"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import type { Ingredient, IngredientCategory } from '@/features/cooking/types'

type Props = {
    ingredients: Ingredient[]
    categories: IngredientCategory[]
    loading?: boolean
    onEdit?: (ingredient: Ingredient) => void
    onDelete?: (ingredient: Ingredient) => void
}

export function IngredientsTable({ ingredients, categories, loading = false, onEdit, onDelete }: Props) {
    const router = useRouter()

    const categoryLabel = (categoryId: number | null) => {
        if (!categoryId) return '-'
        const c = categories.find((x) => Number(x.id) === Number(categoryId))
        if (!c) return String(categoryId)
        return `${c.emoji ?? ''} ${c.title?.fr ?? ''}`.trim()
    }

    const getTranslationProgress = (ingredient: Ingredient) => {
        const supportedLanguages = ['en', 'es']
        const fields = ['name', 'suffix_singular', 'suffix_plural']

        let totalFields = 0
        let translatedFields = 0

        // Compter tous les champs possibles (2 langues × 3 champs = 6 champs)
        for (const lang of supportedLanguages) {
            for (const field of fields) {
                totalFields++
                const fieldValue = ingredient[field as keyof Ingredient] as any
                if (fieldValue?.[lang] && fieldValue[lang].trim().length > 0) {
                    translatedFields++
                }
            }
        }

        return totalFields > 0 ? Math.round((translatedFields / totalFields) * 100) : 0
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
                        <TableHead className="w-[100px]">Traductions</TableHead>
                        <TableHead className="text-right">Créé le</TableHead>
                        <TableHead className="w-[60px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Chargement des ingrédients...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        <>
                            {ingredients.map((ing) => (
                                <TableRow
                                    key={ing.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => router.push(`/dashboard/ingredients/${ing.id}`)}
                                >
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
                                    <TableCell>
                                        {(() => {
                                            const progress = getTranslationProgress(ing)
                                            const variant = progress === 100 ? 'default' : progress >= 50 ? 'secondary' : 'destructive'
                                            return (
                                                <Badge variant={variant} className="text-xs">
                                                    {progress}%
                                                </Badge>
                                            )
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {new Date(ing.created_at).toLocaleString()}
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
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/ingredients/${ing.id}`); }}>Voir les détails</DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(ing); }}>Éditer</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete?.(ing); }}>Supprimer</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {ingredients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
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
