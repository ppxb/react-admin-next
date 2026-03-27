/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_PORT: string
  readonly VITE_ENABLE_DEVTOOLS: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_CLIENT_ID: string
  readonly VITE_APP_ENABLE_API_ENCRYPT?: string
  readonly VITE_APP_API_ENCRYPT_HEADER_FLAG?: string
  readonly VITE_APP_API_ENCRYPT_PUBLIC_KEY?: string
  readonly VITE_APP_API_ENCRYPT_PRIVATE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
