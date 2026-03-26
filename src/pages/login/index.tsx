import type { FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { useAuthStore } from '@/stores/auth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextUsername = username.trim()

    if (!nextUsername || !password.trim()) {
      setError('Username and password are required')
      return
    }

    setSubmitting(true)
    setError(null)

    login({ username: nextUsername })
    await navigate({ to: '/' })

    setSubmitting(false)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
          <p className="mt-1 text-sm text-slate-500">Admin entry for React + Tailwind stack.</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Username</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              onChange={event => setUsername(event.target.value)}
              placeholder="admin"
              type="text"
              value={username}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              onChange={event => setPassword(event.target.value)}
              placeholder="******"
              type="password"
              value={password}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </p>
          )}

          <button
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
