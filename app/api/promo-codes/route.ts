import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { PromoCodeRepository } from '@/features/subscriptions/repositories/promo-code-repository'
import type {
  GeneratePromoCodeRequest,
  PromoCodesListResponse,
  PromoCodeStatus
} from '@/features/subscriptions/types'

/**
 * GET /api/promo-codes?page=1&pageSize=20&status=all
 * List promo codes with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '20', 10), 100)
    const status = (searchParams.get('status') ?? 'all') as PromoCodeStatus

    const promoCodeRepo = new PromoCodeRepository(supabaseServer)
    const { data, total } = await promoCodeRepo.findAllPaginated({
      page,
      pageSize,
      status
    })

    const response: PromoCodesListResponse = {
      data,
      total,
      page,
      pageSize
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la récupération des codes promo' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/promo-codes
 * Generate a new promo code
 */
export async function POST(request: NextRequest) {
  try {
    const body: GeneratePromoCodeRequest = await request.json()
    const { duration } = body

    if (!duration || !['1_month', '1_year'].includes(duration)) {
      return NextResponse.json(
        { error: 'Invalid duration', message: "La durée doit être '1_month' ou '1_year'" },
        { status: 400 }
      )
    }

    const promoCodeRepo = new PromoCodeRepository(supabaseServer)
    const newCode = await promoCodeRepo.generateUniquePromoCode(duration)

    return NextResponse.json({ data: newCode }, { status: 201 })
  } catch (error) {
    console.error('Error generating promo code:', error)

    // Check if it's a generation failure
    if (error instanceof Error && error.message.includes('Failed to generate')) {
      return NextResponse.json(
        { error: 'Generation failed', message: 'Impossible de générer un code unique. Réessayez.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la génération du code promo' },
      { status: 500 }
    )
  }
}
