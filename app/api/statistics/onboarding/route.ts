import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server-client'
import {
  APPETITE_LABELS,
  BATCH_COOKING_FREQUENCY_LABELS,
  BATCH_COOKING_GOAL_LABELS,
} from '@/features/statistics/constants/onboarding-labels'
import type { OnboardingStats } from '@/features/statistics/types/statistics.types'

async function countWithFilter(column: string, value: number | string) {
  const { count } = await supabaseServer
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq(column, value)
  return count ?? 0
}

async function countWithArrayContains(column: string, value: number) {
  const { count } = await supabaseServer
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .contains(column, [value])
  return count ?? 0
}

export async function GET() {
  try {
    // --- KPIs ---
    const [totalResult, premiumResult] = await Promise.all([
      supabaseServer
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null),
      supabaseServer
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gt('premium_sub_end_at', new Date().toISOString()),
    ])

    const totalUsers = totalResult.count ?? 0
    const premiumUsers = premiumResult.count ?? 0

    // Fetch avg values (meal_people_quantity, batch_cooking_session_count)
    // Use a limited sample approach: fetch all values for these two columns
    const { data: avgData } = await supabaseServer
      .from('user_profiles')
      .select('meal_people_quantity, batch_cooking_session_count')
      .is('deleted_at', null)

    let avgHouseholdSize = 0
    let avgSessionCount = 0
    if (avgData && avgData.length > 0) {
      const sumHousehold = avgData.reduce((acc, r) => acc + Number(r.meal_people_quantity), 0)
      const sumSessions = avgData.reduce((acc, r) => acc + Number(r.batch_cooking_session_count), 0)
      avgHouseholdSize = Number((sumHousehold / avgData.length).toFixed(1))
      avgSessionCount = Number((sumSessions / avgData.length).toFixed(1))
    }

    const kpis = {
      totalUsers,
      premiumUsers,
      premiumPercentage: totalUsers > 0 ? Number((100 * premiumUsers / totalUsers).toFixed(1)) : 0,
      avgHouseholdSize,
      avgSessionCount,
    }

    // --- Registrations by month (last 12 months) ---
    const now = new Date()
    const registrationPromises = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return supabaseServer
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextMonth.toISOString())
        .then(({ count }) => ({ month: monthLabel, count: count ?? 0 }))
    })

    // --- Reference tables ---
    const [dietsResult, allergiesResult, equipmentResult] = await Promise.all([
      supabaseServer.from('diets').select('id, title').order('id'),
      supabaseServer.from('allergies').select('id, name').order('id'),
      supabaseServer.from('kitchen_equipments').select('id, name').order('id'),
    ])

    // --- All parallel distribution queries ---
    const [
      registrationsByMonth,
      dietDistribution,
      allergyDistribution,
      equipmentDistribution,
      ...scalarDistributions
    ] = await Promise.all([
      // Registrations
      Promise.all(registrationPromises),

      // Diets (array contains)
      Promise.all(
        ((dietsResult.data ?? []) as { id: number; title: Record<string, string> }[]).map(async (diet) => ({
          label: diet.title?.fr ?? `Diet ${diet.id}`,
          count: await countWithArrayContains('diets', diet.id),
        }))
      ),

      // Allergies (array contains)
      Promise.all(
        ((allergiesResult.data ?? []) as { id: number; name: Record<string, string> }[]).map(async (allergy) => ({
          label: allergy.name?.fr ?? `Allergy ${allergy.id}`,
          count: await countWithArrayContains('allergies', allergy.id),
        }))
      ),

      // Equipment (array contains)
      Promise.all(
        ((equipmentResult.data ?? []) as { id: number; name: Record<string, string> }[]).map(async (equip) => ({
          label: equip.name?.fr ?? `Equip ${equip.id}`,
          count: await countWithArrayContains('kitchen_equipment', equip.id),
        }))
      ),

      // Frequency distribution (values 0-3)
      ...Object.entries(BATCH_COOKING_FREQUENCY_LABELS).map(async ([val, label]) => ({
        label,
        count: await countWithFilter('batch_cooking_frequency', Number(val)),
      })),

      // Appetite distribution (values '0', '1', '2')
      ...Object.entries(APPETITE_LABELS).map(async ([val, label]) => ({
        label,
        count: await countWithFilter('appetite', val),
      })),
    ])

    // Frequency: first 4, Appetite: next 3
    const frequencyDistribution = scalarDistributions.slice(0, Object.keys(BATCH_COOKING_FREQUENCY_LABELS).length)
    const appetiteDistribution = scalarDistributions.slice(Object.keys(BATCH_COOKING_FREQUENCY_LABELS).length)

    // --- Household size distribution (values 1-10) ---
    const householdSizeDistribution = await Promise.all(
      Array.from({ length: 10 }, (_, i) => i + 1).map(async (size) => ({
        size,
        count: await countWithFilter('meal_people_quantity', size),
      }))
    )

    // --- Goals distribution (array, values 0-4) ---
    const goalsDistribution = await Promise.all(
      Object.entries(BATCH_COOKING_GOAL_LABELS).map(async ([val, label]) => ({
        label,
        count: await countWithArrayContains('batch_cooking_goals', Number(val)),
      }))
    )

    const stats: OnboardingStats = {
      kpis,
      registrationsByMonth,
      dietDistribution,
      allergyDistribution,
      equipmentDistribution,
      frequencyDistribution,
      householdSizeDistribution,
      appetiteDistribution,
      goalsDistribution,
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('Error fetching onboarding statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding statistics' },
      { status: 500 }
    )
  }
}
