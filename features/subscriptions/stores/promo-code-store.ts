import { create } from 'zustand'
import type {
  PromoCodeWithLabel,
  PromoCodeStatus,
  PromoDuration
} from '../types'

interface PromoCodeState {
  // List state
  promoCodes: PromoCodeWithLabel[]
  total: number
  page: number
  pageSize: number
  status: PromoCodeStatus
  loading: boolean

  // Generate state
  generating: boolean
  newCode: PromoCodeWithLabel | null
  error: string | null

  // Actions
  fetchPromoCodes: () => Promise<void>
  setPage: (page: number) => void
  setFilter: (status: PromoCodeStatus) => void
  generateCode: (duration: PromoDuration) => Promise<boolean>
  copyToClipboard: (code: string) => Promise<boolean>
  clearNewCode: () => void
}

export const usePromoCodeStore = create<PromoCodeState>((set, get) => ({
  // Initial state
  promoCodes: [],
  total: 0,
  page: 1,
  pageSize: 20,
  status: 'all',
  loading: false,
  generating: false,
  newCode: null,
  error: null,

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
        set({
          loading: false,
          error: json.message || 'Erreur lors du chargement'
        })
        return
      }

      set({
        loading: false,
        promoCodes: json.data,
        total: json.total
      })
    } catch (error) {
      console.error('Error fetching promo codes:', error)
      set({
        loading: false,
        error: 'Erreur lors du chargement des codes promo'
      })
    }
  },

  setPage: (page: number) => {
    set({ page })
    get().fetchPromoCodes()
  },

  setFilter: (status: PromoCodeStatus) => {
    set({ status, page: 1 })
    get().fetchPromoCodes()
  },

  generateCode: async (duration: PromoDuration) => {
    set({ generating: true, error: null, newCode: null })

    try {
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration })
      })

      const json = await res.json()

      if (!res.ok) {
        set({
          generating: false,
          error: json.message || 'Erreur lors de la génération'
        })
        return false
      }

      set({
        generating: false,
        newCode: json.data
      })

      // Refresh the list
      get().fetchPromoCodes()
      return true
    } catch (error) {
      console.error('Error generating promo code:', error)
      set({
        generating: false,
        error: 'Erreur lors de la génération du code promo'
      })
      return false
    }
  },

  copyToClipboard: async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      return true
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      return false
    }
  },

  clearNewCode: () => {
    set({ newCode: null })
  }
}))
