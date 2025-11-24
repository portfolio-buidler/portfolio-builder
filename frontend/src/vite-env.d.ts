/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

// Extend ImportMeta interface for Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_UPLOAD_PATH: string
  readonly VITE_UPLOAD_STATUS_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Explicit module declarations to help TypeScript resolve dependencies
declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axios: any
  export default axios
}

declare module 'react-toastify' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const toast: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const ToastContainer: any
}

// Add support for importing image files
declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}
