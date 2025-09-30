import { NextRequest, NextResponse } from 'next/server'
import { PendingIngredientRepository } from '@/features/cooking/repositories/pending-ingredient-repository'
import { createClient } from '@/lib/supabase/server'

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

        const body = await request.json()
        const { name }: { name: string } = body

        if (!name) {
            return NextResponse.json(
                { error: 'name is required' },
                { status: 400 }
            )
        }

        // Créer un nouveau pending ingredient
        const newPendingIngredient = await pendingIngredientRepo.create({
            name: name.trim()
        })

        return NextResponse.json({
            success: true,
            pendingIngredient: newPendingIngredient
        })
    } catch (error) {
        console.error('Error creating pending ingredient:', error)
        return NextResponse.json(
            { error: 'Failed to create pending ingredient' },
            { status: 500 }
        )
    }
}
