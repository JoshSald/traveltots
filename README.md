# TinyTribe

**TinyTribe** is a peer-to-peer marketplace that allows parents to temporarily borrow baby and kids gear nearby.

Built as a 4-week MVP.

---

## Project Structure
```
traveltots/
  apps/
    frontend/    # Next.js (App Router)
    backend/     # Express API
  packages/
    shared/      # Shared TypeScript types
  package.json
  README.md
```
This project uses npm workspaces.

---

## Tech Stack

**Frontend**
- Next.js (TypeScript, App Router)
- Tailwind CSS
- shadcn/ui
- Mapbox (mapbox-gl)
- Sonner (toasts)

**Backend**
- Node.js (TypeScript)
- Express
- MongoDB (Mongoose)
- Better Auth

**Monorepo**
- npm workspaces

---

## Usage

1. **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd traveltots
    ```
2. **Install all dependencies**
    From the root directory:
    ```bash
    npm install
    ```
    This installs dependencies for:
    - apps/frontend
    - apps/backend
    - packages/shared
3. **Env variables**

    apps/backend/.env.local
    ```env
    PORT=3000
    BETTER_AUTH_URL=http://localhost:3000
    FRONTEND_URL=http://localhost:3001
    CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001

    BETTER_AUTH_SECRET=your_secret
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret

    MONGODB_URI=your_mongodb_connection_string
    MONGO_DB_MONGODB_URI=your_mongodb_connection_string
    ```

    apps/frontend/.env
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:3000
    NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
    NEXT_PUBLIC_UNSPLASH_KEY=your_unsplash_key
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
    ```

4. **Run the project**

   From the root directory:

   Recommended (routes frontend + backend together):
   ```bash
   vercel dev
   ```

   Typical local routing with `vercel dev`:
   - Frontend: http://localhost:3001
   - Backend API/Auth: http://localhost:3000

   Or run only the frontend from this monorepo:
   ```bash
   npm run dev:frontend
   ```

   If you add a backend dev script later, this command will work:
   ```bash
   npm run dev:backend
   ```

---

## Google OAuth Setup

In Google Cloud Console for your OAuth client:

- Authorized redirect URIs:
  - http://localhost:3000/api/auth/callback/google
  - https://traveltots-backend.vercel.app/api/auth/callback/google

- Authorized JavaScript origins:
  - http://localhost:3000
  - http://localhost:3001
  - https://traveltots-frontend.vercel.app
  - https://traveltots-backend.vercel.app

---

## Vercel Deployment

Frontend project environment variables:

```env
NEXT_PUBLIC_API_URL=https://traveltots-backend.vercel.app
NEXT_PUBLIC_MAPBOX_TOKEN=...
NEXT_PUBLIC_UNSPLASH_KEY=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
```

Backend project environment variables:

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

After env updates on Vercel, redeploy both frontend and backend.

---

## MVP Scope

The MVP includes:

- User authentication
- Create and view listings
- Geo-based listing search
- Map integration
- Date-based booking system with conflict validation
- Basic user dashboard

Not included in MVP:

- Payments (Stripe)
- Messaging between users
- Delivery logistics
- Trading system
