import { BaseRepository } from '@/lib/repositories/base-repository'
import type { AdviceArticleCategory } from '@/features/advice/types'

export class AdviceArticleCategoryRepository extends BaseRepository<AdviceArticleCategory> {
    constructor(client: any) {
        super(client, 'advice_article_categories')
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
    }): Promise<{ data: AdviceArticleCategory[]; total: number }> {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        let query = (this.client as any).from(this.table).select('*', { count: 'exact' })

        if (search && search.trim()) {
            const searchTerm = search.trim()
            // Vérifier si la recherche est un nombre (ID)
            if (/^\d+$/.test(searchTerm)) {
                query = query.eq('id', parseInt(searchTerm))
            } else {
                // Recherche sur le titre FR
                query = query.ilike('title->>fr', `%${searchTerm}%`)
            }
        }

        query = query.order('title->>fr', { ascending: true })
        const { data, error, count } = await query.range(from, to)
        if (error) throw error

        let filteredData = (data ?? []) as AdviceArticleCategory[]

        // Appliquer le filtre de traduction côté client
        if (translationFilter) {
            filteredData = filteredData.filter(category => {
                const supportedLanguages = ['en', 'es']
                const fields = ['title']

                let totalFields = 0
                let translatedFields = 0

                for (const lang of supportedLanguages) {
                    for (const field of fields) {
                        totalFields++
                        const fieldValue = category[field as keyof AdviceArticleCategory] as any
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
                    countQuery = countQuery.ilike('title->>fr', `%${searchTerm}%`)
                }
            }

            const { data: allData } = await countQuery
            const allCategories = (allData ?? []) as AdviceArticleCategory[]

            // Appliquer le même filtre de traduction
            const filteredAllData = allCategories.filter(category => {
                const supportedLanguages = ['en', 'es']
                const fields = ['title']

                let totalFields = 0
                let translatedFields = 0

                for (const lang of supportedLanguages) {
                    for (const field of fields) {
                        totalFields++
                        const fieldValue = category[field as keyof AdviceArticleCategory] as any
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
