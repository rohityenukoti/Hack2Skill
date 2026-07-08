# Chikitsalay Setu (चिकित्सालय सेतु)

AI-powered, multilingual platform for **real-time PHC/CHC operations** — inventory monitoring, demand forecasting, resource redistribution, and citizen feedback — built for the **Build with AI: Code for Communities** hackathon (Track 3: Smart Health).

> **TL;DR**: A Vite + React single-page app on **Firebase Hosting**, backed by **Firebase Auth + Firestore + Cloud Functions**, integrating **Gemini 2.0 Flash**, **Speech-to-Text**, **Translation**, **BigQuery**, and **Google Maps** for a district-level health operations cockpit.

**Live demo**: [chikitsalaysetu.web.app](https://chikitsalaysetu.web.app)

**Product walkthrough**: step-by-step production feature guide — see [`WALKTHROUGH.md`](WALKTHROUGH.md) (also summarized [below](#product-walkthrough)).

---

## What problem this solves

PHCs/CHCs often track medicine stock, beds, footfall, and service availability via registers and phone calls. That makes it hard for district administrators to:

- detect **stock-out risk** early
- respond to **demand spikes** in time
- identify **underperforming centers** and operational bottlenecks
- coordinate **redistribution** across centers with donor/recipient confirmation
- incorporate **citizen feedback** in a structured, multilingual way

Chikitsalay Setu turns scattered operational updates and citizen inputs into **actionable recommendations** for district health officers and PHC staff.

---

## Key features

### Role-based portals

| Role | Portal | Capabilities |
|------|--------|--------------|
| **Admin (District)** | Admin Dashboard | District-wide KPIs, AI audit, transfer orchestration, feedback analytics, BigQuery sync |
| **Health Center staff** | PHC/CHC Portal + Voice Reporter | Update center status & inventory, confirm supply transfers, submit voice reports |
| **Citizen** | Citizen Health Portal | Find centers, check availability, get directions, rate & review services (anonymous auth supported) |

### Admin dashboard

- **Real-time district KPIs** — bed occupancy, doctor attendance, footfall, stock alerts
- **Auto-run Gemini AI audit** on load — forecasting, alerts, redistribution suggestions
- **Interactive geospatial map** — center markers, critical tooltips, redistribution routes, drill-down to interventions
- **Supply transfer workflow** — AI recommendations → notify centres → donor/recipient confirmation → completion tracking
- **Underperforming & bottlenecks panel** — AI-flagged centres with intervention briefs
- **Citizen feedback hub** — district ratings, per-centre reviews, AI-generated feedback summaries
- **BigQuery sync** — scheduled daily snapshot (on-demand sync available in development builds)

### PHC/CHC staff portal

- Update beds, doctors, footfall, and centre status in real time
- Manage medicine inventory (stock levels, min thresholds)
- Receive and confirm **transfer notifications** from district admin
- **Voice Reporter** — multilingual voice intake (hi-IN, kn-IN, te-IN, en-IN) parsed by Gemini

### Citizen portal

- Search and filter PHCs/CHCs by type, status, and availability
- **Get Directions** via Google Maps
- Star ratings, category tags, and detailed feedback submission
- **Voice feedback** — record audio → Speech-to-Text → auto-fill the feedback textbox (with simulated samples when voice is unavailable)
- **Health schemes** info (Ayushman Bharat, JSY, etc.) with on-demand translation
- Supported languages: **English, Hindi, Kannada, Telugu, Tamil** (with localStorage translation cache)

### Platform capabilities

- **Server-side AI** — Gemini API key never exposed to the browser
- **Rate limiting** — 15 Cloud Function calls/min per user
- **Graceful degradation** — localStorage + simulated AI when Firebase is not configured (see [`ARCHITECTURE.md`](ARCHITECTURE.md))

---

## Product walkthrough

Quick orientation for the **live production app**. For screens, clicks, transfer storyline, languages, and a 10–12 minute demo script, see the full guide:

→ **[`WALKTHROUGH.md`](WALKTHROUGH.md)**

### Demo credentials

| Role | How to enter | Credentials |
|------|--------------|-------------|
| **Administrator** | Homepage → *Login as Administrator* | `admin@dharwad.demo` / `Admin@123456` |
| **Health Center Staff** | Homepage → *Login as Health Center* | `phc-narendra@dharwad.demo` / `Staff@123456` |
| **Citizen** | Homepage → *Login as Citizen* | Click **Continue as Citizen** (anonymous Auth) |

Demo geography: **Dharwad district** — PHC Narendra, PHC Hebballi, CHC Kalghatgi, PHC Mugad, CHC Kundgol.

### What to explore by role

| Role | Start here | Highlights |
|------|------------|------------|
| **Admin** | District Control Center after login | Live KPIs, auto/manual Gemini audit, geospatial map + redistribution routes, Notify Health Centres transfer flow, intervention table, citizen Feedback Summarize |
| **Staff** | Health Facility Portal (+ Voice Reporter sub-nav) | Daily logs (doctors/beds/footfall), diagnostic audit toggles, pharmacy stock edits, district transfer confirmations, multilingual voice → Gemini → Firestore commit |
| **Citizen** | Citizen Health Portal | Search/filter centres, bed/doctor availability, Get Directions, star ratings + category tags, health schemes, helplines; UI in en/hi/kn/te/ta |

### Suggested end-to-end path

1. **Citizen** — find a centre, open directions, optionally leave feedback.
2. **Staff** — lower a medicine stock (or use a Voice Reporter preset) so the district sees a shortage.
3. **Admin** — let the Gemini audit run; review flags, map routes, and Smart Transfer Suggestions; click **Notify Health Centres**.
4. **Staff** — **Mark as Completed** on the transfer notification; adjust pharmacy stock.
5. **Admin** — confirm the transfer under Completed; use **Summarize Feedback** if citizens have reviewed.

Homepage also supports language switching, text size controls (`A−` / `A` / `A+`), helplines (104 / 108 / 181 / 1098), and rotating government announcements before any login.

---

## Architecture (high level)

```
React SPA (Firebase Hosting)
  ├── Firebase Auth (admin / healthcenter / citizen roles)
  ├── Firestore (centers + inventory + feedback + transfers; realtime)
  └── Cloud Functions (asia-south1)
        ├── analyzeDistrict           → Gemini 2.0 Flash (forecasting + redistribution)
        ├── parseVoiceReport          → Gemini 2.0 Flash (structured voice parsing)
        ├── transcribeAudio           → Cloud Speech-to-Text
        ├── translateTextFn           → Cloud Translation API (single + batch)
        ├── getLanguages              → supported translation languages
        ├── syncToBigQuery            → BigQuery (health_ops dataset)
        ├── scheduledBigQuerySync     → daily Firestore → BigQuery snapshot
        ├── seedDemoAccounts          → demo users + seed data
        └── provisionCitizenProfile   → anonymous citizen role provisioning
```

For a deeper explanation (security model, data model, scaling notes), see [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, Lucide icons |
| **Backend** | Firebase Cloud Functions (Node.js 20, ESM) |
| **Auth** | Firebase Authentication (Email/Password + Anonymous) |
| **Database** | Cloud Firestore (role-based security rules) |
| **AI** | Gemini 2.0 Flash (server-side via Functions secrets) |
| **Voice** | Google Cloud Speech-to-Text |
| **Translation** | Google Cloud Translation API |
| **Analytics** | BigQuery (`health_ops` dataset) |
| **Maps** | Google Maps JavaScript API (`@react-google-maps/api`) |
| **Hosting** | Firebase Hosting (SPA rewrite to `index.html`) |
| **CI/CD** | GitHub Actions → Firebase Hosting deploy |

---

## Hackathon context

Built for **Build with AI: Code for Communities** (Smart Health) to demonstrate:

- end-to-end, working prototype deployable for district pilots
- meaningful use of Google Cloud + Gemini AI across operations, voice, and citizen engagement
- clear scaling path via Firestore (real-time ops) + BigQuery (batch analytics)

---

## Repository layout

```
├── src/
│   ├── components/       # React UI (AdminDashboard, PHCPortal, CitizenPortal, etc.)
│   ├── services/         # Firebase, API, Gemini, translation, auth
│   ├── constants/        # Language options
│   └── utils/            # Mock data for offline demo fallback
├── functions/            # Cloud Functions (AI, speech, BigQuery, translation, seed)
├── .github/workflows/    # CI/CD (firebase-deploy.yml)
├── firestore.rules       # Role-based Firestore security rules
├── firestore.indexes.json
├── firebase.json         # Hosting, emulators, functions config
├── ARCHITECTURE.md       # System design + data model + security
└── WALKTHROUGH.md        # Production feature walkthrough + demo script
```

---

## Local development

For cloning and running the repository locally.

### Prerequisites

- **Node.js**: 18+ (Cloud Functions target **Node 20**)
- **npm**
- **Firebase CLI**: via devDependency (`firebase-tools`) or globally
- A **Firebase project** on the **Blaze** plan (required for Cloud Functions + external APIs)

### Environment variables

Copy `.env.example` to `.env` and set Firebase web config values.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase web config |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase web config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase web config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase web config |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase web config |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Google Analytics |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Recommended for map & directions |
| `VITE_RECAPTCHA_SITE_KEY` | No | App Check reCAPTCHA v3 (production) |
| `VITE_USE_FIREBASE_EMULATORS` | No | Set `true` for local emulator development |

> The Firebase web API key is client-safe. Production protection relies on Firestore rules and App Check.

**Server secrets** (Cloud Functions, not `.env`):

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

### Quickstart

```bash
npm install
cd functions && npm install && cd ..
npm run dev
```

Vite dev server runs at `http://localhost:3000`.

### Firebase emulators

| Service | Port |
|---------|------|
| Auth | 9099 |
| Functions | 5001 |
| Firestore | 8080 |
| Hosting | 5000 |
| Emulator UI | enabled |

```bash
# Terminal 1
firebase emulators:start

# Terminal 2
VITE_USE_FIREBASE_EMULATORS=true npm run dev
```

### Deployment

**Cloud Functions + Firestore rules:**

```bash
cd functions && npm install
firebase functions:secrets:set GEMINI_API_KEY
cd .. && firebase deploy --only functions,firestore:rules
```

**Seed demo accounts** (Functions shell after deploy):

```bash
firebase functions:shell
# > seedDemoAccounts({confirmSeed: true})
```

**Hosting:**

```bash
npm run build
firebase deploy --only hosting
```

**CI/CD**: Pushes to `main`/`master` trigger [`.github/workflows/firebase-deploy.yml`](.github/workflows/firebase-deploy.yml) (build with `VITE_*` secrets → Hosting deploy). Required GitHub secrets: `FIREBASE_SERVICE_ACCOUNT`, `VITE_FIREBASE_*`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_RECAPTCHA_SITE_KEY`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview built app locally |
| `npm run lint:functions` | Syntax-check Functions modules |
| `npm --prefix functions run serve` | Functions emulator only |
| `npm --prefix functions run deploy` | Deploy Functions |

### Data model (Firestore)

```
users/{uid}                         → { role, centerId?, districtId?, email }
centers/{centerId}                  → metadata, beds, doctors, footfall, status
centers/{centerId}/inventory/{id}   → medicine stock levels
centers/{centerId}/feedback/{id}    → citizen feedback entries
transfers/{transferId}              → redistribution requests + confirmation status
```

**BigQuery tables**: `health_ops.centers_daily`, `health_ops.inventory_daily`

### Security model (summary)

Firestore rules (`firestore.rules`) enforce:

- users can only read their own `users/{uid}` doc (writes via Cloud Functions only)
- admins can read/write all centres and create transfers
- health centre staff can update **only their own** centre and confirm related transfers
- citizens can read centres/inventory and create feedback

Production hardening:

- **Gemini key** stored server-side as a Functions secret (`GEMINI_API_KEY`)
- **App Check** enabled in production via `VITE_RECAPTCHA_SITE_KEY`
- **Maps API keys** restricted by HTTP referrer

### Cost controls

The stack fits within free tiers for a pilot/demo. Recommended safeguards:

- small GCP budget alerts (e.g. $1, $5)
- AI/voice endpoints behind Functions with rate limiting (15 calls/min/user)
- Maps API key restrictions and quotas

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page after deploy | Hosting uses SPA rewrite to `/index.html` — check `firebase.json` |
| Emulator mismatch | Set `VITE_USE_FIREBASE_EMULATORS=true` when running locally |
| Functions failing on Gemini | Confirm `GEMINI_API_KEY` secret is set and redeployed |
| Maps not loading | Set `VITE_GOOGLE_MAPS_API_KEY` and restrict in GCP Console |
| Translation errors | Enable `translate.googleapis.com` in GCP Console |
| Microphone / voice feedback | Mic capture requires a **secure context** (HTTPS or `localhost`). Without Cloud Functions, use simulated voice samples or type manually. |
| Dev tools not visible | Seed/reset tools render only in `import.meta.env.DEV` builds |
