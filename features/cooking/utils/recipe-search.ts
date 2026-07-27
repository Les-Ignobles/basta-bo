/**
 * Recherche de recettes tolérante aux accents et aux fautes de frappe.
 *
 * La recherche SQL `ilike` était sensible aux accents ("boeuf" ne trouvait pas
 * "bœuf") et exigeait une orthographe exacte. Ici on normalise (minuscules +
 * suppression des accents) et on tolère les petites fautes via une distance de
 * Levenshtein, le tout côté client (le catalogue est petit).
 */

/** Minuscules + suppression des accents/diacritiques. */
export function normalize(input: string): string {
    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '') // diacritiques (accents)
        .replace(/œ/g, 'oe')
        .replace(/æ/g, 'ae')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
}

/** Distance de Levenshtein bornée (early-exit dès qu'on dépasse maxDistance). */
function boundedLevenshtein(a: string, b: string, maxDistance: number): number {
    if (a === b) return 0
    if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1

    let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
    let curr = new Array<number>(b.length + 1)

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i
        let rowMin = curr[0]
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            curr[j] = Math.min(
                prev[j] + 1, // suppression
                curr[j - 1] + 1, // insertion
                prev[j - 1] + cost // substitution
            )
            if (curr[j] < rowMin) rowMin = curr[j]
        }
        if (rowMin > maxDistance) return maxDistance + 1
        ;[prev, curr] = [curr, prev]
    }

    return prev[b.length]
}

/** Tolérance aux fautes proportionnelle à la longueur du mot recherché. */
function toleranceFor(token: string): number {
    if (token.length <= 3) return 0
    if (token.length <= 6) return 1
    return 2
}

/**
 * Score de correspondance entre une requête et un texte cible.
 * Retourne un score >= 0 (plus grand = plus pertinent), ou -1 si aucun match.
 *
 * Chaque token de la requête doit correspondre à un mot du texte cible :
 * - préfixe exact (fort), sous-chaîne (moyen), ou proche à une faute près (faible).
 */
export function matchScore(query: string, target: string): number {
    const normalizedQuery = normalize(query)
    if (!normalizedQuery) return 0 // requête vide => tout matche

    const normalizedTarget = normalize(target)
    if (!normalizedTarget) return -1

    const queryTokens = normalizedQuery.split(' ').filter(Boolean)
    const targetWords = normalizedTarget.split(' ').filter(Boolean)

    let totalScore = 0

    for (const token of queryTokens) {
        let bestTokenScore = -1

        // Match sur la chaîne entière (utile pour "gratin dauphinois" recherché "gratindau")
        if (normalizedTarget.includes(token)) {
            bestTokenScore = normalizedTarget.startsWith(token) ? 6 : 4
        }

        for (const word of targetWords) {
            if (word === token) {
                bestTokenScore = Math.max(bestTokenScore, 10)
            } else if (word.startsWith(token)) {
                bestTokenScore = Math.max(bestTokenScore, 7)
            } else if (word.includes(token)) {
                bestTokenScore = Math.max(bestTokenScore, 4)
            } else {
                const tolerance = toleranceFor(token)
                if (tolerance > 0) {
                    const distance = boundedLevenshtein(token, word, tolerance)
                    if (distance <= tolerance) {
                        bestTokenScore = Math.max(bestTokenScore, 3 - distance)
                    }
                }
            }
        }

        // Un token non trouvé => la requête ne matche pas (recherche conjonctive).
        if (bestTokenScore < 0) return -1
        totalScore += bestTokenScore
    }

    return totalScore
}

/**
 * Filtre + trie une liste d'éléments par pertinence sur un champ texte.
 * L'ordre initial est conservé pour les scores égaux (tri stable).
 */
export function searchByRelevance<T>(
    items: T[],
    query: string,
    getText: (item: T) => string
): T[] {
    if (!query.trim()) return items

    const scored = items
        .map((item, index) => ({ item, index, score: matchScore(query, getText(item)) }))
        .filter((entry) => entry.score >= 0)

    scored.sort((a, b) => (b.score - a.score) || (a.index - b.index))

    return scored.map((entry) => entry.item)
}
