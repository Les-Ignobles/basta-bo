import { supabaseServer } from '@/lib/supabase/server-client'

/**
 * GET /api/admin/orphan-ingredients
 * Liste les recettes dont des étapes référencent des ingrédients non reliés
 * au catalogue (ingredient_id = 0), avec le détail des noms concernés.
 */
export async function GET() {
    try {
        const actions: Array<{ recipe_id: number; ingredients: unknown[] }> = []
        for (let from = 0; ; from += 1000) {
            const { data, error } = await supabaseServer
                .from('recipe_actions')
                .select('recipe_id, ingredients')
                .range(from, from + 999)
            if (error) throw error
            actions.push(...(data ?? []))
            if (!data || data.length < 1000) break
        }

        const byRecipe = new Map<number, Map<string, number>>()
        for (const a of actions) {
            for (const ing of (a.ingredients ?? []) as Array<
                string | { name?: string; ingredient_id?: number }
            >) {
                const name = typeof ing === 'string' ? ing : ing?.name
                const id = typeof ing === 'string' ? 0 : ing?.ingredient_id ?? 0
                if (id !== 0 || !name) continue
                const names = byRecipe.get(a.recipe_id) ?? new Map<string, number>()
                names.set(name, (names.get(name) ?? 0) + 1)
                byRecipe.set(a.recipe_id, names)
            }
        }

        const recipeIds = [...byRecipe.keys()]
        let titleById = new Map<number, string>()
        if (recipeIds.length > 0) {
            const { data: recipes, error } = await supabaseServer
                .from('recipes')
                .select('id, title')
                .in('id', recipeIds)
            if (error) throw error
            titleById = new Map((recipes ?? []).map((r) => [r.id, r.title]))
        }

        const result = recipeIds
            .map((id) => {
                const names = byRecipe.get(id)!
                const total = [...names.values()].reduce((s, n) => s + n, 0)
                return {
                    recipe_id: id,
                    title: titleById.get(id) ?? `Recette ${id}`,
                    total,
                    names: [...names.entries()]
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count),
                }
            })
            .sort((a, b) => b.total - a.total)

        return Response.json({ data: result })
    } catch (error) {
        console.error('Failed to list orphan ingredients:', error)
        return Response.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
