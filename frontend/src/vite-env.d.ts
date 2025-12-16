/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly REACT_APP_BASE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
