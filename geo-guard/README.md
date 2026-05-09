# Geo Guard

Smart Tourist Safety Monitoring & Incident Response System built as a compact Next.js hackathon MVP.

## Stack

- Next.js App Router
- JavaScript
- Tailwind CSS
- MongoDB + Mongoose
- Next.js API routes
- Polling-based live updates

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## MongoDB

Create `.env.local` when you want persistent MongoDB storage:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/geo-guard
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Without `MONGODB_URI`, the app uses in-memory demo data so it can run immediately during a presentation.

Without `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, the app uses a demo map fallback. After adding or changing this key, restart `npm run dev`.

## Demo Flow

1. Open `/register` and create a tourist.
2. Copy the generated `TID-*` digital tourist ID.
3. Open `/tourist`, share or simulate location, and trigger SOS.
4. Open `/admin` to watch tourists, map markers, zones, and alerts update by polling.
5. Open `/alerts` and `/risk-zones` for focused views.
6. Use the ID verifier to confirm the SHA-256 integrity hash and trip validity.

## API Routes

- `POST /api/register-tourist`
- `GET /api/tourists`
- `PATCH /api/tourists`
- `POST /api/update-location`
- `POST /api/panic-alert`
- `GET /api/alerts`
- `GET /api/risk-zones`
- `POST /api/verify-id`
