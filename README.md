# TravelTots

**TravelTots** is a peer-to-peer marketplace that allows parents to temporarily borrow baby and kids gear nearby.

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
- Mapbox (react-map-gl)

**Backend**
- Node.js (TypeScript)
- Express
- MongoDB (Mongoose)

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

    apps/backend/.env
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret
    ```

    apps/frontend/.env.local
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5000
    NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
    ```

4. **Run the project**

   From the root directory:

   Run frontend:
   ```bash
   npm run dev:frontend
   ```

   Run backend:
   ```bash
   npm run dev:backend
   ```

   Frontend runs on: http://localhost:3000  
   Backend runs on: http://localhost:5000

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
