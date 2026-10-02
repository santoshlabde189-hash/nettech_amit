# Development Roadmap & Test Plan
## Nettech Help Desk Ticket Management System

Suggested duration: **3 weeks** (adjust to your trainer's deadline).

## Phase 1: Foundation (Days 1–2)
- [ ] Create folder structure and `npm init`
- [ ] Install dependencies
- [ ] Set up MongoDB Atlas, add `MONGODB_URI` to `.env`
- [ ] `config/db.js`, `server.js`, error handler
- [ ] Models: `User`, `Ticket`, `Counter`
- [ ] Git repo + `.gitignore` (confirm `.env` ignored)

## Phase 2: Authentication (Days 3–4)
- [ ] Register + login controllers (bcrypt, JWT)
- [ ] `protect` and `authorize` middleware
- [ ] `GET /api/auth/me`, logout
- [ ] Seed admin script
- [ ] Frontend: `index.html` (login), `register.html`, `api.js`, `guard.js`
- [ ] Role-based redirect after login

## Phase 3: User Module (Days 5–8)
- [ ] `POST /api/tickets` + ticket ID generator
- [ ] `GET /api/tickets` (own tickets, pagination)
- [ ] `GET /api/tickets/:id` with ownership check
- [ ] Frontend: user dashboard, raise ticket form, ticket detail page
- [ ] Status badges with colours
- [ ] Profile get/update + change password
- [ ] Frontend: profile page

## Phase 4: Admin Module (Days 9–12)
- [ ] Admin list-all tickets with populate user
- [ ] Search + filters (status, priority, category)
- [ ] `PATCH /api/tickets/:id/status` with history + remarks
- [ ] `DELETE /api/tickets/:id`
- [ ] `GET /api/dashboard/stats` aggregation
- [ ] Frontend: admin dashboard (stat cards + Chart.js), manage tickets table, delete confirmation modal

## Phase 5: Polish & Responsive UI (Days 13–14)
- [ ] Test every page at 360 / 768 / 1280 px
- [ ] Form validation messages (client + server)
- [ ] Loading spinners, empty states, toast alerts
- [ ] Escape user content in the DOM (XSS)

## Phase 6: Bonus Features (Days 15–18)
- [ ] **Priority** in create form, table, and filters
- [ ] **Email notifications** via Nodemailer (created + status changed)
- [ ] **Profile picture** upload with Multer, show in navbar

## Phase 7: Security, Testing, Deployment (Days 19–21)
- [ ] Helmet, rate limiting, mongo-sanitize
- [ ] Postman collection and manual test run
- [ ] Deploy to Render/Railway, set env vars
- [ ] Write README with screenshots
- [ ] Record demo / prepare presentation

---

## Test Cases

### Authentication
| # | Scenario | Expected |
|---|---|---|
| A1 | Register with valid data | 201, redirected to user dashboard |
| A2 | Register with existing email | 409 error message |
| A3 | Register with weak password | 400 validation error |
| A4 | Login with correct credentials | Token issued, role-based redirect |
| A5 | Login with wrong password | 401 generic error |
| A6 | Open protected page without login | Redirect to login |
| A7 | User opens admin page/API | 403 / redirect |

### Tickets (User)
| # | Scenario | Expected |
|---|---|---|
| T1 | Raise ticket with valid data | Ticket `NT-xxxx`, status Pending |
| T2 | Raise ticket with empty title | Validation error |
| T3 | View own tickets | Only own tickets listed |
| T4 | Open another user's ticket by ID | 403 |
| T5 | Search by title / ticket ID | Matching results only |
| T6 | Edit ticket after status is In Progress | Rejected |

### Admin
| # | Scenario | Expected |
|---|---|---|
| D1 | View all tickets | Tickets from all users with owner names |
| D2 | Filter by status + priority | Correct subset |
| D3 | Update status to Resolved with remarks | Saved, history appended, email sent |
| D4 | Delete ticket | Removed, confirmation shown |
| D5 | Dashboard numbers | Match database counts |

### Bonus
| # | Scenario | Expected |
|---|---|---|
| B1 | Upload 5 MB image | Rejected (size) |
| B2 | Upload `.exe` renamed to `.png` | Rejected (type check) |
| B3 | Status change | User receives email |

---

## Definition of Done
- All Must requirements in `PRD.md` pass.
- No secrets in the Git history.
- App works on mobile width and desktop.
- Deployed link and README are ready.
