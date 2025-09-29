export const ISO639_1 = [
    'ar',
    'de',
    'en',
    'es',
    'fr',
    'it',
    'ja',
    'ko',
    'nl',
    'pl',
    'pt',
    'ru',
    'zh',
] as const

export type ISO639_1 = (typeof ISO639_1)[number]

type OtherLangs = Exclude<ISO639_1, 'fr'>

export type TranslationText = { fr: string } & Partial<Record<OtherLangs, string>>


