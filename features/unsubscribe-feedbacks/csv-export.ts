import { downloadCSV } from '@/features/statistics/utils/csv-export'
import { REASON_LABELS, FEEDBACK_OPTION_LABELS } from './types'
import type { UnsubscribeFeedback } from './types'

function escapeCSV(value: string | number): string {
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

export function exportUnsubscribeFeedbacksCSV(feedbacks: UnsubscribeFeedback[]) {
    const header = 'Date,Prenom,Email,User ID,Raison,Details,Texte libre'
    const rows = feedbacks.map((f) => {
        const date = new Date(f.created_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        const firstname = f.user_profile?.firstname ?? ''
        const email = f.user_profile?.email ?? ''
        const reason = REASON_LABELS[f.reason_slug] ?? f.reason_slug
        const options = f.feedback_options
            ? f.feedback_options.map((o) => FEEDBACK_OPTION_LABELS[o] ?? o).join(', ')
            : ''
        const text = f.feedback_text ?? ''

        return [date, firstname, email, f.user_profile_id, reason, options, text].map(escapeCSV).join(',')
    })

    const csv = [header, ...rows].join('\n')
    const dateStr = new Date().toISOString().split('T')[0]
    downloadCSV(csv, `retours-desabonnement-${dateStr}.csv`)
}
