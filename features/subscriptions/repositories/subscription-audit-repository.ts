import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository } from '@/lib/repositories/base-repository'
import type { SubscriptionAuditLog, CreateSubscriptionAuditLogDto } from '../types'

export class SubscriptionAuditRepository extends BaseRepository<SubscriptionAuditLog> {
  constructor(client: SupabaseClient) {
    super(client, 'subscription_audit_logs')
  }

  /**
   * Create a new audit log entry
   */
  async createAuditLog(dto: CreateSubscriptionAuditLogDto): Promise<SubscriptionAuditLog> {
    const { data, error } = await this.client
      .from(this.table)
      .insert({
        admin_id: dto.admin_id,
        admin_email: dto.admin_email,
        user_id: dto.user_id,
        user_email: dto.user_email,
        previous_end_date: dto.previous_end_date,
        new_end_date: dto.new_end_date,
        action_type: dto.action_type
      })
      .select('*')
      .single()

    if (error) throw error
    return data as SubscriptionAuditLog
  }

  /**
   * Find all audit logs for a specific user, ordered by date descending
   */
  async findByUserId(userId: string): Promise<SubscriptionAuditLog[]> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as SubscriptionAuditLog[]
  }
}
