# Chikitsalay Setu (चिकित्सालय सेतु)
AI-powered, multilingual platform for **real-time PHC/CHC operations** — inventory monitoring, demand forecasting, resource redistribution, and citizen feedback — built for the **Build with AI: Code for Communities** hackathon (Track 3: Smart Health).

> **TL;DR**: A Vite + React single-page app on **Firebase Hosting**, backed by **Firebase Auth + Firestore + Cloud Functions**, integrating **Gemini**, **Speech-to-Text**, **Translation**, **BigQuery**, and **Google Maps** for a district-level health operations cockpit.

---

## What problem this solves
PHCs/CHCs often track medicine stock, beds, footfall, and service availability via registers and phone calls. That makes it hard for district administrators to:

- detect **stock-out risk** early
- respond to **demand spikes** in time
- identify **underperforming centers**
- coordinate **redistribution** across centers
- incorporate **citizen feedback** in a structured, multilingual way

Chikitsalay Setu turns scattered operational updates and citizen inputs into **actionable recommendations** for district health officers and PHC staff.

---

## Key features
- **Role-based access**
  - **Admin (District)**: full visibility + interventions + analytics
  - **Health Center staff**: update their center status + inventory
  - **Citizen**: browse center status + submit feedback (supports low-friction access via anonymous auth)
- **Real-time operations dashboard**
  - live center status (beds, doctors, footfall indicators, etc.)
  - medicine inventory snapshots
- **AI-driven workflows (server-side)**
  - district analysis & recommendations via **Gemini**
  - voice report parsing via **Gemini**
  - multilingual intake via **Speech-to-Text** + **Translation**
- **Analytics layer**
  - periodic sync/snapshots to **BigQuery** (`health_ops` dataset)
- **Geospatial views**
  - centers map + redistribution routing support via **Google Maps**
- **Offline-friendly demo mode**
  - when Firebase isn’t configured, the app can fall back to **localStorage + simulated AI** (see `ARCHITECTURE.md`)

---

## Architecture (high level)

```
React SPA (Firebase Hosting)
  ├── Firebase Auth (admin / healthcenter / citizen roles)
  ├── Firestore (centers + inventory + feedback; realtime)
  └── Cloud Functions (asia-south1)
        ├── analyzeDistrict      → Gemini
        ├── parseVoiceReport     → Gemini
        ├── transcribeAudio      → Cloud Speech-to-Text
        ├── translateTextFn      → Cloud Translation API
        ├── syncToBigQuery       → BigQuery (health_ops dataset)
        └── seedDemoAccounts     → Demo users + seed data
```

For a deeper explanation (security model, data model, scaling notes), see `ARCHITECTURE.md`.

---

## Tech stack
- **Frontend**: React 18 + Vite 5
- **Backend**: Firebase Cloud Functions (Node.js 20, ESM)
- **Auth**: Firebase Authentication (Email/Password + Anonymous)
- **Database**: Cloud Firestore (rules included)
- **AI**: Gemini (via server-side Functions)
- **Voice**: Google Cloud Speech-to-Text
- **Translation**: Google Cloud Translation API
- **Analytics**: BigQuery
- **Maps**: Google Maps JavaScript API (via `@react-google-maps/api`)
- **Hosting**: Firebase Hosting (SPA rewrite to `index.html`)

---

## Repository layout
- `src/`: React application source (Vite project)
- `functions/`: Firebase Cloud Functions (Gemini, Speech, BigQuery, Translation, seeding)
- `dist/`: production build output (deploy target for Hosting)
- `firestore.rules`: Firestore security rules (role-based)
- `firebase.json`: Firebase config (hosting + emulators + functions/firestore config)
- `ARCHITECTURE.md`: system design + setup details

---

## Prerequisites
- **Node.js**: 18+ (Functions explicitly targets **Node 20**)
- **npm**
- **Firebase CLI**: installed via devDependency (`firebase-tools`) or globally
- A **Firebase project** (Blaze plan recommended/required for some Functions + APIs)

---

## Environment variables
This project uses Vite-style env vars (`VITE_*`) for client configuration.

Create a `.env` in the repo root (see `.env.example` if present, or copy the template below).

### Client (repo root `.env`)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_RECAPTCHA_SITE_KEY` (optional; App Check reCAPTCHA v3 site key)
- `VITE_GOOGLE_MAPS_API_KEY` (optional; recommended for map features)
- `VITE_USE_FIREBASE_EMULATORS` (`true`/`false`)

> Important: The Firebase web API key is **client-safe** (not a secret), but you should still use environment-specific keys and lock down your Firebase project with proper rules and App Check for production.

### Server secrets (Cloud Functions)
Store server-side secrets using **Firebase Functions secrets** (not in `.env`):

- `GEMINI_API_KEY` (required for Gemini calls)

Set it with:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

---

## Quickstart (local)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure `.env`
Create `.env` in the project root (see the “Environment variables” section above).

### 3) Run the frontend

```bash
npm run dev
```

Vite dev server runs on `http://localhost:3000` (see `vite.config.js`).

---

## Local dev with Firebase emulators (recommended)
Your Firebase config declares emulator ports in `firebase.json`:

- Auth: `9099`
- Functions: `5001`
- Firestore: `8080`
- Hosting: `5000`
- Emulator UI: enabled

### Start emulators

```bash
firebase emulators:start
```

### Start frontend using emulators

```bash
VITE_USE_FIREBASE_EMULATORS=true npm run dev
```

---

## Deployment

### Deploy Cloud Functions + Firestore rules

```bash
cd functions && npm install
firebase functions:secrets:set GEMINI_API_KEY
cd .. && firebase deploy --only functions,firestore:rules
```

### Seed demo accounts / data
After deploying, you can seed demo users + sample data via the `seedDemoAccounts` function (either through the admin UI “System Setup” panel if present, or via the Functions shell):

```bash
firebase functions:shell
# > seedDemoAccounts({confirmSeed: true})
```

Demo credentials (from `ARCHITECTURE.md`):
- **Admin**: `admin@dharwad.demo` / `Admin@123456`
- **PHC Staff**: `phc-narendra@dharwad.demo` / `Staff@123456`
- **Citizen**: use “Continue as Citizen” (anonymous auth)

### Build + deploy Hosting

```bash
npm run build
firebase deploy --only hosting
```

---

## Scripts
From `package.json`:
- `npm run dev`: start Vite dev server
- `npm run build`: production build (outputs to `dist/`)
- `npm run preview`: preview built app locally
- `npm run lint:functions`: run Functions lint/checks (`functions/` package)

From `functions/package.json`:
- `npm --prefix functions run lint`: Node syntax checks for Functions modules
- `npm --prefix functions run serve`: run Functions emulator
- `npm --prefix functions run shell`: open Functions shell
- `npm --prefix functions run deploy`: deploy Functions

---

## Data model (Firestore)
From `ARCHITECTURE.md`:

```
users/{uid}                    → { role, centerId?, districtId?, email }
centers/{centerId}             → center metadata, beds, doctors, footfall, status
centers/{centerId}/inventory/  → medicine stock levels
centers/{centerId}/feedback/   → citizen feedback entries
```

BigQuery tables (analytics snapshots):
- `health_ops.centers_daily`
- `health_ops.inventory_daily`

---

## Security model (summary)
Firestore rules (`firestore.rules`) enforce:
- users can only read their own `users/{uid}` doc
- admins can read/write all centers
- health center staff can update **only their own** center (`centerId` matched)
- citizens can read centers/inventory and create feedback

Operational guidance:
- keep **Gemini key server-side** as a Functions secret (`GEMINI_API_KEY`)
- enable **App Check** in production and set `VITE_RECAPTCHA_SITE_KEY` if using reCAPTCHA v3

---

## Cost controls (recommended for demos)
This stack can fit comfortably within free tiers for a pilot/demo, but you should still:
- set a **small budget alert** (e.g. $1, $5) in GCP billing
- keep AI/voice endpoints behind Functions with basic throttling
- restrict Maps API keys (HTTP referrers) and set quotas

---

## Troubleshooting
- **Blank page / routing issues after deploy**: Hosting is configured as an SPA using a rewrite to `/index.html` in `firebase.json`.
- **Emulator mismatch**: ensure `VITE_USE_FIREBASE_EMULATORS=true` is set when running locally with emulators.
- **Functions failing to call Gemini**: confirm `GEMINI_API_KEY` secret is set and deployed.
- **Maps not loading**: set `VITE_GOOGLE_MAPS_API_KEY` and restrict it appropriately in GCP.

---

## Hackathon context
This project was built for **Build with AI: Code for Communities** (Smart Health) to demonstrate:
- end-to-end, working prototype
- meaningful use of Google Cloud + AI
- deployability for district pilots, with a clear scaling path

See `instructions/Build with AI_ Code for Communities.md` for the full challenge brief.

---

## License
Add a license file if you plan to open-source this repository.

