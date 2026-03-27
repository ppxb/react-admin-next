import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { useMemo } from 'react'

import { useAuthStore, useCurrentUser } from '@/stores/auth'

const navItems = [
  { path: '/' as const, label: 'Dashboard' },
  { path: '/users' as const, label: 'Users' },
  { path: '/settings' as const, label: 'Settings' }
]

type MenuPath = (typeof navItems)[number]['path']

function resolveSelectedKey(pathname: string): MenuPath {
  if (pathname.startsWith('/users')) return '/users'

  if (pathname.startsWith('/settings')) return '/settings'

  return '/'
}

export function AdminLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  const currentUser = useCurrentUser()
  const pathname = useRouterState({ select: state => state.location.pathname })

  const selectedKey = useMemo(() => resolveSelectedKey(pathname), [pathname])

  const handleNavigate = (path: MenuPath) => {
    void navigate({ to: path })
  }

  const handleLogout = async () => {
    await logout()
    await navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-16 items-center border-b border-slate-200 px-5">
            <p className="text-base font-semibold tracking-tight">React Admin Next</p>
          </div>

          <nav className="space-y-1 p-3">
            {navItems.map(item => {
              const isActive = selectedKey === item.path

              return (
                <button
                  key={item.path}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => handleNavigate(item.path)}
                  type="button"
                >
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Modern Admin Console</p>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {currentUser?.name ?? 'Guest'}
                </span>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                  onClick={() => {
                    void handleLogout()
                  }}
                  type="button"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map(item => {
                const isActive = selectedKey === item.path

                return (
                  <button
                    key={item.path}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    onClick={() => handleNavigate(item.path)}
                    type="button"
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}