# Frontend (TinyTribe)

This is the Next.js frontend for TinyTribe.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment Variables

Create `apps/frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_UNSPLASH_KEY=your_unsplash_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

Notes:

- When running the full stack with `vercel dev` from the repo root, frontend is usually on `http://localhost:3001` and API on `http://localhost:3000`.
- `NEXT_PUBLIC_API_URL` should point to the backend origin.

## Local Development

From `apps/frontend`:

```bash
npm run dev
```

Open `http://localhost:3001` (or the port printed by Next.js).

## Build

```bash
npm run build
```

If auth-related build issues appear on `/login`, ensure there are no server-only hooks in navbar/client components and restart the dev server.

## Deployment

On Vercel, set:

```env
NEXT_PUBLIC_API_URL=https://traveltots-backend.vercel.app
NEXT_PUBLIC_MAPBOX_TOKEN=...
NEXT_PUBLIC_UNSPLASH_KEY=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
```

## Auth UX Notes

- OAuth success/error toasts are triggered from query params after redirect.
- Session state in navbar is fetched with `credentials: include` and `cache: no-store` for reliable refresh behavior.