import {
  ArrowRight,
  BookOpen,
  Book,
  CheckCircle2,
  History,
  PenTool,
  Play,
  Scroll,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

const metrics = [
  { label: 'Total Books', icon: BookOpen },
  { label: 'Total Research Papers', icon: Book },
  { label: 'Total Articles', icon: Scroll },
  { label: 'Published Content', icon: CheckCircle2 },
  { label: 'Draft Content', icon: PenTool },
]

const quickActions = [
  { label: 'Open Books', to: '/admin/books', icon: BookOpen },
  { label: 'Open Research Papers', to: '/admin/research-papers', icon: Book },
  { label: 'Open Articles', to: '/admin/articles', icon: Scroll },
  { label: 'Open Media Library', to: '/admin/media-library', icon: Play },
]

export function AdminDashboardPage() {
  const { session } = useAuth()

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-800">Overview</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Welcome{session?.user.email ? `, ${session.user.email}` : ''}. Manage the Research Center from one place.
          </p>
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Content overview
        </span>
      </header>

      <section aria-label="Content statistics">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map(({ label, icon: Icon }) => (
            <article
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900" aria-label={`${label}: not available`}>
                    —
                  </p>
                </div>
                <span className="rounded-lg bg-emerald-50 p-2.5 text-emerald-800">
                  <Icon aria-hidden="true" size={20} />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">Not connected yet</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-amber-50 p-2.5 text-amber-800">
            <History aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-sm text-slate-500">Updates from your CMS workspace</p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center">
            <p className="font-medium text-slate-700">No activity to show</p>
            <p className="mt-2 text-sm text-slate-500">
              Activity will appear here when the CMS activity log is connected.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-500">Open a content area</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-12 items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-700/40 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                <span className="flex items-center gap-3">
                  <Icon aria-hidden="true" size={18} className="text-emerald-800" />
                  {label}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  size={16}
                  className="text-slate-400 transition group-hover:text-emerald-800"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
