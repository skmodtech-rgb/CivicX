# 🏛️ CivicX: High-Fidelity Design System & UX Specification

This document serves as the authoritative blueprint for the CivicX platform. It is designed to guide AI agents and engineers in recreating a pixel-perfect, premium, mobile-first experience.

---

## 🎨 1. Color System

CivicX uses an **Achromatic Dark foundation** with **Brand Green** accents and **Vibrant Semantic** indicators.

### 🌑 Dark Mode Tokens (Primary)
| Variable | Value | Usage |
| :--- | :--- | :--- |
| `--color-bg` | `#0A0A0A` | Base app background. |
| `--color-surface` | `#121212` | Elevated surfaces (sidebars, nav). |
| `--color-card` | `#1E1E1E` | Main component containers. |
| `--color-border` | `#2A2A2A` | Subtle dividers. |
| `--color-primary` | `#1ED760` | Brand Green (Buttons, Active states). |
| `--color-text` | `#FFFFFF` | Primary headings. |
| `--color-text-muted` | `#B3B3B3` | Secondary text. |

### 🚨 Semantic States
- **Critical/Error**: `#EF4444` (SOS, Critical Urgency).
- **Success/Resolved**: `#22C55E` (Points earned, Resolution).
- **Warning/Pending**: `#EAB308` (Needs Attention).
- **Info/Assigned**: `#3B82F6` (Official status).

---

## 📐 2. Layout & Spacing

### 📱 Grid System
- **Base Unit**: 8px (All margins/padding are multiples of 8).
- **Page Gutter**: 16px on mobile, 32px on desktop.
- **Card Radius**: `32px` (Extra large rounding for a modern "app" feel).
- **Input Radius**: `12px`.

### 🏗️ Atomic Components
- **Glass Panel**: 
  ```css
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  ```
- **Premium Button**:
  - `height: 48px`, `border-radius: 999px`, `font-weight: 700`, `letter-spacing: 0.5px`.
  - Hover: `transform: translateY(-2px)`, `box-shadow: 0 8px 20px rgba(30, 215, 96, 0.3)`.

---

## 📱 3. Core Interface Specifications

### 🏡 Citizen Home (Mobile Feed)
- **Top Bar**: User avatar (left), SOS quick-action (right).
- **Stats Carousel**: Horizontal scrollable cards for Reputation and Level.
- **Complaint Cards**: 
  - Image background with bottom-up dark gradient.
  - Overlay: Title (bold white), Status (top right badge), Urgency (bottom right indicator).

### 📋 Submission Flow (Step-by-Step)
1. **Media**: Drag-and-drop or camera shutter interface.
2. **Details**: Title and description with AI-assisted autocomplete.
3. **Location**: Full-screen map with "Use Current Location" primary action.
4. **Analysis**: Lottie animation while Gemini processes the payload.

### 🏛️ Admin/Official Terminal
- **Sidebar**: High-contrast dark sidebar with "Flat Icons" (SVG).
- **Metric Cards**: Large typography for totals with colored trend indicators.
- **DataTable**: Clean row-based layout with "Action" columns (Notify, Delete, Reassign).

---

## 🎬 4. Animation & Interactivity

### ⚛️ Framer Motion Orchestration
- **Page Transitions**: 
  - `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`.
- **Micro-interactions**:
  - Button Tap: `scale: 0.95`.
  - Hover: `scale: 1.02`.
- **Staggered Entrance**: Grid items animate with `delay: i * 0.1`.

### 🚨 Critical SOS Pulse
```css
@keyframes strobe {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
```

---

## 🗺️ 5. Geospatial Visualization

- **Base Layer**: Dark-mode street map (CartoDB DarkMatter).
- **Markers**: 
  - `Pill` shape with category icon.
  - Color-coded: Yellow (Pending) -> Blue (In Progress) -> Green (Resolved).
- **Fly-To Interaction**: Zoom level `16` for single issues, `13` for clusters.

---

**CivicX Design Philosophy** — *The intersection of official authority and startup premium.*


---

**CivicX** — *Designing for the Pulse of the City.*

