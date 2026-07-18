# ChitLedger Design System (PLUM & MILK)

This document is the single source of truth for the styling guidelines, color systems, component states, and micro-interactions across the entire ChitLedger application.

---

## 🎨 Color System

The application uses a strict **two-color palette** with zero fallback to grayscales or other primary/accent colors.

*   **Primary (PLUM)**: `#371931` (A deep corporate burgundy)
*   **Secondary (MILK)**: `#FFF3E5` (A warm banking cream)

### Strict Contrast Rules
1.  **On PLUM Backgrounds**: All text, icons, borders, outlines, hover states, and dividers **must** use **MILK** (`#FFF3E5`).
2.  **On MILK Backgrounds**: All text, icons, borders, outlines, hover states, and dividers **must** use **PLUM** (`#371931`).
3.  No secondary color palettes (slate, zinc, neutral, green, red, yellow) are permitted. All status labels, active tabs, and highlights must be represented using solid contrast fields or double border outlines using only PLUM and MILK.

---

## 📐 Layout & Architecture

*   **Sidebar**: Background: **PLUM** | Text & Elements: **MILK**
*   **Header Bar**: Background: **MILK** | Text & Elements: **PLUM** | Bottom Border: **PLUM**
*   **Main Canvas**: Background: **MILK** | Elements: **PLUM**
*   **Modals & Overlays**: Background: **MILK** | Borders & Inputs: **PLUM**

---

## 🔘 Component Guidelines & Micro-Interactions

### 1. Border Radius Rule
Every component must use a strict **8px (0.5rem)** corner radius:
*   Cards, buttons, inputs, tables, dropdowns, modals, and panel containers.
*   Pills (fully rounded elements) and circles are strictly banned.

### 2. Interaction & Hover Inversion
Every interactive element must provide feedback through color inversion and transition curves:
*   **PLUM Button** (`.btn-plum`):
    *   *Default*: PLUM background, MILK text, no border.
    *   *Hover*: MILK background, PLUM text, PLUM border. Translates upward by `-2px`, increasing shadow depth.
    *   *Active Press*: Scales subtly to `97%` for a physical clicking response.
*   **MILK Button** (`.btn-milk`):
    *   *Default*: MILK background, PLUM text, PLUM border.
    *   *Hover*: PLUM background, MILK text, MILK border. Translates upward by `-2px`, increasing shadow depth.
    *   *Active Press*: Scales subtly to `97%`.
*   **Table Rows**:
    *   *Default*: MILK background.
    *   *Hover*: Inverts row to PLUM background with MILK text. Smooth transition curve.

### 3. Card Elevation & Hover (`.card-milk`)
*   **On MILK Surfaces**: Card moves up `-3px` (translate-y) and shadow elevates from `shadow-sm` (soft PLUM `rgba(55,25,49,0.05)`) to `shadow-md` (PLUM `rgba(55,25,49,0.08)`).
*   **On PLUM Surfaces**: Card moves up `-3px` and shadow elevates to `shadow-milk-md`.

### 4. Shadow & Elevation System
*   **On MILK Surfaces**: Use a soft PLUM-tinted shadow (`rgba(55, 25, 49, 0.06)`).
*   **On PLUM Surfaces**: Use a soft MILK-tinted shadow (`rgba(255, 243, 229, 0.08)`).

### 5. Forms & Inputs (`.input-milk`)
*   Background: **MILK** | Border: **PLUM** | Text: **PLUM** | Radius: **8px**.
*   *Hover*: Outer border color emphasizes.
*   *Focus State*: Border color hardens, and a soft outer glow ring (`ring-2 ring-plum/10`) is applied along with a focus shadow.

### 6. Sidebar Navigation Items
*   *Hover*: Background highlights using `bg-milk/10`, icon scales subtly, and text color transitions.
*   *Active State*: Background changes to solid `bg-milk` with `text-plum` and translates slightly right (`translate-x-1 pl-2.5`) to lock focus.
