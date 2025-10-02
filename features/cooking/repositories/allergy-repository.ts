import { BaseRepository } from '@/lib/repositories/base-repository'
import type { Allergy } from '../types/allergy'

export class AllergyRepository extends BaseRepository<Allergy> {
    constructor(client: any) {
        super(client, 'allergies')
    }
}
