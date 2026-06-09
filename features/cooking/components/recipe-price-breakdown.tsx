"use client"
import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { IngredientUnit, QuantificationType } from '@/features/cooking/types'
import type { Ingredient, StructuredIngredient } from '@/features/cooking/types'

type Row = {
    ingredient: Ingredient
    structured: StructuredIngredient
    grams: number | null
    cost: number | null
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIngredients: Ingredient[]
    structuredIngredients: StructuredIngredient[]
    baseServings: number | null
    quantificationType: QuantificationType
    /**
     * Appelé après une mise à jour réussie du prix d'un ingrédient.
     * Le parent doit propager cette nouvelle valeur dans son état `selectedIngredients`
     * pour que le tableau et le badge se recalculent en temps réel.
     */
    onIngredientPriceUpdated: (ingredientId: number, newPrice: number | null) => void
}

function computeGrams(si: StructuredIngredient): number | null {
    if (si.unit === IngredientUnit.GRAM) return si.quantity
    if (si.unit === IngredientUnit.KILOGRAM) {
        return si.quantity !== null ? si.quantity * 1000 : null
    }
    return si.weight_in_grams
}

export function RecipePriceBreakdown({
    open,
    onOpenChange,
    selectedIngredients,
    structuredIngredients,
    baseServings,
    quantificationType,
    onIngredientPriceUpdated,
}: Props) {
    // Cache des valeurs en cours d'édition (par ingredient_id) pour ne pas spammer le serveur à chaque keystroke.
    const [draftPrices, setDraftPrices] = useState<Record<number, string>>({})
    const [savingId, setSavingId] = useState<number | null>(null)
    const [errorId, setErrorId] = useState<number | null>(null)

    const rows: Row[] = useMemo(() => {
        return structuredIngredients
            .map((si) => {
                const ingredient = selectedIngredients.find((i) => i.id === si.ingredient_id)
                if (!ingredient) return null
                const grams = computeGrams(si)
                const cost =
                    grams !== null && grams > 0 && ingredient.price_per_100g !== null && ingredient.price_per_100g !== undefined
                        ? (ingredient.price_per_100g * grams) / 100
                        : null
                return { ingredient, structured: si, grams, cost }
            })
            .filter((r): r is Row => r !== null)
            .sort((a, b) => a.ingredient.name.fr.localeCompare(b.ingredient.name.fr, 'fr'))
    }, [structuredIngredients, selectedIngredients])

    const totalCost = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0)
    const ratio = baseServings && baseServings > 0 ? totalCost / baseServings : null
    const missing = rows.filter((r) => r.cost === null).length
    const unitLabel = quantificationType === QuantificationType.PER_UNIT ? 'unité' : 'portion'

    async function commitPrice(ingredientId: number) {
        const raw = draftPrices[ingredientId]
        if (raw === undefined) return
        const trimmed = raw.trim()
        const newPrice = trimmed === '' ? null : parseFloat(trimmed.replace(',', '.'))
        if (newPrice !== null && (Number.isNaN(newPrice) || newPrice < 0)) {
            setErrorId(ingredientId)
            return
        }
        const ingredient = selectedIngredients.find((i) => i.id === ingredientId)
        if (!ingredient) return
        if (newPrice === ingredient.price_per_100g) {
            // Pas de changement : on remet l'input à sa source de vérité.
            setDraftPrices((s) => {
                const { [ingredientId]: _, ...rest } = s
                return rest
            })
            return
        }
        setSavingId(ingredientId)
        setErrorId(null)
        try {
            const res = await fetch('/api/ingredients', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: ingredientId, price_per_100g: newPrice }),
            })
            if (!res.ok) throw new Error('PUT failed')
            onIngredientPriceUpdated(ingredientId, newPrice)
            setDraftPrices((s) => {
                const { [ingredientId]: _, ...rest } = s
                return rest
            })
        } catch (e) {
            console.error('Échec de la mise à jour du prix', e)
            setErrorId(ingredientId)
        } finally {
            setSavingId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-w-[95vw] w-full">
                <DialogHeader>
                    <DialogTitle className="font-christmas">Détail du prix</DialogTitle>
                    <DialogDescription>
                        Coût indicatif par ingrédient. Modifier un prix met à jour le catalogue : toutes les autres recettes utilisant cet ingrédient en bénéficieront.
                    </DialogDescription>
                </DialogHeader>

                {rows.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Aucun ingrédient renseigné dans la recette.
                    </div>
                ) : (
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left p-2 font-medium">Ingrédient</th>
                                    <th className="text-right p-2 font-medium w-24">Poids</th>
                                    <th className="text-right p-2 font-medium w-32">Prix / 100g</th>
                                    <th className="text-right p-2 font-medium w-24">Coût</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(({ ingredient, grams, cost }) => {
                                    const draft = draftPrices[ingredient.id]
                                    const displayed =
                                        draft !== undefined
                                            ? draft
                                            : ingredient.price_per_100g !== null && ingredient.price_per_100g !== undefined
                                            ? String(ingredient.price_per_100g)
                                            : ''
                                    return (
                                        <tr key={ingredient.id} className={cost === null ? 'border-t bg-amber-50/40' : 'border-t'}>
                                            <td className="p-2">
                                                <div className="flex items-center gap-2">
                                                    {ingredient.img_path ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={ingredient.img_path}
                                                            alt={ingredient.name.fr}
                                                            className="w-7 h-7 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded bg-muted" />
                                                    )}
                                                    <span>{ingredient.name.fr}</span>
                                                </div>
                                            </td>
                                            <td className="p-2 text-right text-muted-foreground">
                                                {grams !== null && grams > 0 ? `${grams.toLocaleString('fr-FR')} g` : '—'}
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={displayed}
                                                        onChange={(e) => {
                                                            setErrorId(null)
                                                            setDraftPrices((s) => ({ ...s, [ingredient.id]: e.target.value }))
                                                        }}
                                                        onBlur={() => commitPrice(ingredient.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                ;(e.currentTarget as HTMLInputElement).blur()
                                                            }
                                                        }}
                                                        className={`h-8 text-sm text-right w-24 ${
                                                            errorId === ingredient.id ? 'border-destructive' : ''
                                                        }`}
                                                        placeholder="—"
                                                    />
                                                    <span className="text-xs text-muted-foreground">€</span>
                                                    {savingId === ingredient.id && (
                                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2 text-right font-medium">
                                                {cost !== null ? `${cost.toFixed(2)} €` : '—'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t bg-muted/30">
                                    <td className="p-2 font-medium" colSpan={3}>
                                        Total recette ({rows.length} ingrédient{rows.length > 1 ? 's' : ''}
                                        {missing > 0 ? `, ${missing} sans prix` : ''})
                                    </td>
                                    <td className="p-2 text-right font-semibold">{totalCost.toFixed(2)} €</td>
                                </tr>
                                {ratio !== null && (
                                    <tr className="border-t bg-muted/30">
                                        <td className="p-2 text-muted-foreground" colSpan={3}>
                                            Prix par {unitLabel} (÷ {baseServings})
                                        </td>
                                        <td className="p-2 text-right font-semibold">
                                            {ratio.toFixed(2)} €{missing > 0 ? ' (partiel)' : ''}
                                        </td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
