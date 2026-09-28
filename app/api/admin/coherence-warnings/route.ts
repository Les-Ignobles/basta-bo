import { supabaseServer } from '@/lib/supabase/server-client'
import { computeIngredientWarnings } from '@/features/cooking/utils/ingredient-warnings'
import type { Ingredient, RecipeActionBO } from '@/features/cooking/types'

/**
 * GET /api/admin/coherence-warnings
 * Passe le catalogue entier au détecteur d'incohérences liste ↔ étapes
 * (le même que les tags de l'éditeur de recette) et renvoie les ids de
 * recettes par sévérité :
 *  - red    : ingrédient utilisé dans les étapes mais absent de la liste
 *             (liste de courses trouée, masque allergènes faux)
 *  - orange : ingrédient jamais cité, ou étape composite découpe+dépôt
 * Calcul à la demande (~4 requêtes + une passe en mémoire, < 1 s) — appelé
 * uniquement à la première activation du filtre côté listing.
 */
export async function GET() {
    try {
        const fetchAll = async <T,>(table: string, columns: string) => {
            const rows: T[] = []
            for (let from = 0; ; from += 1000) {
                const { data, error } = await supabaseServer
                    .from(table)
                    .select(columns)
                    .range(from, from + 999)
                if (error) throw error
                rows.push(...((data ?? []) as T[]))
                if (!data || data.length < 1000) break
            }
            return rows
        }

        const [pivots, actions, catalogue] = await Promise.all([
            fetchAll<{ recipe_id: number; ingredient_id: number }>('ingredient_recipe_pivot', 'recipe_id, ingredient_id'),
            fetchAll<RecipeActionBO>('recipe_actions', '*'),
            fetchAll<Ingredient>('ingredients', '*'),
        ])

        const catalogueById = new Map(catalogue.map((i) => [i.id, i]))
        const ingredientsByRecipe = new Map<number, Ingredient[]>()
        for (const p of pivots) {
            const ing = catalogueById.get(p.ingredient_id)
            if (!ing) continue
            const list = ingredientsByRecipe.get(p.recipe_id) ?? []
            list.push(ing)
            ingredientsByRecipe.set(p.recipe_id, list)
        }
        const actionsByRecipe = new Map<number, RecipeActionBO[]>()
        for (const a of actions) {
            const list = actionsByRecipe.get(a.recipe_id) ?? []
            list.push(a)
            actionsByRecipe.set(a.recipe_id, list)
        }

        const red: number[] = []
        const orange: number[] = []
        for (const [recipeId, recipeActions] of actionsByRecipe) {
            recipeActions.sort((a, b) => a.step_index - b.step_index)
            const w = computeIngredientWarnings(
                ingredientsByRecipe.get(recipeId) ?? [],
                recipeActions,
                catalogue
            )
            if (w.citedMissing.length > 0) red.push(recipeId)
            if (w.neverCited.length > 0 || w.compositeSteps.length > 0) orange.push(recipeId)
        }

        return Response.json({ data: { red, orange } })
    } catch (error) {
        console.error('coherence-warnings failed:', error)
        return Response.json({ error: 'Failed to compute coherence warnings' }, { status: 500 })
    }
}
