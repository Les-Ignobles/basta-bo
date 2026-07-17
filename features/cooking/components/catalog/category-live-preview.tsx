"use client"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Filter, LayoutList, Sparkles } from 'lucide-react'
import { DYNAMIC_TYPE_LABELS, type RecipeCategoryFormValues } from '@/features/cooking/types/recipe-category'

type Props = {
    values: RecipeCategoryFormValues
}

/** Aperçu live pendant la saisie : la catégorie telle qu'elle apparaîtra dans l'app. */
export function CategoryLivePreview({ values }: Props) {
    const name = values.name_fr || 'Ma catégorie'
    const emoji = values.emoji || '🏷️'
    const color = values.color || '#CCCCCC'

    return (
        <Card className="sticky top-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Aperçu
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* Tuile filtre rapide, comme dans l'app */}
                <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Filtre rapide (haut du catalogue)</p>
                    <div
                        className={`flex flex-col items-start justify-between p-4 rounded-2xl w-[140px] min-h-[110px] ${
                            values.display_as_chip ? '' : 'opacity-40'
                        }`}
                        style={{ backgroundColor: color }}
                    >
                        <span className="text-3xl drop-shadow-sm">{emoji}</span>
                        <span className="mt-2 text-sm font-semibold text-white drop-shadow-sm">{name}</span>
                    </div>
                    {!values.display_as_chip && (
                        <p className="text-[11px] text-muted-foreground">Non affichée comme filtre rapide</p>
                    )}
                </div>

                {/* Titre de bloc */}
                <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Bloc du catalogue</p>
                    <div className={values.display_as_section ? '' : 'opacity-40'}>
                        <span className="text-lg font-semibold">{emoji} {name}</span>
                        <div className="mt-1.5 flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-16 h-12 rounded-lg bg-muted" />
                            ))}
                        </div>
                    </div>
                    {!values.display_as_section && (
                        <p className="text-[11px] text-muted-foreground">Non affichée comme bloc</p>
                    )}
                </div>

                {/* Badge recette si épinglée */}
                {values.is_pinned && (
                    <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Badge sur les cartes de recettes</p>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-background border">
                            <span>{emoji}</span>
                            <span className="text-muted-foreground">{name}</span>
                        </span>
                    </div>
                )}

                {/* Statuts */}
                <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                    {values.display_as_chip && (
                        <Badge variant="outline" className="text-xs gap-1">
                            <Filter className="h-3 w-3" />
                            Filtre
                        </Badge>
                    )}
                    {values.display_as_section && (
                        <Badge variant="outline" className="text-xs gap-1">
                            <LayoutList className="h-3 w-3" />
                            Bloc
                        </Badge>
                    )}
                    {values.is_dynamic && values.dynamic_type && (
                        <Badge variant="default" className="text-xs gap-1">
                            <Sparkles className="h-3 w-3" />
                            {DYNAMIC_TYPE_LABELS[values.dynamic_type].badge}
                        </Badge>
                    )}
                    {!values.display_as_chip && !values.display_as_section && (
                        <p className="text-[11px] text-muted-foreground">
                            Cette catégorie ne sera visible nulle part dans le catalogue
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
