import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import TopBar from './TopBar'

export function PublicArticleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <header className="sticky top-0 z-40 border-b border-[#d4af37]/20 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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
          <nav aria-label="Public navigation" className="flex items-center gap-4 sm:gap-7">
            <Link
              to="/"
              className="text-sm font-semibold text-amber-50/80 transition hover:text-[#ffd700]"
            >
              Home
            </Link>
            <Link
              to="/articles"
              className="text-sm font-semibold text-[#ffd700]"
              aria-current="page"
            >
              Articles
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  )
}
