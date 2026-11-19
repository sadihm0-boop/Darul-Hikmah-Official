import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import TopBar from './TopBar'

type PublicSection = 'articles' | 'books' | 'research-papers'

const publicLinks: { label: string; to: string; id: PublicSection }[] = [
  { label: 'Books', to: '/books', id: 'books' },
  { label: 'Research Papers', to: '/research-papers', id: 'research-papers' },
  { label: 'Articles', to: '/articles', id: 'articles' },
]

export function PublicArticleLayout({
  children,
  currentPage,
}: {
  children: ReactNode
  currentPage: PublicSection
}) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <header className="sticky top-0 z-40 border-b border-[#d4af37]/20 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Darul Hikmah"
              className="h-10 w-10 object-contain"
            />
            <span className="font-serif text-xl font-bold text-white sm:text-2xl">
              Darul Hikmah
            </span>
          </Link>
          <nav aria-label="Public navigation" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-6">
            <Link
              to="/"
              className="text-sm font-semibold text-amber-50/80 transition hover:text-[#ffd700]"
            >
              Home
            </Link>
            {publicLinks.map(({ label, to, id }) => (
              <Link
                key={id}
                to={to}
                className={`text-sm font-semibold transition hover:text-[#ffd700] ${
                  currentPage === id ? 'text-[#ffd700]' : 'text-amber-50/80'
                }`}
                aria-current={currentPage === id ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  )
}
