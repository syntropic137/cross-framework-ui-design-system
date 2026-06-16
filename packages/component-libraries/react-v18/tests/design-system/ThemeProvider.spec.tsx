import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "../../src/design-system/ThemeProvider.js";

const STORAGE_KEY = "design-system-theme";

function installLocalStorage() {
  if (window.localStorage) {
    return;
  }

  const storage = new Map<string, string>();

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear() {
        storage.clear();
      },
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
      key(index: number) {
        return Array.from(storage.keys())[index] ?? null;
      },
      removeItem(key: string) {
        storage.delete(key);
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
      },
      get length() {
        return storage.size;
      }
    } satisfies Storage
  });
}

function resetDom() {
  installLocalStorage();
  document.documentElement.removeAttribute("data-theme");
  window.localStorage.removeItem(STORAGE_KEY);
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    resetDom();
  });

  afterEach(() => {
    resetDom();
  });

  it("renders children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">hello</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("hello");
  });

  it("applies light theme by default", () => {
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("restores theme from localStorage", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("allows switching theme via controller", () => {
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>
    );

    const select = screen.getByRole("combobox", { name: /theme/i });

    fireEvent.change(select, { target: { value: "rose" } });

    expect(document.documentElement.getAttribute("data-theme")).toBe("rose");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("rose");
  });
});
