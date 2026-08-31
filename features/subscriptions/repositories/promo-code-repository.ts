import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from '@/lib/repositories/base-repository'
import type {
  PromoCode,
  PromoCodeWithLabel,
  PromoCodeRedemption,
  CreatePromoCodeV2Dto,
  PromoCodeStatus
} from '../types'
import { promoDurationLabel, computePromoCodeStatus } from '../types'

interface FindAllOptions {
  page?: number
  pageSize?: number
  status?: PromoCodeStatus
}

interface FindAllResult {
  data: PromoCodeWithLabel[]
  total: number
}

export class PromoCodeRepository extends BaseRepository<PromoCode> {
  constructor(client: SupabaseClient) {
    super(client, 'promo_codes')
  }

  /**
   * Liste paginée. Le statut (actif/épuisé/expiré/inactif) est CALCULÉ
   * (croisement de plusieurs colonnes) : le filtre s'applique en mémoire sur
   * la page courante élargie — volumes faibles (codes marketing), pagination
   * SQL conservée pour le cas « tous ».
   */
  async findAllPaginated(options: FindAllOptions = {}): Promise<FindAllResult> {
    const { page = 1, pageSize = 20, status = 'all' } = options

    if (status === 'all') {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, count, error } = await this.client
        .from(this.table)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error
      return { data: this.withLabels(data ?? []), total: count ?? 0 }
    }

    // Filtre par statut calculé : on charge tout (petit volume) puis on filtre.
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    const filtered = (data ?? []).filter(
      (code: PromoCode) => computePromoCodeStatus(code) === status
    )
    const from = (page - 1) * pageSize
    return {
      data: this.withLabels(filtered.slice(from, from + pageSize)),
      total: filtered.length
    }
  }

  private withLabels(codes: PromoCode[]): PromoCodeWithLabel[] {
    return codes.map((code) => ({
      ...code,
      duration_label: promoDurationLabel(code)
    }))
  }

  async createPromoCode(dto: CreatePromoCodeV2Dto): Promise<PromoCodeWithLabel> {
    const { data, error } = await this.client
      .from(this.table)
      .insert({
        code: dto.code,
        label: dto.label,
        duration_days: dto.duration_days,
        premium_end_at: dto.premium_end_at,
        max_uses: dto.max_uses,
        valid_from: dto.valid_from,
        valid_until: dto.valid_until,
        only_never_subscribed: dto.only_never_subscribed
      })
      .select('*')
      .single()

    if (error) throw error
    const promoCode = data as PromoCode
    return { ...promoCode, duration_label: promoDurationLabel(promoCode) }
  }

  async setActive(id: number, isActive: boolean): Promise<void> {
    const { error } = await this.client
      .from(this.table)
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error
  }

  /** Activations d'un code, avec l'email/prénom du profil quand disponible. */
  async findRedemptions(promoCodeId: number): Promise<PromoCodeRedemption[]> {
    const { data, error } = await this.client
      .from('promo_code_redemptions')
      .select('id, redeemed_at, premium_end_at, user_profile_id, user_profiles(email, firstname)')
      .eq('promo_code_id', promoCodeId)
      .order('redeemed_at', { ascending: false })
    if (error) throw error

    return (data ?? []).map((row) => {
      const profile = row.user_profiles as { email?: string | null; firstname?: string | null } | null
      return {
        id: row.id as number,
        redeemed_at: row.redeemed_at as string,
        premium_end_at: row.premium_end_at as string,
        user_profile_id: row.user_profile_id as number,
        user_email: profile?.email ?? null,
        user_firstname: profile?.firstname ?? null
      }
    })
  }
}
