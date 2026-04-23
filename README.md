# 🏛️ CivicX AI: Next-Generation Governance Terminal

CivicX AI is a state-of-the-art, mobile-first, AI-powered civic engagement platform designed for the modern smart city. It merges deep technical intelligence with premium, startup-level aesthetics to bridge the gap between citizens and municipal authorities.

## 🚀 Key Innovation Pillars

### 1. Unified Intelligence Terminal
The application features a **Unified Frontend Architecture**, merging the Citizen App and the Governance (Admin) Terminal into a single, high-performance React codebase.
*   **Citizen Interface**: Addictive, mobile-first UX for reporting, rewards, and real-time community engagement.
*   **Governance Interface**: A fully responsive, mobile-optimized command center accessible via `/admin`.
*   **Mobile-First Design**: Native-like experience with collapsible sidebars and gesture-friendly interactions.

### 2. Civic Brain v2.5 (Gemini 2.5 Flash)
Our proprietary AI engine, powered by the latest **Google Gemini 2.5 Flash**, automates the entire civic lifecycle with near-instant latency:
*   **Intelligent Classification**: High-fidelity detection of issue categories from natural language.
*   **Dynamic Urgency Scoring**: Real-time 1-10 priority calculation based on public safety risk.
*   **Predictive Insights**: AI identifies emerging trouble spots and suggests technical resolutions for city workers.
*   **CivicSpeak Voice Integration**: Stable, hands-free voice reporting with continuous listening and automatic silence handling.

### 3. Advanced Geospatial Intelligence
The map system has been upgraded to a high-fidelity intelligence layer:
*   **Interactive Fly-To Navigation**: Smoothly pans and zooms to reported issues upon interaction.
*   **Multi-Layer Terrain Engine**: Toggle between High-Res Street, Satellite, and OpenTopoMap Terrain views.
*   **Precision Geolocation**: Real-time blue-arrow tracking of user position for hyper-accurate reporting.
*   **Proactive Hotspot Clustering**: Aggregates nearby reports into actionable risk zones.

### 4. Addictive Reward Ecosystem
A sophisticated gamification engine designed to drive consistent citizen engagement:
*   **XP & Leveling System**: Progressive levels with addictive progress mechanics.
*   **Dynamic Tiers**: Tier-based status from Bronze to Platinum based on "Civic Reputation."
*   **Premium Voucher Marketplace**: Seamless redemption of real-world gift cards (Amazon, Google Play, Flipkart).

## 🛠️ Tech Stack

### Frontend
*   **Core**: React 19 + Vite 8
*   **Styling**: Modern Vanilla CSS (Design Tokens) + Tailwind CSS 4
*   **Animation**: Framer Motion (Micro-interactions & Page Transitions)
*   **Maps**: Leaflet + React Leaflet Cluster + OpenTopoMap
*   **State Management**: Zustand (Global Store)

### Backend
*   **Core**: Node.js + Express
*   **Database**: MongoDB + Mongoose (Geospatial Indexing)
*   **AI Engine**: Google Generative AI (Gemini 2.5 Flash)
*   **Security**: JWT + BcryptJS + Express Rate Limit

## ⚙️ Setup & Deployment

### 1. Environment Configuration

Create `.env` in `server/`:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key
ADMIN_EMAIL=admin@civicx.app
ADMIN_PASSWORD=your_admin_password
```

### 2. Installation
```bash
# Install dependencies
npm install

# Run AI Diagnostics (Verify Gemini Integration)
cd server
node test-ai.js

# Start Development Environment
npm run dev
```

## 🔒 Security & Performance
*   **Role-Based Access (RBAC)**: Secure separation between Citizen and Administrative privileges.
*   **Intelligent Rate Limiting**: Protection against spam reporting and API abuse.
*   **Robust JSON Parsing**: Advanced error handling for AI responses to prevent system fallbacks.

---
**CivicX AI** — *Empowering the pulse of the city through intelligence.*
