import { HttpClient, HttpError, setBusinessErrorHandler, type HttpErrorHandler } from '@/lib/http'
import { toast } from 'sonner'

export const AUTH_STORAGE_KEY = 'react-admin-auth'
export const DEFAULT_CLIENT_ID =
  import.meta.env.VITE_APP_CLIENT_ID ?? 'e5cd7e4891bf95d1d19206ce24a7b32e'
export const API_ENCRYPT_HEADER_FLAG = import.meta.env.VITE_APP_API_ENCRYPT_HEADER_FLAG ?? 'encrypt-key'
export const API_ENCRYPT_ENABLED = import.meta.env.VITE_APP_ENABLE_API_ENCRYPT === 'true'
export const API_ENCRYPT_PUBLIC_KEY = import.meta.env.VITE_APP_API_ENCRYPT_PUBLIC_KEY ?? ''

type AuthContext = {
  clientId: null | string
  token: null | string
}

let authContext: AuthContext = {
  clientId: DEFAULT_CLIENT_ID,
  token: null
}

let unauthorizedHandler: (() => void) | null = null
let unauthorizedNotified = false

function isAbortError(error: HttpError): boolean {
  return error.status === 0 && error.message === 'Request aborted'
}

function isUnauthorizedError(error: HttpError): boolean {
  return error.status === 401 || error.code === 401 || error.code === 403
}

const globalErrorHandler: HttpErrorHandler = error => {
  if (isAbortError(error)) {
    return
  }

  if (isUnauthorizedError(error)) {
    if (!unauthorizedNotified) {
      unauthorizedNotified = true
      toast.error('Session expired, please sign in again')
      setTimeout(() => {
        unauthorizedNotified = false
      }, 1000)
    }

    unauthorizedHandler?.()
    return
  }

  toast.error(error.message || 'Request failed, please retry later')
}

export const apiClient = new HttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  encryption: {
    enabled: API_ENCRYPT_ENABLED,
    headerFlag: API_ENCRYPT_HEADER_FLAG,
    publicKey: API_ENCRYPT_PUBLIC_KEY
  },
  getClientId: () => authContext.clientId ?? DEFAULT_CLIENT_ID,
  getToken: () => authContext.token,
  onError: globalErrorHandler
})

setBusinessErrorHandler(globalErrorHandler)

export function setAuthContext(context: Partial<AuthContext>) {
  authContext = {
    ...authContext,
    ...context
  }
}

export function clearAuthContext() {
  authContext = {
    clientId: DEFAULT_CLIENT_ID,
    token: null
  }
}

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}
