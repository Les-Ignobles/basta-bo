import { NextRequest } from 'next/server';
import { KitchenEquipmentRepository } from '@/features/cooking/repositories/kitchen-equipment-repository';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET(req: NextRequest) {
    try {
        const repository = new KitchenEquipmentRepository(supabaseServer);
        const equipments = await repository.findAll();
        return Response.json({ data: equipments });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
