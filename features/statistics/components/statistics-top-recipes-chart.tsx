'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TopRecipeEntry } from '../types/statistics.types'

interface StatisticsTopRecipesChartProps {
  recipes: TopRecipeEntry[]
}

export function StatisticsTopRecipesChart({ recipes }: StatisticsTopRecipesChartProps) {
  const data = recipes.map((r) => ({
    label: r.title.length > 35 ? r.title.slice(0, 35) + '\u2026' : r.title,
    count: r.usageCount,
  }))

  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top 10 recettes les plus utilisees en batch cooking</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={data.length * 44 + 40}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="label" width={200} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} utilisations`, 'Batch cooking']} />
            <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]}>
              <LabelList
                dataKey="count"
                position="right"
                fontSize={11}
                fill="#6b7280"
                formatter={(value) => Number(value).toLocaleString('fr-FR')}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
