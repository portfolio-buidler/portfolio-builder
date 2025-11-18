# Frontend SCSS Architecture & Component Structure Guide

> Version: 1.0 • Owners: Frontend Team • Scope: Portfolio Builder (frontend)

## Table of Contents
- [Title & Scope](#title--scope)
- [High-Level Overview](#high-level-overview)
- [Principles to Follow (Team-wide)](#principles-to-follow-team-wide)
- [Folder & File Structure (Authoritative)](#folder--file-structure-authoritative)
- [Naming Conventions (Strict)](#naming-conventions-strict)
- [Design Tokens (tokens/)](#design-tokens-tokens)
- [Mixins (mixins/)](#mixins-mixins)
- [Base / Layout / Utilities](#base--layout--utilities)
- [Component Styling Rules](#component-styling-rules)
- [Reusability & DRY Pattern Extraction](#reusability--dry-pattern-extraction)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Testing Guidance](#testing-guidance)
- [Performance & Specificity](#performance--specificity)
- [Adding a New Component – Checklist](#adding-a-new-component--checklist)
- [Worked Example (UploadArea)](#worked-example-uploadarea)
- [Migration Playbook (Summary)](#migration-playbook-summary)
- [FAQs & Edge Cases](#faqs--edge-cases)
- [Changelog & Ownership](#changelog--ownership)

## Title & Scope
- What this guide covers: frontend styling and component architecture for the Portfolio Builder app.
- Who should read it: all frontend contributors (engineers, designers contributing to code).
- What it is not: not a product spec, not a visual design system spec. It is a code architecture and implementation guide.

## High-Level Overview
- We split features into Logic, View, and Style per component:
  - Logic (`Component.tsx`) contains state, side effects, data, and event handlers.
  - View (`Component.view.tsx`) is presentational JSX only and wires props to the DOM.
  - Style (`Component.styles.scss`) contains BEM-based SCSS co-located with the component.
- Tailwind has been removed. We use pure SCSS with design tokens, mixins, and base/layout/utility layers.
- Global styles live in `src/styles/` and are composed in `src/styles/main.scss`.

Directory layout (excerpt):
```
src/
  styles/
    tokens/       # colors, spacing, typography, radii, shadows, z-index, breakpoints
    mixins/       # mq(), focus-ring(), fluid-size(), truncate
    base/         # reset, base element rules (html, body, typography)
    layout/       # grid, container, flex helpers
    components/   # truly shared, global-only components (rare)
    utilities/    # a11y helpers (.sr-only, visually-hidden)
    main.scss     # imports the above (via @use) in order

  features/
    UploadCV/
      UploadCV.tsx          # Logic
      UploadCV.view.tsx     # View
      UploadCV.styles.scss  # Style (BEM)
      UploadCV.types.ts     # Public types/props
      index.ts              # Barrel exports (optional)

    UploadCV/UploadArea/
      UploadArea.tsx
      UploadArea.view.tsx
      UploadArea.styles.scss
      UploadArea.types.ts
      index.ts
```

## Principles to Follow (Team-wide)
- Separation of concerns
  - Logic, View, and Style live in separate files. Keep concerns isolated.
- Readability over cleverness
  - Prefer explicit, well-named code to magic abstractions.
- Reusability & DRY
  - Detect repetition → extract tokens, mixins, or shared partials.
- Accessibility first
  - Use ARIA roles/labels, `:focus-visible`, keyboard navigability, and `.sr-only` utilities.
- Low CSS specificity
  - Prefer BEM classes, avoid `!important`, no ID selectors in SCSS.
- Performance & maintainability
  - Keep bundles lean; avoid duplicated rules. Prefer tokens/mixins to ad-hoc values.

## Folder & File Structure (Authoritative)

Global styles folders
- `src/styles/tokens/`
  - Design tokens: colors, spacing, typography, radii, shadows, z-index, breakpoints.
  - Implemented as CSS variables in `:root` for runtime theming and consistency.
- `src/styles/mixins/`
  - Sass mixins: `mq()`, `focus-ring()`, `fluid-size()`, `truncate`.
  - Keep pure logic here; do not emit global CSS from mixins unless intended.
- `src/styles/base/`
  - Reset/normalize and base element styles (html, body, typography).
- `src/styles/layout/`
  - Shared layout primitives (container widths, grid helpers, flex helpers).
- `src/styles/components/`
  - Only truly shared, global components (e.g., a global button style) — use sparingly.
- `src/styles/utilities/`
  - Lightweight helper classes like `.sr-only` and `.visually-hidden`.
- `src/styles/main.scss`
  - Wires everything in order using `@use`.

Per-component pattern (must always exist in a feature folder)
- `Component.tsx`          — logic: state, handlers, effects, data wiring.
- `Component.view.tsx`     — view: pure JSX, no business logic.
- `Component.styles.scss`  — style: BEM rules for this component only.
- `Component.types.ts`     — public props and types.
- `index.ts`               — barrel exports (optional but recommended).

Where to put new styles/code (decision rules)
- If the style applies to a single component → `Component.styles.scss`.
- If the style is reused across multiple components → consider `styles/components/` or a mixin.
- If you see repeated values (colors, spacing, sizes) → promote to a token in `styles/tokens/`.
- If you see a repeated pattern or calculation → create a mixin in `styles/mixins/`.

## Naming Conventions (Strict)
- BEM
  - Block = folder name in lowercase kebab-case.
    - Example: `UploadArea` → `.upload-area`.
  - Elements = `__element` (descendant part of the block).
    - Example: `.upload-area__headline`.
  - Modifiers = `--modifier` (stylistic or behavioral variant).
    - Example: `.upload-area--dragover`.
- Dynamic state via data-attributes
  - Prefer `[data-state="value"]` or `[data-dragover="true"]` when clearer.
- IDs
  - Allowed in HTML for accessibility/anchors; never used as selectors in SCSS.
- Tokens naming
  - `--color-*`, `--space-*`, `--font-size-*`, `--radius-*`, `--shadow-*`, `--z-*`.
- Max SCSS nesting depth
  - 3 levels maximum. Flatten selectors to control specificity.

## Design Tokens (tokens/)
- What we maintain
  - Colors, spacing, typography (families, sizes, weights, tracking), radii, shadows, z-index, breakpoints.
- Rules
  - Prefer tokens over hard-coded values.
  - Promote a one-off value to a token when it appears ≥ 3 times or is part of the design language.
- Examples
  - Colors: `--brand-500: #34C759;`, `--gray-500: #6b7280;`
  - Spacing: `--space-8: 2rem;`, `--space-32: 8rem;`
  - Typography: `--font-size-lg: 1.25rem;`, `--tracking-title-xl: -2.5px;`
  - Radii: `--radius-2xl: 1.25rem;`
  - Shadows: `--shadow-md: 0 4px 12px rgba(0,0,0,0.1);`
  - Z-index: `--z-modal: 1000;`
  - Breakpoints map: `$breakpoints: (sm: 640px, md: 768px, ...);`

## Mixins (mixins/)
- Purpose
  - `mq(bp)`: media query by named breakpoint from `$breakpoints`.
  - `focus-ring()`: visible, accessible focus treatment.
  - `fluid-size(min, max)`: clamp-based responsive sizes.
  - `truncate`: single-line truncation with ellipsis.
- Examples
```scss
// mq
@use '../tokens/breakpoints' as breakpoints;
@mixin mq($bp) {
  @media (min-width: map-get(breakpoints.$breakpoints, $bp)) { @content; }
}

.my-block { width: 100%;
  @include mq(md) { width: 50%; }
}

// focus-ring
:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(52,199,89,.4); }

// fluid-size
.my-title { font-size: clamp(1rem, 2vw + 1rem, 2rem); }

// truncate
.truncate { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
```
- When to create a new mixin
  - A selector pattern or calculation repeats across ≥ 3 components and can accept parameters.

## Base / Layout / Utilities
- Base
  - Reset/normalize, global `html`, `body`, type scale, default link styles.
- Layout
  - Grid, container widths, generic flex helpers (non-component-specific).
- Utilities
  - Accessibility helpers like `.sr-only`, `.visually-hidden`. Keep small and focused.

## Component Styling Rules
- All styling lives in `*.styles.scss`. Do not use inline styles in JSX (except CSS variables on the block for dynamic assets like background URLs).
- No Tailwind utilities remain. Replace former utilities with:
  - Tokens: spacing, colors, sizes.
  - Mixins: `mq`, `focus-ring`, `fluid-size`.
  - BEM classes for structure/states.
- Pseudo-classes & states
  - Use `:hover`, `:active`, `:focus-visible` as needed.
  - Include visible focus via `:focus-visible` (or `@include focus-ring()` when we extract it as a mixin).
- Modifiers vs. data-attributes
  - Visual variants → `--modifier` (e.g., `.button--primary`).
  - Dynamic behavioral state → data attributes (e.g., `[data-dragover="true"]`).
- Mapping dynamic state without Tailwind
```tsx
// View
<div className="upload-area" data-dragover={dragOver}>
  ...
</div>
```
```scss
.upload-area {
  &[data-dragover="true"] { transform: scale(1.05); background-color: var(--overlay-30); }
}
```

## Reusability & DRY Pattern Extraction
- Detect repetition
  - Buttons, cards, flex centers, type scales, shadows.
- Where to extract
  - Complex style logic → `styles/mixins/` (as mixins).
  - Visual primitives used across features → `styles/components/`.
- Quick checklist
  - Repeat ≥ 3 places? Extract.
  - Component-specific or copy is undesirable outside? Keep local.
- Before/After (mini)
```scss
// Before (3+ copies)
.card { box-shadow: 0 4px 12px rgba(0,0,0,.1); border-radius: 1rem; }

// After (tokenized)
:root { --shadow-card: 0 4px 12px rgba(0,0,0,.1); --radius-card: 1rem; }
.card { box-shadow: var(--shadow-card); border-radius: var(--radius-card); }
```

## Accessibility Guidelines
- Always include ARIA roles/labels where necessary.
- Provide visible focus with `:focus-visible` and a clear ring.
- Ensure keyboard navigation (Tab/Shift+Tab) reaches actionable elements.
- `.sr-only` usage:
```scss
.sr-only { position: absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
```

## Testing Guidance
- Do not assert on class names. Prefer resilient selectors:
  - `data-testid`, roles (`getByRole`), labels (`getByLabelText`), data-attributes (e.g., `[data-dragover]`).
- When migrating tests from Tailwind
  - Replace utility-class checks with role/label/state assertions.

## Performance & Specificity
- Avoid deep selector chains; keep max nesting depth of 3.
- No `!important`. Use BEM and clear structure to avoid specificity wars.
- Keep bundles lean by reusing tokens/mixins and avoiding duplicated rules.
- Lift styles to `styles/components/` only when they are truly shared.

## Adding a New Component – Checklist
1. Create the 5 files (`logic/view/styles/types/index`).
2. Define the BEM block and element names.
3. Use tokens/mixins; if a token is missing and justified, add it with a PR note.
4. Add dynamic states via modifiers or data-attrs; include `:focus-visible` styles.
5. Add minimal tests using stable selectors (role, label, data-testid).

## Worked Example (UploadArea)
- Final BEM map
  - Block: `.upload-area`
  - Elements: `__icon`, `__emoji`, `__text`, `__headline`, `__subline`, `__input`
  - State: `[data-dragover="true"]` on the block
- Short SCSS excerpt mapping previous Tailwind → tokens/mixins
```scss
.upload-area {
  width: 38.5rem;
  height: 20.75rem;
  border-radius: var(--radius-2xl);
  background-color: var(--overlay-20);
  border: 1px solid var(--border-overlay-30);
  display: flex; align-items:center; justify-content:center; flex-direction:column;
  transition: transform 300ms ease, background-color 300ms ease;

  &:hover { background-color: var(--overlay-25); }
  &[data-dragover="true"] { transform: scale(1.05); background-color: var(--overlay-30); }
}
```
- Focus ring helper
```scss
.upload-cv__cta:focus-visible { outline:none; box-shadow:0 0 0 3px rgba(52,199,89,.4); }
```
- Test snippet replacing Tailwind assertions
```tsx
// before: expect(button).toHaveClass('bg-green-500')
// after: assert on state/role/text
expect(screen.getByRole('button', { name: /let's do it/i })).toBeDisabled()
```

## Migration Playbook (Summary)
- PR order
  1) Global skeleton (tokens, mixins, base/layout/utilities, main.scss)
  2) Pilot feature (e.g., UploadCV) → Logic/View/Style split
  3) Migrate feature batches → remove Tailwind utilities
  4) Remove Tailwind config/plugins/deps
- Visual parity & a11y per PR
  - Compare screenshots, tab order, and focus-visible states.
- De-Tailwind checklist
  - Remove `tailwind.config.js`
  - Remove `tailwindcss` from PostCSS and `package.json`
  - Remove `@tailwind` directives and `index.css` import
  - Ensure `styles/main.scss` is the only global stylesheet

## FAQs & Edge Cases
- Can I use IDs?
  - Yes in HTML for a11y/anchors; do not use as selectors in SCSS.
- When to create a shared component vs. keep styles local?
  - If reused across features and stable → shared. Otherwise keep local to reduce coupling.
- How to handle one-off values?
  - If truly unique → keep local and document. If repeated or canonical → promote to token.

## Changelog & Ownership
- Proposing changes
  - Open a PR referencing this document and explain the rationale.
- Reviewers
  - At least one frontend maintainer must approve token/mixin changes.
- Versioning
  - Bump the version line at the top (e.g., 1.1) when substantial guidance changes are merged.
