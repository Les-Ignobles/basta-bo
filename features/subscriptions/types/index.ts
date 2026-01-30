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
  premium_end_at: string
  used_at: string | null
}

export interface PromoCodeWithLabel extends PromoCode {
  duration_label: string
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

export type PromoCodeStatus = 'all' | 'used' | 'unused'

// ============================================================================
// DTOs - Create
// ============================================================================

export interface CreatePromoCodeDto {
  code: string
  premium_end_at: string
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

export function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
