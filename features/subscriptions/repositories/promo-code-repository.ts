import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from '@/lib/repositories/base-repository'
import type {
  PromoCode,
  PromoCodeWithLabel,
  CreatePromoCodeDto,
  PromoCodeStatus,
  PromoDuration
} from '../types'
import { generatePromoCode, getDurationLabel } from '../types'

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
   * Find all promo codes with pagination and filtering
   */
  async findAllPaginated(options: FindAllOptions = {}): Promise<FindAllResult> {
    const { page = 1, pageSize = 20, status = 'all' } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = this.client
      .from(this.table)
      .select('*', { count: 'exact' })

    // Apply status filter
    if (status === 'used') {
      query = query.not('used_at', 'is', null)
    } else if (status === 'unused') {
      query = query.is('used_at', null)
    }

    // Order by creation date (newest first) and apply pagination
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Add duration label to each promo code
    const dataWithLabel: PromoCodeWithLabel[] = (data ?? []).map((code: PromoCode) => ({
      ...code,
      duration_label: getDurationLabel(code.created_at, code.premium_end_at)
    }))

    return {
      data: dataWithLabel,
      total: count ?? 0
    }
  }

  /**
   * Create a promo code with the given DTO
   */
  async createPromoCode(dto: CreatePromoCodeDto): Promise<PromoCodeWithLabel> {
    const { data, error } = await this.client
      .from(this.table)
      .insert({
        code: dto.code,
        premium_end_at: dto.premium_end_at
      })
      .select('*')
      .single()

    if (error) throw error

    const promoCode = data as PromoCode
    return {
      ...promoCode,
      duration_label: getDurationLabel(promoCode.created_at, promoCode.premium_end_at)
    }
  }

  /**
   * Generate a unique promo code with retry logic for collision handling
   */
  async generateUniquePromoCode(duration: PromoDuration): Promise<PromoCodeWithLabel> {
    const maxRetries = 3
    const days = duration === '1_month' ? 30 : 365
    const premiumEndAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = generatePromoCode()

      try {
        return await this.createPromoCode({
          code,
          premium_end_at: premiumEndAt
        })
      } catch (error: unknown) {
        // Check if it's a unique constraint violation
        const pgError = error as { code?: string }
        if (pgError.code === '23505' && attempt < maxRetries - 1) {
          // Unique violation, retry with new code
          continue
        }
        throw error
      }
    }

    throw new Error('Failed to generate unique promo code after multiple attempts')
  }
}
