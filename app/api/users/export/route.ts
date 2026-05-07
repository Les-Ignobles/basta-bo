import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import { UserRepository } from '@/features/users/repositories/user-repository'
import type { PremiumFilter, UserExportFilters } from '@/features/users/types'

function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

function isPremiumActive(premiumSubEndAt: string | null): boolean {
    if (!premiumSubEndAt) return false
    return new Date(premiumSubEndAt) > new Date()
}

export async function GET(req: NextRequest) {
    try {
        const repo = new UserRepository(supabaseServer)
        const { searchParams } = new URL(req.url)

        const premiumParam = searchParams.get('premium') as PremiumFilter | null
        const minSessionsParam = searchParams.get('minSessions')

        const filters: UserExportFilters = {
            registeredFrom: searchParams.get('registeredFrom') ?? undefined,
            registeredTo: searchParams.get('registeredTo') ?? undefined,
            lastSessionFrom: searchParams.get('lastSessionFrom') ?? undefined,
            lastSessionTo: searchParams.get('lastSessionTo') ?? undefined,
            premium: premiumParam && ['all', 'premium', 'non_premium'].includes(premiumParam) ? premiumParam : 'all',
            minSessions: minSessionsParam && !isNaN(Number(minSessionsParam)) ? Number(minSessionsParam) : undefined,
            hasEmail: searchParams.get('hasEmail') === 'true',
        }

        const users = await repo.exportUsers(filters)

        const header = 'ID,Prenom,Email,Inscrit le,Premium,Premium fin,Sessions,Derniere session'
        const rows = users.map((u) => {
            const registered = new Date(u.registered_at).toISOString().split('T')[0]
            const last = new Date(u.last_session_at).toISOString().split('T')[0]
            const premium = isPremiumActive(u.premium_sub_end_at) ? 'oui' : 'non'
            const premiumEnd = u.premium_sub_end_at ? new Date(u.premium_sub_end_at).toISOString().split('T')[0] : ''
            return [u.id, u.firstname ?? '', u.email ?? '', registered, premium, premiumEnd, u.session_count, last]
                .map(escapeCSV)
                .join(',')
        })

        const csv = '﻿' + [header, ...rows].join('\n')
        const dateStr = new Date().toISOString().split('T')[0]

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="utilisateurs-${dateStr}.csv"`,
            },
        })
    } catch (error) {
        console.error('Error exporting users:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
