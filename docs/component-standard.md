# Component Standard

Tracks the canonical component set supported by the design system. Each entry captures required props, optional props, and design tokens the component depends on. Version this document alongside package releases.

## Versioning

- **Standard version:** `v0.1.0` – initial set shipping with the React 18 package.
- Increment the patch version for documentation-only updates, minor for new optional props/components, and major for breaking contract changes.

## Component Catalogue

| Component | Description | Required Props | Optional Props | Token Dependencies |
| --- | --- | --- | --- | --- |
| `ThemeProvider` | Applies `data-theme`, persists selection, exposes controller UI. | `children` | `storageKey`, `themes`, `initialTheme` (future) | `--bg`, `--fg`, `--surface`, `--accent`, `--border`, focus tokens |
| `Button` | Semantically styled button with variant + size system. | `children` | `variant` (`primary`\|`ghost`\|`danger`), `size` (`sm`\|`md`\|`lg`), native button props | `--accent`, `--accent-contrast`, `--border`, `--surface`, radius/shadow tokens |
| `Input` | Text input field with semantic styling. | `aria-label` or `id` (a11y) | native input props | `--surface`, `--fg`, `--border`, `--muted`, focus tokens |
| `Card` | Container with surface background, optional interactive state. | `children` | `interactive`, native div props | `--surface`, `--fg`, `--border`, `--shadow-*`, radius |
| `Modal` | Layered dialog with focus trapping and controlled visibility. | `open`, `onClose`, `children` | `aria-label`, `closeOnOverlayClick`, `initialFocusRef`, `overlayClassName` | `--surface`, `--fg`, `--border`, `--shadow-md`, overlay uses `--bg`, focus tokens |
| `Toggle` | Accessible switch for binary preferences. | `aria-label` or `id` (a11y) | `checked`, `defaultChecked`, `onCheckedChange`, `disabled`, native button props | `--accent`, `--accent-contrast`, `--surface`, `--border`, focus tokens |
| `Select` | Dropdown selection for forms and filtering. | `aria-label` or `id` (a11y) | `options`, `value`, `onChange`, native select props | `--surface`, `--fg`, `--border`, `--muted`, focus tokens |
| `Checkbox` | Multi-select input for forms and settings. | `aria-label` or `id` (a11y) | `checked`, `onChange`, `disabled`, native checkbox props | `--accent`, `--border`, focus tokens, radius tokens |
| `Radio Group` | Single-select input for exclusive choices. | `name`, `options`, `value`, `onChange` | `disabled`, `orientation` (`vertical`\|`horizontal`) | `--accent`, `--border`, focus tokens, spacing tokens |
| `Label` | Form field labels for accessibility. | `htmlFor`, `children` | `required`, `disabled`, native label props | `--fg`, `--muted`, spacing tokens |
| `Textarea` | Multi-line text input for comments and descriptions. | `aria-label` or `id` (a11y) | `value`, `onChange`, `rows`, native textarea props | `--surface`, `--fg`, `--border`, `--muted`, focus tokens |
| `Alert` | Prominent messages for notifications and feedback. | `children`, `variant` (`info`\|`success`\|`warning`\|`error`) | `onClose`, `icon`, native div props | `--surface`, `--fg`, `--border`, `--accent` (by variant), radius tokens |
| `Badge` | Small status indicators for tags and counts. | `children` | `variant` (`default`\|`secondary`\|`destructive`\|`outline`), `size` (`sm`\|`md`\|`lg`) | `--bg`, `--fg`, `--border`, radius tokens |
| `Tabs` | Tabbed interface for content organization. | `items`, `activeTab`, `onTabChange` | `orientation` (`horizontal`\|`vertical`), native div props | `--border`, `--surface`, `--fg`, `--accent`, focus tokens |
| `Tooltip` | Hover information popup for help text. | `content`, `children` | `side` (`top`\|`right`\|`bottom`\|`left`), `align` (`start`\|`center`\|`end`) | `--bg`, `--fg`, `--border`, shadow tokens |

## Naming Guidelines

- Components use PascalCase; variants and sizes use kebab-case CSS modifiers (`btn--ghost`).
- Semantic tokens (`--bg`, `--accent`, etc.) must be used in CSS layers; raw brand colors are confined to token definitions.
- New components should define stories, Vitest specs, and contract docs *before* implementation.

## Compliance Checklist

1. Component exports reside in `src/components/<Name>.tsx`.
2. Corresponding styles live under `src/design-system/components/` in the shared cascade layer order.
3. Each component exports TypeScript prop types and receives a Storybook story + Vitest spec.
4. QA must include: `pnpm qa`, Storybook build, and updated CHANGELOG entry when versioned.

## Implementation Progress

### Phase 1: Essential Form Components (High Priority)
- [ ] `Select` – dropdown selection for forms and filtering
- [ ] `Checkbox` – multi-select input for forms and settings  
- [ ] `Radio Group` – single-select input for exclusive choices
- [ ] `Label` – form field labels for accessibility
- [ ] `Textarea` – multi-line text input for comments and descriptions

### Phase 2: Common UI Patterns (Medium Priority)
- [ ] `Alert` – prominent messages for notifications and feedback
- [ ] `Badge` – small status indicators for tags and counts
- [ ] `Tabs` – tabbed interface for content organization
- [ ] `Tooltip` – hover information popup for help text

### Phase 3: Planned Components
- [ ] `Confetti` (WIP) – celebratory overlay, pending animation tokens
- [x] `Modal` – layered dialog with focus trapping
- [x] `Toggle` – accessible switch component

### Phase 4: Future Considerations
- [ ] `Table` – data table component
- [ ] `Pagination` – page navigation controls
- [ ] `Dialog` – modal overlay
- [ ] `Popover` – overlay triggered by click/hover
- [ ] `Progress` – progress indicator
- [ ] `Skeleton` – loading placeholder

Document proposals as PRs referencing this file, bumping the standard version and linking ADRs as needed.
