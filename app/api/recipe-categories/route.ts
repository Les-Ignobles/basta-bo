import { NextRequest, NextResponse } from 'next/server'
import { RecipeCategoryRepository } from '@/features/cooking/repositories/recipe-category-repository'
import { supabaseServer } from '@/lib/supabase/server-client'

export async function GET() {
    try {
        const repo = new RecipeCategoryRepository(supabaseServer)
        const categories = await repo.findAll()

        return NextResponse.json({ data: categories })
    } catch (error) {
        console.error('Error fetching recipe categories:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recipe categories' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const repo = new RecipeCategoryRepository(supabaseServer)
        const body = await request.json()
        const category = await repo.create(body)

        return NextResponse.json({ data: category })
    } catch (error) {
        console.error('Error creating recipe category:', error)
        return NextResponse.json(
            { error: 'Failed to create recipe category' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const repo = new RecipeCategoryRepository(supabaseServer)
        const body = await request.json()
        const { id, ...payload } = body

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required for update' },
                { status: 400 }
            )
        }

        const category = await repo.update(id, payload)
        return NextResponse.json({ data: category })
    } catch (error) {
        console.error('Error updating recipe category:', error)
        return NextResponse.json(
            { error: 'Failed to update recipe category' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const repo = new RecipeCategoryRepository(supabaseServer)
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required for delete' },
                { status: 400 }
            )
        }

        await repo.delete(Number(id))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting recipe category:', error)
        return NextResponse.json(
            { error: 'Failed to delete recipe category' },
            { status: 500 }
        )
    }
}
