# 🚀 NyaySetu Platform — Production Deployment Guide

NyaySetu is configured for **Unified Production Deployment**, where the Express backend API and React single-page frontend run together on a single port.

---

## 🛠️ Build & Local Production Command

To build and run the production deployment locally or on a server:

```bash
# 1. Install dependencies & build client bundle
npm run postinstall
npm run build

# 2. Start the unified production server
npm start
```

Once started, the full platform is live at `http://localhost:5000` (or `process.env.PORT`).

---

## ☁️ Option A: 1-Click Cloud Deployment (Render.com)

1. Push this codebase to GitHub / GitLab.
2. Log in to [Render.com](https://render.com) and click **New -> Web Service**.
3. Connect your GitHub repository.
4. Set the following build and start configuration:
   - **Environment**: `Node`
   - **Build Command**: `npm run postinstall && npm run build`
   - **Start Command**: `npm start`
5. Configure Environment Variables in Render:
   - `SMTP_USER`: `k525ing@gmail.com`
   - `SMTP_PASS`: `xdkvaotfgazmgkmg`
   - `ESCALATION_EMAIL_RECIPIENT`: `k525ing@gmail.com`
   - `OVERSIGHT_EMAIL_RECIPIENT`: `k525ing@gmail.com`
   - `COMPLAINT_RESPONSE_TIMEOUT_MINUTES`: `1440`
   - `DB_HOST`: `<Your MySQL Host>`
   - `DB_USER`: `<Your MySQL User>`
   - `DB_PASSWORD`: `<Your MySQL Password>`
   - `DB_NAME`: `campus_grievance`
   - `JWT_SECRET`: `campus_guard_super_secret_jwt_key_2026_secure`

---

## 🖥️ Option B: Deploying on VPS / Dedicated Server (PM2 & Nginx)

1. Clone repository to server:
   ```bash
   git clone <your-repo-url> /var/www/NyaySetu
   cd /var/www/NyaySetu
   ```

2. Install PM2 process manager:
   ```bash
   npm install -g pm2
   ```

3. Build and launch with PM2:
   ```bash
   npm run postinstall
   npm run build
   cd server
   pm2 start server.js --name "nyaysetu-backend"
   pm2 save
   pm2 startup
   ```

---

## 🔐 System Health Check & SLA Scheduler

- **Health Check Endpoint**: `GET /api/health`
- **Background SLA Scheduler**: Active automatically upon server start, inspecting 24-hour response SLAs every 15 seconds.
- **Immediate Danger Emergency Alerts**: Automatically dispatches Google SMTP emails to `k525ing@gmail.com` whenever safety risks are flagged.
