import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router'

import { useAuthStore } from '@/stores/auth'

const AdminLayout = lazyRouteComponent(() => import('@/layouts/admin-layout'), 'AdminLayout')
const DashboardPage = lazyRouteComponent(() => import('@/pages/dashboard-page'), 'DashboardPage')
const LoginPage = lazyRouteComponent(() => import('@/pages/login'), 'LoginPage')
const NotFoundPage = lazyRouteComponent(() => import('@/pages/fallback/not-found'), 'NotFoundPage')
const SettingsPage = lazyRouteComponent(() => import('@/pages/settings-page'), 'SettingsPage')
const UsersPage = lazyRouteComponent(() => import('@/pages/users-page'), 'UsersPage')

function requireAuth() {
  if (!useAuthStore.getState().isAuthenticated) {
    throw redirect({ to: '/login' })
  }
}

function redirectWhenAuthenticated() {
  if (useAuthStore.getState().isAuthenticated) {
    throw redirect({ to: '/' })
  }
}

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
})

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: requireAuth,
  component: AdminLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: redirectWhenAuthenticated,
  component: LoginPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: DashboardPage,
})

const usersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/users',
  component: UsersPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([dashboardRoute, usersRoute, settingsRoute]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
