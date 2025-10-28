
import { supabaseServer } from '@/lib/supabase/server-client'
import { AllergyRepository } from '@/features/cooking/repositories/allergy-repository'

export async function GET() {
    const repo = new AllergyRepository(supabaseServer)
    const data = await repo.findAll()
    return Response.json({ data })
}