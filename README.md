# 🏛️ CivicX: The Ultimate Civic Governance Terminal

**CivicX** is a production-grade, AI-powered civic engagement platform that bridges the gap between citizens and municipal authorities. It combines a high-fidelity mobile-first experience for citizens with a powerful, real-time command center for city officials.

---

## 🌟 Key Platforms

### 📱 1. The Citizen Mobile App
Designed for maximum friction-less engagement:
- **AI-Powered Reporting**: Real-time issue classification and urgency scoring via Gemini 2.5 Flash.
- **CivicSpeak**: Advanced voice-to-intel reporting system.
- **Geospatial Map**: High-res intelligence layer with real-time tracking and hotspot clustering.
- **Gamified Rewards**: Earn XP, level up, and redeem points for real-world vouchers (Amazon, Flipkart, etc.).

### 🏛️ 2. The Official Dashboard
Tailored for rapid resolution and department management:
- **Authority Feed**: Filtered view of issues assigned specifically to your department.
- **Resolution Tracking**: Detailed history of resolved tasks and performance metrics.
- **Rewards System**: Earn and redeem performance-based reward points.
- **Critical Queue**: Dedicated section for high-priority/life-threatening issues.

### 🔐 3. The Administrative Control Center
A master governance interface for platform stewards:
- **User Management**: Full CRUD capabilities for citizens and officials.
- **Data Governance**: Permanent deletion of fraudulent or duplicate reports.
- **Global Analytics**: Real-time category breakdowns and 7-day reporting trends.
- **Audit Trails**: Complete transparency into all system actions.

---

## 🚀 Core Technologies

### Frontend (Modern React Suite)
- **Framework**: React 19 + Vite 8
- **State**: Zustand (Atomic, high-performance global state)
- **Motion**: Framer Motion (Premium micro-animations)
- **Maps**: Leaflet + React Leaflet Cluster
- **Styling**: Vanilla CSS Design Tokens + Tailwind CSS 4

### Backend (Robust Node Infrastructure)
- **Server**: Node.js + Express
- **DB**: MongoDB + Mongoose (Geospatial Indexing)
- **AI**: Google Generative AI (Gemini 2.5 Flash)
- **Automation**: n8n Webhook Integration

---

## ⚙️ Rapid Setup Guide

### 1. Requirements
- Node.js v18+
- MongoDB instance (Atlas or Local)
- Gemini API Key

### 2. Configuration (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secure_secret
GEMINI_API_KEY=AIzaSy...
ADMIN_EMAIL=admin@civicx.app
ADMIN_PASSWORD=admin123
```

### 3. Execution
```bash
# Install all dependencies
npm install

# Build & Launch (Development)
npm run dev

# Verification
# Admin Panel: http://localhost:5173/admin
# Citizen App: http://localhost:5173/
```

---

## 🛡️ Security & Integrity
- **Role-Based Access Control (RBAC)**: Strict separation of Citizen, Official, and Admin roles.
- **AI Fraud Detection**: Built-in validation scores to prevent platform abuse.
- **Rate Limiting**: Protects against automated spam and API flooding.

---

**CivicX** — *Empowering the pulse of the city through intelligence.*

