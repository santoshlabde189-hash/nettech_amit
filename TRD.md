# Technical Requirements Document (TRD)
## Nettech Help Desk Ticket Management System

## 1. Chosen Technology Stack
| Layer | Technology | Reason |
|---|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+), **Bootstrap 5** | Required by brief; responsive out of the box |
| Backend | **Node.js 18+ / Express 4** | One language across the stack, simple REST APIs |
| Database | **MongoDB Atlas** (cloud) via **Mongoose** | Online MongoDB URL, flexible schema, free tier |
| Auth | JWT + bcryptjs | Stateless, standard |
| File upload | Multer | Profile pictures |
| Email | Nodemailer (SMTP / Gmail App Password) | Notifications |
| Validation | express-validator | Server-side validation |
| Security | helmet, cors, express-rate-limit, express-mongo-sanitize | Hardening |
| Dev tools | nodemon, dotenv, Postman | Workflow |

## 2. System Requirements
- Node.js ≥ 18, npm ≥ 9
- MongoDB Atlas cluster (M0 free tier is enough)
- Modern browser

## 3. Database Connection
The app connects to MongoDB Atlas using a single environment variable.

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nettech_helpdesk?retryWrites=true&w=majority
```

```js
// config/db.js
const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
```

> Never hard-code or commit the real URI. Keep it in `.env` only.

## 4. Authentication & Authorisation

### 4.1 Password handling
- `bcryptjs` with salt rounds = 10.
- Minimum 8 characters; at least one letter and one number.

### 4.2 JWT
- Payload: `{ id, role }`; expiry `1d`.
- Stored client-side in an **httpOnly cookie** (preferred) or `Authorization: Bearer <token>` header.
- Secret in `JWT_SECRET`.

### 4.3 Middleware
| Middleware | Purpose |
|---|---|
| `protect` | Verifies JWT, attaches `req.user`. Returns 401 on failure. |
| `authorize('admin')` | Allows only listed roles. Returns 403 otherwise. |
| `validate` | Runs express-validator rules and returns 400 with errors. |
| `upload` | Multer config for images (type + size checks). |
| `errorHandler` | Central JSON error responses. |

### 4.4 Admin account
Admins cannot self-register. Create one with a seed script (`npm run seed:admin`) reading `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.

## 5. Functional Technical Specs

### 5.1 Ticket ID generation
Human-readable IDs (`NT-0001`, `NT-0002`, ...) generated with an atomic counter in a `counters` collection using `findOneAndUpdate` with `$inc`.

### 5.2 Search & filter
`GET /api/tickets?search=wifi&status=Pending&priority=High&page=1&limit=10`
- `search` matches `ticketId`, `title`, `description` (case-insensitive regex or text index).
- Users are automatically restricted to `createdBy = req.user.id`.
- Admin sees all, with optional `user` filter.

### 5.3 Dashboard statistics
Computed using MongoDB aggregation:
- Total tickets
- Count grouped by `status`
- Count grouped by `priority`
- Tickets created in last 7 days
- 5 most recent tickets

### 5.4 Email notifications
Triggered after: ticket created, status changed.
Sent asynchronously; failure is logged and does not fail the request.

### 5.5 Profile picture upload
- Accepts `image/jpeg`, `image/png`; max 2 MB.
- Saved to `/uploads/profile/` with filename `userId-timestamp.ext`.
- Path stored in `users.profilePicture`.
- Old picture deleted on replace.
- *Production note:* local disk is ephemeral on many hosts (Render, Railway); use Cloudinary or S3 if deployed there.

## 6. Non-Functional Technical Requirements
| Area | Requirement |
|---|---|
| Security | Helmet headers, CORS whitelist, rate limit login (e.g. 10 req / 15 min), NoSQL injection sanitising, XSS-safe output (escape user text in the DOM) |
| Performance | Pagination on lists, indexes on `createdBy`, `status`, `priority`, `ticketId`, `createdAt` |
| Reliability | Central error handler, graceful DB failure handling |
| Logging | `morgan` in dev; `console.error` for failures |
| Config | All secrets and URLs via `.env` |
| Accessibility | Semantic HTML, labels on inputs, colour + text for status badges |

## 7. Environment Variables
| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string |
| `JWT_EXPIRES_IN` | e.g. `1d` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed admin credentials |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email config |
| `EMAIL_FROM` | Sender address |
| `CLIENT_URL` | Allowed origin for CORS |

## 8. Validation Rules
| Field | Rule |
|---|---|
| name | required, 2–50 chars |
| email | required, valid, unique, lowercased |
| password | required, ≥ 8 chars |
| phone | optional, 10–15 digits |
| ticket.title | required, 5–100 chars |
| ticket.description | required, 10–2000 chars |
| ticket.category | one of Hardware, Software, Network, Account, Other |
| ticket.priority | one of Low, Medium, High (default Medium) |
| ticket.status | one of Pending, In Progress, Resolved, Closed |

## 9. Testing Requirements
- Manual test cases per acceptance criteria in the PRD.
- API tests in Postman (collection exported to repo).
- Optional: Jest + Supertest for auth and ticket routes.

## 10. Deployment Requirements
- Backend + static frontend on Render / Railway (single service), or split: frontend on Netlify/Vercel, API on Render.
- Atlas Network Access allows the host's IP.
- Set all env vars in the host dashboard.
