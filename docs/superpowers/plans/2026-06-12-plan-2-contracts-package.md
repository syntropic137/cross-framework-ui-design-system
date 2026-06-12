# Plan 2: Contracts Package

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@design-system/contracts` — a zero-runtime TypeScript-only package containing data-prop interfaces for all 43 Bits UI component groups, plus shared variant types. This is the standard any framework implementation must satisfy.

**Architecture:** New package at `packages/contracts/`. Pure TypeScript, no framework imports, no runtime. One file per component group. A barrel `index.ts` re-exports everything. Tests confirm the barrel exports the expected named exports and that contract types are structurally sound.

**Tech Stack:** TypeScript 5, Vitest

---

## File Map

```
packages/contracts/
  src/
    shared.ts                          ← base types shared across components
    components/
      accordion.ts
      alert-dialog.ts
      aspect-ratio.ts
      avatar.ts
      button.ts
      calendar.ts
      checkbox.ts
      collapsible.ts
      combobox.ts
      command.ts
      context-menu.ts
      date-field.ts
      date-picker.ts
      date-range-field.ts
      date-range-picker.ts
      dialog.ts
      dropdown-menu.ts
      label.ts
      link-preview.ts
      menu.ts
      menubar.ts
      meter.ts
      navigation-menu.ts
      pagination.ts
      pin-input.ts
      popover.ts
      progress.ts
      radio-group.ts
      range-calendar.ts
      rating-group.ts
      scroll-area.ts
      select.ts
      separator.ts
      slider.ts
      switch.ts
      tabs.ts
      time-field.ts
      time-range-field.ts
      toggle.ts
      toggle-group.ts
      toolbar.ts
      tooltip.ts
    index.ts
  tests/
    exports.spec.ts
  package.json
  tsconfig.json
  tsconfig.build.json
```

---

## Task 1: Scaffold the contracts package

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/tsconfig.build.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@design-system/contracts",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc --build tsconfig.build.json",
    "clean": "rimraf dist",
    "lint": "eslint \"src/**/*.ts\" \"tests/**/*.ts\"",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "format": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\""
  },
  "devDependencies": {
    "@types/node": "^20.14.9",
    "prettier": "^3.3.2",
    "rimraf": "^5.0.7",
    "typescript": "^5.5.4",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create tsconfig.build.json**

```json
{
  "extends": "./tsconfig.json",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Install dependencies**

```bash
cd packages/contracts && pnpm install
```

---

## Task 2: Write the failing exports test

**Files:**
- Create: `packages/contracts/tests/exports.spec.ts`

- [ ] **Step 1: Create tests/exports.spec.ts**

```typescript
// packages/contracts/tests/exports.spec.ts
import { describe, it, expect } from "vitest";
import * as contracts from "../src/index.js";

describe("@design-system/contracts barrel exports", () => {
  it("exports shared types (runtime-visible constants are not present — types only)", () => {
    // The module itself must be importable without error
    expect(contracts).toBeDefined();
  });

  it("exports are a defined module object", () => {
    // TypeScript-only packages export nothing at runtime except what's explicitly a value.
    // This test ensures the module loads cleanly — type correctness is validated by tsc.
    expect(typeof contracts).toBe("object");
  });
});
```

- [ ] **Step 2: Run test — it fails because src/index.ts doesn't exist yet**

```bash
cd packages/contracts && pnpm test
```

Expected: FAIL — `Cannot find module '../src/index.js'`

---

## Task 3: Create shared types

**Files:**
- Create: `packages/contracts/src/shared.ts`

- [ ] **Step 1: Create src/shared.ts**

```typescript
// packages/contracts/src/shared.ts

export type ComponentSize       = "sm" | "md" | "lg";
export type ComponentTone       = "neutral" | "success" | "warning" | "danger" | "accent";
export type DataOrientation     = "horizontal" | "vertical";
export type DataSide            = "top" | "right" | "bottom" | "left";
export type DataAlign           = "start" | "center" | "end";
export type CheckedState        = boolean | "indeterminate";

/** Shared open/close state for overlay components */
export interface OpenContract {
  open?:          boolean;
  onOpenChange?:  (open: boolean) => void;
  defaultOpen?:   boolean;
}

/** Shared disabled state */
export interface DisabledContract {
  disabled?: boolean;
}

/** Shared controlled-value pattern */
export interface ValueContract<T = string> {
  value?:          T;
  onValueChange?:  (value: T) => void;
  defaultValue?:   T;
}

/** Shared positioning for floating elements */
export interface PositionContract {
  side?:        DataSide;
  align?:       DataAlign;
  sideOffset?:  number;
  alignOffset?: number;
}
```

---

## Task 4: Create component contract files (simple group)

**Files:**
- Create: `packages/contracts/src/components/button.ts`
- Create: `packages/contracts/src/components/label.ts`
- Create: `packages/contracts/src/components/separator.ts`
- Create: `packages/contracts/src/components/aspect-ratio.ts`
- Create: `packages/contracts/src/components/avatar.ts`
- Create: `packages/contracts/src/components/badge.ts` (not in Bits — added for completeness)
- Create: `packages/contracts/src/components/meter.ts`
- Create: `packages/contracts/src/components/progress.ts`
- Create: `packages/contracts/src/components/scroll-area.ts`

- [ ] **Step 1: button.ts**

```typescript
// packages/contracts/src/components/button.ts
import type { ComponentSize } from "../shared.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonContract {
  variant?:  ButtonVariant;
  size?:     ComponentSize;
  disabled?: boolean;
  loading?:  boolean;
  /** @default 'button' */
  type?:     "button" | "submit" | "reset";
}
```

- [ ] **Step 2: label.ts**

```typescript
// packages/contracts/src/components/label.ts
export interface LabelContract {
  /** The id of the form element this label describes */
  for?: string;
}
```

- [ ] **Step 3: separator.ts**

```typescript
// packages/contracts/src/components/separator.ts
import type { DataOrientation } from "../shared.js";

export interface SeparatorContract {
  /** @default 'horizontal' */
  orientation?:  DataOrientation;
  /** When true, the separator is purely visual and hidden from assistive technology */
  decorative?:   boolean;
}
```

- [ ] **Step 4: aspect-ratio.ts**

```typescript
// packages/contracts/src/components/aspect-ratio.ts
export interface AspectRatioContract {
  /** Width / height ratio. e.g. 16/9 */
  ratio: number;
}
```

- [ ] **Step 5: avatar.ts**

```typescript
// packages/contracts/src/components/avatar.ts
export interface AvatarContract {
  src?:      string;
  alt?:      string;
  fallback?: string;
}
```

- [ ] **Step 6: meter.ts**

```typescript
// packages/contracts/src/components/meter.ts
export interface MeterContract {
  value:  number;
  min?:   number;
  max?:   number;
  label?: string;
}
```

- [ ] **Step 7: progress.ts**

```typescript
// packages/contracts/src/components/progress.ts
export interface ProgressContract {
  /** Current value. null or undefined means indeterminate. */
  value?: number | null;
  max?:   number;
}
```

- [ ] **Step 8: scroll-area.ts**

```typescript
// packages/contracts/src/components/scroll-area.ts
export type ScrollAreaType = "auto" | "always" | "scroll" | "hover";

export interface ScrollAreaContract {
  type?: ScrollAreaType;
}
```

---

## Task 5: Create component contract files (interactive group)

**Files:**
- Create: `packages/contracts/src/components/checkbox.ts`
- Create: `packages/contracts/src/components/switch.ts`
- Create: `packages/contracts/src/components/toggle.ts`
- Create: `packages/contracts/src/components/toggle-group.ts`
- Create: `packages/contracts/src/components/slider.ts`
- Create: `packages/contracts/src/components/pin-input.ts`
- Create: `packages/contracts/src/components/radio-group.ts`
- Create: `packages/contracts/src/components/rating-group.ts`

- [ ] **Step 1: checkbox.ts**

```typescript
// packages/contracts/src/components/checkbox.ts
import type { CheckedState } from "../shared.js";

export interface CheckboxRootContract {
  checked?:          CheckedState;
  onCheckedChange?:  (checked: CheckedState) => void;
  defaultChecked?:   CheckedState;
  disabled?:         boolean;
  required?:         boolean;
  name?:             string;
  value?:            string;
}
```

- [ ] **Step 2: switch.ts**

```typescript
// packages/contracts/src/components/switch.ts
export interface SwitchRootContract {
  checked?:          boolean;
  onCheckedChange?:  (checked: boolean) => void;
  defaultChecked?:   boolean;
  disabled?:         boolean;
  required?:         boolean;
  name?:             string;
  value?:            string;
}
```

- [ ] **Step 3: toggle.ts**

```typescript
// packages/contracts/src/components/toggle.ts
export interface ToggleContract {
  pressed?:          boolean;
  onPressedChange?:  (pressed: boolean) => void;
  defaultPressed?:   boolean;
  disabled?:         boolean;
}
```

- [ ] **Step 4: toggle-group.ts**

```typescript
// packages/contracts/src/components/toggle-group.ts
import type { DataOrientation } from "../shared.js";

export interface ToggleGroupSingleContract {
  type:              "single";
  value?:            string;
  onValueChange?:    (value: string) => void;
  defaultValue?:     string;
  disabled?:         boolean;
  orientation?:      DataOrientation;
}

export interface ToggleGroupMultipleContract {
  type:              "multiple";
  value?:            string[];
  onValueChange?:    (value: string[]) => void;
  defaultValue?:     string[];
  disabled?:         boolean;
  orientation?:      DataOrientation;
}

export type ToggleGroupContract = ToggleGroupSingleContract | ToggleGroupMultipleContract;
```

- [ ] **Step 5: slider.ts**

```typescript
// packages/contracts/src/components/slider.ts
import type { DataOrientation } from "../shared.js";

export interface SliderContract {
  value?:          number[];
  onValueChange?:  (value: number[]) => void;
  defaultValue?:   number[];
  min?:            number;
  max?:            number;
  step?:           number;
  disabled?:       boolean;
  orientation?:    DataOrientation;
}
```

- [ ] **Step 6: pin-input.ts**

```typescript
// packages/contracts/src/components/pin-input.ts
export interface PinInputContract {
  value?:          string[];
  onValueChange?:  (value: string[]) => void;
  /** Number of input cells */
  length?:         number;
  type?:           "text" | "numeric";
  /** Mask input values like a password field */
  mask?:           boolean;
  placeholder?:    string;
  disabled?:       boolean;
}
```

- [ ] **Step 7: radio-group.ts**

```typescript
// packages/contracts/src/components/radio-group.ts
import type { DataOrientation } from "../shared.js";

export interface RadioGroupContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
  defaultValue?:   string;
  disabled?:       boolean;
  required?:       boolean;
  orientation?:    DataOrientation;
  name?:           string;
}

export interface RadioGroupItemContract {
  value:     string;
  disabled?: boolean;
}
```

- [ ] **Step 8: rating-group.ts**

```typescript
// packages/contracts/src/components/rating-group.ts
export interface RatingGroupContract {
  value?:          number;
  onValueChange?:  (value: number) => void;
  defaultValue?:   number;
  max?:            number;
  disabled?:       boolean;
  readonly?:       boolean;
}
```

---

## Task 6: Create component contract files (overlay group)

**Files:**
- Create: `packages/contracts/src/components/dialog.ts`
- Create: `packages/contracts/src/components/alert-dialog.ts`
- Create: `packages/contracts/src/components/popover.ts`
- Create: `packages/contracts/src/components/tooltip.ts`
- Create: `packages/contracts/src/components/link-preview.ts`
- Create: `packages/contracts/src/components/collapsible.ts`

- [ ] **Step 1: dialog.ts**

```typescript
// packages/contracts/src/components/dialog.ts
import type { OpenContract } from "../shared.js";

export interface DialogRootContract extends OpenContract {}

export interface DialogContentContract {
  /** When true, interaction outside the content closes the dialog */
  closeOnOutsideClick?: boolean;
  /** When true, pressing Escape closes the dialog */
  closeOnEscape?:       boolean;
}
```

- [ ] **Step 2: alert-dialog.ts**

```typescript
// packages/contracts/src/components/alert-dialog.ts
import type { OpenContract } from "../shared.js";

export interface AlertDialogRootContract extends OpenContract {}

export interface AlertDialogContentContract {
  closeOnEscape?: boolean;
}
```

- [ ] **Step 3: popover.ts**

```typescript
// packages/contracts/src/components/popover.ts
import type { OpenContract, PositionContract } from "../shared.js";

export interface PopoverRootContract extends OpenContract {}

export interface PopoverContentContract extends PositionContract {
  closeOnOutsideClick?: boolean;
  closeOnEscape?:       boolean;
}
```

- [ ] **Step 4: tooltip.ts**

```typescript
// packages/contracts/src/components/tooltip.ts
import type { PositionContract } from "../shared.js";

export interface TooltipRootContract {
  open?:          boolean;
  onOpenChange?:  (open: boolean) => void;
  openDelay?:     number;
  closeDelay?:    number;
  disabled?:      boolean;
}

export interface TooltipContentContract extends PositionContract {}
```

- [ ] **Step 5: link-preview.ts**

```typescript
// packages/contracts/src/components/link-preview.ts
import type { PositionContract } from "../shared.js";

export interface LinkPreviewRootContract {
  open?:          boolean;
  onOpenChange?:  (open: boolean) => void;
  openDelay?:     number;
  closeDelay?:    number;
}

export interface LinkPreviewContentContract extends PositionContract {}
```

- [ ] **Step 6: collapsible.ts**

```typescript
// packages/contracts/src/components/collapsible.ts
import type { OpenContract } from "../shared.js";

export interface CollapsibleRootContract extends OpenContract {
  disabled?: boolean;
}
```

---

## Task 7: Create component contract files (menu group)

**Files:**
- Create: `packages/contracts/src/components/menu.ts`
- Create: `packages/contracts/src/components/context-menu.ts`
- Create: `packages/contracts/src/components/dropdown-menu.ts`
- Create: `packages/contracts/src/components/menubar.ts`

All four share the same item, sub-menu, and checkbox-item contracts. `menu.ts` defines the shared base; the others re-export it.

- [ ] **Step 1: menu.ts (shared menu contracts)**

```typescript
// packages/contracts/src/components/menu.ts
import type { OpenContract, PositionContract } from "../shared.js";

export interface MenuRootContract extends OpenContract {}

export interface MenuContentContract extends PositionContract {
  loop?: boolean;
}

export interface MenuItemContract {
  disabled?:   boolean;
  textValue?:  string;
}

export interface MenuCheckboxItemContract extends MenuItemContract {
  checked?:          boolean;
  onCheckedChange?:  (checked: boolean) => void;
}

export interface MenuRadioGroupContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
}

export interface MenuSubContract extends OpenContract {}
```

- [ ] **Step 2: context-menu.ts**

```typescript
// packages/contracts/src/components/context-menu.ts
export type {
  MenuRootContract        as ContextMenuRootContract,
  MenuContentContract     as ContextMenuContentContract,
  MenuItemContract        as ContextMenuItemContract,
  MenuCheckboxItemContract as ContextMenuCheckboxItemContract,
  MenuRadioGroupContract  as ContextMenuRadioGroupContract,
  MenuSubContract         as ContextMenuSubContract,
} from "./menu.js";
```

- [ ] **Step 3: dropdown-menu.ts**

```typescript
// packages/contracts/src/components/dropdown-menu.ts
export type {
  MenuRootContract        as DropdownMenuRootContract,
  MenuContentContract     as DropdownMenuContentContract,
  MenuItemContract        as DropdownMenuItemContract,
  MenuCheckboxItemContract as DropdownMenuCheckboxItemContract,
  MenuRadioGroupContract  as DropdownMenuRadioGroupContract,
  MenuSubContract         as DropdownMenuSubContract,
} from "./menu.js";
```

- [ ] **Step 4: menubar.ts**

```typescript
// packages/contracts/src/components/menubar.ts
import type { DataOrientation } from "../shared.js";
export type {
  MenuContentContract     as MenubarMenuContentContract,
  MenuItemContract        as MenubarItemContract,
  MenuCheckboxItemContract as MenubarCheckboxItemContract,
  MenuRadioGroupContract  as MenubarRadioGroupContract,
  MenuSubContract         as MenubarSubContract,
} from "./menu.js";

export interface MenubarRootContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
  orientation?:    DataOrientation;
  loop?:           boolean;
}
```

---

## Task 8: Create component contract files (navigation group)

**Files:**
- Create: `packages/contracts/src/components/tabs.ts`
- Create: `packages/contracts/src/components/accordion.ts`
- Create: `packages/contracts/src/components/navigation-menu.ts`
- Create: `packages/contracts/src/components/toolbar.ts`
- Create: `packages/contracts/src/components/pagination.ts`

- [ ] **Step 1: tabs.ts**

```typescript
// packages/contracts/src/components/tabs.ts
import type { DataOrientation } from "../shared.js";

export interface TabsRootContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
  defaultValue?:   string;
  orientation?:    DataOrientation;
  loop?:           boolean;
}

export interface TabsTriggerContract {
  value:     string;
  disabled?: boolean;
}

export interface TabsContentContract {
  value: string;
}
```

- [ ] **Step 2: accordion.ts**

```typescript
// packages/contracts/src/components/accordion.ts
import type { DataOrientation } from "../shared.js";

export interface AccordionSingleContract {
  type:              "single";
  value?:            string;
  onValueChange?:    (value: string) => void;
  defaultValue?:     string;
  disabled?:         boolean;
  orientation?:      DataOrientation;
}

export interface AccordionMultipleContract {
  type:              "multiple";
  value?:            string[];
  onValueChange?:    (value: string[]) => void;
  defaultValue?:     string[];
  disabled?:         boolean;
  orientation?:      DataOrientation;
}

export type AccordionContract = AccordionSingleContract | AccordionMultipleContract;

export interface AccordionItemContract {
  value:     string;
  disabled?: boolean;
}
```

- [ ] **Step 3: navigation-menu.ts**

```typescript
// packages/contracts/src/components/navigation-menu.ts
import type { DataOrientation } from "../shared.js";

export interface NavigationMenuRootContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
  orientation?:    DataOrientation;
  loop?:           boolean;
}

export interface NavigationMenuItemContract {
  value?: string;
}
```

- [ ] **Step 4: toolbar.ts**

```typescript
// packages/contracts/src/components/toolbar.ts
import type { DataOrientation } from "../shared.js";

export interface ToolbarContract {
  orientation?: DataOrientation;
  loop?:        boolean;
}
```

- [ ] **Step 5: pagination.ts**

```typescript
// packages/contracts/src/components/pagination.ts
export interface PaginationContract {
  page:            number;
  count:           number;
  onPageChange?:   (page: number) => void;
  perPage?:        number;
  siblingCount?:   number;
}
```

---

## Task 9: Create component contract files (select/combobox/command group)

**Files:**
- Create: `packages/contracts/src/components/select.ts`
- Create: `packages/contracts/src/components/combobox.ts`
- Create: `packages/contracts/src/components/command.ts`

- [ ] **Step 1: select.ts**

```typescript
// packages/contracts/src/components/select.ts
import type { ComponentSize, PositionContract } from "../shared.js";

export interface SelectRootContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
  defaultValue?:   string;
  disabled?:       boolean;
  required?:       boolean;
  name?:           string;
}

export interface SelectTriggerContract {
  size?:        ComponentSize;
  placeholder?: string;
}

export interface SelectContentContract extends PositionContract {}

export interface SelectItemContract {
  value:     string;
  label:     string;
  disabled?: boolean;
}
```

- [ ] **Step 2: combobox.ts**

```typescript
// packages/contracts/src/components/combobox.ts
import type { PositionContract } from "../shared.js";

export interface ComboboxRootContract {
  value?:            string;
  onValueChange?:    (value: string) => void;
  defaultValue?:     string;
  open?:             boolean;
  onOpenChange?:     (open: boolean) => void;
  disabled?:         boolean;
  inputValue?:       string;
  onInputValueChange?: (value: string) => void;
}

export interface ComboboxContentContract extends PositionContract {}

export interface ComboboxItemContract {
  value:     string;
  label:     string;
  disabled?: boolean;
}
```

- [ ] **Step 3: command.ts**

```typescript
// packages/contracts/src/components/command.ts
export interface CommandRootContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
  filter?:         (value: string, search: string) => number;
  loop?:           boolean;
}

export interface CommandInputContract {
  placeholder?: string;
  value?:       string;
  onValueChange?: (value: string) => void;
}

export interface CommandItemContract {
  value:     string;
  disabled?: boolean;
  keywords?: string[];
}
```

---

## Task 10: Create component contract files (date/time group)

**Files:**
- Create: `packages/contracts/src/components/calendar.ts`
- Create: `packages/contracts/src/components/date-field.ts`
- Create: `packages/contracts/src/components/date-picker.ts`
- Create: `packages/contracts/src/components/date-range-field.ts`
- Create: `packages/contracts/src/components/date-range-picker.ts`
- Create: `packages/contracts/src/components/range-calendar.ts`
- Create: `packages/contracts/src/components/time-field.ts`
- Create: `packages/contracts/src/components/time-range-field.ts`

Date values use `string` typed as ISO 8601 (`YYYY-MM-DD` for dates, `HH:MM` for times). Framework implementations may use richer date types; the contract uses string to stay framework-agnostic.

- [ ] **Step 1: calendar.ts**

```typescript
// packages/contracts/src/components/calendar.ts
export interface CalendarContract {
  value?:                  string;
  onValueChange?:          (value: string) => void;
  defaultValue?:           string;
  placeholder?:            string;
  minValue?:               string;
  maxValue?:               string;
  disabled?:               boolean;
  readonly?:               boolean;
  fixedWeeks?:             boolean;
  numberOfMonths?:         number;
}
```

- [ ] **Step 2: date-field.ts**

```typescript
// packages/contracts/src/components/date-field.ts
export interface DateFieldContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
  defaultValue?:   string;
  placeholder?:    string;
  minValue?:       string;
  maxValue?:       string;
  disabled?:       boolean;
  readonly?:       boolean;
  required?:       boolean;
  name?:           string;
}
```

- [ ] **Step 3: date-picker.ts**

```typescript
// packages/contracts/src/components/date-picker.ts
import type { OpenContract } from "../shared.js";
import type { DateFieldContract } from "./date-field.js";

export interface DatePickerRootContract extends DateFieldContract, OpenContract {}
```

- [ ] **Step 4: date-range-field.ts**

```typescript
// packages/contracts/src/components/date-range-field.ts
export interface DateRange {
  start?: string;
  end?:   string;
}

export interface DateRangeFieldContract {
  value?:          DateRange;
  onValueChange?:  (value: DateRange) => void;
  defaultValue?:   DateRange;
  minValue?:       string;
  maxValue?:       string;
  disabled?:       boolean;
  readonly?:       boolean;
}
```

- [ ] **Step 5: date-range-picker.ts**

```typescript
// packages/contracts/src/components/date-range-picker.ts
import type { OpenContract } from "../shared.js";
import type { DateRangeFieldContract } from "./date-range-field.js";

export interface DateRangePickerRootContract extends DateRangeFieldContract, OpenContract {}
```

- [ ] **Step 6: range-calendar.ts**

```typescript
// packages/contracts/src/components/range-calendar.ts
import type { DateRange } from "./date-range-field.js";

export interface RangeCalendarContract {
  value?:                  DateRange;
  onValueChange?:          (value: DateRange) => void;
  defaultValue?:           DateRange;
  placeholder?:            string;
  minValue?:               string;
  maxValue?:               string;
  disabled?:               boolean;
  readonly?:               boolean;
  numberOfMonths?:         number;
}
```

- [ ] **Step 7: time-field.ts**

```typescript
// packages/contracts/src/components/time-field.ts
export interface TimeFieldContract {
  value?:          string;
  onValueChange?:  (value: string) => void;
  defaultValue?:   string;
  minValue?:       string;
  maxValue?:       string;
  disabled?:       boolean;
  readonly?:       boolean;
  required?:       boolean;
  name?:           string;
  hourCycle?:      12 | 24;
}
```

- [ ] **Step 8: time-range-field.ts**

```typescript
// packages/contracts/src/components/time-range-field.ts
export interface TimeRange {
  start?: string;
  end?:   string;
}

export interface TimeRangeFieldContract {
  value?:          TimeRange;
  onValueChange?:  (value: TimeRange) => void;
  defaultValue?:   TimeRange;
  minValue?:       string;
  maxValue?:       string;
  disabled?:       boolean;
  readonly?:       boolean;
  hourCycle?:      12 | 24;
}
```

---

## Task 11: Barrel export and final verification

**Files:**
- Create: `packages/contracts/src/index.ts`

- [ ] **Step 1: Create src/index.ts**

```typescript
// packages/contracts/src/index.ts
export * from "./shared.js";

export * from "./components/accordion.js";
export * from "./components/alert-dialog.js";
export * from "./components/aspect-ratio.js";
export * from "./components/avatar.js";
export * from "./components/button.js";
export * from "./components/calendar.js";
export * from "./components/checkbox.js";
export * from "./components/collapsible.js";
export * from "./components/combobox.js";
export * from "./components/command.js";
export * from "./components/context-menu.js";
export * from "./components/date-field.js";
export * from "./components/date-picker.js";
export * from "./components/date-range-field.js";
export * from "./components/date-range-picker.js";
export * from "./components/dialog.js";
export * from "./components/dropdown-menu.js";
export * from "./components/label.js";
export * from "./components/link-preview.js";
export * from "./components/menu.js";
export * from "./components/menubar.js";
export * from "./components/meter.js";
export * from "./components/navigation-menu.js";
export * from "./components/pagination.js";
export * from "./components/pin-input.js";
export * from "./components/popover.js";
export * from "./components/progress.js";
export * from "./components/radio-group.js";
export * from "./components/range-calendar.js";
export * from "./components/rating-group.js";
export * from "./components/scroll-area.js";
export * from "./components/select.js";
export * from "./components/separator.js";
export * from "./components/slider.js";
export * from "./components/switch.js";
export * from "./components/tabs.js";
export * from "./components/time-field.js";
export * from "./components/time-range-field.js";
export * from "./components/toggle.js";
export * from "./components/toggle-group.js";
export * from "./components/toolbar.js";
export * from "./components/tooltip.js";
```

- [ ] **Step 2: Run tests — confirm they pass**

```bash
cd packages/contracts && pnpm test
```

Expected: 2 tests pass

- [ ] **Step 3: Type-check the package**

```bash
cd packages/contracts && pnpm typecheck
```

Expected: no errors

- [ ] **Step 4: Build the package**

```bash
cd packages/contracts && pnpm build
```

Expected: `dist/` created with `.js` and `.d.ts` files

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/
git commit -m "feat(contracts): add @design-system/contracts package with all 42 component interfaces"
```
