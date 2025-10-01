import { NextRequest, NextResponse } from 'next/server'
import { DietRepository } from '@/features/cooking/repositories/diet-repository'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const dietRepo = new DietRepository(supabase)
        
        const diets = await dietRepo.findAll()
        
        return NextResponse.json({ data: diets })
    } catch (error) {
        console.error('Error fetching diets:', error)
        return NextResponse.json(
            { error: 'Failed to fetch diets' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const dietRepo = new DietRepository(supabase)
        
        const body = await request.json()
        const diet = await dietRepo.create(body)
        
        return NextResponse.json({ data: diet })
    } catch (error) {
        console.error('Error creating diet:', error)
        return NextResponse.json(
            { error: 'Failed to create diet' },
            { status: 500 }
        )
    }
}
