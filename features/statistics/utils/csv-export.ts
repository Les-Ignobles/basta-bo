import type { OnboardingStats } from '../types/statistics.types'

function escapeCSV(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function generateOnboardingCSV(stats: OnboardingStats): string {
  const lines: string[] = []

  // KPIs section
  lines.push('=== KPIs ===')
  lines.push('Metrique,Valeur')
  lines.push(`Utilisateurs totaux,${stats.kpis.totalUsers}`)
  lines.push(`Utilisateurs premium,${stats.kpis.premiumUsers}`)
  lines.push(`Pourcentage premium,${stats.kpis.premiumPercentage}%`)
  lines.push(`Taille moyenne du foyer,${stats.kpis.avgHouseholdSize}`)
  lines.push(`Sessions BC moyennes,${stats.kpis.avgSessionCount}`)
  lines.push('')

  // Registrations
  lines.push('=== Inscriptions par mois ===')
  lines.push('Mois,Inscriptions')
  stats.registrationsByMonth.forEach((r) => {
    lines.push(`${escapeCSV(r.month)},${r.count}`)
  })
  lines.push('')

  // Diets
  lines.push('=== Regimes alimentaires ===')
  lines.push('Regime,Nombre')
  stats.dietDistribution.forEach((d) => {
    lines.push(`${escapeCSV(d.label)},${d.count}`)
  })
  lines.push('')

  // Allergies
  lines.push('=== Allergies ===')
  lines.push('Allergie,Nombre')
  stats.allergyDistribution.forEach((a) => {
    lines.push(`${escapeCSV(a.label)},${a.count}`)
  })
  lines.push('')

  // Equipment
  lines.push('=== Equipement cuisine ===')
  lines.push('Equipement,Nombre')
  stats.equipmentDistribution.forEach((e) => {
    lines.push(`${escapeCSV(e.label)},${e.count}`)
  })
  lines.push('')

  // Frequency
  lines.push('=== Frequence batch cooking ===')
  lines.push('Frequence,Nombre')
  stats.frequencyDistribution.forEach((f) => {
    lines.push(`${escapeCSV(f.label)},${f.count}`)
  })
  lines.push('')

  // Household size
  lines.push('=== Nombre de personnes par foyer ===')
  lines.push('Personnes,Nombre')
  stats.householdSizeDistribution.forEach((h) => {
    lines.push(`${h.size},${h.count}`)
  })
  lines.push('')

  // Appetite
  lines.push('=== Appetit ===')
  lines.push('Appetit,Nombre')
  stats.appetiteDistribution.forEach((a) => {
    lines.push(`${escapeCSV(a.label)},${a.count}`)
  })
  lines.push('')

  // Goals
  lines.push('=== Objectifs batch cooking ===')
  lines.push('Objectif,Nombre')
  stats.goalsDistribution.forEach((g) => {
    lines.push(`${escapeCSV(g.label)},${g.count}`)
  })

  return lines.join('\n')
}

export function downloadCSV(csvContent: string, filename: string) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
