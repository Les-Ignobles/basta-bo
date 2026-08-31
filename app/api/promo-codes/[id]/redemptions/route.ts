import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { PromoCodeRepository } from '@/features/subscriptions/repositories/promo-code-repository'

/**
 * GET /api/promo-codes/[id]/redemptions
 * Liste des activations d'un code (qui, quand, premium accordé jusqu'à quand).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const promoCodeRepo = new PromoCodeRepository(supabaseServer)
    const redemptions = await promoCodeRepo.findRedemptions(parseInt(id, 10))
    return NextResponse.json({ data: redemptions })
  } catch (error) {
    console.error('Error fetching redemptions:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la récupération des activations' },
      { status: 500 }
    )
  }
}
