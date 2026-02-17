export interface OnboardingKpis {
  totalUsers: number
  premiumUsers: number
  premiumPercentage: number
  avgHouseholdSize: number
  avgSessionCount: number
}

export interface LabelCount {
  label: string
  count: number
}

export interface HouseholdSizeEntry {
  size: number
  count: number
}

export interface RegistrationEntry {
  month: string
  count: number
}

export interface OnboardingStats {
  kpis: OnboardingKpis
  registrationsByMonth: RegistrationEntry[]
  dietDistribution: LabelCount[]
  allergyDistribution: LabelCount[]
  equipmentDistribution: LabelCount[]
  frequencyDistribution: LabelCount[]
  householdSizeDistribution: HouseholdSizeEntry[]
  appetiteDistribution: LabelCount[]
  goalsDistribution: LabelCount[]
}
