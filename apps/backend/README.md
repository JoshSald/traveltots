# Backend (TinyTribe)

This is the backend API for TinyTribe.

It provides:
- Better Auth endpoints (`/api/auth/*`)
- Listings endpoint (`/api/listings/near`)
- Health endpoint (`/api/health`)

## Stack

- Node.js + TypeScript
- Better Auth
- MongoDB (MongoDB driver + Mongoose models)
- Express-compatible handlers for API routes

## Scripts

From `apps/backend`:

```bash
npm run build
npm run seed
```

Note: this package does not currently include a dedicated `dev` script.
For local full-stack development, run `vercel dev` from the repo root.

## Environment Variables

Create `apps/backend/.env.local` for local development:

```env
PORT=3000
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001

BETTER_AUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

MONGODB_URI=your_mongodb_uri
MONGO_DB_MONGODB_URI=your_mongodb_uri
```

## Local Development

From repo root:

```bash
vercel dev
```

Typical routing:
- Frontend: `http://localhost:3001`
- Backend/API: `http://localhost:3000`

## OAuth (Google)

In Google Cloud Console for your OAuth client:

Authorized redirect URIs:
- `http://localhost:3000/api/auth/callback/google`
- `https://traveltots-backend.vercel.app/api/auth/callback/google`

Authorized JavaScript origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `https://traveltots-frontend.vercel.app`
- `https://traveltots-backend.vercel.app`

## Deploy (Vercel)

Set these environment variables in the backend Vercel project:

```env
BETTER_AUTH_URL=https://traveltots-backend.vercel.app
FRONTEND_URL=https://traveltots-frontend.vercel.app
CORS_ORIGINS=https://traveltots-frontend.vercel.app

BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

MONGODB_URI=...
MONGO_DB_MONGODB_URI=...
```

Redeploy after changing env vars.

## Troubleshooting

- `state_not_found` during OAuth callback:
  - Ensure callback query params are preserved by the auth handler.
  - Ensure `BETTER_AUTH_URL`, `FRONTEND_URL`, and Google redirect URI values match exactly.

- `redirect_uri_mismatch` from Google:
  - Add exact callback URI in Google OAuth settings.

- CORS errors from frontend:
  - Ensure frontend origin is included in `CORS_ORIGINS` and matches the active port/domain.
