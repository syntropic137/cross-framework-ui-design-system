/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UI_DESIGN?: "default" | "brutalist";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
