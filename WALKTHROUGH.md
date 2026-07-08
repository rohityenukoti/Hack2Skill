# Chikitsalay Setu — Product Walkthrough

A complete, feature-by-feature guide to the **production** experience at [chikitsalaysetu.web.app](https://chikitsalaysetu.web.app).

Use this document to demo the platform end-to-end, or as an onboarding guide for district admins, PHC/CHC staff, and citizens.

---

## Table of contents

1. [What you are looking at](#1-what-you-are-looking-at)
2. [Demo accounts](#2-demo-accounts)
3. [Homepage & landing experience](#3-homepage--landing-experience)
4. [Signing in](#4-signing-in)
5. [Administrator — District Control Center](#5-administrator--district-control-center)
6. [Health Center Staff — Operations Portal](#6-health-center-staff--operations-portal)
7. [Voice Reporter](#7-voice-reporter)
8. [Citizen Health Portal](#8-citizen-health-portal)
9. [End-to-end supply transfer story](#9-end-to-end-supply-transfer-story)
10. [Languages & accessibility](#10-languages--accessibility)
11. [What happens behind the scenes](#11-what-happens-behind-the-scenes)
12. [Suggested demo script (10–12 minutes)](#12-suggested-demo-script-1012-minutes)

---

## 1. What you are looking at

**Chikitsalay Setu (चिकित्सालय सेतु)** is an AI-powered, multilingual operations platform for Primary Health Centres (PHCs) and Community Health Centres (CHCs).

It connects three audiences on one shared live dataset:

| Audience | Portal | Purpose |
|----------|--------|---------|
| **District Administrator** | District Control Center | See district KPIs, run Gemini audits, orchestrate medicine redistribution, review citizen feedback |
| **Health Center Staff** | Facility Portal + Voice Reporter | Update beds, doctors, footfall, diagnostics, and pharmacy stock; confirm transfers; report by voice |
| **Citizen** | Citizen Health Portal | Find centres, check availability, get directions, rate services, browse health schemes |

Production stack: React SPA on **Firebase Hosting**, **Firebase Auth + Firestore** (realtime), and **Cloud Functions** (`asia-south1`) for Gemini, Speech-to-Text, Translation, and BigQuery.

---

## 2. Demo accounts

| Role | How to enter | Credentials |
|------|--------------|-------------|
| **Administrator** | Homepage hero → **Administrator** (or login card below) | `admin@dharwad.demo` / `Admin@123456` |
| **Health Center Staff** | Homepage hero → **Health Center** (or login card below) | `phc-narendra@dharwad.demo` / `Staff@123456` |
| **Citizen** | Homepage hero → **Citizen** (or login card below) | No credentials — click **Continue as Citizen** (anonymous Auth) |

Demo geography is **Dharwad district** with five facilities:

| ID | Center | Type |
|----|--------|------|
| `phc-narendra` | PHC Narendra | PHC |
| `phc-hebballi` | PHC Hebballi | PHC |
| `chc-kalghatgi` | CHC Kalghatgi | CHC |
| `phc-mugad` | PHC Mugad | PHC |
| `chc-kundgol` | CHC Kundgol | CHC |

Staff login for `phc-narendra` is locked to that facility (the centre cannot be switched).

---

## 3. Homepage & landing experience

Open the live site. You land on a government-style public homepage before any login.

### Top government bar

- Platform title: **Chikitsalay Setu | चिकित्सालय सेतु**
- **Skip to Main Content** link
- **Language selector**: English, हिंदी, ಕನ್ನಡ, తెలుగు, தமிழ்  
  Changing language batch-translates homepage copy via Cloud Translation (cached locally for repeat visits)
- **Text size controls**: `A−` / `A` / `A+`

### Navigation & helplines

- Navbar links: Features, Announcements, Login
- Emergency callout for ambulance **108**
- Persistent helpline strip: **104** (health), **108** (ambulance), **181** (women), **1098** (child)
- Indian **tricolor ribbon** below the header

### Hero & stats

- Bilingual hero (English + Hindi) with short value proposition
- **Sign-in in the hero** — three compact role buttons open the login modal immediately (no scroll required):
  1. **Administrator**
  2. **Health Center**
  3. **Citizen**
- Soft role-tinted styling keeps the row scannable without crowding the first viewport
- Quiet **Explore Features** text link below the buttons (scrolls to platform capabilities)
- Quick stats strip: connected centres, 24/7 monitoring, Gemini insights, languages supported

### Government announcements

Rotating public-service announcements plus a 4-card summary grid covering immunization, TB screening, stock-out reporting, dengue prevention, Ayushman Bharat, JSY, Jan Aushadhi, and NCD screening.

### Platform capabilities

Six feature cards explain the product surface:

1. Real-Time Monitoring  
2. AI Demand Forecasting  
3. Multilingual Voice Reporting  
4. Staff & Bed Tracking  
5. Geospatial Dashboard  
6. Citizen Feedback  

### Role login cards

A fuller **Access Your Dashboard** section lower on the page still shows three detail cards (features list + button). Useful for visitors who scroll; the hero buttons are the primary path for most people:

1. **Administrator** — District Health Dashboard  
2. **Health Center Staff** — PHC/CHC Operations Portal  
3. **Citizen** — Public Health Portal  

Footer repeats quick links, emergency numbers, and flagship government programs.

---

## 4. Signing in

### Administrator / Health Center Staff

1. Choose a role from the **hero buttons** (or the login cards further down).
2. Enter email + password (password visibility toggle available).
3. Submit → Firebase Email/Password Auth.
4. App loads `users/{uid}` from Firestore (role + `centerId` for staff).
5. You are routed into the matching portal.

Hints under the form show the demo credentials.

### Citizen

1. Choose **Citizen** from the hero (or **Login as Citizen** on the detail card).
2. Click **Continue as Citizen** (no email/password).
3. Firebase **Anonymous Auth** creates a session.
4. Cloud Function `provisionCitizenProfile` writes `role: citizen` on `users/{uid}`.
5. Citizen Health Portal opens.

### After login (all roles)

A consistent chrome appears:

- Top bar with platform name + **Logout**
- For citizens: language selector stays available  
- Brand header with platform mark and tagline  
- Tricolor ribbon  

Staff also get a sub-nav: **Health Facility Portal** | **Voice Reporter**.

---

## 5. Administrator — District Control Center

Sign in as `admin@dharwad.demo`. This is the district operations cockpit.

### 5.1 Header actions

| Control | What it does |
|---------|--------------|
| **Trigger Gemini AI Audit** | On-demand call to `analyzeDistrict` (Gemini 2.0 Flash). Recomputes alerts, forecasts, redistributions, and intervention briefs. |
| *(Auto-run)* | Audit also runs **once automatically** when all centre inventories finish loading. |

> BigQuery analytics run via **`scheduledBigQuerySync`**, which snapshots centres and inventory daily.

### 5.2 Live KPI strip

Four glass KPI cards, fed by realtime Firestore centre docs + inventory:

| KPI | Meaning |
|-----|---------|
| **Patient Footfall** | Sum of `footfall.today` across all centres |
| **Bed Occupancy** | District occupied / total beds (%), with raw counts |
| **Staff Presence** | Doctors present / total (%) |
| **Stockout Warnings** | Medicines at zero stock + below `minRequired` |

KPI colours escalate when occupancy is high, staff presence is low, or stock-outs are critical.

### 5.3 District Geospatial Health Map

Left panel of the main grid.

- Markers for every PHC/CHC, colour-coded:
  - Blue ≈ normal  
  - Amber ≈ warning  
  - Red ≈ critical  
- **Critical centres** get a delayed “URGENT” tooltip (~2s) with **More details**, which scrolls to the intervention table.
- Clicking non-critical markers opens an info window (name, location, status, More details).
- After an AI audit, **polylines** draw recommended redistribution routes (red = High urgency, green = Medium).
- If Maps API is unavailable, a canvas fallback map renders the same semantics.

### 5.4 Smart Transfer Suggestions

Right panel next to the map.

**New AI recommendations** (not yet sent):

- Medicine name + quantity  
- From centre → To centre (+ distance estimate)  
- Urgency badge (High / Medium)  
- AI reason quote  
- **Notify Health Centres** button → creates a Firestore `transfers` document (`status: notified`) and removes it from the “suggestion” list  

**Awaiting Centre Confirmation:**

- Transfers already notified  
- Shows donor / recipient confirmation progress  

**Completed Transfers:**

- Both sides confirmed  
- Completion timestamp  

Urgency sorting keeps High priority transfers at the top.

### 5.5 Gemini Logistics Insights

After an audit completes:

#### Low Stock & Urgent Flags

Alerts grouped **per PHC/CHC**:

- Critical/warning badges  
- Issue summaries (stockouts, staff absence, bed capacity, etc.)  

#### Intervention Briefs

AI-flagged underperforming centres with:

- Centre name  
- Severity  
- Short intervention brief for the DHO  

If Functions/Gemini are unreachable, the UI may show a **Simulated** badge and still render useful recommended actions from a deterministic fallback.

### 5.6 Facilities Requiring District Intervention

Operational table (not AI-generated copy) listing only centres with `status !== normal`:

| Column | Content |
|--------|---------|
| Center Name / Type | Facility identity |
| Staffing Status | Present vs total (highlights zero doctors) |
| Bed Load | Occupied / total (highlights ≥90%) |
| Pharmacy Stockouts | Zero-stock medicine names |
| Current Status | Badge: warning / critical |

If all centres are `normal`, an empty success state is shown.

Clicking **More details** on the map scrolls here for faster triage.

### 5.7 Citizen Feedback hub

District-wide feedback stream:

- Total review count + average rating  
- Chronological list: name, centre tag, stars, date, free-text, category tags  
- **Summarize Feedback** → Gemini produces per-centre summaries (avg rating, review count, narrative)

This closes the loop from citizen submissions in the public portal to admin decision-making.

---

## 6. Health Center Staff — Operations Portal

Sign in as `phc-narendra@dharwad.demo`. Sub-nav defaults to **Health Facility Portal**.

Staff are **scoped to their assigned centre**; the facility name is shown locked (no district-wide selector).

### 6.1 District Transfer Notifications

When the admin has notified a redistribution involving this centre, a panel appears at the top:

- Item name, quantity, High/Medium urgency  
- Role-aware copy:
  - **Donor**: “Send supply … Update your stock after the handoff.”  
  - **Recipient**: “Receive supply … Update your stock once received.”  
- Confirmation status for this centre vs the other centre  
- **Mark as Completed** → sets `donorConfirmed` or `recipientConfirmed`  
- When **both** confirm → transfer becomes `completed` (visible to admin)

Staff are expected to adjust pharmacy stock manually to match the physical handoff.

### 6.2 Daily Operational Logs

Edit and save:

| Field | Notes |
|-------|-------|
| **Doctors Present** | Capped at facility total |
| **Beds Occupied** + **Total capacity** | Occupancy feeds KPIs and status |
| **Patient Footfall Today** | Live district KPI input |

**Save Daily Logs** writes to Firestore. Status may auto-escalate (`normal` → `warning` → `critical`) from occupancy/staffing rules.

### 6.3 Diagnostic Diagnostics Audit

Checklist of facility diagnostic capabilities (e.g. lab / imaging kits). Toggles save immediately and are visible to citizens on centre cards.

### 6.4 Pharmacy & Medicine Supply Chain

Editable realtime inventory table:

| Column | Behaviour |
|--------|-----------|
| Medicine / Category | Fixed labels |
| Current Stock | −10 / +10 buttons or direct number edit |
| Min Limit | Threshold used by AI + status engine |
| Daily Use | Used in stockout forecasting |
| Status | **OUT** (0) · **LOW** (&lt; min) · **SUFFICIENT** |

Inventory writes also recompute centre status based on how many items are critical/low.

---

## 7. Voice Reporter

Staff sub-nav → **Voice Reporter**.

Multilingual voice intake for workers who prefer speaking over typing forms.

### Flow

```
Mic / Preset / Typed text
        ↓
Cloud Speech-to-Text (live audio)   ← transcribeAudio
        ↓
Transcript (Hindi / Kannada / Telugu / English / Hinglish)
        ↓
Gemini parseVoiceReport
        ↓
Structured action preview
        ↓
Confirm & Commit → Firestore (source: voice)
```

### Left panel — Record / Input

1. Confirm **Reporting Health Center** (defaults to assigned centre).  
2. Click the microphone → record → click again to stop.  
3. Audio is transcribed via Cloud Speech-to-Text (`WEBM_OPUS`).  
4. Or pick a **Demo Preset** (Hindi stockout, Kannada staff/beds, Hinglish insulin, Telugu beds).  
5. Or type/edit the transcript manually.  
6. Click **Process & Translate Report**.

### Right panel — AI Processing & Actions

Shows:

- Original transcript  
- English translation  
- Operation type: **Stock Update** · **Staff Log** · **Bed Status**  
- Extraction confidence %  
- Parsed fields (item + quantity, doctors present, or beds occupied)

Then **Confirm & Commit to Live Database**, which updates inventory or centre metrics with `source: 'voice'`. That immediately ripples into the admin KPIs, map status colours, and AI audit inputs.

If the microphone or Speech API is unavailable, presets + manual typing keep the demo path working.

---

## 8. Citizen Health Portal

Sign in as Citizen (anonymous). Three tabs:

### 8.1 Find Health Centers

**Search** by centre name or location.  
**Filter** by All Types / PHC Only / CHC Only.

Each centre card shows:

- Status colour bar + badge (**Available** / **Busy** / **Overcrowded**)  
- Type (PHC/CHC) and location  
- **Beds Free**, **Doctors present/total**, **Patients Today**, estimated **Distance**  
- **Available Diagnostic Tests** (available / unavailable chips)  
- Actions:
  - **Get Directions** → Google Maps directions (lat/lng when present, otherwise name+location search)  
  - **Rate This Center** → jumps to Feedback tab with the centre pre-selected  

### 8.2 Give Feedback

Form fields:

| Field | Notes |
|-------|-------|
| Centre visited | Required |
| Name | Optional (defaults to anonymous) |
| Star rating (1–5) | Required; hover labels Poor → Excellent |
| Category tags | Cleanliness, Staff Behavior, Medicine Availability, Wait Time, Facilities, Overall Experience |
| Detailed text | Free-form; can be filled by typing **or voice** |

Voice input:

- Click **Record Feedback** to start recording and allow microphone permissions when prompted.
- Click again to stop; the app runs **Speech-to-Text** and auto-fills the “Detailed Feedback” textbox.
- If microphone access isn’t available (or the site isn’t running in a **secure context** — HTTPS or `localhost`), use the built-in **simulated voice feedback** sample buttons to populate feedback text for demos.

Submit stores feedback under `centers/{id}/feedback`. Success state thanks the user, then resets.

Selecting a centre also shows **recent feedback** for that facility (last entries with stars, text, tags).

Admins see the same submissions in the District Control Center feedback hub.

### 8.3 Health Schemes

Informational cards (translated with the UI language):

1. Ayushman Bharat (PMJAY)  
2. Janani Suraksha Yojana  
3. National Health Mission  
4. Rashtriya Bal Swasthya Karyakram  

Plus an **Emergency Helplines** grid: 104, 108, 112, 181, 1098, and Ayushman Bharat toll-free.

### Citizen language switch

Top bar language select re-translates portal strings, schemes, and category labels. Preference is stored in `localStorage` (`chikitsalay_preferred_language`) and reused on return visits.

---

## 9. End-to-end supply transfer story

This is the strongest multi-role production demo. Walk it in order:

### Step A — Create imbalance (Staff)

1. Login as **PHC Narendra** staff.  
2. Drop a medicine (e.g. Paracetamol / Insulin) well below `Min Limit`, or to `0`.  
3. Alternatively use **Voice Reporter** → Hindi preset → Process → Confirm.  
4. Logout.

### Step B — Detect & recommend (Admin)

1. Login as **Administrator**.  
2. Wait for auto-audit (or click **Trigger Gemini AI Audit**).  
3. Watch:
   - Stockout KPI climb  
   - Map marker may go warning/critical  
   - Urgent Flags / Intervention Briefs populate  
   - **Smart Transfer Suggestions** propose donor → recipient moves with routes on the map  

### Step C — Notify centres (Admin)

1. On a suggestion card, click **Notify Health Centres**.  
2. The suggestion moves to **Awaiting Centre Confirmation**.  

### Step D — Confirm handoff (Staff)

1. Login again as the affected staff account (and, in a full demo with multiple staff accounts, the other centre).  
2. In the transfer notification panel for the assigned centre, click **Mark as Completed**.  
3. Adjust pharmacy stock to reflect the physical transfer.  

> With the seeded demo, only Narendra staff credentials are published. For a two-party confirmation demo, use a second healthcenter user if seeded, or illustrate donor confirmation on Narendra when it is the donor/recipient side.

### Step E — Close the loop (Admin)

1. Refresh/return to Admin view.  
2. Transfer appears under **Completed Transfers** once both sides confirm.  
3. Optional: open **Citizen Feedback**, submit a review from the citizen portal, then **Summarize Feedback** on the admin side.

---

## 10. Languages & accessibility

| Capability | Where it appears |
|------------|------------------|
| **5 UI languages** (en / hi / kn / te / ta) | Homepage + Citizen portal |
| **Preferred language persistence** | `localStorage` |
| **Translation cache** | In-memory + versioned localStorage to cut API cost |
| **Text size A− / A / A+** | Homepage top bar |
| **Skip to Main Content** | Homepage + authenticated chrome |
| **Voice languages** | Hindi, Kannada, Telugu, English/Hinglish intakes |

Cloud Translation runs server-side through `translateTextFn` (batch up to 80 strings). Homepage translation can establish an anonymous session so unauthenticated visitors can still switch languages.

---

## 11. What happens behind the scenes

Optional technical context for how the production system behaves under the hood.

### Realtime data

Firestore listeners keep centres, inventory, transfers, and feedback in sync across roles. Staff updates appear on the admin KPIs without a page refresh.

### AI (server-side only)

| Function | Used for |
|----------|----------|
| `analyzeDistrict` | Forecasts, alerts, redistributions, underperforming centres (optionally enriched with BigQuery 7-day trends) |
| `parseVoiceReport` | Structured voice → stock/staff/bed commands |
| `summarizeCitizenFeedback` | Admin feedback narratives *(client orchestration via Gemini service)* |

`GEMINI_API_KEY` never ships to the browser.

### Voice & translation

| Function | Used for |
|----------|----------|
| `transcribeAudio` | Speech-to-Text |
| `translateTextFn` / `getLanguages` | UI multilingual support |

### Analytics

| Mechanism | Cadence |
|-----------|---------|
| `scheduledBigQuerySync` | Daily snapshot → `health_ops.centers_daily` / `inventory_daily` |
| Rate limiting | ~15 Cloud Function calls/min/user |

### Security highlights

- Role documents under `users/{uid}` are Function-written only.  
- Staff can update **only their centre**.  
- Citizens can read centres/inventory and create feedback.  
- Admins can manage transfers district-wide.  
- Production can enable **App Check** (reCAPTCHA v3) when configured.

---

## 12. Suggested demo script (10–12 minutes)

| Time | Move |
|------|------|
| **0:00–1:30** | Homepage: language switch (e.g. Hindi), announcements, feature cards, helplines |
| **1:30–2:00** | Login as **Citizen** → Find centres → show beds/doctors → Get Directions → Rate a centre |
| **2:00–2:30** | Health Schemes + helplines tab |
| **2:30–3:00** | Logout → Login as **Staff** (`phc-narendra`) |
| **3:00–5:00** | Drop stock OR Voice Reporter preset → Process → Confirm to live DB |
| **5:00–5:30** | Logout → Login as **Admin** |
| **5:30–8:00** | KPIs, map (critical tooltips), auto/manual Gemini audit, flags + briefs |
| **8:00–9:30** | Notify a Smart Transfer; explain dual confirmation model |
| **9:30–11:00** | Confirm transfer as staff (or show completed transfer path); open Citizen Feedback + Summarize |
| **11:00–12:00** | Wrap: three portals, one live pipe, AI + voice + multilingual citizen loop |

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`README.md`](README.md) | Setup, env vars, deploy |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System design, data model, security |

**Live app:** [https://chikitsalaysetu.web.app](https://chikitsalaysetu.web.app)
