import { BaseRepository } from '@/lib/repositories/base-repository'
import type { AdviceArticle } from '@/features/advice/types'

export class AdviceArticleRepository extends BaseRepository<AdviceArticle> {
    constructor(client: any) {
        super(client, 'advice_articles')
    }

    async findPage({
        search,
        page,
        pageSize,
        categoryId,
        publicationState,
        isFeatured,
        translationFilter
    }: {
        search?: string
        page: number
        pageSize: number
        categoryId?: number
        publicationState?: string
        isFeatured?: boolean
        translationFilter?: 'incomplete' | 'complete'
    }): Promise<{ data: AdviceArticle[]; total: number }> {
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

        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        if (publicationState) {
            query = query.eq('publication_state', publicationState)
        }

        if (isFeatured !== undefined) {
            query = query.eq('is_featured', isFeatured)
        }

        query = query.order('created_at', { ascending: false })
        const { data, error, count } = await query.range(from, to)
        if (error) throw error

        let filteredData = (data ?? []) as AdviceArticle[]

        // Appliquer le filtre de traduction côté client
        if (translationFilter) {
            filteredData = filteredData.filter(article => {
                const supportedLanguages = ['en', 'es']
                const fields = ['title', 'content']

                let totalFields = 0
                let translatedFields = 0

                for (const lang of supportedLanguages) {
                    for (const field of fields) {
                        totalFields++
                        const fieldValue = article[field as keyof AdviceArticle] as any
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
            if (categoryId) {
                countQuery = countQuery.eq('category_id', categoryId)
            }
            if (publicationState) {
                countQuery = countQuery.eq('publication_state', publicationState)
            }
            if (isFeatured !== undefined) {
                countQuery = countQuery.eq('is_featured', isFeatured)
            }

            const { data: allData } = await countQuery
            const allArticles = (allData ?? []) as AdviceArticle[]

            // Appliquer le même filtre de traduction
            const filteredAllData = allArticles.filter(article => {
                const supportedLanguages = ['en', 'es']
                const fields = ['title', 'content']

                let totalFields = 0
                let translatedFields = 0

                for (const lang of supportedLanguages) {
                    for (const field of fields) {
                        totalFields++
                        const fieldValue = article[field as keyof AdviceArticle] as any
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
