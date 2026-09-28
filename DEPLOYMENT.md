# LeadFlow deployment

## Backend — Render

Create a Render Web Service connected to this repository.

Root directory:

```text
server
```

Build command:

```text
npm install
```

Start command:

```text
npm start
```

Add environment variables:

```text
MONGO_URI
JWT_SECRET
CLIENT_URL
REDIS_URL                 # optional
CLOUDINARY_CLOUD_NAME     # optional
CLOUDINARY_API_KEY        # optional
CLOUDINARY_API_SECRET     # optional
RESEND_API_KEY            # optional
EMAIL_FROM                # optional
```

Set `CLIENT_URL` to your Vercel URL after the frontend is deployed.

The server listens on `process.env.PORT`.

## Frontend — Vercel

Create a Vercel project from the same repository.

Root directory:

```text
client
```

Build command:

```text
npm run build
```

Environment variables:

```text
VITE_API_URL=https://YOUR-BACKEND.onrender.com/api
VITE_SOCKET_URL=https://YOUR-BACKEND.onrender.com
```

`vercel.json` is included for React Router SPA routes.

## MongoDB Atlas

Create a database user.

Use:

```text
mongodb+srv://USERNAME:PASSWORD@cluster0.fxblzjz.mongodb.net/leadflow
```

Allow your deployed backend to reach the cluster through Atlas Network Access.

## Redis

Optional for the assignment demo. If used, put the Redis connection string in `REDIS_URL`.

## Cloudinary

Optional. Add:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

## Resend

Optional. Add:

```text
RESEND_API_KEY
EMAIL_FROM
```

For production sending, verify your sending domain.

## Deployment test

Backend:

```text
https://YOUR-BACKEND.onrender.com/health
```

Frontend:

```text
https://YOUR-FRONTEND.vercel.app
```
