# 🧠 CivicX: Technical Architecture & Logic Blueprint

This document specifies the internal logic, database structures, and AI configurations of the CivicX platform. It is designed to enable a "one-shot" reconstruction of the entire infrastructure.

---

## 🏗️ 1. System Architecture

- **Backend**: Node.js (Express) - RESTful API.
- **Frontend**: React 19 (Vite) - SPA with Atomic Design.
- **Database**: MongoDB (Geospatial Enabled) - Atlas recommended.
- **AI Engine**: Google Gemini 2.5 Flash - Real-time analysis & routing.
- **Automation**: n8n (External) - Handles email notifications & workflow triggers.
- **Auth**: JWT (JSON Web Tokens) - 7-day expiration with secure cookie/local storage strategies.

---

## 📊 2. Database Models (Mongoose Schemas)

### 👤 User Model
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Full name (Required). |
| `email` | String | Unique email (Required, lowercase). |
| `password` | String | Bcrypt hashed password. |
| `role` | Enum | `citizen` (default), `official`, `admin`. |
| `department` | String | Department name (only for `official`). |
| `isApproved` | Boolean | Required for `official` to login. |
| `points` | Number | Current spendable points. |
| `totalPointsEarned` | Number | Lifetime XP for leveling. |
| `level` | Number | `Math.floor(totalPointsEarned / 500) + 1`. |
| `tier` | Enum | `bronze`, `silver`, `gold`, `platinum`. |
| `reputationScore` | Number | range 0-100 (Default: 50). |
| `complaintsSubmitted`| Number | Count of reports filed. |
| `complaintsResolved` | Number | Count of reports marked as 'resolved'. |

### 📋 Complaint Model
- **Geospatial**: `location: { type: "Point", coordinates: [lng, lat] }` (2dsphere index).
| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | String | AI-generated or user-provided summary. |
| `description` | String | Detailed issue report. |
| `category` | Enum | `garbage`, `water`, `pothole`, `streetlight`, `sewage`, `noise`, `encroachment`, `traffic`, `electricity`, `police`, `fire`, `other`. |
| `urgency` | Enum | `low`, `medium`, `high`, `critical`. |
| `status` | Enum | `pending`, `assigned`, `in_progress`, `resolved`, `rejected`. |
| `images` | Array | URLs of uploaded evidence (CDN/Base64). |
| `department` | String | Assigned municipal department. |
| `isAIVerified` | Boolean | True if image/text matches category patterns. |
| `aiAnalysis` | Object | Detailed JSON (priority, sentiment, keywords, suggested_resolution). |
| `user` | ObjectID | Reference to User model. |
| `notified` | Boolean | True if department has been alerted. |

### 🚨 SOS Model
| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | Enum | `medical`, `police`, `fire`, `disaster`. |
| `status` | Enum | `active`, `responding`, `resolved`. |
| `location` | Object | `[lng, lat]` + `address`. |
| `user` | ObjectID | Reference to User. |

---

## 🤖 3. AI Engine Logic (Gemini 2.5 Flash)

### 📝 Core Classification Prompt
The system sends the following structured prompt to Gemini:
```text
Analyze this civic issue report and return ONLY a valid JSON object:
{
  "category": "garbage|pothole|streetlight|water|sewage|noise|encroachment|traffic|electricity|other",
  "priority": "low|medium|high|critical",
  "sentiment": "frustrated|concerned|neutral|angry|emergency",
  "keywords": ["tag1", "tag2"],
  "summary": "1-sentence summary",
  "confidence": 0.0-1.0,
  "urgency_score": 1-10,
  "is_valid": boolean,
  "suggested_resolution": "Technical action for authorities"
}
```

---

## 🔌 4. API Specification

### 🔓 Public / Auth
- `POST /api/auth/register`: Create user account.
- `POST /api/auth/login`: Authenticate and receive JWT.
- `GET /api/auth/profile`: [AUTH] Fetch current user data.

### 📋 Complaints
- `POST /api/complaints`: [AUTH] Submit new report with image analysis.
- `GET /api/complaints`: Fetch public feed (supports `limit`, `status` filters).
- `GET /api/complaints/:id`: Fetch full report details.
- `POST /api/complaints/:id/vote`: [AUTH] Upvote/Downvote report.

### 🏛️ Administrative (Admin Only)
- `GET /api/admin/stats`: Fetch high-level analytics (Category breakdown, daily trend).
- `GET /api/admin/users`: Fetch list of all citizens/officials.
- `POST /api/admin/users`: Create new citizen or official account.
- `DELETE /api/admin/users/:id`: Permanently delete a user.
- `GET /api/admin/complaints`: Fetch all complaints with management options.
- `DELETE /api/admin/complaints/:id`: Remove fraudulent/duplicate reports.
- `PUT /api/admin/complaints/:id`: Reassign department or update status.

### 🏛️ Official Dashboard
- `GET /api/official/assigned`: Fetch reports assigned to user's department.
- `PATCH /api/official/status`: Update report status (e.g., to `in_progress` or `resolved`).
- `GET /api/official/stats`: Fetch department-specific resolution metrics.

---

## 🪙 5. Rewards & Redemption Logic

### Point Allocation
- `Report Submission`: +50 XP
- `Resolution Contributor`: +100 XP
- `Verification (UPVOTE)`: +10 XP

### Redemption Process
1. User selects voucher (e.g., Amazon $10).
2. Backend checks `points >= cost`.
3. Deduction occurs, and a new `Redemption` record is created.
4. Admin reviews and approves the redemption.

---

## 🎙️ 6. Specialized Systems

### 📍 Map Intelligence
- **Clustering**: Uses `react-leaflet-cluster` for dense areas.
- **Dynamic Icons**: Marker colors change based on `status`.
- **Pulse Animation**: "Critical" issues (urgency > 8) trigger a CSS-based red pulse.

### 🎙️ CivicSpeak (Voice)
- Uses `webkitSpeechRecognition`.
- Logic: Continuous listening -> Real-time transcript -> Buffer analysis -> Final submission to AI Engine.

---

**CivicX Technical Specification** — *Built for Scalable Urban Intelligence.*

