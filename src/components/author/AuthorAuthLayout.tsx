import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthorAuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthorAuthLayout({
  title,
  description,
  children,
  footer,
}: AuthorAuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[#d4af37]/25 bg-black/45 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
        <header className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">
            Darul Hikmah
          </p>
          <p className="text-sm font-medium tracking-wide text-amber-50/75">
            Research Center
          </p>
          <h1 className="mt-5 text-3xl font-bold">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-amber-50/75">{description}</p>
        </header>

        {children}

        <div className="mt-7 border-t border-white/10 pt-5 text-center">
          {footer}
          <Link
            to="/"
            className="mt-4 inline-block text-sm text-amber-100/75 transition hover:text-[#ffd700]"
          >
            Return to the public website
          </Link>
        </div>
      </section>
    </main>
  )
}
