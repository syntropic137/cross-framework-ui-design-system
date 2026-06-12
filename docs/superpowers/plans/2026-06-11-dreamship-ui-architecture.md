# DreamShip UI Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standardized, theme-swappable Svelte component library for DreamShip where the app imports only from `$lib/ui`, Bits UI is the private behavior engine underneath, and CSS custom properties enable full visual redesign without touching component code.

**Architecture:** Bits UI provides headless, accessible primitives that are wrapped exactly once in `src/lib/ui/<component>/`. The app never imports from `bits-ui` directly — only from `$lib/ui`. Styling is driven exclusively by CSS custom properties (`--ui-*` tokens) and `data-*` attributes, so swapping `tokens.css` or loading an alternate theme file is all that is needed to change the entire visual language.

**Tech Stack:** SvelteKit, Bits UI, TypeScript, Storybook (Svelte CSF), Vitest + @testing-library/svelte

---

## The Core Contract

Every component in `$lib/ui` must honor:

| Concern | Mechanism |
|---|---|
| Behavior / a11y | Bits UI primitive underneath |
| Public API | Props defined in the component's `.svelte` file |
| Styling hook | `data-variant`, `data-size`, `data-density`, `data-state` attributes |
| Visual tokens | `--ui-*` CSS custom properties |
| Swap point | Change `tokens.css` or load an alternate theme — nothing else |

---

## File Structure

```
src/lib/
  design/
    tokens.css              ← single source of truth for all --ui-* vars
    reset.css               ← minimal, opinionated reset
    global.css              ← root-level imports + body defaults
    themes/
      default.css           ← dark studio aesthetic
      cyberpunk.css
      paper.css
      high-contrast.css
  ui/
    button/
      Button.svelte
      button.css
      Button.stories.svelte
      index.ts              ← re-exports Button
    badge/
      Badge.svelte
      badge.css
      Badge.stories.svelte
      index.ts
    card/
      Card.svelte
      card.css
      Card.stories.svelte
      index.ts
    dialog/
      Dialog.svelte          ← thin wrapper + context provider
      DialogTrigger.svelte
      DialogContent.svelte
      DialogHeader.svelte
      DialogFooter.svelte
      dialog.css
      Dialog.stories.svelte
      index.ts
    select/
      Select.svelte
      SelectTrigger.svelte
      SelectContent.svelte
      SelectItem.svelte
      select.css
      Select.stories.svelte
      index.ts
    popover/
      Popover.svelte
      PopoverTrigger.svelte
      PopoverContent.svelte
      popover.css
      Popover.stories.svelte
      index.ts
    tooltip/
      Tooltip.svelte
      TooltipTrigger.svelte
      TooltipContent.svelte
      tooltip.css
      Tooltip.stories.svelte
      index.ts
    tabs/
      Tabs.svelte
      TabsList.svelte
      TabsTrigger.svelte
      TabsContent.svelte
      tabs.css
      Tabs.stories.svelte
      index.ts
    index.ts                 ← barrel: re-exports all ui components
  layout/
    AppShell.svelte
    Sidebar.svelte
    SplitPane.svelte
    index.ts
```

---

## Task 1: Design Token Foundation

**Files:**
- Create: `src/lib/design/tokens.css`
- Create: `src/lib/design/reset.css`
- Create: `src/lib/design/global.css`
- Create: `src/lib/design/themes/default.css`

- [ ] **Step 1: Create token file**

```css
/* src/lib/design/tokens.css */
:root {
  /* Surface */
  --ui-bg:           #0f1115;
  --ui-panel:        #171a21;
  --ui-panel-raised: #1e2230;
  --ui-overlay:      #242838;

  /* Text */
  --ui-text:         #f4f4f5;
  --ui-text-muted:   #8b8fa8;
  --ui-text-subtle:  #5a5e72;

  /* Border */
  --ui-border:       #2a2f3a;
  --ui-border-focus: #4f6ef7;

  /* Accent */
  --ui-accent:       #4f6ef7;
  --ui-accent-hover: #6882ff;
  --ui-accent-text:  #ffffff;

  /* Semantic */
  --ui-success:      #22c55e;
  --ui-warning:      #f59e0b;
  --ui-danger:       #ef4444;
  --ui-danger-hover: #f87171;

  /* Radius */
  --ui-radius-sm:    4px;
  --ui-radius-md:    8px;
  --ui-radius-lg:    12px;
  --ui-radius-xl:    16px;
  --ui-radius-full:  9999px;

  /* Space */
  --ui-space-1:      4px;
  --ui-space-2:      8px;
  --ui-space-3:      12px;
  --ui-space-4:      16px;
  --ui-space-5:      20px;
  --ui-space-6:      24px;
  --ui-space-8:      32px;

  /* Typography */
  --ui-font-sans:    'Inter', system-ui, sans-serif;
  --ui-font-mono:    'JetBrains Mono', 'Fira Code', monospace;
  --ui-text-xs:      0.75rem;
  --ui-text-sm:      0.875rem;
  --ui-text-base:    1rem;
  --ui-text-lg:      1.125rem;

  /* Motion */
  --ui-duration-fast:   100ms;
  --ui-duration-base:   200ms;
  --ui-duration-slow:   350ms;
  --ui-ease:            cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-index */
  --ui-z-dropdown:  100;
  --ui-z-sticky:    200;
  --ui-z-overlay:   300;
  --ui-z-modal:     400;
  --ui-z-toast:     500;
}
```

- [ ] **Step 2: Create reset**

```css
/* src/lib/design/reset.css */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html { -webkit-text-size-adjust: 100%; }
body { line-height: 1.5; -webkit-font-smoothing: antialiased; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
button { cursor: pointer; background: none; border: none; }
a { color: inherit; text-decoration: none; }
```

- [ ] **Step 3: Create global.css**

```css
/* src/lib/design/global.css */
@import './reset.css';
@import './tokens.css';

body {
  font-family: var(--ui-font-sans);
  font-size: var(--ui-text-base);
  color: var(--ui-text);
  background: var(--ui-bg);
}
```

- [ ] **Step 4: Import global.css in the SvelteKit root layout**

In `src/routes/+layout.svelte`:
```svelte
<script lang="ts">
  import '$lib/design/global.css';
</script>

<slot />
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/design/ src/routes/+layout.svelte
git commit -m "feat(design): add CSS token foundation and global reset"
```

---

## Task 2: Button Component (first primitive, sets the pattern)

**Files:**
- Create: `src/lib/ui/button/Button.svelte`
- Create: `src/lib/ui/button/button.css`
- Create: `src/lib/ui/button/index.ts`
- Create: `src/lib/ui/button/Button.stories.svelte`

Button is self-implemented (no Bits UI needed — it is a native `<button>`). It establishes the `data-*` attribute styling pattern every other component will follow.

- [ ] **Step 1: Write the story first (contract-first)**

```svelte
<!-- src/lib/ui/button/Button.stories.svelte -->
<script context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from './Button.svelte';

  const { Story } = defineMeta({
    title: 'UI/Button',
    component: Button,
    argTypes: {
      variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
      size:    { control: 'select', options: ['sm', 'md', 'lg'] },
    },
  });
</script>

<Story name="Primary"   args={{ variant: 'primary',   size: 'md', children: 'Save changes' }} />
<Story name="Secondary" args={{ variant: 'secondary', size: 'md', children: 'Cancel' }} />
<Story name="Ghost"     args={{ variant: 'ghost',     size: 'md', children: 'Learn more' }} />
<Story name="Danger"    args={{ variant: 'danger',    size: 'md', children: 'Delete' }} />
<Story name="Small"     args={{ variant: 'primary',   size: 'sm', children: 'Small' }} />
<Story name="Large"     args={{ variant: 'primary',   size: 'lg', children: 'Large' }} />
<Story name="Disabled"  args={{ variant: 'primary',   size: 'md', children: 'Disabled', disabled: true }} />
<Story name="Loading"   args={{ variant: 'primary',   size: 'md', children: 'Loading…',  loading: true }} />
```

- [ ] **Step 2: Start Storybook and verify stories render (they will fail — Button.svelte doesn't exist)**

```bash
pnpm storybook
```

Expected: import error on Button.svelte — confirms we're driving from stories.

- [ ] **Step 3: Implement Button.svelte**

```svelte
<!-- src/lib/ui/button/Button.svelte -->
<script lang="ts">
  import './button.css';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
  type Size    = 'sm' | 'md' | 'lg';

  export let variant: Variant = 'primary';
  export let size:    Size    = 'md';
  export let disabled         = false;
  export let loading          = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
</script>

<button
  class="ui-button"
  data-variant={variant}
  data-size={size}
  {type}
  disabled={disabled || loading}
  aria-busy={loading}
  on:click
>
  <slot />
</button>
```

- [ ] **Step 4: Implement button.css**

```css
/* src/lib/ui/button/button.css */
.ui-button {
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-2);
  border-radius: var(--ui-radius-md);
  font-size: var(--ui-text-sm);
  font-weight: 500;
  line-height: 1;
  transition: background var(--ui-duration-fast) var(--ui-ease),
              border-color var(--ui-duration-fast) var(--ui-ease),
              opacity var(--ui-duration-fast) var(--ui-ease);
}

/* Sizes */
.ui-button[data-size='sm'] { padding: var(--ui-space-1) var(--ui-space-2); font-size: var(--ui-text-xs); }
.ui-button[data-size='md'] { padding: var(--ui-space-2) var(--ui-space-3); }
.ui-button[data-size='lg'] { padding: var(--ui-space-3) var(--ui-space-4); font-size: var(--ui-text-base); }

/* Variants */
.ui-button[data-variant='primary'] {
  background: var(--ui-accent);
  color: var(--ui-accent-text);
  border: 1px solid transparent;
}
.ui-button[data-variant='primary']:hover:not(:disabled) { background: var(--ui-accent-hover); }

.ui-button[data-variant='secondary'] {
  background: var(--ui-panel-raised);
  color: var(--ui-text);
  border: 1px solid var(--ui-border);
}
.ui-button[data-variant='secondary']:hover:not(:disabled) { background: var(--ui-overlay); }

.ui-button[data-variant='ghost'] {
  background: transparent;
  color: var(--ui-text);
  border: 1px solid transparent;
}
.ui-button[data-variant='ghost']:hover:not(:disabled) { background: var(--ui-panel-raised); }

.ui-button[data-variant='danger'] {
  background: transparent;
  color: var(--ui-danger);
  border: 1px solid var(--ui-danger);
}
.ui-button[data-variant='danger']:hover:not(:disabled) { background: var(--ui-danger); color: #fff; }

/* States */
.ui-button:disabled { opacity: 0.4; cursor: not-allowed; }
.ui-button:focus-visible {
  outline: 2px solid var(--ui-border-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Create the index re-export**

```typescript
// src/lib/ui/button/index.ts
export { default as Button } from './Button.svelte';
```

- [ ] **Step 6: Verify stories pass in Storybook — check all 8 story variants visually**

- [ ] **Step 7: Commit**

```bash
git add src/lib/ui/button/
git commit -m "feat(ui): add Button component with variant/size/state tokens"
```

---

## Task 3: Badge and Card (simple primitives)

**Files:**
- Create: `src/lib/ui/badge/Badge.svelte`, `badge.css`, `Badge.stories.svelte`, `index.ts`
- Create: `src/lib/ui/card/Card.svelte`, `card.css`, `Card.stories.svelte`, `index.ts`

- [ ] **Step 1: Implement Badge.svelte**

```svelte
<!-- src/lib/ui/badge/Badge.svelte -->
<script lang="ts">
  import './badge.css';
  type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  export let tone: Tone = 'neutral';
</script>

<span class="ui-badge" data-tone={tone}>
  <slot />
</span>
```

- [ ] **Step 2: badge.css**

```css
/* src/lib/ui/badge/badge.css */
.ui-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--ui-space-2);
  border-radius: var(--ui-radius-full);
  font-size: var(--ui-text-xs);
  font-weight: 500;
  line-height: 1.4;
}
.ui-badge[data-tone='neutral'] { background: var(--ui-panel-raised); color: var(--ui-text-muted); }
.ui-badge[data-tone='accent']  { background: color-mix(in srgb, var(--ui-accent) 20%, transparent); color: var(--ui-accent); }
.ui-badge[data-tone='success'] { background: color-mix(in srgb, var(--ui-success) 20%, transparent); color: var(--ui-success); }
.ui-badge[data-tone='warning'] { background: color-mix(in srgb, var(--ui-warning) 20%, transparent); color: var(--ui-warning); }
.ui-badge[data-tone='danger']  { background: color-mix(in srgb, var(--ui-danger)  20%, transparent); color: var(--ui-danger); }
```

- [ ] **Step 3: badge/index.ts**

```typescript
export { default as Badge } from './Badge.svelte';
```

- [ ] **Step 4: Implement Card.svelte**

```svelte
<!-- src/lib/ui/card/Card.svelte -->
<script lang="ts">
  import './card.css';
  type Padding = 'none' | 'sm' | 'md' | 'lg';
  export let padding: Padding = 'md';
  export let interactive = false;
</script>

<div class="ui-card" data-padding={padding} data-interactive={interactive || undefined}>
  <slot />
</div>
```

- [ ] **Step 5: card.css**

```css
/* src/lib/ui/card/card.css */
.ui-card {
  background: var(--ui-panel);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
}
.ui-card[data-padding='none'] { padding: 0; }
.ui-card[data-padding='sm']   { padding: var(--ui-space-3); }
.ui-card[data-padding='md']   { padding: var(--ui-space-4); }
.ui-card[data-padding='lg']   { padding: var(--ui-space-6); }
.ui-card[data-interactive] {
  cursor: pointer;
  transition: border-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-card[data-interactive]:hover { border-color: var(--ui-border-focus); }
```

- [ ] **Step 6: card/index.ts**

```typescript
export { default as Card } from './Card.svelte';
```

- [ ] **Step 7: Write Badge and Card stories (follow the Button story pattern from Task 2 — cover all tones/paddings)**

- [ ] **Step 8: Commit**

```bash
git add src/lib/ui/badge/ src/lib/ui/card/
git commit -m "feat(ui): add Badge and Card components"
```

---

## Task 4: Dialog (first Bits UI wrapper — sets the headless pattern)

**Files:**
- Create: `src/lib/ui/dialog/Dialog.svelte`
- Create: `src/lib/ui/dialog/DialogTrigger.svelte`
- Create: `src/lib/ui/dialog/DialogContent.svelte`
- Create: `src/lib/ui/dialog/DialogHeader.svelte`
- Create: `src/lib/ui/dialog/DialogFooter.svelte`
- Create: `src/lib/ui/dialog/dialog.css`
- Create: `src/lib/ui/dialog/Dialog.stories.svelte`
- Create: `src/lib/ui/dialog/index.ts`

- [ ] **Step 1: Install Bits UI if not already installed**

```bash
pnpm add bits-ui
```

- [ ] **Step 2: Implement Dialog.svelte (root provider — thin pass-through)**

```svelte
<!-- src/lib/ui/dialog/Dialog.svelte -->
<script lang="ts">
  import { Dialog as BitsDialog } from 'bits-ui';
  export let open = false;
</script>

<BitsDialog.Root bind:open>
  <slot />
</BitsDialog.Root>
```

- [ ] **Step 3: Implement DialogTrigger.svelte**

```svelte
<!-- src/lib/ui/dialog/DialogTrigger.svelte -->
<script lang="ts">
  import { Dialog as BitsDialog } from 'bits-ui';
</script>

<BitsDialog.Trigger asChild let:builder>
  <slot {builder} />
</BitsDialog.Trigger>
```

- [ ] **Step 4: Implement DialogContent.svelte**

```svelte
<!-- src/lib/ui/dialog/DialogContent.svelte -->
<script lang="ts">
  import { Dialog as BitsDialog } from 'bits-ui';
  import './dialog.css';
</script>

<BitsDialog.Portal>
  <BitsDialog.Overlay class="ui-dialog-overlay" />
  <BitsDialog.Content class="ui-dialog-content">
    <slot />
  </BitsDialog.Content>
</BitsDialog.Portal>
```

- [ ] **Step 5: Implement DialogHeader.svelte and DialogFooter.svelte**

```svelte
<!-- src/lib/ui/dialog/DialogHeader.svelte -->
<script lang="ts">
  import { Dialog as BitsDialog } from 'bits-ui';
  export let title: string;
  export let description: string | undefined = undefined;
</script>

<div class="ui-dialog-header">
  <BitsDialog.Title class="ui-dialog-title">{title}</BitsDialog.Title>
  {#if description}
    <BitsDialog.Description class="ui-dialog-description">{description}</BitsDialog.Description>
  {/if}
</div>
```

```svelte
<!-- src/lib/ui/dialog/DialogFooter.svelte -->
<div class="ui-dialog-footer">
  <slot />
</div>
```

- [ ] **Step 6: dialog.css**

```css
/* src/lib/ui/dialog/dialog.css */
.ui-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(4px);
  z-index: var(--ui-z-modal);
}
.ui-dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: calc(var(--ui-z-modal) + 1);
  width: min(560px, 90vw);
  background: var(--ui-panel);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-xl);
  padding: var(--ui-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-4);
}
.ui-dialog-header { display: flex; flex-direction: column; gap: var(--ui-space-2); }
.ui-dialog-title { font-size: var(--ui-text-lg); font-weight: 600; color: var(--ui-text); }
.ui-dialog-description { font-size: var(--ui-text-sm); color: var(--ui-text-muted); }
.ui-dialog-footer { display: flex; justify-content: flex-end; gap: var(--ui-space-2); }
```

- [ ] **Step 7: dialog/index.ts**

```typescript
export { default as Dialog }        from './Dialog.svelte';
export { default as DialogTrigger } from './DialogTrigger.svelte';
export { default as DialogContent } from './DialogContent.svelte';
export { default as DialogHeader }  from './DialogHeader.svelte';
export { default as DialogFooter }  from './DialogFooter.svelte';
```

- [ ] **Step 8: Write Dialog story — cover: default open, with description, with footer actions**

```svelte
<!-- src/lib/ui/dialog/Dialog.stories.svelte -->
<script context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Dialog from './Dialog.svelte';
  const { Story } = defineMeta({ title: 'UI/Dialog', component: Dialog });
</script>

<Story name="Default">
  <script>
    import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter } from '.';
    import { Button } from '../button';
    let open = false;
  </script>
  <Dialog bind:open>
    <DialogTrigger let:builder>
      <Button variant="primary" {...builder} use:builder.action>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader title="Confirm action" description="This cannot be undone." />
      <DialogFooter>
        <Button variant="ghost" on:click={() => (open = false)}>Cancel</Button>
        <Button variant="danger">Delete</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</Story>
```

- [ ] **Step 9: Verify in Storybook — open/close works, overlay dismisses on click, Escape closes it (Bits handles this)**

- [ ] **Step 10: Commit**

```bash
git add src/lib/ui/dialog/
git commit -m "feat(ui): add Dialog component wrapping Bits UI"
```

---

## Task 5: Select

**Files:**
- Create: `src/lib/ui/select/Select.svelte`, `SelectTrigger.svelte`, `SelectContent.svelte`, `SelectItem.svelte`, `select.css`, `Select.stories.svelte`, `index.ts`

- [ ] **Step 1: Implement Select.svelte**

```svelte
<!-- src/lib/ui/select/Select.svelte -->
<script lang="ts">
  import { Select as BitsSelect } from 'bits-ui';
  export let value: string | undefined = undefined;
  export let placeholder = 'Select…';
</script>

<BitsSelect.Root bind:value>
  <slot {placeholder} />
</BitsSelect.Root>
```

- [ ] **Step 2: SelectTrigger.svelte**

```svelte
<!-- src/lib/ui/select/SelectTrigger.svelte -->
<script lang="ts">
  import { Select as BitsSelect } from 'bits-ui';
  import './select.css';
  export let placeholder = 'Select…';
</script>

<BitsSelect.Trigger class="ui-select-trigger">
  <BitsSelect.Value {placeholder} />
  <svg class="ui-select-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</BitsSelect.Trigger>
```

- [ ] **Step 3: SelectContent.svelte**

```svelte
<!-- src/lib/ui/select/SelectContent.svelte -->
<script lang="ts">
  import { Select as BitsSelect } from 'bits-ui';
</script>

<BitsSelect.Content class="ui-select-content">
  <slot />
</BitsSelect.Content>
```

- [ ] **Step 4: SelectItem.svelte**

```svelte
<!-- src/lib/ui/select/SelectItem.svelte -->
<script lang="ts">
  import { Select as BitsSelect } from 'bits-ui';
  export let value: string;
  export let label: string;
</script>

<BitsSelect.Item class="ui-select-item" {value} {label}>
  {label}
</BitsSelect.Item>
```

- [ ] **Step 5: select.css**

```css
/* src/lib/ui/select/select.css */
.ui-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-space-2);
  width: 100%;
  padding: var(--ui-space-2) var(--ui-space-3);
  background: var(--ui-panel-raised);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-md);
  color: var(--ui-text);
  font-size: var(--ui-text-sm);
  cursor: pointer;
  transition: border-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-select-trigger:hover    { border-color: var(--ui-text-subtle); }
.ui-select-trigger:focus    { border-color: var(--ui-border-focus); outline: none; }

.ui-select-chevron { color: var(--ui-text-muted); flex-shrink: 0; }

.ui-select-content {
  background: var(--ui-panel-raised);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-md);
  padding: var(--ui-space-1);
  min-width: var(--bits-select-trigger-width);
  z-index: var(--ui-z-dropdown);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.4);
}
.ui-select-item {
  padding: var(--ui-space-2) var(--ui-space-3);
  border-radius: var(--ui-radius-sm);
  font-size: var(--ui-text-sm);
  color: var(--ui-text);
  cursor: pointer;
  transition: background var(--ui-duration-fast) var(--ui-ease);
}
.ui-select-item:hover,
.ui-select-item[data-highlighted] { background: var(--ui-overlay); }
.ui-select-item[data-selected]    { color: var(--ui-accent); }
```

- [ ] **Step 6: select/index.ts**

```typescript
export { default as Select }        from './Select.svelte';
export { default as SelectTrigger } from './SelectTrigger.svelte';
export { default as SelectContent } from './SelectContent.svelte';
export { default as SelectItem }    from './SelectItem.svelte';
```

- [ ] **Step 7: Write a Select story with 5-6 items, verify keyboard navigation works (Bits handles this)**

- [ ] **Step 8: Commit**

```bash
git add src/lib/ui/select/
git commit -m "feat(ui): add Select component wrapping Bits UI"
```

---

## Task 6: Popover and Tooltip

Follow the exact same wrapping pattern as Dialog and Select.

**Files:**
- Create: `src/lib/ui/popover/` — Popover.svelte, PopoverTrigger.svelte, PopoverContent.svelte, popover.css, index.ts, stories
- Create: `src/lib/ui/tooltip/` — Tooltip.svelte, TooltipTrigger.svelte, TooltipContent.svelte, tooltip.css, index.ts, stories

- [ ] **Step 1: Implement Popover.svelte**

```svelte
<!-- src/lib/ui/popover/Popover.svelte -->
<script lang="ts">
  import { Popover as BitsPopover } from 'bits-ui';
  export let open = false;
</script>
<BitsPopover.Root bind:open><slot /></BitsPopover.Root>
```

- [ ] **Step 2: PopoverTrigger.svelte**

```svelte
<!-- src/lib/ui/popover/PopoverTrigger.svelte -->
<script lang="ts">
  import { Popover as BitsPopover } from 'bits-ui';
</script>
<BitsPopover.Trigger asChild let:builder><slot {builder} /></BitsPopover.Trigger>
```

- [ ] **Step 3: PopoverContent.svelte**

```svelte
<!-- src/lib/ui/popover/PopoverContent.svelte -->
<script lang="ts">
  import { Popover as BitsPopover } from 'bits-ui';
  import './popover.css';
  export let side: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  export let align: 'start' | 'center' | 'end' = 'start';
  export let sideOffset = 6;
</script>
<BitsPopover.Content class="ui-popover-content" {side} {align} {sideOffset}>
  <slot />
</BitsPopover.Content>
```

- [ ] **Step 4: popover.css**

```css
/* src/lib/ui/popover/popover.css */
.ui-popover-content {
  background: var(--ui-panel-raised);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
  padding: var(--ui-space-3);
  z-index: var(--ui-z-dropdown);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.4);
  min-width: 220px;
}
```

- [ ] **Step 5: popover/index.ts**

```typescript
export { default as Popover }        from './Popover.svelte';
export { default as PopoverTrigger } from './PopoverTrigger.svelte';
export { default as PopoverContent } from './PopoverContent.svelte';
```

- [ ] **Step 6: Implement Tooltip using the same pattern (BitsTooltip.Root → BitsTooltip.Trigger → BitsTooltip.Content)**

tooltip.css should style `.ui-tooltip-content` with a smaller, darker bubble appearance:
```css
.ui-tooltip-content {
  background: var(--ui-overlay);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-sm);
  padding: var(--ui-space-1) var(--ui-space-2);
  font-size: var(--ui-text-xs);
  color: var(--ui-text);
  z-index: var(--ui-z-tooltip, 600);
  max-width: 240px;
}
```

- [ ] **Step 7: Write stories for both, verify positioning and dismissal behavior**

- [ ] **Step 8: Commit**

```bash
git add src/lib/ui/popover/ src/lib/ui/tooltip/
git commit -m "feat(ui): add Popover and Tooltip components"
```

---

## Task 7: Tabs

**Files:**
- Create: `src/lib/ui/tabs/Tabs.svelte`, `TabsList.svelte`, `TabsTrigger.svelte`, `TabsContent.svelte`, `tabs.css`, `Tabs.stories.svelte`, `index.ts`

- [ ] **Step 1: Tabs.svelte**

```svelte
<script lang="ts">
  import { Tabs as BitsTabs } from 'bits-ui';
  export let value: string;
</script>
<BitsTabs.Root bind:value><slot /></BitsTabs.Root>
```

- [ ] **Step 2: TabsList.svelte**

```svelte
<script lang="ts">
  import { Tabs as BitsTabs } from 'bits-ui';
  import './tabs.css';
</script>
<BitsTabs.List class="ui-tabs-list"><slot /></BitsTabs.List>
```

- [ ] **Step 3: TabsTrigger.svelte**

```svelte
<script lang="ts">
  import { Tabs as BitsTabs } from 'bits-ui';
  export let value: string;
</script>
<BitsTabs.Trigger class="ui-tabs-trigger" {value}><slot /></BitsTabs.Trigger>
```

- [ ] **Step 4: TabsContent.svelte**

```svelte
<script lang="ts">
  import { Tabs as BitsTabs } from 'bits-ui';
  export let value: string;
</script>
<BitsTabs.Content class="ui-tabs-content" {value}><slot /></BitsTabs.Content>
```

- [ ] **Step 5: tabs.css**

```css
/* src/lib/ui/tabs/tabs.css */
.ui-tabs-list {
  display: flex;
  gap: var(--ui-space-1);
  border-bottom: 1px solid var(--ui-border);
  padding-bottom: 1px;
}
.ui-tabs-trigger {
  padding: var(--ui-space-2) var(--ui-space-3);
  font-size: var(--ui-text-sm);
  color: var(--ui-text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--ui-duration-fast) var(--ui-ease),
              border-color var(--ui-duration-fast) var(--ui-ease);
}
.ui-tabs-trigger:hover                 { color: var(--ui-text); }
.ui-tabs-trigger[data-state='active']  { color: var(--ui-accent); border-bottom-color: var(--ui-accent); }
.ui-tabs-content { padding-top: var(--ui-space-4); }
```

- [ ] **Step 6: tabs/index.ts**

```typescript
export { default as Tabs }        from './Tabs.svelte';
export { default as TabsList }    from './TabsList.svelte';
export { default as TabsTrigger } from './TabsTrigger.svelte';
export { default as TabsContent } from './TabsContent.svelte';
```

- [ ] **Step 7: Write a story with 3 tabs and content panels — verify keyboard navigation (arrow keys, Bits handles this)**

- [ ] **Step 8: Commit**

```bash
git add src/lib/ui/tabs/
git commit -m "feat(ui): add Tabs component"
```

---

## Task 8: Barrel Export and Theme Alternate

**Files:**
- Create: `src/lib/ui/index.ts`
- Create: `src/lib/design/themes/cyberpunk.css`

- [ ] **Step 1: Create the barrel export**

```typescript
// src/lib/ui/index.ts
export * from './button';
export * from './badge';
export * from './card';
export * from './dialog';
export * from './select';
export * from './popover';
export * from './tooltip';
export * from './tabs';
```

- [ ] **Step 2: Verify this import resolves correctly in the app**

```svelte
<script lang="ts">
  import { Button, Dialog, DialogContent, Tabs } from '$lib/ui';
</script>
```

This is the only import pattern the app should ever use. If it works, the architecture is correct.

- [ ] **Step 3: Create cyberpunk theme to prove swappability**

```css
/* src/lib/design/themes/cyberpunk.css */
:root {
  --ui-bg:           #030712;
  --ui-panel:        #0d1117;
  --ui-panel-raised: #111827;
  --ui-overlay:      #1f2937;

  --ui-text:         #e2e8f0;
  --ui-text-muted:   #64748b;
  --ui-text-subtle:  #334155;

  --ui-border:       #00ff9d33;
  --ui-border-focus: #00ff9d;

  --ui-accent:       #00ff9d;
  --ui-accent-hover: #39ffb4;
  --ui-accent-text:  #030712;

  --ui-radius-sm:    2px;
  --ui-radius-md:    2px;
  --ui-radius-lg:    4px;
  --ui-radius-xl:    6px;
}
```

- [ ] **Step 4: Add a Storybook global switcher for themes**

In `.storybook/preview.ts`, add a `globalTypes.theme` control that loads the alternate CSS:

```typescript
export const globalTypes = {
  theme: {
    name: 'Theme',
    defaultValue: 'default',
    toolbar: {
      icon: 'paintbrush',
      items: ['default', 'cyberpunk'],
    },
  },
};

export const decorators = [
  (Story, context) => {
    const theme = context.globals.theme;
    if (theme === 'cyberpunk') {
      import('../src/lib/design/themes/cyberpunk.css');
    }
    return Story();
  },
];
```

- [ ] **Step 5: Open any story in Storybook, switch themes — verify the entire visual language changes without a single component being touched**

- [ ] **Step 6: Commit**

```bash
git add src/lib/ui/index.ts src/lib/design/themes/ .storybook/
git commit -m "feat(ui): add barrel export and cyberpunk theme — proves swap architecture"
```

---

## Architecture Rules (lock these in)

These are the invariants. Any future component work should be checked against them:

1. **The app only imports from `$lib/ui`** — never from `bits-ui` directly.
2. **CSS only uses `--ui-*` tokens** — no hardcoded colors, radii, or spacing in component CSS.
3. **Styling hooks are `data-*` attributes** — no Tailwind classes, no class logic in components.
4. **Every component has a Storybook story** — stories are the contract test bench.
5. **To swap Bits UI for a different primitive**, only the component file changes, not its CSS, stories, or the app.
6. **To change the design language**, only `tokens.css` or a theme override changes, nothing else.

---

## Self-Review

**Spec coverage:**
- [x] Bits UI as private engine — Tasks 4–7
- [x] App imports only from `$lib/ui` — Task 8, Step 2 verification
- [x] CSS token foundation — Task 1
- [x] `data-*` attribute styling pattern — Task 2 establishes it, all tasks follow
- [x] Theme swappability proven — Task 8, cyberpunk theme
- [x] Storybook as contract test bench — every task includes stories
- [x] Self-implemented primitives (Button, Badge, Card) — Tasks 2–3
- [x] Bits-wrapped behavior components (Dialog, Select, Popover, Tooltip, Tabs) — Tasks 4–7

**Components from the spec not yet planned (future plan):**
- `Switch` (Bits UI has one)
- `Combobox` (Bits UI has one)
- Layout components: `AppShell`, `Sidebar`, `SplitPane`
- `CommandPalette` (Bits `Command` primitive)
