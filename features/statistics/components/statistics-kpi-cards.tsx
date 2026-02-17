import { Card, CardContent } from '@/components/ui/card'
import { Users, Crown, Home, ChefHat } from 'lucide-react'
import type { OnboardingKpis } from '../types/statistics.types'

interface StatisticsKpiCardsProps {
  kpis: OnboardingKpis
}

const kpiConfig = [
  {
    key: 'totalUsers' as const,
    label: 'Utilisateurs totaux',
    icon: Users,
    format: (v: number) => v.toLocaleString('fr-FR'),
  },
  {
    key: 'premiumUsers' as const,
    label: 'Utilisateurs premium',
    icon: Crown,
    format: (v: number) => v.toLocaleString('fr-FR'),
  },
  {
    key: 'avgHouseholdSize' as const,
    label: 'Taille moyenne foyer',
    icon: Home,
    format: (v: number) => `${v} pers.`,
  },
  {
    key: 'avgSessionCount' as const,
    label: 'Sessions BC moyennes',
    icon: ChefHat,
    format: (v: number) => v.toLocaleString('fr-FR'),
  },
]

export function StatisticsKpiCards({ kpis }: StatisticsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiConfig.map(({ key, label, icon: Icon, format }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{format(kpis[key])}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
