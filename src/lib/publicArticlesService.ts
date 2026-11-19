import { publicSupabase } from './supabaseClient'

export interface PublicArticleSummary {
  id: string
  title: string
  author: string | null
  excerpt: string | null
  category: string | null
  cover_path: string | null
  published_at: string | null
}

export interface PublicArticle extends PublicArticleSummary {
  content: string | null
}

export class PublicArticlesServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublicArticlesServiceError'
  }
}

const publicArticleSummaryColumns =
  'id, title, author, excerpt, category, cover_path, published_at'
const publicArticleColumns =
  'id, title, author, content, excerpt, category, cover_path, published_at'

function requireClient() {
  if (!publicSupabase) {
    throw new PublicArticlesServiceError(
      'Articles are unavailable because the public service is not configured.',
    )
  }
  return publicSupabase
}

export async function getPublicArticles(): Promise<PublicArticleSummary[]> {
  const client = requireClient()

  try {
    const { data, error } = await client
      .from('articles')
      .select(publicArticleSummaryColumns)
      .order('published_at', { ascending: false })
      .overrideTypes<PublicArticleSummary[], { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new PublicArticlesServiceError(
        'Published articles could not be loaded. Please try again.',
      )
    }
    return data
  } catch (error: unknown) {
    if (error instanceof PublicArticlesServiceError) throw error
    throw new PublicArticlesServiceError(
      'Published articles could not be loaded. Please try again.',
    )
  }
}

export async function getPublicArticleById(
  articleId: string,
): Promise<PublicArticle> {
  const client = requireClient()

  try {
    const { data, error } = await client
      .from('articles')
      .select(publicArticleColumns)
      .eq('id', articleId)
      .maybeSingle()
      .overrideTypes<PublicArticle | null, { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new PublicArticlesServiceError(
        'This article is unavailable or has not been published.',
      )
    }
    return data
  } catch (error: unknown) {
    if (error instanceof PublicArticlesServiceError) throw error
    throw new PublicArticlesServiceError(
      'The article could not be loaded. Please try again.',
    )
  }
}

export function getPublicArticleCoverUrl(
  coverPath: string | null,
): string | null {
  const value = coverPath?.trim()
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return url.toString()
    }
    return null
  } catch {
    if (value.startsWith('/') && !value.startsWith('//')) return value
    if (!publicSupabase) return null
    return publicSupabase.storage.from('covers').getPublicUrl(value).data.publicUrl
  }
}
