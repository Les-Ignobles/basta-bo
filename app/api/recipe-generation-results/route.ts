import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { RecipeGenerationResultRepository } from '@/features/cooking/repositories/recipe-generation-result-repository'

export async function GET(req: NextRequest) {
    try {
        const repo = new RecipeGenerationResultRepository(supabaseServer)
        const { searchParams } = new URL(req.url)

        const action = searchParams.get('action')

        if (action === 'stats') {
            // Récupérer les statistiques
            const stats = await repo.getStats()
            return Response.json({ data: stats })
        }

        if (action === 'recent') {
            // Récupérer l'activité récente
            const limit = Number(searchParams.get('limit') || '10')
            const recent = await repo.getRecentActivity(limit)
            return Response.json({ data: recent })
        }

        // Récupérer la liste paginée
        const page = Number(searchParams.get('page') ?? '1')
        const pageSize = Number(searchParams.get('pageSize') ?? '50')
        const search = searchParams.get('search') ?? undefined
        const dietMaskParam = searchParams.get('dietMask')
        const dietMask = dietMaskParam ? Number(dietMaskParam) : undefined
        const allergyMaskParam = searchParams.get('allergyMask')
        const allergyMask = allergyMaskParam ? Number(allergyMaskParam) : undefined
        const kitchenEquipmentMaskParam = searchParams.get('kitchenEquipmentMask')
        const kitchenEquipmentMask = kitchenEquipmentMaskParam ? Number(kitchenEquipmentMaskParam) : undefined
        
        const { data, total } = await repo.findPage({ page, pageSize, search, dietMask, allergyMask, kitchenEquipmentMask })
        return Response.json({ data, total, page, pageSize })

    } catch (error) {
        console.error('Error in recipe-generation-results API:', error)
        return Response.json(
            { error: 'Failed to fetch recipe generation results' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const repo = new RecipeGenerationResultRepository(supabaseServer)
        const { searchParams } = new URL(req.url)
        
        const action = searchParams.get('action')
        
        if (action === 'clear-old') {
            // Nettoyer les anciennes entrées
            const daysOld = Number(searchParams.get('days') || '30')
            const deletedCount = await repo.clearOldEntries(daysOld)
            return Response.json({ 
                success: true, 
                deletedCount,
                message: `${deletedCount} entrées supprimées`
            })
        }
        
        if (action === 'delete') {
            // Supprimer un batch spécifique
            const id = Number(searchParams.get('id'))
            if (!id) {
                return Response.json(
                    { error: 'ID is required' },
                    { status: 400 }
                )
            }
            
            await repo.deleteById(id)
            return Response.json({ 
                success: true,
                message: `Batch #${id} supprimé`
            })
        }
        
        return Response.json(
            { error: 'Invalid action' },
            { status: 400 }
        )
        
    } catch (error) {
        console.error('Error in recipe-generation-results DELETE:', error)
        return Response.json(
            { error: 'Failed to delete recipe generation results' },
            { status: 500 }
        )
    }
}
