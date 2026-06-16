/// <reference types="svelte/elements" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UI_DESIGN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
