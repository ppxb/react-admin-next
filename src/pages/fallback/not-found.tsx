import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Home } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-mono text-7xl font-bold text-slate-900">404</p>
          <h1 className="text-2xl font-semibold">Page Not Found</h1>
          <p className="text-sm text-slate-500">
            Sorry, the page you are looking for does not exist or has been removed.
          </p>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={() => window.history.back()}
            type="button"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </button>
          <button
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={() => void navigate({ to: '/' })}
            type="button"
          >
            <Home className="size-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
