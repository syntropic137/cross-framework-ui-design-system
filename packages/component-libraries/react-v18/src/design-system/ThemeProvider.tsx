import { useState, useEffect, useLayoutEffect } from "react";
import type { ReactNode, CSSProperties } from "react";
import "./styles.css";

export type ThemeProviderProps = {
  children: ReactNode;
};

const STORAGE_KEY = "design-system-theme";
const THEMES = ["light", "dark", "rose", "serif"] as const;
const DEFAULT_THEME = "light";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<string>(() => getInitialTheme());

  useIsomorphicLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

    if (!mediaQuery) {
      return;
    }

    const preferredListener = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setTheme("dark");
      }
    };

    mediaQuery.addEventListener("change", preferredListener);

    return () => {
      mediaQuery.removeEventListener("change", preferredListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.setDesignSystemTheme = (value: string) => {
        if (THEMES.includes(value as (typeof THEMES)[number])) {
          setTheme(value);
        }
      };
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.setDesignSystemTheme;
      }
    };
  }, []);

  return (
    <>
      <ThemeController current={theme} onChange={setTheme} />
      {children}
    </>
  );
}

function getInitialTheme(): string {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && THEMES.includes(saved as (typeof THEMES)[number])) {
    return saved;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : DEFAULT_THEME;
}

function applyTheme(theme: string) {
  document.documentElement.setAttribute("data-theme", theme);
}

type ThemeControllerProps = {
  current: string;
  onChange: (theme: string) => void;
};

function ThemeController({ current, onChange }: ThemeControllerProps) {
  return (
    <div style={controllerStyles}>
      <label style={labelStyles}>
        <span style={srOnlyStyles}>Theme</span>
        <select
          aria-label="Theme"
          value={current}
          onChange={(event) => onChange(event.target.value)}
          style={selectStyles}
        >
          {THEMES.map((themeName) => (
            <option key={themeName} value={themeName}>
              {themeName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const controllerStyles: CSSProperties = {
  position: "fixed",
  inset: "auto 16px 16px auto",
  zIndex: 9999,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "var(--shadow-sm)",
  padding: "4px",
  display: "flex"
};

const selectStyles: CSSProperties = {
  padding: "6px 10px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--fg)",
  fontFamily: "inherit"
};

const labelStyles: CSSProperties = {
  display: "flex",
  alignItems: "center"
};

const srOnlyStyles: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
};

declare global {
  interface Window {
    setDesignSystemTheme?: (theme: string) => void;
  }
}
