# Nettech Help Desk Ticket Management System

A full-stack IT service desk and support ticket management application built with Node.js, Express, MongoDB, and modern vanilla JavaScript with Bootstrap 5.

---

## 🚀 Key Features

- **Authentication & RBAC**:
  - Employee self-registration and login.
  - Secure bcrypt password hashing and stateless JWT tokens (supporting both httpOnly cookies and Authorization Bearer header).
  - Protected user and admin route guards.
- **User / Employee Portal**:
  - Dashboard with summary metric cards (Total, Pending, In Progress, Resolved/Closed).
  - Raise support tickets with category, priority, and atomic human-readable ticket numbers (`NT-0001`, `NT-0002`).
  - Search own tickets and filter by status.
  - Detailed ticket tracking with status audit trail and IT technician remarks.
  - Edit ticket content while in *Pending* status.
  - Profile management: update details, change password, and upload profile picture (JPG/PNG ≤ 2 MB with automatic cleanup of obsolete photos).
- **Admin Management Portal**:
  - Comprehensive IT Operations Dashboard with Chart.js visualization for tickets by status and priority.
  - 6 KPI metric stat cards: Total, Pending, In Progress, Resolved, Closed, and Last 7 Days.
  - Manage company tickets table with debounced live search, multi-criteria filters (status, priority, category), and pagination.
  - Quick status update modal with remark notes.
  - Ticket deletion with safety confirmation modal.
  - Company employee directory view.
- **Bonus & Security Hardening**:
  - Ticket Priority (Low, Medium, High) with visual and text badges.
  - Non-blocking asynchronous email notification dispatched upon ticket creation and status changes.
  - Profile picture upload validation (enforcing 2 MB limit and MIME/extension matching).
  - Security headers via Helmet, CORS configuration, Rate Limiter on login, and NoSQL injection sanitizer.
  - XSS protection with safe DOM population (`textContent`).

---

## 🛠️ Tech Stack

- **Backend**: Node.js 18+, Express 4, Mongoose 8
- **Database**: MongoDB Atlas (with in-memory dev fallback when offline)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons, Chart.js
- **Utilities**: Multer, Nodemailer, Bcryptjs, JSONWebToken, Express-Validator, Helmet, Express-Rate-Limit, Express-Mongo-Sanitize

---

## 📁 Project Structure

```
nettech-helpdesk/
├── config/
│   └── db.js                 # MongoDB connection logic
├── controllers/
│   ├── authController.js     # Register, login, logout, me
│   ├── userController.js     # Profile, password, avatar upload, users list
│   ├── ticketController.js   # Ticket CRUD, search, history, remarks
│   └── dashboardController.js# Aggregated stats for admin and user
├── middleware/
│   ├── auth.js               # JWT protect & role authorization
│   ├── validate.js           # express-validator evaluation
│   ├── upload.js             # Multer config (2 MB, JPG/PNG)
│   └── errorHandler.js       # Central error responder
├── models/
│   ├── User.js               # User schema
│   ├── Ticket.js             # Ticket schema with embedded statusHistory
│   └── Counter.js            # Atomic sequence counter for NT-XXXX IDs
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── ticketRoutes.js
│   └── dashboardRoutes.js
├── utils/
│   ├── generateToken.js      # JWT signing
│   ├── generateTicketId.js   # Atomic sequential ID generator
│   └── sendEmail.js          # Non-blocking email dispatcher
├── scripts/
│   ├── seedAdmin.js          # CLI script to seed administrator
│   └── testRunner.js         # Automated test suite (A1-A7, T1-T6, D1-D5, B1-B3)
├── uploads/
│   └── profile/              # Uploaded user avatars
├── public/                   # Frontend SPA/MPA assets
│   ├── index.html            # Public login
│   ├── register.html         # Public registration
│   ├── user/                 # Employee pages
│   │   ├── dashboard.html
│   │   ├── raise-ticket.html
│   │   ├── ticket-detail.html
│   │   └── profile.html
│   ├── admin/                # Admin pages
│   │   ├── dashboard.html
│   │   ├── tickets.html
│   │   ├── ticket-detail.html
│   │   └── users.html
│   ├── css/
│   │   └── style.css         # Modern SaaS CSS with dark mode variables
│   └── js/
│       ├── api.js            # Fetch wrapper, toast notifications, theme
│       └── guard.js          # Role & auth redirection guard
├── server.js                 # Express server entry point
├── package.json
├── .env.example
└── .gitignore
```

---

## ⚙️ Installation & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your MongoDB Atlas URI is set:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nettech_helpdesk?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_nettech_2026
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5000

ADMIN_NAME=Nettech Admin
ADMIN_EMAIL=admin@nettech.com
ADMIN_PASSWORD=ChangeMe@123

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="Nettech Help Desk <your_email@gmail.com>"
```
*(Note: If no Atlas cluster is provided, the system gracefully falls back to an embedded in-memory MongoDB instance for local testing).*

### 3. Seed Default Admin Account
```bash
npm run seed:admin
```
Default credentials:
- **Email**: `admin@nettech.com`
- **Password**: `ChangeMe@123`

### 4. Start the Application
- **Development**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```
Navigate to: `http://localhost:5000`

---

## 🧪 Automated Test Verification

Run the automated test suite covering all PRD & TASKS.md criteria:
```bash
npm run test:all
```
All **21/21 tests pass**:
- `A1` - `A7`: Registration, validation, duplicate prevention, password constraints, login, unauthenticated route protection, role authorization (403).
- `T1` - `T6`: Raising tickets (`NT-XXXX`), title validation, scoping to owner, cross-user 403 prevention, ticket ID and title search, blocking edits on in-progress tickets.
- `D1` - `D5`: Admin viewing all tickets with user populates, filtering by status and priority, status and remark updates, ticket deletion, real-time dashboard count verification.
- `B1` - `B3`: File upload 2 MB limit enforcement, file MIME/extension rejection, non-blocking email triggers and audit history tracking.
