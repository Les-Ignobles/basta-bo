import { create } from 'zustand'
import { BatchCookingSession, BatchCookingSessionForm, BatchCookingSessionFilters } from '@/features/cooking/types/batch-cooking-session'

type BatchCookingSessionState = {
    // Données
    sessions: BatchCookingSession[]
    total: number
    page: number
    pageSize: number

    // États
    loading: boolean
    error: string | null

    // Filtres
    filters: BatchCookingSessionFilters

    // Actions
    setSessions: (sessions: BatchCookingSession[]) => void
    setTotal: (total: number) => void
    setPage: (page: number) => void
    setPageSize: (pageSize: number) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setFilters: (filters: Partial<BatchCookingSessionFilters>) => void
    clearFilters: () => void

    // Actions CRUD
    fetchSessions: () => Promise<void>
    createSession: (formData: BatchCookingSessionForm) => Promise<BatchCookingSession>
    updateSession: (id: number, formData: Partial<BatchCookingSessionForm>) => Promise<BatchCookingSession>
    deleteSession: (id: number) => Promise<void>
    markAsCooked: (id: number) => Promise<void>

    // Actions spécifiques
    fetchOriginalSessions: () => Promise<void>
    fetchChildrenByParentId: (parentId: number) => Promise<BatchCookingSession[]>
}

const initialState = {
    sessions: [],
    total: 0,
    page: 1,
    pageSize: 50,
    loading: false,
    error: null,
    filters: {
        is_original: true // Par défaut, on affiche les sessions originales
    }
}

export const useBatchCookingSessionStore = create<BatchCookingSessionState>((set, get) => ({
    ...initialState,

    setSessions: (sessions) => set({ sessions }),
    setTotal: (total) => set({ total }),
    setPage: (page) => set({ page }),
    setPageSize: (pageSize) => set({ pageSize }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
        page: 1 // Reset page when filters change
    })),

    clearFilters: () => set({
        filters: { is_original: true },
        page: 1
    }),

    fetchSessions: async () => {
        const { page, pageSize, filters } = get()
        set({ loading: true, error: null })

        try {
            const response = await fetch(`/api/batch-cooking-sessions?page=${page}&pageSize=${pageSize}&${new URLSearchParams(filters as any).toString()}`)

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const data = await response.json()
            set({
                sessions: data.data,
                total: data.total,
                loading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
        }
    },

    fetchOriginalSessions: async () => {
        const { page, pageSize, filters } = get()
        set({ loading: true, error: null })

        try {
            const response = await fetch(`/api/batch-cooking-sessions/original?page=${page}&pageSize=${pageSize}&${new URLSearchParams(filters as any).toString()}`)

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const data = await response.json()
            set({
                sessions: data.data,
                total: data.total,
                loading: false
            })
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
        }
    },

    createSession: async (formData) => {
        set({ loading: true, error: null })

        try {
            const response = await fetch('/api/batch-cooking-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const newSession = await response.json()
            set((state) => ({
                sessions: [newSession, ...state.sessions],
                total: state.total + 1,
                loading: false
            }))

            return newSession
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
            throw error
        }
    },

    updateSession: async (id, formData) => {
        set({ loading: true, error: null })

        try {
            const response = await fetch(`/api/batch-cooking-sessions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const updatedSession = await response.json()
            set((state) => ({
                sessions: state.sessions.map(session =>
                    session.id === id ? updatedSession : session
                ),
                loading: false
            }))

            return updatedSession
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
            throw error
        }
    },

    deleteSession: async (id) => {
        set({ loading: true, error: null })

        try {
            const response = await fetch(`/api/batch-cooking-sessions/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            set((state) => ({
                sessions: state.sessions.filter(session => session.id !== id),
                total: state.total - 1,
                loading: false
            }))
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
            throw error
        }
    },

    markAsCooked: async (id) => {
        set({ loading: true, error: null })

        try {
            const response = await fetch(`/api/batch-cooking-sessions/${id}/cooked`, {
                method: 'PATCH'
            })

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const updatedSession = await response.json()
            set((state) => ({
                sessions: state.sessions.map(session =>
                    session.id === id ? updatedSession : session
                ),
                loading: false
            }))
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                loading: false
            })
            throw error
        }
    },

    fetchChildrenByParentId: async (parentId) => {
        try {
            const response = await fetch(`/api/batch-cooking-sessions/${parentId}/children`)

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            })
            throw error
        }
    }
}))
