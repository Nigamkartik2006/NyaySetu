# CampusGuard — Campus Grievance & Incident Reporting Platform

**CampusGuard** is an institutional transparency and grievance reporting platform designed to empower students to securely report serious campus complaints, track case resolution, and prevent complaints from being silently suppressed.

---

## 🚀 Technology Stack

### Frontend
- **React 18**
- **Vite 6**
- **Tailwind CSS v3**
- **React Router v6**
- **Lucide React Icons**

### Backend
- **Node.js**
- **Express.js**
- **MySQL2 Connection Pool** (`mysql2/promise`)
- **JSON Web Tokens (JWT)** (`jsonwebtoken`)
- **Password Hashing** (`bcryptjs`)

### Database
- **MySQL 8.0+** (`campus_grievance` database)

---

## 🔐 User Roles & Permissions Matrix

| Role | Database Value | Public Registration | Portal Access |
| :--- | :--- | :--- | :--- |
| **Student** | `student` | ✅ Allowed | `/student/dashboard` |
| **College Official** | `official` | ❌ Restricted (Login Only) | `/official/dashboard` |
| **Admin** | `admin` | ❌ Restricted (Login Only) | `/admin/dashboard` |

---

## 🗝️ Test Credentials

The database script automatically seeds test accounts for all three roles upon server startup:

| Role | Email | Password | Student ID / Details |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campusguard.edu` | `Student@123` | `STU-2026-001` |
| **College Official** | `official@campusguard.edu` | `Official@123` | N/A |
| **Admin** | `admin@campusguard.edu` | `Admin@123` | N/A |

> **Note**: Public registration is enabled for new Student accounts on the `/register` page.

---

## 🛠️ MySQL Database Setup Instructions

1. Ensure MySQL Server 8.0+ is installed and running on `localhost:3306`.
2. Configure credentials in `server/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=Gilbil@2006
   DB_NAME=campus_grievance
   DB_PORT=3306
   ```
3. Initialize Database Schema & Seed Data (Optional CLI command):
   ```bash
   cd server
   npm run db:init
   ```
   *(Note: The Express backend also runs database initialization automatically on server startup.)*

---

## ⚙️ Environment Variables (`server/.env.example`)

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_grievance
DB_PORT=3306
JWT_SECRET=campus_guard_super_secret_jwt_key_2026_secure
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
```

---

## 💻 How to Run the Application

### 1. Start Express Backend
```bash
cd server
npm install
npm run dev   # Runs backend at http://localhost:5000
```

### 2. Start React + Vite Frontend
```bash
cd client
npm install
npm run dev   # Runs frontend at http://localhost:5173
```

---

## 🛡️ Authentication & Authorization Flow

1. **Role Selection**: The user selects one of the 3 role cards on the landing page (`/`).
2. **Registration Enforcement**: Public registration is permitted **only** for the `student` role. Registration requests for `official` or `admin` roles are rejected by both the frontend UI and the backend API (`POST /api/auth/register`).
3. **Strict Database Role Verification**: During login (`POST /api/auth/login`), the backend:
   - Verifies the user exists in MySQL.
   - Verifies password using `bcrypt.compare()`.
   - **Verifies that the user's actual database `role` matches the `selectedRole` requested by the client**. If a student selects `admin` on the login screen, the server rejects the request with HTTP 403: `"You are not authorized to access this role."`
4. **JWT Verification & Route Guarding**: On successful login, a signed JWT containing `{ userId, email, role, full_name, student_id }` is issued. React's `<ProtectedRoute>` guards client routes and automatically redirects users attempting to access unauthorized dashboards.

---

## 📁 Project Structure & Files Created

```
NyaySetu/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Sidebar.jsx
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── RoleSelectionPage.jsx
│       │   │   ├── LoginPage.jsx
│       │   │   └── RegisterPage.jsx
│       │   ├── student/
│       │   │   ├── StudentDashboard.jsx
│       │   │   └── PlaceholderStudentPage.jsx
│       │   ├── official/
│       │   │   └── OfficialDashboard.jsx
│       │   └── admin/
│       │       └── AdminDashboard.jsx
│       └── services/
│           └── api.js
│
├── server/
│   ├── package.json
│   ├── server.js
│   ├── .env
│   ├── .env.example
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── routes/
│   │   └── authRoutes.js
│   └── scripts/
│       └── initDb.js
│
├── database/
│   └── schema.sql
├── .gitignore
├── .env.example
└── README.md
```
