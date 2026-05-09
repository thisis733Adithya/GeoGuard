# Geo Guard App Explanation

Geo Guard is a simple tourist safety monitoring system built with Next.js. It helps register tourists, create a temporary digital tourist ID, track safe location updates with consent, detect risky areas, and show emergency alerts to an admin dashboard.

## 1. What Happens When a Tourist Registers

The tourist opens the registration page and fills in:

- Name
- Aadhaar or passport number
- Phone number
- Emergency contact
- Trip start and end date
- Planned itinerary
- Location tracking consent

When the form is submitted, the app creates a temporary tourist ID like:

```text
TID-2026-ABCDE
```

This ID is saved with the tourist details. It is treated as valid only during the trip dates.

## 2. Digital ID Integrity

The app creates a SHA-256 hash from the tourist ID data. This hash works like a digital fingerprint.

If important ID data changes later, the hash will no longer match. This lets the app show whether the tourist ID data is verified or possibly tampered with.

This is not a full blockchain. It is a simple blockchain-style integrity check for a hackathon demo.

## 3. Tourist Dashboard

The tourist dashboard shows:

- Tourist profile
- Trip dates
- Safety score
- Current location
- Tracking consent toggle
- Alert history
- Panic SOS button

The tourist can choose whether tracking is enabled. If tracking consent is off, the app does not accept location updates for that tourist.

## 4. Location Tracking

The tourist can share live location from the browser. If browser location is unavailable, the app can use demo locations.

When a location update is sent, the app:

1. Finds the tourist record.
2. Checks if tracking consent is enabled.
3. Saves the location update.
4. Checks the location against risk zones.
5. Runs simple safety detection rules.
6. Updates the tourist safety score.
7. Creates alerts if needed.

## 5. Geo-Fencing

The app has a list of risk zones. Each zone has:

- Name
- Latitude
- Longitude
- Radius
- Severity
- Safety advice

The app uses a Haversine distance function to check if the tourist is inside a risk zone.

If the tourist enters a restricted or high-risk area, the app creates an alert and shows it on both the tourist dashboard and admin dashboard.

## 6. Safety Detection

The app uses simple JavaScript rules to detect possible safety issues.

Examples:

- No movement for a long time
- Location updates suddenly stop
- Tourist moves away from the planned route
- Higher-risk solo travel behavior

The app returns:

- Risk score
- Anomaly type
- Suggested action

This keeps the AI part lightweight and easy to explain in a 1-day hackathon.

## 7. Panic SOS Flow

When the tourist clicks the red SOS button:

1. The current or last known location is captured.
2. A critical alert is created.
3. The alert is saved.
4. The admin dashboard shows the alert.
5. The tourist sees a placeholder emergency response message.

The response message includes a sample nearest police unit, ETA, and emergency phone number.

## 8. Admin Dashboard

The admin dashboard is the control room.

It shows:

- Total registered tourists
- Open alerts
- Critical alerts
- Average safety score
- Tourist list
- Last known locations
- Live map markers
- Risk zone cards
- Alert panel

The dashboard refreshes by polling the API every few seconds, so new alerts appear without manually refreshing the page.

## 9. Alerts Page

The alerts page shows all alert records in one place.

Alerts can be:

- Normal
- Warning
- Critical

Each alert includes a timestamp, tourist ID, message, severity, and suggested action.

## 10. Risk Zones Page

The risk zones page shows all monitored danger areas.

It displays each zone with:

- Zone type
- Coordinates
- Radius
- Severity
- Safety advice

These zones are also shown on the map.

## Google Maps

If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is added in `.env.local`, the map uses the Google Maps JavaScript API.

The real map shows:

- Tourist markers
- Risk zone circles
- Clickable zone details
- Clickable tourist status

If the Google Maps key is missing or the script cannot load, the app automatically shows a simple demo map fallback.

## 11. Backend Logic

There is no separate Express backend.

The backend is built using Next.js API routes inside the same project.

Main API routes:

- `POST /api/register-tourist`
- `GET /api/tourists`
- `PATCH /api/tourists`
- `POST /api/update-location`
- `POST /api/panic-alert`
- `GET /api/alerts`
- `GET /api/risk-zones`
- `POST /api/verify-id`

## 12. Database

The app uses MongoDB with Mongoose models for:

- Tourist
- Alert
- RiskZone
- LocationUpdate

If `MONGODB_URI` is set, data is stored in MongoDB.

If `MONGODB_URI` is not set, the app uses in-memory demo data. This makes the app easy to run quickly during a hackathon presentation.

## 13. Simple Demo Flow

For a demo, use this flow:

1. Go to the home page.
2. Open the registration page.
3. Register a tourist.
4. Copy or use the generated tourist ID.
5. Open the tourist dashboard.
6. Share location or simulate a risk zone.
7. Click SOS to create a critical alert.
8. Open the admin dashboard to see live monitoring.
9. Use the ID verifier to prove the digital ID hash is valid.

## In One Sentence

Geo Guard is a single Next.js app that registers tourists, tracks opt-in locations, detects risky situations, sends SOS alerts, and gives admins a live safety dashboard for quick incident response.
