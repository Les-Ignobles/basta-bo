'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OnboardingStats } from '../types/statistics.types'

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5', '#c026d3', '#d97706', '#059669', '#dc2626', '#6366f1']

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function HorizontalBarChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 40 + 40}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR')} />
        <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function DonutChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR')} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface StatisticsOnboardingChartsProps {
  stats: OnboardingStats
}

export function StatisticsOnboardingCharts({ stats }: StatisticsOnboardingChartsProps) {
  const registrationData = stats.registrationsByMonth.map((r) => ({
    ...r,
    label: r.month.slice(5) + '/' + r.month.slice(2, 4),
  }))

  const householdData = stats.householdSizeDistribution.map((h) => ({
    label: `${h.size} pers.`,
    count: h.count,
  }))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Donnees d&apos;onboarding</h2>

      {/* Line chart - full width */}
      <ChartCard title="Inscriptions par mois">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={registrationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR')} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Inscriptions"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2 columns: Diets + Allergies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Regimes alimentaires">
          <HorizontalBarChart data={stats.dietDistribution} />
        </ChartCard>
        <ChartCard title="Allergies">
          <HorizontalBarChart data={stats.allergyDistribution} />
        </ChartCard>
      </div>

      {/* 2 columns: Equipment + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Equipement cuisine">
          <HorizontalBarChart data={stats.equipmentDistribution} />
        </ChartCard>
        <ChartCard title="Objectifs batch cooking">
          <HorizontalBarChart data={stats.goalsDistribution} />
        </ChartCard>
      </div>

      {/* 3 columns: Frequency + Appetite + Household size */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Frequence batch cooking">
          <DonutChart data={stats.frequencyDistribution} />
        </ChartCard>
        <ChartCard title="Appetit">
          <DonutChart data={stats.appetiteDistribution} />
        </ChartCard>
        <ChartCard title="Nombre de personnes par foyer">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={householdData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value: number) => value.toLocaleString('fr-FR')} />
              <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
