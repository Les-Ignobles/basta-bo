import type { TranslationText } from '@/lib/i18n'

export interface Diet {
    id: number
    created_at: string
    title: TranslationText
    description?: TranslationText
    emoji: string
    slug: string
    order: number
    is_all: boolean
    bit_index: number
}

export interface DietFormValues extends Omit<Diet, 'id' | 'created_at'> {
    id?: number
}

