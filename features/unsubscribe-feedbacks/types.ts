export interface UnsubscribeFeedback {
  id: number
  user_profile_id: number
  reason_slug: 'bugs' | 'not_using' | 'too_expensive' | 'recipes_not_matching'
  feedback_text: string | null
  feedback_options: string[] | null
  created_at: string
  user_profile: {
    firstname: string | null
    email: string | null
  } | null
}

export const REASON_LABELS: Record<string, string> = {
  too_expensive: 'Trop cher',
  not_using: "N'utilise pas l'app",
  recipes_not_matching: 'Recettes inadaptées',
  bugs: 'Bugs',
}

export const FEEDBACK_OPTION_LABELS: Record<string, string> = {
  too_complex: 'Trop complexes',
  too_caloric: 'Trop caloriques',
  portions_too_big: 'Portions trop grandes',
  not_gourmet: 'Pas assez gourmand',
}
