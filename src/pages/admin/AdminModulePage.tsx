import { ArrowRight, BookOpen } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'

const moduleTitles: Record<string, string> = {
  books: 'Books',
  'research-papers': 'Research Papers',
  articles: 'Articles',
  departments: 'Departments',
  programs: 'Programs',
  events: 'Events & Seminars',
  'founder-profile': 'Founder Profile',
  'homepage-content': 'Homepage Content',
  'certification-steps': 'Certification Steps',
  'media-library': 'Media Library',
  'site-settings': 'Site Settings',
}

export function AdminModulePage() {
  const { module } = useParams()
  const title = module ? moduleTitles[module] : undefined

  if (!title) {
    return <Navigate to="/admin" replace />
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-emerald-800">Content management</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          This workspace is ready for its content-management phase.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm sm:px-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
          <BookOpen aria-hidden="true" size={23} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No content connected</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Database records and editing tools are not part of this UI phase. No content has been loaded or changed.
        </p>
        <Link
          to="/admin"
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-emerald-800/30 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <ArrowRight aria-hidden="true" size={16} className="rotate-180" />
          Back to dashboard
        </Link>
      </div>
    </section>
  )
}
