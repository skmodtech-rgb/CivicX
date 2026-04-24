# 🏛️ CivicX: High-Fidelity Design System & UX Specification

This document serves as the authoritative blueprint for the CivicX platform. It is designed to guide AI agents and engineers in recreating a pixel-perfect, premium, mobile-first experience.

---

## 🎨 1. Color System

CivicX uses an **Achromatic Dark/Light foundation** with a singular **Vibrant Green** brand accent.

### 🟢 Brand Colors
| Role | HEX | Usage |
| :--- | :--- | :--- |
| **Primary (Brand)** | `#1ED760` | Play buttons, Active states, Primary CTAs, Key Brand Elements. |
| **Primary Hover** | `#1DB954` | Hover states for primary green elements. |

### 🌑 Dark Mode (Primary Theme)
| Role | HEX | Usage |
| :--- | :--- | :--- |
| **Base Background** | `#0A0A0A` | Deepest layer, app background. |
| **Secondary BG** | `#121212` | Sidebar background, secondary sections. |
| **Surface/Card** | `#1E1E1E` | Cards, elevated panels, modal backgrounds. |
| **Border** | `#2A2A2A` | Subtle dividers and component outlines. |
| **Text Primary** | `#FFFFFF` | Main headings, emphasized text. |
| **Text Secondary** | `#B3B3B3` | Body text, labels. |
| **Text Muted** | `#737373` | Metadata, inactive icons, placeholder text. |

### ☀️ Light Mode (Adaptive Theme)
| Role | HEX | Usage |
| :--- | :--- | :--- |
| **Base Background** | `#F8F9FA` | Page background. |
| **Secondary BG** | `#FFFFFF` | Secondary sections. |
| **Surface/Card** | `#FFFFFF` | Cards, elevated panels. |
| **Border** | `#E5E7EB` | Subtle dividers. |
| **Text Primary** | `#111827` | Main headings. |
| **Text Secondary** | `#4B5563` | Body text. |
| **Text Muted** | `#9CA3AF` | Metadata. |

### 🚨 Semantic & Status
- **Success**: `#22C55E` (Resolved, Verified, +Points)
- **Warning**: `#EAB308` (In Progress, Caution)
- **Error/Emergency**: `#EF4444` (Critical, Rejected, Delete)
- **Info**: `#3B82F6` (Assigned, Intelligence Hints)

---

## 🅰️ 2. Typography

**Primary Font Family**: `Inter` (Fallback: `system-ui, sans-serif`)
**Secondary/Display Font**: `Outfit` (for H1/H2 for a more premium look)

| Level | Size | Weight | Line Height | Case | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 (Display)** | `32px` | `800` | `1.1` | Sentence | `-0.04em` |
| **H2 (Section)** | `24px` | `700` | `1.2` | Sentence | `-0.02em` |
| **H3 (Card Title)**| `18px` | `700` | `1.3` | Sentence | `normal` |
| **Body (Large)** | `16px` | `500` | `1.5` | Sentence | `normal` |
| **Body (Small)** | `14px` | `400` | `1.5` | Sentence | `normal` |
| **Label/Button** | `14px` | `700` | `1.0` | **UPPERCASE** | `0.1em` |
| **Micro (Meta)** | `11px` | `600` | `1.4` | **UPPERCASE** | `0.05em` |

---

## 📏 3. Spacing System

Based on an **8px grid** for consistent rhythm.

- **4px**: Micro-adjustments, internal icon-text gaps.
- **8px**: Small component internal padding.
- **12px**: Grid item gaps, small card padding.
- **16px**: Standard body padding, secondary card margins.
- **24px**: Section spacing, primary card padding.
- **32px**: Page edge padding on desktop, large section dividers.

---

## 📐 4. Border Radius & Shadows

### Border Radius
- **Pill (Button)**: `9999px`
- **Card (Large)**: `32px` (Premium rounded look)
- **Card (Standard)**: `24px`
- **Input/Badge**: `12px`

### Shadows
- **Light**: `0 4px 12px rgba(0,0,0,0.1)` (Static cards)
- **Medium**: `0 8px 24px rgba(0,0,0,0.2)` (Hover states, Modals)
- **Heavy (Dark Mode)**: `0 12px 48px rgba(0,0,0,0.5)` (AI Intelligence Panels)

---

## 🧱 5. Component System

### 🔘 Buttons
- **Primary**: Brand Green background, Black text (`#000000`), Pill shape. Scale up on hover (1.05x).
- **Secondary**: Transparent with 1px border (`var(--color-border)`), White text. Subtle background glow on hover.
- **Ghost**: No background, White text. Text turns Primary Green on hover.
- **Voice Button**: Circular (`50%`), Pulse animation when active.

### 🃏 Cards
- **Complaint Card**: `32px` radius. Gradient border on hover. Category badge top-right.
- **AI Panel**: Glassmorphism effect (`backdrop-filter: blur(12px)`). Background: `rgba(255,255,255,0.03)`.
- **Reward Card**: Interactive hover state. Background transition from Secondary BG to a subtle primary gradient.

### 🧭 Navigation
- **Mobile Bottom Bar**: 72px height. Floating effect with `blur(20px)`. Icon active state: Brand Green + subtle glow dot underneath.
- **Admin Sidebar**: 280px width. Collapsible to 80px. High contrast between active/inactive items.

---

## 📱 6. Screen-by-Screen Design

### 1. Home Screen (The Feed)
- **Header**: Circular avatar + Welcome text + Notifications icon.
- **Hero Stats**: Horizontal scroll of "Reputation Points" and "Level Progress" bars.
- **Action Bar**: Large fixed "REPORT ISSUE" button (Floating Action Button style).
- **Feed**: Vertical list of nearby complaints with high-res thumbnails.

### 2. Submission Flow
- **Step-based UI**: Progress indicator at the top.
- **Media Upload**: Large "Tap to Upload" zone with dotted border.
- **Location Selector**: Inline mini-map with current location auto-focused.

### 3. AI Analysis (The "Magic" Moment)
- **Animation**: Lottie pulse while processing.
- **Structure**: Title ("Civic Intelligence") -> Confidence Bar -> Auto-Category -> Resolution Hint.
- **Visuals**: Use `#539df5` (Info Blue) accents for AI-generated text.

---

## 🎬 7. Interactions & Animations

**Library**: `framer-motion`

- **Page Transitions**: Slide up and Fade (300ms, ease-out).
- **Staggered Lists**: Complaint cards should animate in one by one (stagger: 0.1s).
- **Micro-interactions**: 
  - Button press: `scale: 0.96`.
  - Checkboxes: Spring pop-out.
  - Progress bars: Smooth width transition (800ms).

---

## 🌗 8. Dark & Light Mode Rules

- **Theme Variable Mapping**: Use CSS Variables (`--color-bg-base`, `--color-text-primary`).
- **Surface Elevation**: In Dark Mode, higher elevation elements get lighter backgrounds. In Light Mode, higher elevation gets more shadow.
- **Image Treatment**: In Dark Mode, images should have `brightness(0.9)` to reduce eye strain.

---

## 🧠 9. UX Principles

1. **Mobile-First**: Every button is reachable with one thumb (bottom-heavy layout).
2. **Confidence First**: Show AI confidence scores to build user trust.
3. **No Dead Ends**: Every error or empty state should have a "Go back to Home" or "Try Again" button.
4. **Reward Loop**: Celebrate every submission with a "Points Earned" popup.

---

## 🔥 10. Special CivicX Elements

### Status Badge Colors
- **PENDING**: Gray Background / White Text.
- **ASSIGNED**: Blue Background / White Text.
- **IN_PROGRESS**: Yellow Background / Black Text.
- **RESOLVED**: Green Background / Black Text.

### AI Risk Indicator
- 1-3: Low (Green dot)
- 4-7: High (Orange pulse)
- 8-10: Critical (Red strobe)

---

**CivicX** — *Designing for the Pulse of the City.*

