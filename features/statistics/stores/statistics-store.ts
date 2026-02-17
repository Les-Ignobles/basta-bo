import { create } from 'zustand'
import type { OnboardingStats } from '../types/statistics.types'

interface StatisticsState {
  data: OnboardingStats | null
  isLoading: boolean
  error: string | null

  fetchOnboardingStats: () => Promise<void>
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchOnboardingStats: async () => {
    set({ isLoading: true, error: null })

    try {
      const res = await fetch('/api/statistics/onboarding')
      const json = await res.json()

      if (!res.ok) {
        set({
          isLoading: false,
          error: json.error || 'Erreur lors du chargement des statistiques',
        })
        return
      }

      set({ isLoading: false, data: json.data })
    } catch (error) {
      console.error('Error fetching statistics:', error)
      set({
        isLoading: false,
        error: 'Erreur lors du chargement des statistiques',
      })
    }
  },
}))
