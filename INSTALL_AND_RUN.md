# LeadFlow — Windows / VS Code setup

## 1. Prerequisites

Install:
- Node.js LTS
- VS Code
- MongoDB Atlas account (already created)

Check Node:
```bash
node -v
npm -v
```

## 2. MongoDB Atlas

The project is configured for the Atlas cluster shown in the supplied screenshot:

```text
mongodb+srv://sudhanshut120_db_user:<db_password>@cluster0.fxblzjz.mongodb.net/...
```

Open `server/.env` and replace `<db_password>` with the password of the Atlas database user `sudhanshut120_db_user`.

IMPORTANT: this is the database user's password, not necessarily the Atlas website login password.

If your password contains `@`, `#`, `/`, `:`, `?`, `%`, etc., URL-encode it.

Example:
```text
My@Pass123
```
becomes:
```text
My%40Pass123
```

Also check Atlas:
Security → Network Access → IP Access List

For local development, add your current public IP. For a temporary assignment-only setup you can use `0.0.0.0/0`, but that allows access from anywhere and should not be used casually in production.

## 3. Open the project

Extract the ZIP.

In VS Code:
File → Open Folder → `leadflow`

## 4. Install backend

Open Terminal 1:

```bash
cd server
npm install
```

Then seed demo data:

```bash
npm run seed
```

Then start backend:

```bash
npm run dev
```

Backend:
```text
http://localhost:5000
```

Test:
```text
http://localhost:5000/health
```

You should get:
```json
{"status":"ok","service":"leadflow-api"}
```

## 5. Install frontend

Open Terminal 2:

```bash
cd client
npm install
npm run dev
```

Vite will show a local URL, normally:

```text
http://localhost:5173
```

Open that URL in the browser.

## 6. Login

Brokerage Admin:

```text
Email: admin@leadflow.test
Password: Password123!
```

Other seeded users:

```text
platform@leadflow.test
advisor@leadflow.test
client@leadflow.test
```

Password for all:

```text
Password123!
```

## 7. What is hosted where right now?

During local development:

```text
Browser
   ↓
React/Vite frontend
http://localhost:5173
   ↓ HTTP / Socket.IO
Node/Express backend
http://localhost:5000
   ↓
MongoDB Atlas
cloud.mongodb.com
```

So:

- Frontend: NOT deployed yet. It runs locally through Vite.
- Backend: NOT deployed yet. It runs locally through Node.js.
- Database: hosted in MongoDB Atlas.
- Socket.IO: runs inside the local backend.
- Uploaded development files: local `server/uploads` folder.

## 8. Production deployment later

Recommended assignment deployment:

```text
React frontend → Vercel
Node/Express API → Render
MongoDB → MongoDB Atlas
```

Optional services:
- Redis → Upstash
- Files → Cloudinary
- Email → Resend

See `DEPLOYMENT.md`.

## 9. Fastest way to run every time

Terminal 1:
```bash
cd server
npm run dev
```

Terminal 2:
```bash
cd client
npm run dev
```

You only need `npm install` once unless dependencies change.

## 10. If MongoDB connection fails

Check these in order:

1. `server/.env` contains the real password.
2. The username is exactly `sudhanshut120_db_user`.
3. Atlas Network Access allows your IP.
4. The password is URL-encoded if it has special characters.
5. The Atlas cluster is running.
6. Restart `npm run dev` after changing `.env`.


## If you see the two errors from the earlier screenshots

### Backend:
`querySrv ECONNREFUSED _mongodb._tcp.cluster0.fxblzjz.mongodb.net`

This is a DNS resolver problem. The updated server already tries public DNS. If it persists, run:

```powershell
nslookup -type=SRV _mongodb._tcp.cluster0.fxblzjz.mongodb.net
```

Then fix Windows DNS/VPN/firewall as described in `TROUBLESHOOTING.md`.

### Frontend:
`Uncaught ReferenceError: React is not defined`

The updated project includes the Vite React plugin and an explicit React import. Restart the frontend with:

```bash
cd client
npm run dev
```
