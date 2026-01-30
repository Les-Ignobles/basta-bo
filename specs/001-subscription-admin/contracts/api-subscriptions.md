# API Contract: Subscriptions

**Base Path**: `/api/subscriptions`

---

## GET /api/subscriptions

Recherche un utilisateur par email ou UUID.

### Request

**Query Parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Email ou UUID de l'utilisateur |

### Response

**200 OK** - Utilisateur trouvé

```json
{
  "data": {
    "authUser": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "userProfile": {
      "id": 123,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstname": "Marie",
      "premium_sub_end_at": "2025-06-15T00:00:00Z"
    }
  }
}
```

**200 OK** - Utilisateur auth trouvé mais sans profil

```json
{
  "data": {
    "authUser": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "userProfile": null,
    "canCreateProfile": true
  }
}
```

**404 Not Found** - Utilisateur non trouvé

```json
{
  "error": "User not found",
  "message": "Aucun utilisateur trouvé avec cet email ou UUID"
}
```

---

## PUT /api/subscriptions

Met à jour la date de fin d'abonnement d'un utilisateur.

### Request

**Body**:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "add_1_month",
  "customDate": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string (UUID) | Yes | UUID de l'utilisateur |
| `action` | string | Yes | `add_1_month`, `add_1_year`, ou `custom_date` |
| `customDate` | string (ISO 8601) | Conditional | Requis si action = `custom_date` |

### Response

**200 OK**

```json
{
  "data": {
    "userProfile": {
      "id": 123,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstname": "Marie",
      "premium_sub_end_at": "2026-02-28T00:00:00Z"
    },
    "previousEndDate": "2026-01-30T00:00:00Z",
    "newEndDate": "2026-02-28T00:00:00Z",
    "auditLogId": 456
  }
}
```

**400 Bad Request** - Paramètres invalides

```json
{
  "error": "Invalid request",
  "message": "customDate is required when action is 'custom_date'"
}
```

**404 Not Found** - Utilisateur non trouvé

```json
{
  "error": "User not found",
  "message": "Utilisateur non trouvé"
}
```

---

## POST /api/subscriptions/profile

Crée un profil minimal pour un utilisateur existant dans auth.users.

### Request

**Body**:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response

**201 Created**

```json
{
  "data": {
    "userProfile": {
      "id": 124,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstname": null,
      "premium_sub_end_at": null
    }
  }
}
```

**409 Conflict** - Profil existe déjà

```json
{
  "error": "Profile exists",
  "message": "Un profil existe déjà pour cet utilisateur"
}
```

---

## GET /api/subscriptions/audit

Récupère l'historique des modifications pour un utilisateur.

### Request

**Query Parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string (UUID) | Yes | UUID de l'utilisateur |

### Response

**200 OK**

```json
{
  "data": [
    {
      "id": 456,
      "created_at": "2026-01-30T14:30:00Z",
      "admin_email": "admin@basta.com",
      "previous_end_date": "2026-01-30T00:00:00Z",
      "new_end_date": "2026-02-28T00:00:00Z",
      "action_type": "add_1_month"
    },
    {
      "id": 455,
      "created_at": "2026-01-15T10:00:00Z",
      "admin_email": "admin@basta.com",
      "previous_end_date": null,
      "new_end_date": "2026-01-30T00:00:00Z",
      "action_type": "add_1_month"
    }
  ]
}
```
