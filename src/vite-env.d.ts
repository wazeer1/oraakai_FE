/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_GOOGLE_REDIRECT_URI: string
  readonly VITE_GITHUB_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
