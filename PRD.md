# Product Requirements Document (PRD)
## Nettech Help Desk Ticket Management System

| Field | Value |
|---|---|
| Version | 1.0 |
| Type | Full Stack Internship Project |
| Stack | HTML, CSS, JavaScript, Bootstrap 5 · Node.js + Express · MongoDB Atlas |

---

## 1. Overview
Nettech Help Desk is a mini company IT support system. Employees raise support tickets for technical issues and track their progress. Administrators view, search, update, and delete tickets and monitor activity through a statistics dashboard.

## 2. Goals
- Deliver a working end-to-end flow: **Frontend → REST API → Database**.
- Let employees raise and track tickets without email back-and-forth.
- Give admins a single place to manage and resolve tickets.
- Demonstrate authentication, CRUD, search, responsive UI, and dashboard statistics.

### Non-Goals (v1)
- Live chat, SLA timers, multi-tenant organisations, mobile native apps, third-party ticketing integrations.

## 3. User Roles
| Role | Description |
|---|---|
| **User (Employee)** | Registers, logs in, raises tickets, views own ticket status, edits own profile. |
| **Admin** | Logs in (account is seeded, not self-registered), views all tickets, updates status, deletes tickets, views dashboard. |

## 4. Functional Requirements

### 4.1 Authentication
| ID | Requirement | Priority |
|---|---|---|
| AUTH-1 | Users can register with name, email, password. | Must |
| AUTH-2 | Users and admins can log in with email + password. | Must |
| AUTH-3 | Passwords are hashed; sessions use JWT. | Must |
| AUTH-4 | Role-based access: user pages and admin pages are protected. | Must |
| AUTH-5 | Logout clears the session. | Must |

### 4.2 User Module
| ID | Requirement | Priority |
|---|---|---|
| USR-1 | Raise a ticket: title, description, category (priority optional bonus). | Must |
| USR-2 | View list of own tickets with status badges. | Must |
| USR-3 | View ticket detail including status history and admin remarks. | Must |
| USR-4 | Search own tickets by ID, title, or status filter. | Must |
| USR-5 | Edit profile: name, phone, department; change password. | Must |
| USR-6 | Edit/cancel own ticket while status is *Pending*. | Should |

### 4.3 Admin Module
| ID | Requirement | Priority |
|---|---|---|
| ADM-1 | View all tickets from all users in a paginated table. | Must |
| ADM-2 | Search/filter by ticket ID, title, user, status, priority, category. | Must |
| ADM-3 | Update ticket status (Pending → In Progress → Resolved → Closed) and add remarks. | Must |
| ADM-4 | Delete a ticket (with confirmation). | Must |
| ADM-5 | Dashboard: total tickets, count per status, count per priority, recent tickets. | Must |
| ADM-6 | View list of registered users. | Could |

### 4.4 Bonus Features
| ID | Requirement |
|---|---|
| BON-1 | **Ticket Priority**: High / Medium / Low, selectable at creation, editable by admin. |
| BON-2 | **Email Notifications**: email user on ticket creation and on every status change. |
| BON-3 | **Profile Picture Upload**: JPG/PNG up to 2 MB shown in navbar and profile page. |

## 5. Ticket Lifecycle
```
Pending ──► In Progress ──► Resolved ──► Closed
   │
   └──► (Deleted by Admin / Cancelled by User while Pending)
```

## 6. User Stories
- As an employee, I want to register and log in so that my tickets are tied to me.
- As an employee, I want to describe my issue and submit it so IT can help me.
- As an employee, I want to see whether my ticket is pending, in progress, or resolved.
- As an employee, I want to update my profile and picture.
- As an admin, I want to see every ticket so I can prioritise work.
- As an admin, I want to search tickets quickly so I can find a specific one.
- As an admin, I want to change status and leave remarks so users know progress.
- As an admin, I want to delete invalid or duplicate tickets.
- As an admin, I want a dashboard with statistics to understand workload at a glance.

## 7. Acceptance Criteria (key flows)
1. **Register/Login**: a new user can register, log in, and land on the user dashboard; wrong credentials show an error.
2. **Raise Ticket**: submitting valid data creates a ticket with a unique ID (e.g. `NT-0001`) and status *Pending*.
3. **Track**: the user sees only their own tickets; status updates made by admin appear on refresh.
4. **Admin Update**: changing status saves, records history, and (if enabled) sends an email.
5. **Delete**: deleted tickets disappear from all views.
6. **Dashboard**: counts match the actual data in the database.
7. **Access Control**: a user opening an admin URL or API gets 403; no token gets 401.
8. **Responsive**: all pages are usable at 360 px, 768 px and 1280 px widths.

## 8. UI Pages
| Page | Role |
|---|---|
| Landing / Login | Public |
| Register | Public |
| User Dashboard (my tickets + quick stats) | User |
| Raise Ticket | User |
| Ticket Detail | User / Admin |
| Edit Profile | User |
| Admin Dashboard (stats, charts, recent tickets) | Admin |
| Manage Tickets (table, search, filters) | Admin |
| Users List (optional) | Admin |

## 9. Non-Functional Requirements
- **Security**: hashed passwords, input validation, protected routes, secrets in `.env`.
- **Performance**: list endpoints respond < 500 ms for up to 10k tickets (indexed, paginated).
- **Usability**: Bootstrap 5, consistent status colours, clear form errors.
- **Compatibility**: latest Chrome, Edge, Firefox, Safari.
- **Maintainability**: modular folder structure, documented API.

## 10. Success Metrics
- All Must requirements pass acceptance criteria.
- No unprotected admin endpoint.
- Demo-able end-to-end flow on a deployed URL.

## 11. Risks
| Risk | Mitigation |
|---|---|
| Credentials leaked in Git | `.env` in `.gitignore`; rotate Atlas password if exposed. |
| Atlas IP blocking | Add current IP / `0.0.0.0/0` (dev only) in Atlas Network Access. |
| Email delivery failures | Treat email as non-blocking; log errors. |
