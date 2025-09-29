import { supabaseServer } from '@/lib/supabase/server-client'
import { IngredientCategoryRepository } from '@/features/cooking/repositories/ingredient-category-repository'

export async function GET() {
    const repo = new IngredientCategoryRepository(supabaseServer)
    const data = await repo.findAll()
    return Response.json({ data })
}


