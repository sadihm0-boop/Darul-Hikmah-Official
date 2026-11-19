import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Book,
  CheckCircle2,
  GraduationCap,
  Globe,
  Library,
  Menu,
  Play,
  Scroll,
  Settings,
  ShieldCheck,
  Users,
  Video,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

const navigation = [
  { label: 'Dashboard', to: '/admin', icon: ShieldCheck },
  { label: 'Books', to: '/admin/books', icon: BookOpen },
  { label: 'Research Papers', to: '/admin/research-papers', icon: Book },
  { label: 'Articles', to: '/admin/articles', icon: Scroll },
  { label: 'Departments', to: '/admin/departments', icon: Library },
  { label: 'Programs', to: '/admin/programs', icon: GraduationCap },
  { label: 'Events & Seminars', to: '/admin/events', icon: Video },
  { label: 'Founder Profile', to: '/admin/founder-profile', icon: Users },
  { label: 'Homepage Content', to: '/admin/homepage-content', icon: Globe },
  { label: 'Certification Steps', to: '/admin/certification-steps', icon: CheckCircle2 },
  { label: 'Media Library', to: '/admin/media-library', icon: Play },
  { label: 'Site Settings', to: '/admin/site-settings', icon: Settings },
]

export function AdminLayout() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const activePage = navigation.find(
    ({ to }) => to === pathname || (to !== '/admin' && pathname.startsWith(`${to}/`)),
  )
  const pageTitle = activePage?.label ?? 'Dashboard'
  const email = session?.user.email ?? 'Administrator'
  const initials = email.slice(0, 1).toUpperCase()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setLogoutError(null)
    try {
      await signOut()
      navigate('/admin/login', { replace: true })
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to sign out.')
    } finally {
      setIsSigningOut(false)
    }
  }

  const renderNavigation = () => (
    <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {navigation.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/admin'}
          title={isCollapsed ? label : undefined}
          aria-label={label}
          onClick={() => setIsMobileNavigationOpen(false)}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd700] lg:duration-150 ${
              isActive
                ? 'bg-[#d4af37]/15 text-[#ffd700]'
                : 'text-emerald-50/80 hover:bg-white/5 hover:text-white'
            } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`
          }
        >
          <Icon aria-hidden="true" size={19} className="shrink-0" />
          <span className={isCollapsed ? 'lg:hidden' : ''}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-slate-900">
      {isMobileNavigationOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setIsMobileNavigationOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col bg-[#062d1a] text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-20 lg:translate-x-0 ${
            isMobileNavigationOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isCollapsed ? 'lg:w-[5.5rem]' : 'lg:w-72'}`}
        >
          <div
            className={`flex h-[4.5rem] shrink-0 items-center border-b border-white/10 px-4 ${
              isCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#ffd700]">
              <BookOpen aria-hidden="true" size={21} />
            </span>
            <div className={isCollapsed ? 'lg:hidden' : ''}>
              <p className="text-sm font-semibold text-white">Darul Hikmah</p>
              <p className="mt-0.5 text-xs text-emerald-100/65">Research Center</p>
            </div>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="ml-auto rounded-lg p-2 text-emerald-50/70 hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setIsMobileNavigationOpen(false)}
            >
              <X aria-hidden="true" size={19} />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {renderNavigation()}
            <div className="border-t border-white/10 p-3">
              <div
                className={`flex items-center gap-3 rounded-lg px-2 py-2 ${
                  isCollapsed ? 'lg:justify-center' : ''
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-sm font-semibold text-[#08200e]">
                  {initials}
                </span>
                <div className={isCollapsed ? 'lg:hidden' : 'min-w-0'}>
                  <p className="truncate text-xs font-medium text-white">{email}</p>
                  <p className="mt-0.5 text-xs text-emerald-100/60">Administrator</p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden h-11 shrink-0 items-center justify-center border-t border-white/10 text-emerald-100/70 hover:bg-white/5 hover:text-white lg:flex"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          >
            {isCollapsed ? (
              <ArrowRight aria-hidden="true" size={18} />
            ) : (
              <ArrowRight aria-hidden="true" size={18} className="rotate-180" />
            )}
          </button>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-[4.5rem] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation menu"
                className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
                onClick={() => setIsMobileNavigationOpen(true)}
              >
                <Menu aria-hidden="true" size={20} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{pageTitle}</p>
                <p className="hidden text-xs text-slate-500 sm:block">Research Center CMS</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden max-w-52 items-center gap-2 sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900">
                  {initials}
                </span>
                <span className="truncate text-xs font-medium text-slate-600">{email}</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-emerald-800/30 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowRight aria-hidden="true" size={17} />
                <span className="hidden sm:inline">
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </span>
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {logoutError && (
              <p
                role="alert"
                className="mx-auto mb-5 max-w-7xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {logoutError}
              </p>
            )}
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
