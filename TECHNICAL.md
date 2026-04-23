# 🧠 CivicX AI: Technical Architecture & Logic Blueprint

This document specifies the internal logic, database structures, and AI configurations of the CivicX AI platform. Use this as the "Brain" to compliment the "Body" (DESIGN.md).

---

## 🏗️ 1. System Architecture

- **Backend**: Node.js (Express)
- **Frontend**: React 19 (Vite)
- **Database**: MongoDB (Geospatial Enabled)
- **AI Engine**: Google Gemini 2.5 Flash
- **State Management**: Zustand (Client-side)
- **Auth**: JWT (JSON Web Tokens) with 7-day expiration.

---

## 📊 2. Database Models (Mongoose Schemas)

### 👤 User Model
- `reputationScore`: (Number) Range 0-100.
- `points`: (Number) Current spendable points.
- `totalPointsEarned`: (Number) Lifetime accumulation (used for leveling).
- `level`: (Number) Calculation: `Math.floor(totalPointsEarned / 500) + 1`.
- `tier`: (Enum) `bronze`, `silver`, `gold`, `platinum`.
- `badges`: (Array) Objects with `name`, `icon`, `earnedAt`.

### 📋 Complaint Model
- `location`: GeoJSON Point `[lng, lat]` with 2dsphere indexing.
- `status`: `pending`, `assigned`, `in_progress`, `resolved`, `rejected`, `duplicate`.
- `urgency`: `low`, `medium`, `high`, `critical`.
- `aiAnalysis`: Structured object (see AI Engine section).
- `fraudScore`: (Number) Probability of fake report (0-100).
- `upvotes/downvotes`: Array of User ObjectIDs.

---

## 🤖 3. AI Engine Logic (Gemini 2.5 Flash)

### 📝 Core Classification Prompt
The system sends the following structured prompt to Gemini:
```text
Analyze and return ONLY a JSON object:
- category: [garbage, pothole, streetlight, water, sewage, noise, encroachment, traffic, electrical, other]
- priority: [low, medium, high, critical]
- sentiment: [frustrated, concerned, neutral, angry, emergency]
- keywords: Array of 5-8 strings
- summary: Professional 1-sentence summary
- confidence: Decimal 0-1
- urgency_score: 1-10 based on safety risk
- suggested_resolution: Actionable technical suggestion
```

### 🛡️ Robust Parsing
- **JSON Extraction**: Uses regex `rawText.match(/\{[\s\S]*\}/)` to isolate JSON from any conversational AI text.
- **Dynamic Initialization**: Re-initializes `GoogleGenerativeAI` per request to ensure the latest `.env` keys are active.
- **Fallback Mode**: If API fails, returns a keyword-based analysis with the source marked as `fallback`.

---

## 🎮 4. Gamification & Rewards Logic

### 🪙 Point Values
| Action | Points |
| :--- | :--- |
| Submit Complaint | `50` |
| Upload Images | `20` |
| Complaint Verified | `30` |
| Complaint Resolved | `100` |
| Community Vote | `15` |
| Badge Earned | `75` |
| Level Up | `200` |

### 📈 Leveling Math
- `Level = floor(TotalPoints / 500) + 1`
- Every level up grants a one-time `200` point bonus.

---

## 🗺️ 5. Geospatial & Intelligence Logic

### 🔍 Duplicate Detection
- **Window**: Checks for reports within the last **48 hours**.
- **Distance**: Searches within a **500-meter** radius using `$near` query.
- **Similarity**: Uses `string-similarity` library (Dice's Coefficient). Threshold: `> 0.6` matches are flagged as duplicates.

### 📍 Hotspot Aggregation (Admin)
- **Clustering**: Rounds coordinates to 3 decimal places (~110m precision).
- **Trigger**: Areas with **3+ active complaints** are flagged as "High Risk Hotspots."
- **Risk Level**: Calculated using `avg(aiAnalysis.urgency_score)`.

---

## 🔐 6. Administrative & Security

### 🔑 Admin Seeding
On server start, the system automatically:
1. Checks if `ADMIN_EMAIL` exists in the DB.
2. If not, creates a super-user with `role: 'admin'`.
3. If user exists but is not an admin, enforces the admin role upgrade.

### 🛡️ Security Layers
- **CORS**: Enforced `origin: true` with `credentials: true`.
- **Rate Limiting**: `200 requests / 15 mins` per IP for API safety.
- **Helmet.js**: Implemented for HTTP header security.

---

## ⚛️ 7. Frontend Architecture & State

### 📦 State Management (Zustand)
The app uses a unified store (`client/src/store/index.js`) to manage:
- **Auth Store**: Handles login/logout, user profile caching, and `civicx_token` persistence.
- **Complaint Store**: Manages the global list of complaints, map marker filtering, and "currentComplaint" selection.
- **UI Store**: Handles modal states, sidebar toggles, and theme switching logic.

### 🧩 Core Component Hierarchy
- **Layouts**: `AdminLayout` (Collapsible sidebar) and `CitizenLayout` (Bottom Nav).
- **MapView**: Uses `react-leaflet`. Marker logic:
  - Yellow: PENDING
  - Blue: ASSIGNED/IN_PROGRESS
  - Green: RESOLVED
  - Red Strobe: CRITICAL (AI urgenccy > 8)
- **IntelligencePanel**: Reusable component that parses `aiAnalysis` and renders a progress bar for `confidence` and a targeted `suggested_resolution`.

---

## 🛠️ 8. Integration & API Patterns

### 📡 API Service (`api.js`)
- **Base Config**: Uses `axios` with interceptors to automatically attach the `Authorization` header.
- **Base URL**: Dynamically switches between `process.env.VITE_API_BASE_URL` (Production) and `/api` (Proxy for Development).
- **Error Handling**: 401 Interceptor automatically wipes local storage and redirects to `/login`.

### 🎙️ CivicSpeak (Voice Logic)
Uses the browser's `Web Speech API`:
- **Continuous Mode**: `recognition.continuous = true` ensures the mic doesn't turn off during pauses.
- **Auto-stop**: Ends session only when user taps "Stop Intel Capture."

---

**CivicX AI Technical Stack** — *The logical heart of next-gen governance.*
