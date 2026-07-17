"use client"
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EyeOff } from 'lucide-react'
import type { Diet } from '@/features/cooking/types/diet'
import type { Allergy } from '@/features/cooking/types/allergy'
import type { RecipeOrderItem } from '@/features/cooking/types/recipe-category'

type Props = {
    recipe: RecipeOrderItem
    diets: Diet[]
    allergies: Allergy[]
}

const hasBit = (mask: number | null | undefined, bitIndex: number | null | undefined) =>
    mask != null && bitIndex != null && (mask & (1 << bitIndex)) !== 0

/**
 * Badges d'anticipation : pour qui cette recette sera (in)visible dans l'app.
 * - Régimes couverts (la recette reste visible pour ces profils)
 * - Allergènes présents (la recette disparaît pour ces profils)
 * - Cachée (invisible pour tout le monde)
 */
export function RecipeCompatBadges({ recipe, diets, allergies }: Props) {
    const compatibleDiets = diets.filter(diet => hasBit(recipe.diet_mask, diet.bit_index))
    const presentAllergens = allergies.filter(allergy => hasBit(recipe.allergy_mask, allergy.bit_index))

    return (
        <div className="flex flex-wrap items-center gap-1">
            {recipe.is_visible === false && (
                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                    <EyeOff className="h-2.5 w-2.5" />
                    Cachée
                </Badge>
            )}
            {compatibleDiets.map(diet => (
                <Tooltip key={`diet-${diet.id}`}>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 cursor-help border-green-300 text-green-700">
                            {diet.emoji} {diet.title.fr}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Visible pour les profils {diet.title.fr}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
            {presentAllergens.map(allergy => (
                <Tooltip key={`allergy-${allergy.id}`}>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 cursor-help border-red-300 text-red-700">
                            {allergy.emoji} {allergy.name.fr}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Masquée pour les allergiques : {allergy.name.fr}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    )
}
