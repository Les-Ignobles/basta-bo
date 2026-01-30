# API Contract: Promo Codes

**Base Path**: `/api/promo-codes`

---

## GET /api/promo-codes

Liste les codes promo avec pagination et filtrage.

### Request

**Query Parameters**:

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | number | No | 1 | Numéro de page |
| `pageSize` | number | No | 20 | Nombre d'éléments par page (max 100) |
| `status` | string | No | `all` | Filtre : `all`, `used`, `unused` |

### Response

**200 OK**

```json
{
  "data": [
    {
      "id": 1,
      "created_at": "2026-01-30T10:00:00Z",
      "code": "BASTA2026",
      "premium_end_at": "2026-02-28T00:00:00Z",
      "used_at": null,
      "duration_label": "1 mois"
    },
    {
      "id": 2,
      "created_at": "2026-01-29T15:30:00Z",
      "code": "PROMO123",
      "premium_end_at": "2027-01-29T00:00:00Z",
      "used_at": "2026-01-30T08:45:00Z",
      "duration_label": "1 an"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

**Computed Fields**:
- `duration_label` : Calculé côté serveur basé sur la différence entre `created_at` et `premium_end_at`

---

## POST /api/promo-codes

Génère un nouveau code promo.

### Request

**Body**:

```json
{
  "duration": "1_month"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `duration` | string | Yes | `1_month` ou `1_year` |

### Response

**201 Created**

```json
{
  "data": {
    "id": 3,
    "created_at": "2026-01-30T14:35:00Z",
    "code": "XK7M2P9Q",
    "premium_end_at": "2026-02-28T14:35:00Z",
    "used_at": null,
    "duration_label": "1 mois"
  }
}
```

**400 Bad Request** - Durée invalide

```json
{
  "error": "Invalid duration",
  "message": "La durée doit être '1_month' ou '1_year'"
}
```

**500 Internal Server Error** - Échec génération (collision codes après 3 essais)

```json
{
  "error": "Generation failed",
  "message": "Impossible de générer un code unique. Réessayez."
}
```

---

## Notes d'implémentation

### Génération de code

Le code est généré côté serveur avec le format suivant :
- 8 caractères
- Caractères autorisés : A-Z (majuscules) et 0-9
- Exemple : `XK7M2P9Q`

### Calcul de premium_end_at

```
premium_end_at = NOW() + duration
  - 1_month = +30 jours
  - 1_year = +365 jours
```

### Calcul de duration_label

Le label est calculé à partir de la différence entre `premium_end_at` et `created_at` :
- < 35 jours → "1 mois"
- >= 35 jours → "1 an"

### Gestion des collisions

Si le code généré existe déjà (constraint UNIQUE violée), le serveur :
1. Génère un nouveau code
2. Réessaie l'insertion
3. Maximum 3 tentatives avant erreur 500
