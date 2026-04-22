import { create } from 'zustand'
import type { ActiveUser } from '../types'

interface UserStoreState {
    users: ActiveUser[]
    loading: boolean
    error: string | null
    page: number
    pageSize: number
    total: number
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'

    fetchUsers: () => Promise<void>
    setPage: (page: number) => void
    setSearch: (search: string) => void
    setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
}

export const useUserStore = create<UserStoreState>((set, get) => ({
    users: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 50,
    total: 0,
    search: '',
    sortBy: 'last_session_at',
    sortOrder: 'desc',

    fetchUsers: async () => {
        set({ loading: true, error: null })
        try {
            const { page, pageSize, search, sortBy, sortOrder } = get()
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
                sortBy,
                sortOrder,
            })
            if (search) params.set('search', search)

            const res = await fetch(`/api/users?${params}`)
            const json = await res.json()
            set({ users: json.data, total: json.total })
        } catch {
            set({ error: 'Erreur lors du chargement des utilisateurs' })
        } finally {
            set({ loading: false })
        }
    },

    setPage: (page: number) => set({ page }),
    setSearch: (search: string) => set({ search, page: 1 }),
    setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => set({ sortBy, sortOrder, page: 1 }),
}))
