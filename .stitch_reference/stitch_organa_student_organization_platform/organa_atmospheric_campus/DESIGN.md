---
name: Organa Atmospheric Campus
colors:
  surface: '#f7f9ff'
  surface-dim: '#d1dbea'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e4effe'
  surface-container-high: '#dfe9f8'
  surface-container-highest: '#d9e3f2'
  on-surface: '#121c27'
  on-surface-variant: '#41484c'
  inverse-surface: '#27313d'
  inverse-on-surface: '#e9f1ff'
  outline: '#71787d'
  outline-variant: '#c1c7cd'
  surface-tint: '#37637c'
  primary: '#37637c'
  on-primary: '#ffffff'
  primary-container: '#a9d5f2'
  on-primary-container: '#305d76'
  inverse-primary: '#a0cce9'
  secondary: '#4c6700'
  on-secondary: '#ffffff'
  secondary-container: '#c5ee66'
  on-secondary-container: '#506c00'
  tertiary: '#4d635b'
  on-tertiary: '#ffffff'
  tertiary-container: '#bdd5ca'
  on-tertiary-container: '#485d55'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c5e7ff'
  primary-fixed-dim: '#a0cce9'
  on-primary-fixed: '#001e2d'
  on-primary-fixed-variant: '#1c4b63'
  secondary-fixed: '#c7f169'
  secondary-fixed-dim: '#acd44f'
  on-secondary-fixed: '#151f00'
  on-secondary-fixed-variant: '#394e00'
  tertiary-fixed: '#d0e8dd'
  tertiary-fixed-dim: '#b4ccc1'
  on-tertiary-fixed: '#0a1f19'
  on-tertiary-fixed-variant: '#364b43'
  background: '#f7f9ff'
  on-background: '#121c27'
  surface-variant: '#d9e3f2'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  gutter-sm: 1rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system blends an ethereal, optimistic atmosphere with pragmatic organizational utility. Designed specifically for Indonesian collegiate governance (Badan Eksekutif Mahasiswa / Himpunan Mahasiswa), the interface avoids bureaucratic sterility in favor of an airy, forward-looking campus ecosystem.

The aesthetic fuses **Soft Glassmorphism** with **Neo-Tactile Modernism**:
- Translucent, frosted sky-blue backdrops evoke spaciousness and clarity.
- Energetic lime green punctuates critical conversion moments, approvals, and status metrics.
- Organic radii, pill-shaped tags, and floating informational wafers provide a welcoming, student-friendly tactile experience while maintaining governance-grade rigor.

## Colors

The palette establishes an open, sky-like canvas with punchy, actionable accents:

- **Atmospheric Sky (`#DCEEFF` & `#A9D5F2`):** Primary structural tint. Used for gradient washes, hero container backdrops, and active navigational plateaus.
- **Punchy Lime (`#C9F36A`):** The primary kinetic signal. Reserved for primary calls-to-action, success states, positive budget deltas, and live status badges. Always paired with Deep Navy text to preserve WCAG AAA legibility.
- **Soft Mint (`#D9F1E6`):** Secondary semantic accent. Used for secondary status pills, verified member approvals, and subtle progress bars.
- **Deep Navy (`#202A35`):** Grounding neutral for primary typography, icons, and strong architectural borders. Provides optical balance to luminous background tints.
- **Muted Slate (`#7B8794`):** Secondary metadata, inactive states, and helper captions.
- **Clean Surfaces (`#FFFFFF` & `#F5F7F8`):** Elevated cards, input fills, and sheet backgrounds.

## Typography

Typography pairs the structural warmth of **Plus Jakarta Sans** for prominent headers, metric callouts, and interactive controls with the rhythmic clarity of **DM Sans** for informational tables, committee rosters, and proposal descriptions.

- **Editorial Hierarchy:** Display and headline levels rely on snug negative letter-spacing (`-0.02em` to `-0.03em`) and heavy weights (`700`–`800`) to evoke an assertive, modern editorial quality.
- **Campus Metrics:** Quantitative telemetry (budget numbers, proposal voting percentages) uses `headline-lg` or `display-hero` styled in Plus Jakarta Sans with Deep Navy color rendering.
- **Labels & Microcopy:** Tag indicators and status pills always use uppercase or tight title-case in Plus Jakarta Sans `label-sm` or `label-md` with slight positive tracking (`0.02em`–`0.04em`) to ensure instant legibility against frosted backgrounds.

## Layout & Spacing

The layout model is built on an adaptable 12-column responsive fluid grid designed around airy, open negative space:

- **Desktop (1024px+):** 12 columns, `margin` of `2rem` (expanding to auto-centered max-width container of 1440px), with `1.5rem` gutters. Side navigation drawers float as elevated cards over atmospheric sky gradient canvases.
- **Tablet (768px - 1023px):** 8 columns, `margin` of `1.5rem`, `1.25rem` gutters. Metric cards collapse to a 2x2 cluster.
- **Mobile (< 768px):** 4 columns, `margin-sm` of `1rem`, `gutter-sm` of `1rem`. Floating actions and bottom navigation ribbons replace docked side rails.

Internal card paddings prioritize breathable comfort: compact cards employ `space-md` (`1rem`), while primary dashboard hero zones and proposal overview surfaces use `space-xl` (`2.5rem`).

## Elevation & Depth

Visual hierarchy uses frosted glassmorphism and ambient tinted shadows rather than stark borders or heavy black drop shadows:

- **Surface Level 0 (Atmosphere Canvas):** Linear gradient blending from `#DCEEFF` (top/diagonal) down to `#F5F7F8` and pure white.
- **Surface Level 1 (Glass Containers & Rails):** `rgba(255, 255, 255, 0.72)` with a `16px` backdrop blur (`backdrop-filter: blur(16px)`). Bound by an ethereal top-lit stroke: `1px solid rgba(255, 255, 255, 0.6)`. Shadow: `0 12px 32px -8px rgba(32, 42, 53, 0.06)`.
- **Surface Level 2 (Floating Action Cards & Interactive Modals):** Solid `#FFFFFF` or `rgba(255, 255, 255, 0.92)`. Shadow: `0 20px 40px -12px rgba(32, 42, 53, 0.08)`, supplemented by an ambient sky glow: `0 8px 24px -4px rgba(169, 213, 242, 0.35)`.
- **Surface Level 3 (Popovers, Toasts, Dropdowns):** Crisp white with subtle perimeter ring (`1px solid rgba(32, 42, 53, 0.04)`) and pronounced soft diffusion: `0 24px 48px -12px rgba(32, 42, 53, 0.12)`.

## Shapes

The design uses an organic, humanized shape vocabulary with substantial, touch-friendly curvature:

- **Standard Cards & Modals (`rounded-lg` / `1rem`):** Content containers, data visualization cards, and administrative forms maintain a `16px` corner radius.
- **Feature Modules & Hero Blocks (`rounded-xl` / `1.5rem`):** Main program highlights, event recruitment boards, and organizational charts use generous `24px` curves.
- **Interactive Controls & Wafers (Full Pill / `9999px`):** Buttons, search bars, filter chips, avatar badges, and status pills adopt fully rounded cylindrical perimeters to evoke friendliness and approachability.

## Components

### Buttons
- **Primary CTA:** Punchy Lime (`#C9F36A`) surface, Deep Navy (`#202A35`) bold label, fully pill-shaped. Hover state introduces a luminous lime bloom (`0 8px 20px rgba(201, 243, 106, 0.45)`) and slight upward translation (`-1px`).
- **Secondary Atmospheric:** Translucent Sky (`#DCEEFF`), Deep Navy text. Hover transitions to `#A9D5F2`.
- **Ghost / Tertiary:** Deep Navy text on transparent ground; hover triggers `rgba(169, 213, 242, 0.16)` pill wash.

### Chips & Status Badges
- **Pill Badges:** Rounded full. Used for organizational roles (e.g., *Ketua BEM*, *Kadiv Humas*) and proposal states (e.g., *Disetujui*, *Dalam Review*).
- **Active / Success Badge:** Soft Mint (`#D9F1E6`) background with deep forest-navy label (`#124B38`).
- **Pending / Action Badge:** Punchy Lime (`#C9F36A`) background with Deep Navy (`#202A35`) label.

### Cards & Floating Stat Badges
- **Glass Stat Wafers:** Floating KPI counters (e.g., "Kas Himpunan", "Anggota Aktif", "LPJ Diserahkan") constructed with frosted `rgba(255, 255, 255, 0.85)` surface, `16px` blur, and a delicate inset white border. Stat numbers rendered in heavy Plus Jakarta Sans.
- **Event / Proker Cards:** Rounded `1.25rem` white cards with subtle sky drop shadow, featuring image previews, progress rings, and tag rows.

### Input Fields & Controls
- **Text Inputs:** `#FFFFFF` background with subtle light gray border (`rgba(32, 42, 53, 0.08)`), pill-shaped or soft-rounded (`0.75rem`). When focused, transitions to an energetic halo ring: `0 0 0 3px rgba(169, 213, 242, 0.5)` with `#202A35` border stroke.
- **Checkboxes & Radios:** Smooth pill-toggled switches and rounded squares (`0.375rem`) filled with Punchy Lime when checked, featuring a crisp Deep Navy glyph.

### Domain-Specific Components
- **Struktur Organisasi Tree Card:** Modular, pill-linked executive cards with avatar cutouts, division tags, and quick-contact triggers.
- **Proposal Approval Stepper:** Fluid glass progression bar utilizing Soft Mint and Punchy Lime nodes to trace bureaucratic sign-offs between student leaders and university deans.