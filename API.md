# REST API Specification
## Nettech Help Desk

**Base URL:** `http://localhost:5000/api`
**Format:** JSON · **Auth:** JWT via httpOnly cookie or `Authorization: Bearer <token>`

### Standard responses
```json
// Success
{ "success": true, "data": { } }

// Error
{ "success": false, "message": "Human readable error", "errors": [ { "field": "email", "msg": "Invalid email" } ] }
```

| Code | Meaning |
|---|---|
| 200 / 201 | OK / Created |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not allowed for this role / not owner |
| 404 | Not found |
| 409 | Conflict (e.g. email already exists) |
| 429 | Too many requests |
| 500 | Server error |

---

## 1. Endpoint Summary
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register employee |
| POST | `/auth/login` | Public | Login (user or admin) |
| POST | `/auth/logout` | Auth | Logout |
| GET | `/auth/me` | Auth | Current user |
| GET | `/users/profile` | User | Get own profile |
| PUT | `/users/profile` | User | Update own profile |
| PUT | `/users/change-password` | User | Change password |
| POST | `/users/profile-picture` | User | Upload picture *(bonus)* |
| GET | `/users` | Admin | List users *(optional)* |
| POST | `/tickets` | User | Raise ticket |
| GET | `/tickets` | Auth | List tickets (own for user, all for admin) + search/filter |
| GET | `/tickets/:id` | Auth | Ticket detail (owner or admin) |
| PUT | `/tickets/:id` | User | Edit own ticket while Pending |
| PATCH | `/tickets/:id/status` | Admin | Update status / priority / remarks |
| DELETE | `/tickets/:id` | Admin | Delete ticket |
| GET | `/dashboard/stats` | Admin | Dashboard statistics |
| GET | `/dashboard/user-stats` | User | Own ticket counts |

---

## 2. Authentication

### POST `/auth/register`
```json
// Request
{ "name": "Ravi Patil", "email": "ravi@nettech.com", "password": "Pass1234", "department": "Sales", "phone": "9876543210" }

// 201 Response
{ "success": true, "data": { "user": { "id": "665f0a...", "name": "Ravi Patil", "email": "ravi@nettech.com", "role": "user" }, "token": "<jwt>" } }
```

### POST `/auth/login`
```json
// Request
{ "email": "ravi@nettech.com", "password": "Pass1234" }

// 200 Response
{ "success": true, "data": { "user": { "id": "665f0a...", "name": "Ravi Patil", "role": "user" }, "token": "<jwt>" } }
```
Frontend redirects: `role === 'admin'` → `/admin/dashboard.html`, else → `/user/dashboard.html`.

### GET `/auth/me`
Returns the logged-in user (without password).

---

## 3. Users

### PUT `/users/profile`
```json
{ "name": "Ravi P.", "phone": "9876543210", "department": "Support" }
```

### PUT `/users/change-password`
```json
{ "currentPassword": "Pass1234", "newPassword": "NewPass5678" }
```

### POST `/users/profile-picture`
`multipart/form-data` with field `avatar` (JPG/PNG, ≤ 2 MB).
Response: `{ "success": true, "data": { "profilePicture": "/uploads/profile/665f0a-1721800000.png" } }`

---

## 4. Tickets

### POST `/tickets`
```json
// Request
{ "title": "Laptop not connecting to Wi-Fi", "description": "Since this morning my laptop cannot connect...", "category": "Network", "priority": "High" }

// 201 Response
{ "success": true, "data": { "ticketId": "NT-0001", "status": "Pending", "priority": "High", "createdAt": "2026-07-24T09:00:00Z" } }
```

### GET `/tickets`
**Query parameters**
| Param | Example | Notes |
|---|---|---|
| `search` | `wifi` or `NT-0001` | Matches ticketId, title, description |
| `status` | `Pending` | Filter |
| `priority` | `High` | Filter |
| `category` | `Network` | Filter |
| `user` | `<userId>` | Admin only |
| `page` | `1` | Default 1 |
| `limit` | `10` | Default 10, max 50 |
| `sort` | `-createdAt` | Default newest first |

```json
// 200 Response
{
  "success": true,
  "data": {
    "tickets": [ { "ticketId": "NT-0001", "title": "...", "status": "Pending", "priority": "High", "createdBy": { "name": "Ravi Patil", "email": "ravi@nettech.com" }, "createdAt": "..." } ],
    "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
  }
}
```

### GET `/tickets/:id`
Returns full ticket including `statusHistory` and `adminRemarks`. A normal user requesting another user's ticket gets **403**.

### PUT `/tickets/:id` (User, status must be Pending)
```json
{ "title": "Updated title", "description": "Updated description", "priority": "Medium" }
```

### PATCH `/tickets/:id/status` (Admin)
```json
{ "status": "Resolved", "priority": "Medium", "remarks": "Router replaced. Issue fixed." }
```
Side effects: appends to `statusHistory`, updates `adminRemarks`, sends email to the owner.

### DELETE `/tickets/:id` (Admin)
```json
{ "success": true, "message": "Ticket deleted" }
```

---

## 5. Dashboard

### GET `/dashboard/stats` (Admin)
```json
{
  "success": true,
  "data": {
    "total": 42,
    "byStatus":   { "Pending": 12, "In Progress": 10, "Resolved": 15, "Closed": 5 },
    "byPriority": { "High": 8, "Medium": 24, "Low": 10 },
    "last7Days": 14,
    "totalUsers": 18,
    "recentTickets": [ { "ticketId": "NT-0042", "title": "...", "status": "Pending", "createdAt": "..." } ]
  }
}
```

### GET `/dashboard/user-stats` (User)
```json
{ "success": true, "data": { "total": 5, "byStatus": { "Pending": 1, "In Progress": 2, "Resolved": 2, "Closed": 0 } } }
```

---

## 6. Postman Quick Test Order
1. Register user → Login → copy token
2. Create ticket → List tickets → Get ticket
3. Login as admin → List all tickets → PATCH status → check email
4. GET `/dashboard/stats`
5. Try admin endpoint as user → expect **403**
6. DELETE ticket → expect **404** on next GET
