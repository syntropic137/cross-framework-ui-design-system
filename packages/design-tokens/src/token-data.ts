export type TokenCategories = {
  color: Record<string, string>;
  typography: Record<string, string>;
  space: Record<string, string>;
  radius: Record<string, string>;
  shadow: Record<string, string>;
};

export type ThemeDefinition = {
  name: string;
  selector: string;
  description: string;
  isDefault?: boolean;
  overrides: Partial<TokenCategories>;
};

const sansStack = `ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji`;
const monoStack = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`;
const serifStack = `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`;

export const baseTokens: TokenCategories = {
  color: {
    "brand-hue": "222",
    "brand-sat": "85%",
    brand: "hsl(var(--brand-hue) var(--brand-sat) 50%)",
    "brand-600": "hsl(var(--brand-hue) var(--brand-sat) 40%)",
    "brand-700": "hsl(var(--brand-hue) var(--brand-sat) 32%)",
    bg: "#ffffff",
    fg: "#0b0c0e",
    muted: "#6b7280",
    surface: "#f5f7fb",
    border: "#e5e7eb",
    accent: "var(--brand)",
    "accent-contrast": "#ffffff",
    "focus-ring": "2px solid var(--brand)"
  },
  typography: {
    "font-sans": sansStack,
    "font-mono": monoStack,
    "text-xs": "12px",
    "text-sm": "14px",
    "text-md": "16px",
    "text-lg": "18px",
    "text-xl": "20px",
    "text-2xl": "24px"
  },
  space: {
    "space-1": "4px",
    "space-2": "8px",
    "space-3": "12px",
    "space-4": "16px",
    "space-6": "24px",
    "space-8": "32px"
  },
  radius: {
    "radius-sm": "6px",
    "radius-md": "10px",
    "radius-lg": "14px"
  },
  shadow: {
    "shadow-sm": "0 1px 2px rgba(0,0,0,.06)",
    "shadow-md": "0 4px 12px rgba(0,0,0,.08)"
  }
};

export const themeDefinitions: ThemeDefinition[] = [
  {
    name: "light",
    selector: ":root",
    description: "Default light theme",
    isDefault: true,
    overrides: {}
  },
  {
    name: "dark",
    selector: "[data-theme=\"dark\"]",
    description: "Dark mode palette",
    overrides: {
      color: {
        bg: "#0c0f14",
        fg: "#e8eaee",
        muted: "#a8b0bd",
        surface: "#121621",
        border: "#1f2633",
        accent: "hsl(var(--brand-hue) var(--brand-sat) 62%)",
        "accent-contrast": "#0a0b0e",
        "focus-ring": "2px solid var(--accent)"
      },
      shadow: {
        "shadow-sm": "0 1px 2px rgba(0,0,0,.5)",
        "shadow-md": "0 6px 18px rgba(0,0,0,.55)"
      }
    }
  },
  {
    name: "rose",
    selector: "[data-theme=\"rose\"]",
    description: "Rose brand accent",
    overrides: {
      color: {
        "brand-hue": "340",
        "brand-sat": "70%",
        accent: "hsl(var(--brand-hue) var(--brand-sat) 55%)",
        "accent-contrast": "#ffffff"
      }
    }
  },
  {
    name: "serif",
    selector: "[data-theme=\"serif\"]",
    description: "Serif typography option",
    overrides: {
      typography: {
        "font-sans": serifStack
      }
    }
  }
];
