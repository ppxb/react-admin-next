import { authApi } from '@/api'
import {
  AUTH_STORAGE_KEY,
  DEFAULT_CLIENT_ID,
  clearAuthContext,
  registerUnauthorizedHandler,
  setAuthContext
} from '@/api/client'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type UserRole = string

export interface AuthUser {
  id: string
  name: string
  permissions: string[]
  role: UserRole
  roles: string[]
  username: string
}

interface LoginPayload {
  code?: string
  tenantId?: string
  username: string
  password: string
  uuid?: string
}

interface AuthState {
  clientId: string
  isLoggingIn: boolean
  token: null | string
  user: AuthUser | null
  clearAuth: () => void
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

type PersistedAuthSnapshot = {
  clientId?: null | string
  token?: null | string
  user?: AuthUser | null
}

type PersistedAuthStorage = {
  state?: PersistedAuthSnapshot
}

function readPersistedAuthSnapshot(): PersistedAuthSnapshot {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as PersistedAuthStorage
    if (!parsed.state || typeof parsed.state !== 'object') {
      return {}
    }
    return parsed.state
  } catch {
    return {}
  }
}

const persistedSnapshot = readPersistedAuthSnapshot()
const initialToken = persistedSnapshot.token ?? null
const initialClientId = persistedSnapshot.clientId ?? DEFAULT_CLIENT_ID

setAuthContext({
  token: initialToken,
  clientId: initialClientId
})

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      clientId: initialClientId,
      isLoggingIn: false,
      token: initialToken,
      user: persistedSnapshot.user ?? null,
      clearAuth: () => {
        clearAuthContext()
        set({
          token: null,
          clientId: DEFAULT_CLIENT_ID,
          user: null
        })
      },
      login: async payload => {
        set({ isLoggingIn: true })
        try {
          const loginResult = await authApi.loginWithPassword(payload)
          const token = loginResult.access_token
          const clientId = loginResult.client_id || DEFAULT_CLIENT_ID

          setAuthContext({
            token,
            clientId
          })

          set({
            token,
            clientId
          })

          const userInfo = await authApi.getUserInfo()

          const authUser: AuthUser = {
            id: String(userInfo.user.userId),
            name: userInfo.user.nickName || userInfo.user.userName,
            username: userInfo.user.userName,
            role: userInfo.roles[0] ?? 'user',
            roles: userInfo.roles,
            permissions: userInfo.permissions
          }

          set({
            user: authUser
          })
        } catch (error) {
          get().clearAuth()
          throw error
        } finally {
          set({ isLoggingIn: false })
        }
      },
      logout: async () => {
        try {
          if (get().token) {
            await authApi.logout()
          }
        } catch {
          // Logout should still clear local auth state if network call fails.
        }

        get().clearAuth()
      }
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        clientId: state.clientId,
        token: state.token,
        user: state.user
      }),
      onRehydrateStorage: () => state => {
        if (!state) {
          clearAuthContext()
          return
        }

        setAuthContext({
          token: state.token,
          clientId: state.clientId
        })
      }
    }
  )
)

registerUnauthorizedHandler(() => {
  useAuthStore.getState().clearAuth()

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
})

export const useIsAuthenticated = () => useAuthStore(state => Boolean(state.token))

export const useCurrentUser = () => useAuthStore(state => state.user)
