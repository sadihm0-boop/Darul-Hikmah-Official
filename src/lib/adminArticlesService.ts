import { supabase } from './supabaseClient'
import type {
  AdminArticleReviewMetadata,
  ArticleStatus,
} from './authorArticlesService'

export interface AdminArticle {
  id: string
  title: string
  author: string | null
  content: string | null
  excerpt: string | null
  category: string | null
  cover_path: string | null
  status: ArticleStatus
  created_at: string | null
  updated_at: string | null
}

export type AdminArticleAction =
  | 'publish'
  | 'request_revision'
  | 'reject'
  | 'archive'

export class AdminArticlesServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminArticlesServiceError'
  }
}

const adminArticleColumns =
  'id, title, author, content, excerpt, category, cover_path, status, created_at, updated_at'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readNullableString(value: unknown, field: string): string | null {
  if (value === null) return null
  if (typeof value !== 'string') {
    throw new AdminArticlesServiceError(
      `The article review response did not contain a valid ${field}.`,
    )
  }
  return value
}

function requireClient() {
  if (!supabase) {
    throw new AdminArticlesServiceError(
      'Articles are unavailable because Supabase is not configured.',
    )
  }
  return supabase
}

export async function getAdminArticles(): Promise<AdminArticle[]> {
  const client = requireClient()

  try {
    const { data, error } = await client
      .from('articles')
      .select(adminArticleColumns)
      .order('updated_at', { ascending: false })
      .overrideTypes<AdminArticle[], { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new AdminArticlesServiceError(
        'Articles could not be loaded. Please try again.',
      )
    }
    return data
  } catch (error: unknown) {
    if (error instanceof AdminArticlesServiceError) throw error
    throw new AdminArticlesServiceError(
      'Articles could not be loaded. Confirm administrator access and try again.',
    )
  }
}

export async function getAdminArticleReviewMetadata(
  articleId: string,
): Promise<AdminArticleReviewMetadata> {
  const client = requireClient()

  try {
    const { data, error } = await client.rpc('get_article_review_metadata', {
      p_article_id: articleId,
    })

    if (error) throw error
    if (!isRecord(data)) {
      throw new AdminArticlesServiceError(
        'Review metadata was not returned for this article. Please try again.',
      )
    }

    return {
      review_note: readNullableString(data.review_note, 'review note'),
      reviewed_at: readNullableString(data.reviewed_at, 'review date'),
      reviewed_by: readNullableString(data.reviewed_by, 'reviewer ID'),
    }
  } catch (error: unknown) {
    if (error instanceof AdminArticlesServiceError) throw error
    throw new AdminArticlesServiceError(
      'Review metadata could not be loaded. Confirm administrator access and try again.',
    )
  }
}

export async function transitionAdminArticle(
  articleId: string,
  action: AdminArticleAction,
  reviewNote: string | null,
): Promise<void> {
  const client = requireClient()

  try {
    const { data, error } = await client.rpc('admin_transition_article', {
      p_article_id: articleId,
      p_action: action,
      p_review_note: reviewNote,
    })

    if (error) throw error
    if (data !== articleId) {
      throw new AdminArticlesServiceError(
        'The article action was not confirmed. Refresh the page and try again.',
      )
    }
  } catch (error: unknown) {
    if (error instanceof AdminArticlesServiceError) throw error
    throw new AdminArticlesServiceError(
      'The article action could not be completed. Confirm administrator access and try again.',
    )
  }
}
