/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Firebase types
declare global {
  interface Window {
    recaptchaVerifier?: any;
    confirmationResult?: any;
  }
}
