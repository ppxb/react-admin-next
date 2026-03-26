import { useState } from 'react'

const toggles = {
  compactMode: {
    description: 'Use denser spacing for data-heavy screens.',
    label: 'Compact Layout'
  },
  emailAlert: {
    description: 'Receive system notifications via email.',
    label: 'Email Alerts'
  }
} as const

export function SettingsPage() {
  const [compactMode, setCompactMode] = useState(false)
  const [emailAlert, setEmailAlert] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Keep global preferences in one place and sync them via store or API.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-slate-900">{toggles.compactMode.label}</p>
            <p className="text-sm text-slate-500">{toggles.compactMode.description}</p>
          </div>
          <input
            checked={compactMode}
            className="size-5 accent-slate-900"
            onChange={event => setCompactMode(event.target.checked)}
            type="checkbox"
          />
        </label>

        <label className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="font-medium text-slate-900">{toggles.emailAlert.label}</p>
            <p className="text-sm text-slate-500">{toggles.emailAlert.description}</p>
          </div>
          <input
            checked={emailAlert}
            className="size-5 accent-slate-900"
            onChange={event => setEmailAlert(event.target.checked)}
            type="checkbox"
          />
        </label>
      </section>
    </div>
  )
}
