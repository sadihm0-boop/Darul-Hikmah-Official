import { supabase } from './supabaseClient'

export interface AuthorDashboardData {
  fullName: string | null
  email: string | null
  totalArticles: number
  draftArticles: number
  pendingReviewArticles: number
  publishedArticles: number
}

export class AuthorDashboardServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorDashboardServiceError'
  }
}

interface AuthorProfileRecord {
  full_name: string | null
}

const permissionErrorCodes = new Set(['401', '403', '42501', 'PGRST301', 'PGRST302'])

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

function toDashboardError(error: unknown): AuthorDashboardServiceError {
  if (error instanceof AuthorDashboardServiceError) return error

  return new AuthorDashboardServiceError(
    permissionErrorCodes.has(getErrorCode(error) ?? '')
      ? 'You do not have permission to view this author dashboard. Confirm your author account access and try again.'
      : 'Your author profile and article statistics could not be loaded. Please try again.',
  )
}

function requireCount(count: number | null): number {
  if (count === null) {
    throw new AuthorDashboardServiceError(
      'Article statistics were not returned. Please refresh the dashboard.',
    )
  }
  return count
}

export async function getAuthorDashboardData(
  userId: string,
  email: string | null,
): Promise<AuthorDashboardData> {
  if (!supabase) {
    throw new AuthorDashboardServiceError(
      'The author dashboard is unavailable because Supabase is not configured.',
    )
  }

  try {
    const [profileResult, totalResult, draftResult, reviewResult, publishedResult] =
      await Promise.all([
        supabase
          .from('author_profiles')
          .select('full_name')
          .eq('user_id', userId)
          .maybeSingle()
          .overrideTypes<AuthorProfileRecord | null, { merge: false }>(),
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'draft'),
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'pending_review'),
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'published'),
      ])

    if (profileResult.error) throw profileResult.error

    const articleResults = [
      totalResult,
      draftResult,
      reviewResult,
      publishedResult,
    ]
    const failedResult = articleResults.find((result) => result.error)
    if (failedResult?.error) throw failedResult.error

    return {
      fullName: profileResult.data?.full_name ?? null,
      email,
      totalArticles: requireCount(totalResult.count),
      draftArticles: requireCount(draftResult.count),
      pendingReviewArticles: requireCount(reviewResult.count),
      publishedArticles: requireCount(publishedResult.count),
    }
  } catch (error: unknown) {
    throw toDashboardError(error)
  }
}
