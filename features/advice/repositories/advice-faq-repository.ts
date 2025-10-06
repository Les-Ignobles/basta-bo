import { BaseRepository } from '@/lib/repositories/base-repository'
import type { AdviceFaq } from '@/features/advice/types'

export class AdviceFaqRepository extends BaseRepository<AdviceFaq> {
    constructor(client: any) {
        super(client, 'advice_faq')
    }

    async findPage({
        search,
        page,
        pageSize,
        translationFilter
    }: {
        search?: string
        page: number
        pageSize: number
        translationFilter?: 'incomplete' | 'complete'
    }): Promise<{ data: AdviceFaq[]; total: number }> {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        let query = (this.client as any).from(this.table).select('*', { count: 'exact' })

        if (search && search.trim()) {
            const searchTerm = search.trim()
            // Vérifier si la recherche est un nombre (ID)
            if (/^\d+$/.test(searchTerm)) {
                query = query.eq('id', parseInt(searchTerm))
            } else {
                // Recherche sur la question FR
                query = query.ilike('question->>fr', `%${searchTerm}%`)
            }
        }

        query = query.order('created_at', { ascending: false })
        const { data, error, count } = await query.range(from, to)
        if (error) throw error

        let filteredData = (data ?? []) as AdviceFaq[]

        // Appliquer le filtre de traduction côté client
        if (translationFilter) {
            filteredData = filteredData.filter(faq => {
                const supportedLanguages = ['en', 'es']
                const fields = ['question', 'answer']

                let totalFields = 0
                let translatedFields = 0

                for (const lang of supportedLanguages) {
                    for (const field of fields) {
                        totalFields++
                        const fieldValue = faq[field as keyof AdviceFaq] as any
                        if (fieldValue?.[lang] && fieldValue[lang].trim().length > 0) {
                            translatedFields++
                        }
                    }
                }

                const progress = totalFields > 0 ? (translatedFields / totalFields) * 100 : 0

                if (translationFilter === 'complete') {
                    return progress === 100
                } else if (translationFilter === 'incomplete') {
                    return progress < 100
                }

                return true
            })
        }

        // Si on a un filtre de traduction, on doit compter le total après filtrage
        let actualTotal = count || 0

        if (translationFilter) {
            // Pour le filtre de traduction, on fait une requête séparée pour compter le total
            let countQuery = (this.client as any).from(this.table).select('*', { count: 'exact' })
            if (search && search.trim()) {
                const searchTerm = search.trim()
                if (/^\d+$/.test(searchTerm)) {
                    countQuery = countQuery.eq('id', parseInt(searchTerm))
                } else {
                    countQuery = countQuery.ilike('question->>fr', `%${searchTerm}%`)
                }
            }

            const { data: allData } = await countQuery
            const allFaqs = (allData ?? []) as AdviceFaq[]

            // Appliquer le même filtre de traduction
            const filteredAllData = allFaqs.filter(faq => {
                const supportedLanguages = ['en', 'es']
                const fields = ['question', 'answer']

                let totalFields = 0
                let translatedFields = 0

                for (const lang of supportedLanguages) {
                    for (const field of fields) {
                        totalFields++
                        const fieldValue = faq[field as keyof AdviceFaq] as any
                        if (fieldValue?.[lang] && fieldValue[lang].trim().length > 0) {
                            translatedFields++
                        }
                    }
                }

                const progress = totalFields > 0 ? (translatedFields / totalFields) * 100 : 0

                if (translationFilter === 'complete') {
                    return progress === 100
                } else if (translationFilter === 'incomplete') {
                    return progress < 100
                }

                return true
            })

            actualTotal = filteredAllData.length
        }

        return { data: filteredData, total: actualTotal }
    }
}
