# ARKA Design System — Visual Tokens

Design tokens for the ARKA clinical decision support platform. Brand anchors: **navy** `#0F172A`, **slate** `#1E293B`, **teal** `#14B8A6`. Source of truth: `tailwind.config.ts` and `styles/globals.css`.

---

## Color ramps

### `arka-teal-*` (50–950)

| Token | Hex | Usage |
|-------|-----|-------|
| `arka-teal-50` | `#F0FDFA` | Subtle teal wash |
| `arka-teal-100` | `#CCFBF1` | Hover backgrounds |
| `arka-teal-200` | `#99F6E4` | Selection highlight |
| `arka-teal-300` | `#5EEAD4` | Borders, accents |
| `arka-teal-400` | `#2DD4BF` | Interactive hover |
| `arka-teal-500` | `#14B8A6` | **Brand accent** (`arka-teal`, `arka-cyan`) |
| `arka-teal-600` | `#0D9488` | Pressed / active |
| `arka-teal-700` | `#0F766E` | Dark accent text |
| `arka-teal-800` | `#115E59` | Deep accent |
| `arka-teal-900` | `#134E4A` | Dark UI accent |
| `arka-teal-950` | `#042F2E` | Darkest teal |

### `arka-slate-*` (50–950)

| Token | Hex | Usage |
|-------|-----|-------|
| `arka-slate-50` | `#F8FAFC` | Page alt background (`arka-bg-light`) |
| `arka-slate-100` | `#F1F5F9` | Muted fill (`arka-pale`, `arka-bg-alt`) |
| `arka-slate-200` | `#E2E8F0` | Subtle borders (`arka-light`) |
| `arka-slate-300` | `#CBD5E1` | Strong borders |
| `arka-slate-400` | `#94A3B8` | Disabled / placeholder |
| `arka-slate-500` | `#64748B` | Soft body text (`arka-text-dark-soft`) |
| `arka-slate-600` | `#475569` | Muted body text (`arka-text-dark-muted`) |
| `arka-slate-700` | `#334155` | Secondary headings |
| `arka-slate-800` | `#1E293B` | **Brand slate** (`arka-deep`, `arka-bg-medium`) |
| `arka-slate-900` | `#0F172A` | **Brand navy** (`arka-primary`, `arka-navy`, `arka-bg-dark`) |
| `arka-slate-950` | `#020617` | Deepest background |

---

## Semantic surfaces & borders

| Token | Hex | Tailwind class | Usage |
|-------|-----|----------------|-------|
| `surface` | `#FFFFFF` | `bg-surface` | Default page canvas |
| `surface-raised` | `#FCFDFE` | `bg-surface-raised` | Cards, panels |
| `surface-sunken` | `#F1F5F9` | `bg-surface-sunken` | Inset wells, sidebars |
| `surface-dark` | `#0F172A` | `bg-surface-dark` | Hero, nav, footer |
| `surface-dark-raised` | `#16203A` | `bg-surface-dark-raised` | Elevated dark panels |
| `border-subtle` | `#E2E8F0` | `border-border-subtle` | Default dividers |
| `border-strong` | `#CBD5E1` | `border-border-strong` | Emphasized borders |

---

## Clinical status

| Token | Hex | `-bg` pastel | Tailwind |
|-------|-----|--------------|----------|
| `success` | `#059669` | `#ECFDF5` | `text-success`, `bg-success-bg` |
| `warning` | `#D97706` | `#FFFBEB` | `text-warning`, `bg-warning-bg` |
| `danger` | `#DC2626` | `#FEF2F2` | `text-danger`, `bg-danger-bg` |
| `info` | `#0284C7` | `#EFF6FF` | `text-info`, `bg-info-bg` |

---

## Typography

**Font:** Inter via `next/font` (`display: swap`). OpenType features: `cv02`, `cv03`, `cv04`, `cv11`.

| Token | Size | Line height | Letter spacing | Class |
|-------|------|-------------|----------------|-------|
| `display` | `clamp(2.5rem, 5vw, 4rem)` | 1.05 | −0.03em | `text-display` |
| `h1` | 2.25rem | 1.15 | −0.025em | `text-h1` |
| `h2` | 1.75rem | 1.2 | −0.02em | `text-h2` |
| `h3` | 1.375rem | 1.25 | −0.015em | `text-h3` |
| `body-lg` | 1.125rem | 1.6 | 0 | `text-body-lg` |
| `body` | 1rem | 1.6 | 0 | `text-body` |
| `caption` | 0.875rem | 1.5 | +0.01em | `text-caption` |

Headings use negative tracking; never apply default `tracking-normal` on heading tokens.

---

## Elevation (shadows)

| Token | Description |
|-------|-------------|
| `elevation-1` | Resting — chips, inputs |
| `elevation-2` | Cards at rest |
| `elevation-3` | Dropdowns, popovers |
| `elevation-4` | Modals, dialogs |

Legacy aliases `shadow-card` and `shadow-card-hover` remain for existing components.

### Glow (teal, ~30% reduced opacity)

| Token | Opacity |
|-------|---------|
| `glow-sm` | ~10.5% |
| `glow` | ~14% |
| `glow-lg` | ~17.5% |

---

## Border radius

| Token | Value | Recommended use |
|-------|-------|-----------------|
| `radius-sm` | 6px | Badges, tags |
| `radius-md` | 10px | Buttons, inputs |
| `radius-lg` | 14px | Cards |
| `radius-xl` | 20px | Modals |

Classes: `rounded-radius-sm`, `rounded-radius-md`, `rounded-radius-lg`, `rounded-radius-xl`.

---

## Motion

### Preserved (do not retime)

| Animation | Duration | Easing |
|-----------|----------|--------|
| `animate-fade-in` | 300ms | ease-out |
| `animate-slide-up` | 300ms | ease-out |
| `animate-pulse-glow` | 2s | ease-in-out |

### Additive (new components)

| Animation | Spec |
|-----------|------|
| `animate-fade-in-up` | 12px translateY, 400ms, `cubic-bezier(0.16, 1, 0.3, 1)` |
| `animate-scale-in` | scale 0.97→1, 250ms ease-out |
| `animate-shimmer` | 2s linear infinite — pair with `bg-shimmer` |
| `stagger-children` | Parent utility; children set `--stagger-index` for 60ms incremental delay |

---

## Texture utilities

| Class | Description |
|-------|-------------|
| `bg-grain` | SVG noise overlay at 4% opacity — dark hero sections |
| `bg-grid-faint` | 1px slate grid, 32px cells, radial mask fade — technical sections |
| `bg-shimmer` | Skeleton gradient base for `animate-shimmer` |

---

## Legacy aliases (backward compatible)

| Legacy token | Maps to |
|--------------|---------|
| `arka-primary`, `arka-navy`, `arka-bg-dark` | `arka-slate-900` |
| `arka-deep`, `arka-bg-medium` | `arka-slate-800` |
| `arka-teal`, `arka-cyan` | `arka-teal-500` |
| `arka-light` | `arka-slate-200` |
| `arka-pale`, `arka-bg-alt` | `arka-slate-100` |
| `arka-bg-light` | `arka-slate-50` |
| `arka-text-dark` | `arka-slate-900` |
| `arka-text-dark-muted` | `arka-slate-600` |
| `arka-text-dark-soft` | `arka-slate-500` |

---

## Root layout defaults

`app/layout.tsx` body: `antialiased`, `text-arka-slate-900`, `bg-surface`, `selection:bg-arka-teal-200 selection:text-arka-slate-900`.
