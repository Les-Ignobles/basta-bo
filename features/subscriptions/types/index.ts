// Types for Subscription Admin feature

import type { RoleScope } from '@/lib/types/auth'

// ============================================================================
// Entities
// ============================================================================

export interface UserProfile {
  id: number
  uuid: string
  email: string | null
  firstname: string | null
  avatar: string | null
  premium_sub_end_at: string | null
  is_admin: boolean
  role_scopes: RoleScope[]
}

export interface AuthUser {
  id: string
  email: string | null
  created_at: string
}

export interface PromoCode {
  id: number
  created_at: string
  code: string
  /** Mode date fixe (v1) : fin de premium absolue. Null pour un code à durée. */
  premium_end_at: string | null
  used_at: string | null
  // ─── v2 : codes universels ───
  label: string | null
  /** Mode durée relative : X jours de premium à partir de l'activation. */
  duration_days: number | null
  /** Quota d'utilisations (null = illimité). */
  max_uses: number | null
  uses_count: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  only_never_subscribed: boolean
}

export interface PromoCodeWithLabel extends PromoCode {
  duration_label: string
}

export interface PromoCodeRedemption {
  id: number
  redeemed_at: string
  premium_end_at: string
  user_profile_id: number
  user_email: string | null
  user_firstname: string | null
}

/** Statut calculé d'un code v2 (ordre de priorité : inactif > expiré > épuisé > actif). */
export type PromoCodeComputedStatus = 'active' | 'exhausted' | 'expired' | 'inactive'

export function computePromoCodeStatus(code: PromoCode): PromoCodeComputedStatus {
  if (!code.is_active) return 'inactive'
  const now = Date.now()
  if (code.valid_until && new Date(code.valid_until).getTime() < now) return 'expired'
  if (code.duration_days == null && code.premium_end_at && new Date(code.premium_end_at).getTime() < now) {
    return 'expired'
  }
  if (code.max_uses != null && code.uses_count >= code.max_uses) return 'exhausted'
  return 'active'
}

export interface SubscriptionAuditLog {
  id: number
  created_at: string
  admin_id: string
  admin_email: string
  user_id: string
  user_email: string
  previous_end_date: string | null
  new_end_date: string
  action_type: ActionType
}

// ============================================================================
// Enums & Types
// ============================================================================

export type ActionType = 'add_1_month' | 'add_1_year' | 'custom_date'

export type PromoDuration = '1_month' | '1_year'

export type PromoCodeStatus = 'all' | 'active' | 'exhausted' | 'expired' | 'inactive'

// ============================================================================
// DTOs - Create
// ============================================================================

export interface CreatePromoCodeDto {
  code: string
  premium_end_at: string
}

export interface CreatePromoCodeV2Dto {
  code: string
  label: string | null
  duration_days: number | null
  premium_end_at: string | null
  max_uses: number | null
  valid_from: string | null
  valid_until: string | null
  only_never_subscribed: boolean
}

export interface CreateSubscriptionAuditLogDto {
  admin_id: string
  admin_email: string
  user_id: string
  user_email: string
  previous_end_date: string | null
  new_end_date: string
  action_type: ActionType
}

export interface CreateMinimalProfileDto {
  uuid: string
  email: string | null
}

// ============================================================================
// DTOs - Update
// ============================================================================

export interface UpdateSubscriptionDto {
  premium_sub_end_at: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface SearchUserResponse {
  authUser: AuthUser
  userProfile: UserProfile | null
  canCreateProfile?: boolean
}

export interface UpdateSubscriptionRequest {
  userId: string
  action: ActionType
  customDate?: string
}

export interface UpdateSubscriptionResponse {
  userProfile: UserProfile
  previousEndDate: string | null
  newEndDate: string
  auditLogId: number
}

export interface GeneratePromoCodeRequest {
  duration: PromoDuration
}

export interface PromoCodesListResponse {
  data: PromoCodeWithLabel[]
  total: number
  page: number
  pageSize: number
}

// ============================================================================
// Utility Functions
// ============================================================================

export function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function calculateNewEndDate(
  currentEndDate: string | null,
  duration: PromoDuration
): Date {
  const now = new Date()
  const current = currentEndDate ? new Date(currentEndDate) : null
  const baseDate = current && current > now ? current : now

  const days = duration === '1_month' ? 30 : 365
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
}

export function getDurationLabel(createdAt: string, premiumEndAt: string): string {
  const created = new Date(createdAt)
  const end = new Date(premiumEndAt)
  const diffDays = Math.round((end.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays < 35 ? '1 mois' : '1 an'
}

/** « 30 jours » pour un code à durée, « jusqu'au 12/10/2026 » pour une date fixe. */
export function promoDurationLabel(code: PromoCode): string {
  if (code.duration_days != null) {
    return `${code.duration_days} jour${code.duration_days > 1 ? 's' : ''}`
  }
  if (code.premium_end_at) {
    return `jusqu'au ${new Date(code.premium_end_at).toLocaleDateString('fr-FR')}`
  }
  return '—'
}

export function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
