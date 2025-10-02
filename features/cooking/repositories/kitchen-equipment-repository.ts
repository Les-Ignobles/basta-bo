import { BaseRepository } from '@/lib/repositories/base-repository'
import type { KitchenEquipment } from '../types/kitchen-equipment'

export class KitchenEquipmentRepository extends BaseRepository<KitchenEquipment> {
    constructor(client: any) {
        super(client, 'kitchen_equipments')
    }
}