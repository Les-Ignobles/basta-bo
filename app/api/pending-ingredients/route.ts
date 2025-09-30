import { NextRequest, NextResponse } from 'next/server'
import { PendingIngredientRepository } from '@/features/cooking/repositories/pending-ingredient-repository'
import { IngredientRepository } from '@/features/cooking/repositories/ingredient-repository'
import { createClient } from '@/lib/supabase/server'
import type { IngredientFormValues } from '@/features/cooking/components/ingredient-form'
import type { Ingredient } from '@/features/cooking/types'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const pendingIngredientRepo = new PendingIngredientRepository(supabase)

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '50')
        const search = searchParams.get('search') || undefined

        const result = await pendingIngredientRepo.findPage(page, pageSize, search)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching pending ingredients:', error)
        return NextResponse.json(
            { error: 'Failed to fetch pending ingredients' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const pendingIngredientRepo = new PendingIngredientRepository(supabase)

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            )
        }

        await pendingIngredientRepo.delete(parseInt(id))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting pending ingredient:', error)
        return NextResponse.json(
            { error: 'Failed to delete pending ingredient' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const pendingIngredientRepo = new PendingIngredientRepository(supabase)
        const ingredientRepo = new IngredientRepository(supabase)

        const body = await request.json()
        console.log('Received request body:', JSON.stringify(body, null, 2))
        
        const { pendingId, ingredientData }: { 
            pendingId: number
            ingredientData: IngredientFormValues 
        } = body

        if (!pendingId || !ingredientData) {
            return NextResponse.json(
                { error: 'pendingId and ingredientData are required' },
                { status: 400 }
            )
        }

        console.log('ingredientData.id:', ingredientData.id)
        console.log('ingredientData keys:', Object.keys(ingredientData))

        // Créer l'ingrédient (exclure l'id pour éviter les conflits de clé primaire)
        const ingredientToCreate: Omit<Ingredient, 'id'> = {
            name: ingredientData.name,
            suffix_singular: ingredientData.suffix_singular,
            suffix_plural: ingredientData.suffix_plural,
            category_id: ingredientData.category_id ?? null,
            img_path: ingredientData.img_path ?? null,
            created_at: new Date().toISOString()
        }

        console.log('Creating ingredient with data:', JSON.stringify(ingredientToCreate, null, 2))
        const newIngredient = await ingredientRepo.create(ingredientToCreate)

        // Supprimer le pending ingredient
        await pendingIngredientRepo.delete(pendingId)

        return NextResponse.json({
            success: true,
            ingredient: newIngredient
        })
    } catch (error) {
        console.error('Error converting pending ingredient:', error)
        return NextResponse.json(
            { error: 'Failed to convert pending ingredient' },
            { status: 500 }
        )
    }
}
