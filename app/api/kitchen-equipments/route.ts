import { KitchenEquipmentRepository } from '@/features/cooking/repositories/kitchen-equipment-repository';
import { supabaseServer } from '@/lib/supabase/server-client';

export async function GET() {
    try {
        const repository = new KitchenEquipmentRepository(supabaseServer);
        const equipments = await repository.findAll();
        return Response.json({ data: equipments });
    } catch (error: unknown) {
        return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
