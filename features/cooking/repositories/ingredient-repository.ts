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
            const searchTerm = search.trim()
            // Vérifier si la recherche est un nombre (ID)
            if (/^\d+$/.test(searchTerm)) {
                // Recherche par ID
                query = query.eq('id', parseInt(searchTerm))
            } else {
                // Recherche sur le nom FR (ajuster au besoin pour d'autres langues)
                query = query.ilike('name->>fr', `%${searchTerm}%`)
            }
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
                const searchTerm = search.trim()
                // Vérifier si la recherche est un nombre (ID)
                if (/^\d+$/.test(searchTerm)) {
                    // Recherche par ID
                    countQuery = countQuery.eq('id', parseInt(searchTerm))
                } else {
                    // Recherche sur le nom FR (ajuster au besoin pour d'autres langues)
                    countQuery = countQuery.ilike('name->>fr', `%${searchTerm}%`)
                }
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

    async findAdjacentIngredients(
        currentId: number,
        filters?: {
            search?: string
            noImage?: boolean
            categories?: number[]
            translationFilter?: 'incomplete' | 'complete'
        }
    ): Promise<{ previous: number | null; next: number | null }> {
        // Réutiliser la logique de filtrage existante en récupérant tous les ingrédients
        const { data: allIngredients } = await this.findPage({
            search: filters?.search,
            page: 1,
            pageSize: 10000, // Récupérer tous les ingrédients (limite raisonnable)
            noImage: filters?.noImage,
            categories: filters?.categories,
            translationFilter: filters?.translationFilter
        })

        // Les ingrédients sont déjà triés par nom (ordre alphabétique) par findPage
        const currentIndex = allIngredients.findIndex(i => i.id === currentId)

        // Si l'ingrédient actuel n'est pas dans la liste filtrée, pas de navigation
        if (currentIndex === -1) {
            return { previous: null, next: null }
        }

        return {
            previous: currentIndex > 0 ? allIngredients[currentIndex - 1].id : null,
            next: currentIndex < allIngredients.length - 1 ? allIngredients[currentIndex + 1].id : null
        }
    }
}


