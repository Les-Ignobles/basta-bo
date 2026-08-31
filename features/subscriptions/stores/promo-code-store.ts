import { create } from 'zustand'
import type {
  PromoCodeWithLabel,
  PromoCodeRedemption,
  PromoCodeStatus,
  CreatePromoCodeV2Dto
} from '../types'

interface PromoCodeState {
  // List state
  promoCodes: PromoCodeWithLabel[]
  total: number
  page: number
  pageSize: number
  status: PromoCodeStatus
  loading: boolean

  // Create state
  creating: boolean
  newCode: PromoCodeWithLabel | null
  error: string | null

  // Detail state (activations d'un code)
  redemptions: PromoCodeRedemption[]
  redemptionsLoading: boolean

  // Actions
  fetchPromoCodes: () => Promise<void>
  setPage: (page: number) => void
  setFilter: (status: PromoCodeStatus) => void
  createCode: (dto: Partial<CreatePromoCodeV2Dto>) => Promise<boolean>
  toggleActive: (id: number, isActive: boolean) => Promise<void>
  fetchRedemptions: (id: number) => Promise<void>
  copyToClipboard: (code: string) => Promise<boolean>
  clearNewCode: () => void
}

export const usePromoCodeStore = create<PromoCodeState>((set, get) => ({
  promoCodes: [],
  total: 0,
  page: 1,
  pageSize: 20,
  status: 'all',
  loading: false,
  creating: false,
  newCode: null,
  error: null,
  redemptions: [],
  redemptionsLoading: false,

  fetchPromoCodes: async () => {
    const { page, pageSize, status } = get()
    set({ loading: true, error: null })

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        status
      })
      const res = await fetch(`/api/promo-codes?${params}`)
      const json = await res.json()

      if (!res.ok) {
        set({ loading: false, error: json.message || 'Erreur lors du chargement' })
        return
      }
      set({ promoCodes: json.data, total: json.total, loading: false })
    } catch {
      set({ loading: false, error: 'Erreur lors du chargement' })
    }
  },

  setPage: (page) => {
    set({ page })
    get().fetchPromoCodes()
  },

  setFilter: (status) => {
    set({ status, page: 1 })
    get().fetchPromoCodes()
  },

  createCode: async (dto) => {
    set({ creating: true, error: null, newCode: null })
    try {
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      })
      const json = await res.json()

      if (!res.ok) {
        set({ creating: false, error: json.message || 'Erreur lors de la création' })
        return false
      }
      set({ creating: false, newCode: json })
      get().fetchPromoCodes()
      return true
    } catch {
      set({ creating: false, error: 'Erreur lors de la création' })
      return false
    }
  },

  toggleActive: async (id, isActive) => {
    try {
      const res = await fetch(`/api/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive })
      })
      if (res.ok) {
        set({
          promoCodes: get().promoCodes.map((c) =>
            c.id === id ? { ...c, is_active: isActive } : c
          )
        })
      }
    } catch {
      // silencieux : l'état visuel reste inchangé en cas d'échec
    }
  },

  fetchRedemptions: async (id) => {
    set({ redemptionsLoading: true, redemptions: [] })
    try {
      const res = await fetch(`/api/promo-codes/${id}/redemptions`)
      const json = await res.json()
      set({ redemptions: res.ok ? json.data : [], redemptionsLoading: false })
    } catch {
      set({ redemptions: [], redemptionsLoading: false })
    }
  },

  copyToClipboard: async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      return true
    } catch {
      return false
    }
  },

  clearNewCode: () => set({ newCode: null })
}))
