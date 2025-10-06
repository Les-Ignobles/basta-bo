import type { TranslationText } from '@/lib/i18n'

export type PublicationState = 'draft' | 'published' | 'archived'

export type AdviceArticle = {
    id: number
    created_at: string
    title: TranslationText
    content: TranslationText
    is_featured: boolean
    publication_state: PublicationState
    category_id: number
    cover_url: string
}

export type AdviceArticleCategory = {
    id: number
    created_at: string
    title: TranslationText
    short_title: TranslationText
}

export type AdviceFaq = {
    id: number
    created_at: string
    question: TranslationText
    answer: TranslationText
}

// Types pour les formulaires
export type AdviceArticleFormValues = {
    id?: number
    title: TranslationText
    content: TranslationText
    is_featured: boolean
    publication_state: PublicationState
    category_id: number
    cover_url: string
}

export type AdviceArticleCategoryFormValues = {
    id?: number
    title: TranslationText
    short_title: TranslationText
}

export type AdviceFaqFormValues = {
    id?: number
    question: TranslationText
    answer: TranslationText
}