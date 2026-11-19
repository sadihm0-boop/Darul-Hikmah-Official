import { publicSupabase } from './supabaseClient'
import type { Book } from './booksService'
import type { ResearchPaper } from './researchPapersService'

export type PublicBook = Pick<
  Book,
  | 'id'
  | 'title'
  | 'author'
  | 'description'
  | 'category'
  | 'language'
  | 'file_path'
  | 'cover_path'
  | 'published_date'
>

export type PublicResearchPaper = Pick<
  ResearchPaper,
  | 'id'
  | 'title'
  | 'author'
  | 'abstract'
  | 'keywords'
  | 'category'
  | 'file_path'
  | 'publication_date'
  | 'journal_name'
>

export class PublicCatalogServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublicCatalogServiceError'
  }
}

function requirePublicClient() {
  if (!publicSupabase) {
    throw new PublicCatalogServiceError(
      'The public catalog is unavailable because Supabase is not configured.',
    )
  }
  return publicSupabase
}

export async function getPublicBooks(): Promise<PublicBook[]> {
  const client = requirePublicClient()

  try {
    const { data, error } = await client
      .from('books')
      .select(
        'id, title, author, description, category, language, file_path, cover_path, published_date',
      )
      .eq('status', 'published')
      .order('published_date', { ascending: false })
      .overrideTypes<PublicBook[], { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new PublicCatalogServiceError(
        'Published books could not be loaded. Please try again.',
      )
    }
    return data
  } catch (error: unknown) {
    if (error instanceof PublicCatalogServiceError) throw error
    throw new PublicCatalogServiceError(
      'Published books could not be loaded. Please try again.',
    )
  }
}

export async function getPublicBookById(bookId: string): Promise<PublicBook> {
  const client = requirePublicClient()

  try {
    const { data, error } = await client
      .from('books')
      .select(
        'id, title, author, description, category, language, file_path, cover_path, published_date',
      )
      .eq('id', bookId)
      .eq('status', 'published')
      .maybeSingle()
      .overrideTypes<PublicBook | null, { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new PublicCatalogServiceError(
        'This book is unavailable or has not been published.',
      )
    }
    return data
  } catch (error: unknown) {
    if (error instanceof PublicCatalogServiceError) throw error
    throw new PublicCatalogServiceError(
      'The book could not be loaded. Please try again.',
    )
  }
}

export async function getPublicResearchPapers(): Promise<PublicResearchPaper[]> {
  const client = requirePublicClient()

  try {
    const { data, error } = await client
      .from('research_papers')
      .select(
        'id, title, author, abstract, keywords, category, file_path, publication_date, journal_name',
      )
      .eq('status', 'published')
      .order('publication_date', { ascending: false })
      .overrideTypes<PublicResearchPaper[], { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new PublicCatalogServiceError(
        'Published research papers could not be loaded. Please try again.',
      )
    }
    return data
  } catch (error: unknown) {
    if (error instanceof PublicCatalogServiceError) throw error
    throw new PublicCatalogServiceError(
      'Published research papers could not be loaded. Please try again.',
    )
  }
}

function getSafeStoragePath(path: string | null): string | null {
  const value = path?.trim()
  return value &&
    !value.startsWith('/') &&
    !value.includes('://') &&
    !value.split('/').some((segment) => segment === '..')
    ? value
    : null
}

function getPublicStorageUrl(
  bucket: 'books' | 'covers' | 'research-papers',
  path: string | null,
  download = false,
): string | null {
  const safePath = getSafeStoragePath(path)
  if (!publicSupabase || !safePath) return null

  const storage = publicSupabase.storage.from(bucket)
  return download
    ? storage.getPublicUrl(safePath, { download: true }).data.publicUrl
    : storage.getPublicUrl(safePath).data.publicUrl
}

export function getPublicBookCoverUrl(path: string | null): string | null {
  return getPublicStorageUrl('covers', path)
}

export function getPublicBookFileUrl(path: string | null): string | null {
  return getPublicStorageUrl('books', path)
}

export function getPublicBookDownloadUrl(path: string | null): string | null {
  return getPublicStorageUrl('books', path, true)
}

export function getPublicResearchPaperFileUrl(path: string | null): string | null {
  return getPublicStorageUrl('research-papers', path)
}

export function getPublicResearchPaperDownloadUrl(
  path: string | null,
): string | null {
  return getPublicStorageUrl('research-papers', path, true)
}
