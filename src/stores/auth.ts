import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type UserRole = 'admin'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
}

interface LoginPayload {
  username: string
}

interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  login: (payload: LoginPayload) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isAuthenticated: false,
      user: null,
      login: ({ username }) => {
        set({
          isAuthenticated: true,
          user: {
            id: 'u_admin',
            name: username,
            role: 'admin'
          }
        })
      },
      logout: () => {
        set({
          isAuthenticated: false,
          user: null
        })
      }
    }),
    {
      name: 'react-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user
      })
    }
  )
)

export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)

export const useCurrentUser = () => useAuthStore(state => state.user)
