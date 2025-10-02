import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { AllergyRepository } from '@/features/cooking/repositories/allergy-repository'

export async function GET() {
    try {
        const repo = new AllergyRepository(supabaseServer)
        const allergies = await repo.findAll()
        return Response.json({ data: allergies })
    } catch (error) {
        console.error('Error fetching allergies:', error)
        return Response.json(
            { error: 'Failed to fetch allergies' },
            { status: 500 }
        )
    }
}
