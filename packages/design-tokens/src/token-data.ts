export type TokenCategories = {
  color:      Record<string, string>;
  typography: Record<string, string>;
  space:      Record<string, string>;
  radius:     Record<string, string>;
  shadow:     Record<string, string>;
  motion:     Record<string, string>;
  z:          Record<string, string>;
};

export type ThemeDefinition = {
  name:        string;
  selector:    string;
  description: string;
  isDefault?:  boolean;
  overrides:   Partial<TokenCategories>;
};

const sansStack  = `ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji`;
const monoStack  = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`;
const serifStack = `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`;

export const baseTokens: TokenCategories = {
  color: {
    "ds-color-brand-hue": "222",
    "ds-color-brand-sat": "85%",
    // var() composition below is intentional — these values resolve at CSS runtime in the browser
    "ds-color-brand":     "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 50%)",
    "ds-color-brand-600": "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 40%)",
    "ds-color-brand-700": "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 32%)",

    "ds-color-bg":              "#ffffff",
    "ds-color-fg":              "#0b0c0e",
    "ds-color-surface":         "#f5f7fb",
    "ds-color-surface-raised":  "#edf0f5",
    "ds-color-overlay":         "#e0e4ec",

    "ds-color-text-muted":  "#6b7280",
    "ds-color-text-subtle": "#9ca3af",

    "ds-color-border":       "#e5e7eb",
    "ds-color-border-focus": "var(--ds-color-accent)",

    "ds-color-accent":          "var(--ds-color-brand)",
    "ds-color-accent-contrast": "#ffffff",

    "ds-focus-ring": "2px solid var(--ds-color-brand)"
  },
  typography: {
    "ds-font-sans": sansStack,
    "ds-font-mono": monoStack,
    "ds-text-xs":   "12px",
    "ds-text-sm":   "14px",
    "ds-text-md":   "16px",
    "ds-text-lg":   "18px",
    "ds-text-xl":   "20px",
    "ds-text-2xl":  "24px"
  },
  space: {
    "ds-space-1": "4px",
    "ds-space-2": "8px",
    "ds-space-3": "12px",
    "ds-space-4": "16px",
    "ds-space-6": "24px",
    "ds-space-8": "32px"
  },
  radius: {
    "ds-radius-sm": "6px",
    "ds-radius-md": "10px",
    "ds-radius-lg": "14px"
  },
  shadow: {
    "ds-shadow-sm": "0 1px 2px rgba(0,0,0,.06)",
    "ds-shadow-md": "0 4px 12px rgba(0,0,0,.08)"
  },
  motion: {
    "ds-duration-fast": "100ms",
    "ds-duration-base": "200ms",
    "ds-duration-slow": "350ms",
    "ds-ease":          "cubic-bezier(0.4, 0, 0.2, 1)"
  },
  z: {
    "ds-z-dropdown": "100",
    "ds-z-sticky":   "200",
    "ds-z-overlay":  "300",
    "ds-z-modal":    "400",
    "ds-z-toast":    "500"
  }
};

export const themeDefinitions: ThemeDefinition[] = [
  {
    name:        "light",
    selector:    ":root",
    description: "Default light theme",
    isDefault:   true,
    overrides:   {}
  },
  {
    name:        "dark",
    selector:    "[data-theme=\"dark\"]",
    description: "Dark mode palette",
    overrides: {
      color: {
        "ds-color-bg":             "#0c0f14",
        "ds-color-fg":             "#e8eaee",
        "ds-color-text-muted":     "#a8b0bd",
        "ds-color-text-subtle":    "#6b7280",
        "ds-color-surface":        "#121621",
        "ds-color-surface-raised": "#1a1f2e",
        "ds-color-overlay":        "#1f2633",
        "ds-color-border":         "#1f2633",
        "ds-color-accent":         "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 62%)",
        "ds-color-accent-contrast":"#0a0b0e",
        "ds-focus-ring":           "2px solid var(--ds-color-accent)"
      },
      shadow: {
        "ds-shadow-sm": "0 1px 2px rgba(0,0,0,.5)",
        "ds-shadow-md": "0 6px 18px rgba(0,0,0,.55)"
      }
    }
  },
  {
    name:        "rose",
    selector:    "[data-theme=\"rose\"]",
    description: "Rose brand accent",
    overrides: {
      color: {
        "ds-color-brand-hue": "340",
        "ds-color-brand-sat": "70%",
        "ds-color-accent":    "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 55%)",
        "ds-color-accent-contrast": "#ffffff"
      }
    }
  },
  {
    name:        "serif",
    selector:    "[data-theme=\"serif\"]",
    description: "Serif typography option",
    overrides: {
      typography: {
        "ds-font-sans": serifStack
      }
    }
  }
];
