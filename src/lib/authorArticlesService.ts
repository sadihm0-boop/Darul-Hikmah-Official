import { supabase } from './supabaseClient'

export type ArticleStatus =
  | 'draft'
  | 'pending_review'
  | 'revision_requested'
  | 'rejected'
  | 'published'
  | 'archived'

export interface Article {
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
  user_id: string
}

export type ArticleSummary = Omit<Article, 'content'>

export interface ArticleInput {
  title: string
  author?: string | null
  content: string
  excerpt?: string | null
  category?: string | null
  cover_path?: string | null
}

export type ArticleMutationResult = Pick<Article, 'id' | 'status'>

export interface ArticleReviewFeedback {
  review_note: string | null
  reviewed_at: string | null
}

export interface AdminArticleReviewMetadata extends ArticleReviewFeedback {
  reviewed_by: string | null
}

export type AuthorArticlesServiceErrorKind =
  | 'configuration'
  | 'authentication'
  | 'permission'
  | 'request'
  | 'validation'

export class AuthorArticlesServiceError extends Error {
  readonly kind: AuthorArticlesServiceErrorKind

  constructor(kind: AuthorArticlesServiceErrorKind, message: string) {
    super(message)
    this.name = 'AuthorArticlesServiceError'
    this.kind = kind
  }
}

const articleSummaryColumns =
  'id, title, author, excerpt, category, cover_path, status, created_at, updated_at, user_id'
const articleColumns =
  'id, title, author, content, excerpt, category, cover_path, status, created_at, updated_at, user_id'
const permissionErrorCodes = new Set(['403', '42501', 'PGRST301', 'PGRST302'])

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  if (
    'statusCode' in error &&
    (typeof error.statusCode === 'string' || typeof error.statusCode === 'number')
  ) {
    return String(error.statusCode)
  }
  if (
    'status' in error &&
    (typeof error.status === 'number' || typeof error.status === 'string')
  ) {
    return String(error.status)
  }
  if ('code' in error && typeof error.code === 'string') return error.code
  return undefined
}

function toServiceError(error: unknown): AuthorArticlesServiceError {
  if (error instanceof AuthorArticlesServiceError) return error

  return permissionErrorCodes.has(getErrorCode(error) ?? '')
    ? new AuthorArticlesServiceError(
        'permission',
        'You do not have permission to access this article. Confirm your author account access and try again.',
      )
    : new AuthorArticlesServiceError(
        'request',
        'The article operation could not be completed. Please try again.',
      )
}

function requireClient() {
  if (!supabase) {
    throw new AuthorArticlesServiceError(
      'configuration',
      'Articles are unavailable because Supabase is not configured.',
    )
  }
  return supabase
}

async function requireAuthenticatedClient() {
  const client = requireClient()
  const { data, error } = await client.auth.getUser()

  if (error) {
    if (getErrorCode(error) === '401') {
      throw new AuthorArticlesServiceError(
        'authentication',
        'Your author session could not be verified. Please sign in again.',
      )
    }
    throw toServiceError(error)
  }

  if (!data.user) {
    throw new AuthorArticlesServiceError(
      'authentication',
      'Sign in to access your articles.',
    )
  }

  return { client, userId: data.user.id }
}

function normalizeOptional(value: string | null | undefined): string | null {
  return value?.trim() || null
}

function requireTitle(title: string): void {
  if (!title.trim()) {
    throw new AuthorArticlesServiceError('validation', 'Enter an article title.')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readNullableString(value: unknown, field: string): string | null {
  if (value === null) return null
  if (typeof value !== 'string') {
    throw new AuthorArticlesServiceError(
      'request',
      `The article review response did not contain a valid ${field}.`,
    )
  }
  return value
}

export async function getMyArticles(): Promise<ArticleSummary[]> {
  const { client, userId } = await requireAuthenticatedClient()

  try {
    const { data, error } = await client
      .from('articles')
      .select(articleSummaryColumns)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .overrideTypes<ArticleSummary[], { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new AuthorArticlesServiceError(
        'request',
        'Your articles could not be loaded. Please try again.',
      )
    }
    return data
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

export async function getMyArticleReviewMetadata(
  articleId: string,
): Promise<ArticleReviewFeedback> {
  const { client } = await requireAuthenticatedClient()

  try {
    const { data, error } = await client.rpc('get_article_review_metadata', {
      p_article_id: articleId,
    })

    if (error) throw error
    if (!isRecord(data)) {
      throw new AuthorArticlesServiceError(
        'request',
        'Review feedback was not returned for this article. Please try again.',
      )
    }

    return {
      review_note: readNullableString(data.review_note, 'review note'),
      reviewed_at: readNullableString(data.reviewed_at, 'review date'),
    }
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

export async function getMyArticleById(articleId: string): Promise<Article> {
  const { client, userId } = await requireAuthenticatedClient()

  try {
    const { data, error } = await client
      .from('articles')
      .select(articleColumns)
      .eq('id', articleId)
      .eq('user_id', userId)
      .maybeSingle()
      .overrideTypes<Article | null, { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new AuthorArticlesServiceError(
        'request',
        'This article was not found or you are not authorized to access it.',
      )
    }
    return data
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

export async function createDraft(input: ArticleInput): Promise<ArticleMutationResult> {
  requireTitle(input.title)
  const { client, userId } = await requireAuthenticatedClient()

  try {
    const { data, error } = await client
      .from('articles')
      .insert({
        title: input.title.trim(),
        author: normalizeOptional(input.author),
        content: input.content,
        excerpt: normalizeOptional(input.excerpt),
        category: normalizeOptional(input.category),
        cover_path: normalizeOptional(input.cover_path),
        user_id: userId,
      })
      .select('id, status')
      .single()
      .overrideTypes<ArticleMutationResult, { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new AuthorArticlesServiceError(
        'request',
        'The draft was not returned after saving. Please refresh and try again.',
      )
    }
    return data
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

export async function updateDraft(
  articleId: string,
  input: ArticleInput,
): Promise<ArticleMutationResult> {
  requireTitle(input.title)
  const { client, userId } = await requireAuthenticatedClient()

  try {
    const { data, error } = await client
      .from('articles')
      .update({
        title: input.title.trim(),
        author: normalizeOptional(input.author),
        content: input.content,
        excerpt: normalizeOptional(input.excerpt),
        category: normalizeOptional(input.category),
        cover_path: normalizeOptional(input.cover_path),
      })
      .eq('id', articleId)
      .eq('user_id', userId)
      .in('status', ['draft', 'revision_requested'])
      .select('id, status')
      .maybeSingle()
      .overrideTypes<ArticleMutationResult | null, { merge: false }>()

    if (error) throw error
    if (!data) {
      throw new AuthorArticlesServiceError(
        'request',
        'This article was not found or is no longer editable by your account.',
      )
    }
    return data
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

export async function submitForReview(articleId: string): Promise<void> {
  const { client } = await requireAuthenticatedClient()

  try {
    const { error } = await client.rpc('submit_article_for_review', {
      p_article_id: articleId,
    })

    if (error) throw error
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}
