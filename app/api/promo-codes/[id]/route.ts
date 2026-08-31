import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { PromoCodeRepository } from '@/features/subscriptions/repositories/promo-code-repository'

/**
 * PATCH /api/promo-codes/[id]
 * Body: { is_active: boolean } — activer/désactiver un code.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as { is_active?: boolean }
    if (typeof body.is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid payload', message: 'is_active (booléen) requis' },
        { status: 400 }
      )
    }

    const promoCodeRepo = new PromoCodeRepository(supabaseServer)
    await promoCodeRepo.setActive(parseInt(id, 10), body.is_active)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating promo code:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la mise à jour du code' },
      { status: 500 }
    )
  }
}
