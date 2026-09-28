# LeadFlow — MERN Developer Assignment

LeadFlow is a multi-tenant lead and document platform for mortgage brokerages.

## Included features

- Multi-tenant brokerage isolation
- JWT authentication
- Four roles: platform admin, brokerage admin, advisor, client
- Lead CRUD
- External lead webhook
- Duplicate lead detection
- Live pipeline with Socket.IO
- Lead → client conversion
- Client document upload
- Background document checking
- Email templates with placeholders
- Pipeline email triggers
- Pipeline task triggers
- Dashboard counters
- Demo seed data
- Local file storage in development
- Optional Cloudinary storage
- Optional Redis/BullMQ
- Optional Resend email
- Production-ready environment variable structure

## Quick start

### 1. Install

Open two terminals.

Terminal 1:

```bash
cd server
npm install
npm run seed
npm run dev
```

Terminal 2:

```bash
cd client
npm install
npm run dev
```

Open:

http://localhost:5173

### 2. MongoDB

Create a MongoDB Atlas database user and put the connection string in:

`server/.env`

Example:

```env
MONGO_URI=mongodb+srv://sudhanshut120_db_user:YOUR_DATABASE_PASSWORD@cluster0.fxblzjz.mongodb.net/leadflow?retryWrites=true&w=majority&appName=Cluster0
```

The password in the connection string is the **MongoDB database-user password**, not your Atlas login password.

If the password contains characters such as `@`, `#`, `/`, `:`, `?`, URL-encode them.

### 3. Demo accounts

After running:

```bash
cd server
npm run seed
```

use:

- Platform Admin: platform@leadflow.test
- Brokerage Admin: admin@leadflow.test
- Advisor: advisor@leadflow.test
- Client: client@leadflow.test

Password for all:

`Password123!`

## Optional services

The application works locally with MongoDB only.

### Redis/BullMQ

If `REDIS_URL` is configured, document checking and email jobs use BullMQ + Redis.

If Redis is not configured, LeadFlow automatically uses a local delayed worker so the project remains runnable for the assignment demo.

### Cloudinary

If Cloudinary variables are configured, uploaded documents go to Cloudinary.

If they are not configured, development uploads are stored in `server/uploads`.

### Resend

If `RESEND_API_KEY` is configured, email jobs send through Resend.

If it is not configured, the email worker logs the email to the server console.

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/leads`
- `POST /api/leads`
- `PATCH /api/leads/:id/status`
- `POST /api/leads/:id/convert`
- `GET /api/clients`
- `POST /api/documents`
- `GET /api/documents`
- `GET /api/tasks`
- `PATCH /api/tasks/:id/complete`
- `GET /api/email-templates`
- `POST /api/email-templates`
- `PATCH /api/email-templates/:id`
- `GET /api/dashboard`
- `POST /api/webhooks/leads`
- `GET /health`

## External webhook

Send:

```json
{
  "brokerageId": "BROKERAGE_ID",
  "externalLeadId": "external-1001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+49123456789",
  "source": "website"
}
```

to:

`POST http://localhost:5000/api/webhooks/leads`

The dashboard exposes the brokerage ID to make testing easier.

## Deployment

Frontend:
- Vercel

Backend:
- Render

Database:
- MongoDB Atlas

Optional:
- Upstash Redis
- Cloudinary
- Resend

See `DEPLOYMENT.md`.

## Important

Do not commit `server/.env` or production secrets.

The assignment requires the AI prompts used during development to be submitted. Keep your own complete, chronological prompt history in `PROMPTS.md` and add any additional prompts you use during development.


## Current hosting status

At this stage the frontend and backend are local development services. Only MongoDB is hosted remotely in MongoDB Atlas. Production deployment to Vercel + Render is documented in `DEPLOYMENT.md` but has not been performed by this ZIP.
