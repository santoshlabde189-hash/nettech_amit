# Setup & Deployment Guide
## Nettech Help Desk Ticket Management System

## 1. Prerequisites
- Node.js 18+ and npm
- Git
- MongoDB Atlas account (free)
- VS Code + Postman (recommended)

## 2. Create the Project
```bash
mkdir nettech-helpdesk && cd nettech-helpdesk
npm init -y
npm install express mongoose dotenv bcryptjs jsonwebtoken cookie-parser cors helmet \
  express-rate-limit express-mongo-sanitize express-validator multer nodemailer morgan
npm install -D nodemon
```

`package.json` scripts:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "seed:admin": "node scripts/seedAdmin.js"
}
```

## 3. MongoDB Atlas
1. Create a free **M0 cluster**.
2. **Database Access** → add a database user (username + strong password).
3. **Network Access** → add your IP (`0.0.0.0/0` for dev only).
4. **Connect → Drivers** → copy the connection string.
5. Add the DB name `nettech_helpdesk` before the `?`.

## 4. Environment Files

`.env` (local only, never commit):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nettech_helpdesk?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_string
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

`.env.example`: same keys with empty or dummy values (this one is committed).

`.gitignore`:
```
node_modules/
.env
uploads/*
!uploads/.gitkeep
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 5. Minimal `server.js`
```js
require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
connectDB();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## 6. Seed Admin Script (`scripts/seedAdmin.js`)
```js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (exists) { console.log('Admin already exists'); process.exit(0); }
  await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL,
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
    role: 'admin'
  });
  console.log('Admin created');
  process.exit(0);
})();
```

## 7. Run Locally
```bash
npm run seed:admin     # once
npm run dev
```
Open `http://localhost:5000`.

## 8. Gmail SMTP (for email notifications)
1. Enable 2-Step Verification on the Google account.
2. Create an **App Password** (Google Account → Security → App passwords).
3. Use that 16-character value as `SMTP_PASS`. Do not use your normal password.

## 9. Deployment (Render example)
1. Push code to GitHub (confirm `.env` is **not** included).
2. Render → **New Web Service** → connect repo.
3. Build command: `npm install` · Start command: `npm start`.
4. Add all `.env` variables in the **Environment** tab, with `NODE_ENV=production` and `CLIENT_URL` set to the Render URL.
5. In Atlas **Network Access**, allow Render's outbound IPs (or `0.0.0.0/0`).
6. Run the admin seed once via the Render shell, or locally pointing at the same `MONGODB_URI`.
7. Use cloud storage (Cloudinary/S3) for profile pictures, since Render's disk resets on redeploy.

## 10. Troubleshooting
| Problem | Fix |
|---|---|
| `MongoServerSelectionError` | IP not whitelisted in Atlas, or wrong URI |
| `Authentication failed` | Wrong DB user/password; URL-encode special characters |
| CORS error | `CLIENT_URL` must match the browser origin |
| 401 on every request | Token missing/expired; check cookie or header |
| Email not sending | Use an App Password; check port 587 |
| Uploads vanish after deploy | Ephemeral disk; switch to cloud storage |

## 11. Security Checklist Before Submission
- [ ] `.env` is in `.gitignore` and was never committed
- [ ] Default admin password changed
- [ ] Atlas password rotated if it was ever shared or pushed
- [ ] Admin routes return 403 for normal users
- [ ] Passwords are hashed in the database
