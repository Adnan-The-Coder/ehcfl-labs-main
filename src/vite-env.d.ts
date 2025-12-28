/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_SUPABASE_URL: string
  readonly VITE_PUBLIC_SUPABASE_ANON_KEY: string
  readonly VITE_BACKEND_API_BASE_URL: string
  readonly VITE_PUBLIC_IP_INFO_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
