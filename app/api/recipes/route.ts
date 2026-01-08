import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { RecipeRepository } from '@/features/cooking/repositories/recipe-repository'
import { IngredientRecipePivotRepository } from '@/features/cooking/repositories/ingredient-recipe-pivot-repository'
import type { StructuredIngredient } from '@/features/cooking/types'

export async function GET(req: NextRequest) {
    const repo = new RecipeRepository(supabaseServer)
    const { searchParams } = new URL(req.url)

    // Si un id est fourni en query parameter, rediriger vers la route spécifique
    const id = searchParams.get('id')
    if (id) {
        // Rediriger vers la route [id]
        const recipe = await repo.findById(Number(id))
        if (!recipe) {
            return Response.json({ error: 'Recipe not found' }, { status: 404 })
        }
        return Response.json({ data: recipe })
    }

    // Sinon, gérer la pagination des listes
    const page = Number(searchParams.get('page') ?? '1')
    const pageSize = Number(searchParams.get('pageSize') ?? '10')
    const search = searchParams.get('search') ?? undefined
    const noImage = (searchParams.get('noImage') ?? 'false') === 'true'
    const dishTypeParam = searchParams.get('dishType')
    const dishType = dishTypeParam ? Number(dishTypeParam) : undefined
    const dietsParam = searchParams.get('diets')
    const diets = dietsParam ? dietsParam.split(',').map(Number) : undefined
    const kitchenEquipmentsParam = searchParams.get('kitchenEquipments')
    const kitchenEquipments = kitchenEquipmentsParam ? kitchenEquipmentsParam.split(',').map(Number) : undefined
    const quantificationTypeParam = searchParams.get('quantificationType')
    const quantificationType = quantificationTypeParam ? Number(quantificationTypeParam) : undefined
    const isVisibleParam = searchParams.get('isVisible')
    const isVisible = isVisibleParam ? isVisibleParam === 'true' : undefined
    const isFolkloreParam = searchParams.get('isFolklore')
    const isFolklore = isFolkloreParam ? isFolkloreParam === 'true' : undefined

    const { data, total } = (diets && diets.length > 0) || (kitchenEquipments && kitchenEquipments.length > 0)
        ? await repo.findPageWithFilters({ search, page, pageSize, noImage, dishType, diets, kitchenEquipments, quantificationType, isVisible, isFolklore })
        : await repo.findPage({ search, page, pageSize, noImage, dishType, quantificationType, isVisible, isFolklore })
    return Response.json({ data, total, page, pageSize })
}

export async function POST(req: NextRequest) {
    const payload = await req.json()
    const { ingredient_ids, ...recipeData } = payload

    const repo = new RecipeRepository(supabaseServer)
    const pivotRepo = new IngredientRecipePivotRepository(supabaseServer)

    // Créer la recette (sans ingredient_ids qui n'existe pas dans la table recipes)
    const created = await repo.create(recipeData)

    // Créer les relations ingrédients-recette dans la table pivot
    if (ingredient_ids && ingredient_ids.length > 0) {
        await pivotRepo.syncRecipeIngredients(created.id, ingredient_ids)
    }

    return Response.json({ data: created })
}

export async function PUT(req: NextRequest) {
    const payload = await req.json()
    const { id, ingredient_ids, structured_ingredients, ...recipeData } = payload

    const repo = new RecipeRepository(supabaseServer)
    const pivotRepo = new IngredientRecipePivotRepository(supabaseServer)

    // Mettre à jour la recette (sans ingredient_ids et structured_ingredients qui n'existent pas dans la table recipes)
    const updated = await repo.update(Number(id), recipeData)

    // Mettre à jour les relations ingrédients-recette dans la table pivot
    if (structured_ingredients && Array.isArray(structured_ingredients) && structured_ingredients.length > 0) {
        // Utiliser les données structurées si disponibles
        await pivotRepo.syncRecipeStructuredIngredients(Number(id), structured_ingredients as StructuredIngredient[])
    } else if (ingredient_ids !== undefined) {
        // Sinon utiliser la liste simple d'IDs
        await pivotRepo.syncRecipeIngredients(Number(id), ingredient_ids)
    }

    return Response.json({ data: updated })
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    const repo = new RecipeRepository(supabaseServer)
    await repo.delete(id)
    return Response.json({ ok: true })
}
