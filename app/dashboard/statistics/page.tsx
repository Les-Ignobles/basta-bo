'use client'

import { useEffect } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { useStatisticsStore } from '@/features/statistics/stores/statistics-store'
import { StatisticsKpiCards } from '@/features/statistics/components/statistics-kpi-cards'
import { StatisticsOnboardingCharts } from '@/features/statistics/components/statistics-onboarding-charts'
import { CsvExportButton } from '@/features/statistics/components/csv-export-button'

export default function StatisticsPage() {
  const { data, isLoading, error, fetchOnboardingStats } = useStatisticsStore()

  useEffect(() => {
    fetchOnboardingStats()
  }, [fetchOnboardingStats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Chargement des statistiques...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-6" />
          <h1 className="text-2xl font-semibold">Statistiques</h1>
        </div>
        <CsvExportButton />
      </div>

      {/* KPI Cards */}
      <StatisticsKpiCards kpis={data.kpis} />

      {/* Onboarding Charts */}
      <StatisticsOnboardingCharts stats={data} />
    </div>
  )
}
