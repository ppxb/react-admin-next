interface UserRecord {
  key: string
  name: string
  department: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'inactive'
}

const users: UserRecord[] = [
  { key: '1', name: 'Olivia Carter', department: 'Product', role: 'admin', status: 'active' },
  { key: '2', name: 'Liam Brooks', department: 'Engineering', role: 'editor', status: 'active' },
  { key: '3', name: 'Ava Thompson', department: 'Operations', role: 'viewer', status: 'inactive' },
]

function getStatusClasses(status: UserRecord['status']) {
  return status === 'active'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

export function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Example user management table built with semantic HTML + Tailwind.</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Department</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map(user => (
                <tr key={user.key} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${getStatusClasses(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
