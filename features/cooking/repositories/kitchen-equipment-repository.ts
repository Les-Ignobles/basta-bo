import { BaseRepository } from '@/lib/repositories/base-repository';
import type { KitchenEquipment } from '@/features/cooking/types';

export class KitchenEquipmentRepository extends BaseRepository<KitchenEquipment> {
    constructor(client: any) {
        super(client, 'kitchen_equipments');
    }
}
