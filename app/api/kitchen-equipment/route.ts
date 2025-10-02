import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { KitchenEquipmentRepository } from '@/features/cooking/repositories/kitchen-equipment-repository'

export async function GET(req: NextRequest) {
    try {
        const repo = new KitchenEquipmentRepository(supabaseServer)
        const kitchenEquipment = await repo.findAll()
        return Response.json({ data: kitchenEquipment })
    } catch (error) {
        console.error('Error fetching kitchen equipment:', error)
        return Response.json(
            { error: 'Failed to fetch kitchen equipment' },
            { status: 500 }
        )
    }
}
