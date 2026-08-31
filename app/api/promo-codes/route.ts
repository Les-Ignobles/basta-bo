import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { PromoCodeRepository } from '@/features/subscriptions/repositories/promo-code-repository'
import { generatePromoCode } from '@/features/subscriptions/types'
import type {
  CreatePromoCodeV2Dto,
  PromoCodesListResponse,
  PromoCodeStatus
} from '@/features/subscriptions/types'

/**
 * GET /api/promo-codes?page=1&pageSize=20&status=all
 * Liste paginée, filtre par statut calculé (active/exhausted/expired/inactive).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '20', 10), 100)
    const status = (searchParams.get('status') ?? 'all') as PromoCodeStatus

    const promoCodeRepo = new PromoCodeRepository(supabaseServer)
    const { data, total } = await promoCodeRepo.findAllPaginated({ page, pageSize, status })

    const response: PromoCodesListResponse = { data, total, page, pageSize }
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
 * Crée un code v2 : universel (quota), durée relative OU date fixe, fenêtre
 * de validité, option « jamais abonnés ». Sans code fourni → génération auto.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreatePromoCodeV2Dto>

    const code = (body.code ?? '').trim().toUpperCase() || generatePromoCode()
    if (!/^[A-Z0-9_-]{4,32}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code', message: 'Le code doit faire 4 à 32 caractères (lettres, chiffres, - ou _)' },
        { status: 400 }
      )
    }

    const durationDays = body.duration_days ?? null
    const premiumEndAt = body.premium_end_at ?? null
    if (durationDays == null && premiumEndAt == null) {
      return NextResponse.json(
        { error: 'Invalid duration', message: 'Renseignez une durée en jours ou une date de fin fixe' },
        { status: 400 }
      )
    }
    if (durationDays != null && (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650)) {
      return NextResponse.json(
        { error: 'Invalid duration', message: 'La durée doit être un nombre de jours entre 1 et 3650' },
        { status: 400 }
      )
    }
    const maxUses = body.max_uses ?? null
    if (maxUses != null && (!Number.isInteger(maxUses) || maxUses < 1)) {
      return NextResponse.json(
        { error: 'Invalid quota', message: 'Le quota doit être un entier positif (ou vide pour illimité)' },
        { status: 400 }
      )
    }

    const promoCodeRepo = new PromoCodeRepository(supabaseServer)
    const created = await promoCodeRepo.createPromoCode({
      code,
      label: body.label?.trim() || null,
      duration_days: durationDays,
      premium_end_at: premiumEndAt,
      max_uses: maxUses,
      valid_from: body.valid_from ?? null,
      valid_until: body.valid_until ?? null,
      only_never_subscribed: body.only_never_subscribed ?? false
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: unknown) {
    const pgError = error as { code?: string }
    if (pgError.code === '23505') {
      return NextResponse.json(
        { error: 'Duplicate code', message: 'Ce code existe déjà' },
        { status: 409 }
      )
    }
    console.error('Error creating promo code:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Erreur lors de la création du code promo' },
      { status: 500 }
    )
  }
}
