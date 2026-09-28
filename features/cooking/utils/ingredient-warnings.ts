import type { Ingredient, RecipeActionBO } from '@/features/cooking/types'
import { RecipeActionType } from '@/features/cooking/types'

/**
 * Détections de cohérence entre la liste d'ingrédients d'une recette et ses
 * étapes, affichées en tags dans le BO à la création/édition.
 *
 * Contexte : des fiches sont parties en prod avec des ingrédients utilisés
 * dans les étapes mais absents de la liste (ex. le lait du Cake breakfast
 * pomme & cannelle) → liste de courses trouée ET masque allergènes faux
 * (une allergique au lactose pouvait se voir proposer la recette). L'audit
 * du 25/09 a compté ~60 fiches concernées : ces tags empêchent d'en créer
 * de nouvelles.
 */

export type IngredientWarnings = {
    /** Cités dans les étapes (référence ou texte) mais absents de la liste. */
    citedMissing: string[]
    /** Dans la liste mais jamais évoqués par aucune étape. */
    neverCited: string[]
    /** Étapes de prep suspectes. step = le numéro « # » du tableau
     *  (step_index). Deux familles :
     *  - 'composite' : découpe + dépôt dans la même étape (à séparer, piège
     *    « une étape = un geste », cf. gratin de gnocchis) ;
     *  - 'mistype'   : le texte est un mélange/préchauffage/fouettage mais le
     *    type est une découpe — le moteur croit à une prep anticipable et
     *    peut perdre le préchauffage ou déplacer la transformation. */
    compositeSteps: { step: number; verb: string; kind: 'composite' | 'mistype'; actionType: string }[]
}

const EAU_ID = 23

// Même normalisation que le matcher backend (accents, ligatures, pluriels).
const normalize = (s: string) =>
    s.toLowerCase()
        .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

const singularize = (s: string) =>
    s.split(' ').map(w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)).join(' ')

const PREP_TYPES = new Set<string>([
    RecipeActionType.WASH, RecipeActionType.PEEL, RecipeActionType.CUT,
    RecipeActionType.GRATE, RecipeActionType.MINCE, RecipeActionType.CRUSH,
    RecipeActionType.ZEST, RecipeActionType.SQUEEZE,
])

// Verbes de dépôt/mélange/cuisson (formes désaccentuées, testées sur texte
// normalisé). « melange » et « verse » exigent l'impératif : précédés d'un
// article (« obtenir un mélange lisse », « verse le mélange ») ce sont des
// noms, pas des gestes. « prechauffe » et « fouette » attrapent les mistypes
// dangereux (préchauffage typé découpe, fouettage typé émincé — éligibles à
// l'anticipation par le moteur, le pattern du bug lasagnes).
const DEPOSIT_VERB_RE =
    /(?<!\b(?:un|une|le|la|ce|du|au|de) )\b(dispose|verse|ajoute|etale|repartis|saupoudre|transvase|nappe|recouvre)\b/

// Le texte est une transformation/cuisson mais le TYPE est une prep : mistype
// pur (pas une étape à séparer — un type à corriger).
const MISTYPE_VERB_RE =
    /(?<!\b(?:un|une|le|la|ce|du|au|de) )\b(melange|fouette|incorpore|prechauffe|enfourne)\b/

const wordRe = (name: string) => new RegExp(`(?:^| )${name}(?:$| )`)

/** Noms trop ambigus pour le matching textuel : « pâte homogène » n'est pas
 *  un oubli de Pâtes. */
const AMBIGUOUS_NAMES = new Set(['pate', 'pates'])

/** Qualificatifs retirés des noms du catalogue pour le matching : une étape
 *  dit « la cannelle », le catalogue dit « Cannelle en poudre ». */
const QUALIFIER_WORDS = new Set([
    'en', 'de', 'du', 'poudre', 'frais', 'fraiche', 'seche', 'sechee', 'seches', 'sechees',
    'moulu', 'moulue', 'rape', 'rapee', 'liquide', 'entier', 'entiere', 'surgele', 'surgelee',
    'concasse', 'concassee', 'concassees', 'cuit', 'cuite', 'cuites',
])

const significantWords = (normalized: string) =>
    normalized.split(' ').filter(w => w.length >= 4 && !QUALIFIER_WORDS.has(w))

const coreName = (normalized: string) => {
    const words = normalized.split(' ').filter(w => !QUALIFIER_WORDS.has(w))
    return words.join(' ')
}

export function computeIngredientWarnings(
    recipeIngredients: Ingredient[],
    actions: RecipeActionBO[],
    catalogue: Ingredient[]
): IngredientWarnings {
    if (actions.length === 0) return { citedMissing: [], neverCited: [], compositeSteps: [] }

    const listIds = new Set(recipeIngredients.map(i => i.id))
    const listNames = recipeIngredients.map(i => normalize(i.name?.fr ?? ''))
    const texts = actions.map(a => ` ${singularize(normalize(a.normalized_instruction ?? ''))} `)
    const allText = texts.join(' ')

    // ── 1. Cités mais absents de la liste ──────────────────────────────────
    const citedMissing = new Map<number, string>()

    // (a) Par référence : un ingrédient relié dans une étape doit être dans la
    // liste (l'eau est volontairement hors liste par convention).
    for (const a of actions) {
        for (const ref of a.ingredients ?? []) {
            if (!ref.ingredient_id || ref.ingredient_id === EAU_ID) continue
            if (!listIds.has(ref.ingredient_id)) {
                citedMissing.set(ref.ingredient_id, ref.name || `#${ref.ingredient_id}`)
            }
        }
    }

    // (b) Par le texte : un nom du catalogue apparaît dans une étape sans être
    // couvert par la liste — c'est le cas « lait » du cake 484, dont aucune
    // référence n'existait. Les basiques (sel, poivre, eau…) sont exclus pour
    // éviter le bruit ; un nom couvert par un ingrédient de la liste (« lait »
    // quand la liste a « Lait de coco ») n'est pas signalé.
    const listWords = new Set(listNames.flatMap(significantWords))
    for (const ing of catalogue) {
        if (ing.is_basic || listIds.has(ing.id) || citedMissing.has(ing.id)) continue
        const full = singularize(normalize(ing.name?.fr ?? ''))
        const core = coreName(full)
        if (core.length < 4 || AMBIGUOUS_NAMES.has(core)) continue
        // Match sur le nom complet OU sur le nom débarrassé des qualificatifs
        // (« la cannelle » ↔ « Cannelle en poudre »).
        if (!wordRe(full).test(allText) && !wordRe(core).test(allText)) continue
        // Couvert si un ingrédient de la liste partage un mot significatif :
        // « sauce tomate » citée ne manque pas quand la liste a « Tomate
        // concassée » (la sauce est faite dans la recette).
        const covered =
            listNames.some(ln => ln.includes(core) || core.includes(ln)) ||
            significantWords(full).some(w => listWords.has(w))
        if (!covered) citedMissing.set(ing.id, ing.name?.fr ?? '')
    }

    // ── 2. Dans la liste mais jamais cités ─────────────────────────────────
    const citedIds = new Set<number>()
    for (const a of actions) {
        for (const ref of a.ingredients ?? []) {
            if (ref.ingredient_id) citedIds.add(ref.ingredient_id)
        }
    }
    const neverCited: string[] = []
    for (const ing of recipeIngredients) {
        if (citedIds.has(ing.id)) continue
        // Les basiques (sel, poivre, huile…) s'utilisent via « assaisonne »
        // sans être nommés : les signaler serait du bruit permanent.
        if (ing.is_basic) continue
        const words = singularize(normalize(ing.name?.fr ?? ''))
            .split(' ')
            .filter(w => w.length >= 4)
        // Généreux exprès (un seul mot significatif suffit) : ce tag signale
        // un oubli probable, il ne doit pas crier pour une reformulation.
        const mentioned = words.some(w => wordRe(w).test(allText))
        if (!mentioned) neverCited.push(ing.name?.fr ?? '')
    }

    // ── 3. Étapes composites découpe + dépôt ───────────────────────────────
    const compositeSteps: IngredientWarnings['compositeSteps'] = []
    actions.forEach((a, idx) => {
        if (!PREP_TYPES.has(a.action_type)) return
        const mistype = texts[idx].match(MISTYPE_VERB_RE)
        if (mistype) {
            compositeSteps.push({ step: a.step_index, verb: mistype[1], kind: 'mistype', actionType: a.action_type })
            return
        }
        const composite = texts[idx].match(DEPOSIT_VERB_RE)
        if (composite) {
            compositeSteps.push({ step: a.step_index, verb: composite[1], kind: 'composite', actionType: a.action_type })
        }
    })

    return {
        citedMissing: [...citedMissing.values()],
        neverCited,
        compositeSteps,
    }
}
