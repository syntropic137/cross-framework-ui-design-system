import "@testing-library/jest-dom/vitest";
import { beforeAll } from "vitest";

function installLocalStorage() {
  if (typeof globalThis.localStorage !== "undefined") {
    return;
  }

  const storage = new Map<string, string>();
  const localStorage = {
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
  } satisfies Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage
  });

  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorage
    });
  }
}

installLocalStorage();
beforeAll(() => {
  installLocalStorage();
});
