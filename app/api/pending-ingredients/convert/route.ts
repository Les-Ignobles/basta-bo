import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { IngredientRepository } from '@/features/cooking/repositories/ingredient-repository'
import { PendingIngredientRepository } from '@/features/cooking/repositories/pending-ingredient-repository'
import type { Ingredient } from '@/features/cooking/types'

export async function POST(request: NextRequest) {
    try {
        const { pendingId, ingredientData } = await request.json()

        if (!pendingId || !ingredientData) {
            return NextResponse.json(
                { error: 'pendingId et ingredientData sont requis' },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const ingredientRepo = new IngredientRepository(supabase)
        const pendingRepo = new PendingIngredientRepository(supabase)

        // Vérifier que le pending ingredient existe
        const pendingIngredient = await pendingRepo.findById(pendingId)
        if (!pendingIngredient) {
            return NextResponse.json(
                { error: 'Pending ingredient non trouvé' },
                { status: 404 }
            )
        }

        // Créer l'ingrédient
        const ingredientToCreate: Omit<Ingredient, 'id'> = {
            name: ingredientData.name,
            suffix_singular: ingredientData.suffix_singular,
            suffix_plural: ingredientData.suffix_plural,
            category_id: ingredientData.category_id,
            img_path: ingredientData.img_path || null,
            is_basic: false, // Par défaut, les ingrédients convertis ne sont pas de base
            created_at: new Date().toISOString()
        }

        const newIngredient = await ingredientRepo.create(ingredientToCreate)

        // Supprimer le pending ingredient
        await pendingRepo.delete(pendingId)

        return NextResponse.json({
            success: true,
            ingredient: newIngredient,
            message: 'Ingrédient créé avec succès'
        })

    } catch (error) {
        console.error('Erreur lors de la conversion:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la conversion de l\'ingrédient' },
            { status: 500 }
        )
    }
}
