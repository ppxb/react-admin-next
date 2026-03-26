const metrics = [
  { key: 'active-users', title: 'Active Users', value: 1280, suffix: 'users' },
  { key: 'orders', title: 'Daily Orders', value: 246, suffix: 'orders' },
  { key: 'conversion', title: 'Conversion Rate', value: 4.8, suffix: '%' }
]

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Core business indicators and delivery status.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map(metric => (
          <section
            key={metric.key}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{metric.title}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {metric.value}
              <span className="ml-1 text-base font-medium text-slate-500">{metric.suffix}</span>
            </p>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Project Notes</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Use TanStack Router loaders for route-scoped data in future pages.</li>
          <li>Keep domain state in stores and derive UI state from selectors.</li>
          <li>Prefer reusable Tailwind primitives for UI consistency and speed.</li>
        </ul>
      </section>
    </div>
  )
}
