# Chikitsalay Setu — Architecture

AI-driven PHC/CHC health center management for the **Build with AI: Code for Communities** hackathon (Track 3: Smart Health).

## System Overview

```
React SPA (Firebase Hosting)
    ├── Firebase Auth (admin / healthcenter / citizen roles)
    ├── Firestore (real-time centers + inventory + feedback)
    └── Cloud Functions (asia-south1)
            ├── analyzeDistrict      → Gemini 2.0 Flash
            ├── parseVoiceReport     → Gemini 2.0 Flash
            ├── transcribeAudio      → Cloud Speech-to-Text
            ├── translateTextFn      → Cloud Translation API
            ├── syncToBigQuery       → BigQuery (health_ops dataset)
            └── seedDemoAccounts     → Demo users + seed data
```

## Google Cloud Services Used

| Service | Purpose |
|---------|---------|
| **Firebase Auth** | Role-based login (district admin, PHC staff, anonymous citizen) |
| **Cloud Firestore** | Real-time operational data with security rules |
| **Cloud Functions** | Secure server-side AI, speech, translation, analytics |
| **Gemini API** | District forecasting, redistribution, voice parsing, intervention briefs |
| **Cloud Speech-to-Text** | Multilingual voice intake (hi-IN, kn-IN, te-IN, en-IN) |
| **Cloud Translation API** | Citizen portal scheme descriptions in regional languages |
| **BigQuery** | District analytics layer (daily center/inventory snapshots) |
| **Google Maps Platform** | Geospatial health center map with redistribution routes |
| **Firebase Hosting** | Production deployment |
| **Firebase App Check** | Abuse protection for Cloud Functions (production) |

## Security Model

- **Firestore rules** enforce role-based access: admins read/write all centers; staff write own center; citizens read centers and submit feedback.
- **Gemini API key** stored in Cloud Functions secrets (`GEMINI_API_KEY`), never exposed to the browser.
- **Rate limiting** on Cloud Functions (15 calls/min per user).
- **Audit fields** on writes: `updatedAt`, `source` (`portal` | `voice` | `admin`).

## Cost Controls (Free Tier)

The entire stack runs on GCP/Firebase free tiers for a single-district pilot:

- Set a **$1 budget alert** in GCP Console immediately after enabling billing (Blaze plan required for Functions).
- Firestore, Functions, Speech-to-Text, Translation, BigQuery, and Maps all have generous free tiers for demo traffic.
- Gemini uses AI Studio free tier via server-side proxy.

## Setup Instructions

### 1. Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create project → Enable Google Analytics (optional).
2. Upgrade to **Blaze (pay-as-you-go)** plan.
3. Enable **Authentication** → Email/Password + Anonymous sign-in.
4. Create **Firestore** database (production mode, `asia-south1`).
5. Set GCP budget alert at $1 and $5.

### 2. Configure environment

Copy `.env.example` to `.env` and fill in Firebase web config + optional Maps/App Check keys.

### 3. Deploy Cloud Functions

```bash
cd functions && npm install
firebase functions:secrets:set GEMINI_API_KEY
cd .. && firebase deploy --only functions,firestore:rules
```

### 4. Seed demo data

After deploy, call `seedDemoAccounts` from the admin System Setup panel, or:

```bash
firebase functions:shell
# > seedDemoAccounts({confirmSeed: true})
```

**Demo credentials:**
- Admin: `admin@dharwad.demo` / `Admin@123456`
- PHC Staff: `phc-narendra@dharwad.demo` / `Staff@123456`
- Citizen: Click "Continue as Citizen" (anonymous auth)

### 5. Deploy frontend

```bash
npm install && npm run build
firebase deploy --only hosting
```

## Local Development

```bash
# Terminal 1: Firebase emulators
firebase emulators:start

# Terminal 2: Frontend with emulators
VITE_USE_FIREBASE_EMULATORS=true npm run dev
```

Without Firebase configured, the app falls back to localStorage + simulated AI (offline demo mode).

## Scaling Beyond Pilot

- **50+ PHCs**: Firestore handles real-time ops; BigQuery handles batch analytics and trend forecasting.
- **Multi-district**: Clone Firebase project per district; shared BigQuery dataset with `district_id` column.
- **Low connectivity**: Voice presets + offline localStorage cache; sync when connectivity returns.

## Data Model

```
users/{uid}                    → { role, centerId?, districtId?, email }
centers/{centerId}             → center metadata, beds, doctors, footfall, status
centers/{centerId}/inventory/  → medicine stock levels
centers/{centerId}/feedback/   → citizen feedback entries
```

BigQuery tables: `health_ops.centers_daily`, `health_ops.inventory_daily`
