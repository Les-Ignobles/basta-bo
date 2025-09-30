import { BaseRepository } from '@/lib/repositories/base-repository'
import type { Ingredient } from '@/features/cooking/types'

export class IngredientRepository extends BaseRepository<Ingredient> {
    constructor(client: any) {
        super(client, 'ingredients')
    }

    async findPage({ search, page, pageSize, noImage, categories, translationFilter }: { search?: string; page: number; pageSize: number; noImage?: boolean; categories?: number[]; translationFilter?: 'incomplete' | 'complete' }): Promise<{ data: Ingredient[]; total: number }> {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        let query = (this.client as any).from(this.table).select('*', { count: 'exact' })
        if (search && search.trim()) {
            // Recherche sur le nom FR (ajuster au besoin pour d’autres langues)
            query = query.ilike('name->>fr', `%${search}%`)
        }
        if (noImage) {
            query = query.is('img_path', null)
        }
        if (categories && categories.length > 0) {
            query = query.in('category_id', categories)
        }

        // Note: Le filtrage par traduction se fait côté client car il nécessite
        // de calculer le pourcentage pour chaque ingrédient
        query = query.order('name->>fr', { ascending: true })
        const { data, error, count } = await query.range(from, to)
        if (error) throw error

        let filteredData = (data ?? []) as Ingredient[]

        // Appliquer le filtre de traduction côté client
        if (translationFilter) {
            filteredData = filteredData.filter(ingredient => {
                const supportedLanguages = ['en', 'es']
                const fields = ['name', 'suffix_singular', 'suffix_plural']

                let totalFields = 0
                let translatedFields = 0

                for (const lang of supportedLanguages) {
                    for (const field of fields) {
                        totalFields++
                        const fieldValue = ingredient[field as keyof Ingredient] as any
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
        // Sinon, on utilise le count de Supabase
        let actualTotal = count || 0
        
        if (translationFilter) {
            // Pour le filtre de traduction, on doit compter tous les ingrédients qui matchent
            // On fait une requête séparée pour compter le total
            let countQuery = (this.client as any).from(this.table).select('*', { count: 'exact' })
            if (search && search.trim()) {
                countQuery = countQuery.ilike('name->>fr', `%${search}%`)
            }
            if (noImage) {
                countQuery = countQuery.is('img_path', null)
            }
            if (categories && categories.length > 0) {
                countQuery = countQuery.in('category_id', categories)
            }
            
            const { data: allData, count: allCount } = await countQuery
            const allIngredients = (allData ?? []) as Ingredient[]
            
            // Appliquer le même filtre de traduction
            const filteredAllData = allIngredients.filter(ingredient => {
                const supportedLanguages = ['en', 'es']
                const fields = ['name', 'suffix_singular', 'suffix_plural']

                let totalFields = 0
                let translatedFields = 0

                for (const lang of supportedLanguages) {
                    for (const field of fields) {
                        totalFields++
                        const fieldValue = ingredient[field as keyof Ingredient] as any
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


