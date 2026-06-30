# Middle of Math Design System

## 1. Atmosphere & Identity

Middle of Math feels like a quiet diagnosis desk for elementary math: calm enough for students to keep thinking, precise enough for teachers to see the learning signal quickly. The signature is "one judgment at a time": compact progress, neutral student feedback, and teacher-facing summaries that translate behavior into instructional next steps.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | `--surface-primary` | `#f8faf9` | `#0d1110` | Main background |
| Surface/secondary | `--surface-secondary` | `#ffffff` | `#151918` | App shell, panels |
| Surface/tertiary | `--surface-tertiary` | `#edf3f1` | `#1d2422` | Quiet section bands |
| Surface/selected | `--surface-selected` | `#e5f1ed` | `#22332d` | Selected options |
| Text/primary | `--text-primary` | `#17211d` | `#f4f7f6` | Main reading text |
| Text/secondary | `--text-secondary` | `#52615b` | `#bac7c2` | Supporting copy |
| Text/tertiary | `--text-tertiary` | `#7b8984` | `#869590` | Metadata, disabled |
| Border/default | `--border-default` | `#d9e2df` | `#2b3431` | Inputs, cards |
| Border/subtle | `--border-subtle` | `#e8eeee` | `#202724` | Dividers |
| Accent/primary | `--accent-primary` | `#146b55` | `#64d2ad` | Primary action, focus |
| Accent/hover | `--accent-hover` | `#0f5a48` | `#8ee6c6` | Primary hover |
| Accent/soft | `--accent-soft` | `#d9eee7` | `#19362f` | Low-emphasis accent fills |
| Status/warning | `--status-warning` | `#9d6a12` | `#f4c35f` | Productive struggle signals |
| Status/error | `--status-error` | `#b44742` | `#ff9a93` | High-risk misconception |
| Status/info | `--status-info` | `#315f8d` | `#8bbcef` | Informational notes |

### Rules

- Student surfaces avoid red correctness feedback. Red is reserved for teacher-facing high-risk misconception labels.
- Accent green marks action, focus, and mathematical structure. It is not used as decoration.
- Warning amber means "needs attention", not "wrong".
- Any color added to production CSS must first be added to this table.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | `40px / 2.5rem` | 680 | 1.12 | 0 | Product title only |
| H1 | `32px / 2rem` | 680 | 1.2 | 0 | Major view title |
| H2 | `24px / 1.5rem` | 640 | 1.3 | 0 | Problem title, dashboard sections |
| H3 | `20px / 1.25rem` | 640 | 1.35 | 0 | Panel headings |
| Body/lg | `18px / 1.125rem` | 450 | 1.55 | 0 | Student problem text |
| Body | `16px / 1rem` | 450 | 1.55 | 0 | Default text |
| Body/sm | `14px / 0.875rem` | 450 | 1.45 | 0 | Secondary info |
| Caption | `12px / 0.75rem` | 620 | 1.35 | 0 | Labels, metadata |

### Font Stack

- Primary: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`

### Rules

- No negative letter spacing. Korean text must stay readable and uncompressed.
- Student-facing text never drops below `14px`.
- Teacher analytics can be compact, but each diagnosis sentence must remain scannable.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a base of `4px`.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Icon offsets |
| `--space-2` | `8px` | Tight groups |
| `--space-3` | `12px` | Option inner gaps |
| `--space-4` | `16px` | Default component padding |
| `--space-5` | `20px` | Comfortable groups |
| `--space-6` | `24px` | Panel padding |
| `--space-8` | `32px` | View sections |
| `--space-10` | `40px` | Wide page rhythm |
| `--space-12` | `48px` | Major separation |

### Grid

- Max content width: `1180px`.
- App grid: two columns on desktop, single column on mobile.
- Breakpoints: `640px`, `768px`, `1024px`, `1280px`.

### Rules

- Fixed-format controls such as icon buttons, progress bars, options, and fraction bars use stable dimensions.
- No page section is styled as a floating marketing card. Panels frame tools and repeated report items only.
- Cards keep radius at `8px` or less.

## 5. Components

### App Shell

- **Structure**: header with product name, role tabs, active session summary; main content area.
- **Variants**: student, teacher.
- **Spacing**: `--space-4`, `--space-6`, `--space-8`.
- **States**: active tab, hover, focus.
- **Accessibility**: `nav` with `aria-label`, buttons announce selected state.
- **Motion**: tab content fades and translates by `4px`.

### Choice Option

- **Structure**: `button` containing only the student-facing answer candidate.
- **Variants**: fraction choice, text choice, selected, disabled.
- **Spacing**: `--space-4`.
- **States**: default, hover, selected, focus, disabled.
- **Accessibility**: `aria-pressed` communicates selection.
- **Motion**: background and border transition only.
- **Content boundary**: never render diagnostic hints, misconception labels, teacher notes, or why-this-is-wrong text inside student choices. Those fields may exist in data for teacher analysis, but the student-facing choice shows only the candidate answer/reason the student must judge.

### Primary Button

- **Structure**: text button with optional inline icon.
- **Variants**: primary, secondary, quiet.
- **Spacing**: horizontal `--space-5`, min height `44px`.
- **States**: default, hover, active, focus, disabled.
- **Accessibility**: disabled state uses real `disabled` attribute.
- **Motion**: `120ms` transform and color transition.

### Fraction Bar

- **Structure**: generated segmented bar with filled numerator pieces.
- **Variants**: single, comparison pair, common denominator preview.
- **Spacing**: `--space-2`, `--space-3`.
- **States**: neutral only on student side; teacher side may annotate.
- **Accessibility**: each bar has a text label describing numerator and denominator.
- **Motion**: no automatic animation; changes crossfade.

### Teacher Summary Row

- **Structure**: diagnosis title, student count, concise interpretation, suggested teaching move.
- **Variants**: warning, error, info, success.
- **Spacing**: `--space-4`, `--space-5`.
- **States**: hover, selected, focus.
- **Accessibility**: status is repeated in text, not color only.
- **Motion**: selected row uses tonal shift.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | `120ms` | `ease-out` | Button press, option selection |
| Standard | `220ms` | `ease-in-out` | Step change, tab switch |
| Emphasis | `360ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Completion state |

### Rules

- Animate only `opacity` and `transform`.
- `prefers-reduced-motion` disables non-essential transitions.
- Student flow never auto-advances after a choice. The student always confirms with the next button.
- "잘 모르겠어요" appears after 30 seconds under the options and logs uncertainty without shame language.

## 7. Depth & Surface

### Strategy

Mixed, but restrained: tonal shifts plus subtle borders. Shadows are rare and only used for sticky controls.

| Level | Value | Usage |
|-------|-------|-------|
| Border/Subtle | `1px solid var(--border-subtle)` | Page dividers |
| Border/Default | `1px solid var(--border-default)` | Panels, options |
| Shadow/Sticky | `0 8px 28px rgba(23, 33, 29, 0.08)` | Sticky teacher sidebars only |

### Rules

- Student task panels use tonal hierarchy and borders, not heavy elevation.
- Teacher analytics can be denser but still avoids stacked cards inside cards.
- Modal-like depth is not part of this MVP.
