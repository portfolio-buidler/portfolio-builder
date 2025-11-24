/**
 * Error Mapping Utility
 * 
 * Maps backend HTTP error responses to user-friendly error messages.
 * Handles specific status codes and extracts field-level errors when available.
 */

// Avoid importing AxiosError directly from 'axios' which may not be exported in some environments.

export interface BackendErrorDetail {
  detail?: string | { loc: string[]; msg: string; type: string }[]
  message?: string
}

export interface MappedError {
  message: string
  fieldErrors?: Record<string, string>
  retryAfter?: number // Seconds until retry is allowed (for 429 errors)
}

/**
 * Map backend error to user-friendly message
 * 
 * Status code mapping:
 * - 401 → "Invalid email or password" (login) or "Unauthorized" (other)
 * - 409 → "Email already registered"
 * - 422 → Field-specific validation errors
 * - 429 → "Too many requests. Please try again in X seconds" + retryAfter
 * - 500 → "An unexpected error occurred"
 * 
 * @param error - Axios error object from failed request
 * @param context - Context for better error messages ('login', 'register', 'upload', etc.)
 * @returns Mapped error with message and optional field errors
 */
export function mapBackendError(
  error: unknown,
  context?: 'login' | 'register' | 'upload' | 'general'
): MappedError {
  // Handle non-axios errors
  if (!isAxiosError(error)) {
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return { message: error.message }
    }
    return { message: 'An unexpected error occurred' }
  }

  const status = error.response?.status
  const data = error.response?.data as BackendErrorDetail | undefined

  // 401 Unauthorized
  if (status === 401) {
    if (context === 'login') {
      return { message: 'Invalid email or password' }
    }
    return { message: data?.detail as string || 'Unauthorized. Please log in again.' }
  }

  // 409 Conflict (duplicate email)
  if (status === 409) {
    if (context === 'register') {
      return { message: 'Email already registered. Please use a different email or log in.' }
    }
    return { message: data?.detail as string || 'A conflict occurred' }
  }

  // 422 Unprocessable Entity (validation errors)
  if (status === 422) {
    const fieldErrors = extractFieldErrors(data?.detail)
    if (Object.keys(fieldErrors).length > 0) {
      return {
        message: 'Please fix the following errors:',
        fieldErrors,
      }
    }
    return { message: data?.detail as string || 'Validation error' }
  }

  // 429 Too Many Requests
  if (status === 429) {
    const retryAfter = error.response?.headers?.['retry-after']
    const seconds =
      retryAfter != null
        ? (typeof retryAfter === 'number'
            ? retryAfter
            : parseInt(String(retryAfter), 10) || 60)
        : 60
    return {
      message: `Too many requests. Please try again in ${seconds} seconds.`,
      retryAfter: seconds,
    }
  }

  // 413 Payload Too Large (file upload)
  if (status === 413) {
    return { message: 'File is too large. Maximum size is 5MB.' }
  }

  // 415 Unsupported Media Type (file upload)
  if (status === 415) {
    return { message: 'Unsupported file type. Please upload PDF or DOCX.' }
  }

  // 500 Internal Server Error
  if (status === 500) {
    return { message: 'An unexpected error occurred. Please try again later.' }
  }

  // Network error (no response)
  if (!error.response) {
    return { message: 'Network error. Please check your connection and try again.' }
  }

  // Fallback
  return {
    message: data?.detail as string || data?.message || 'An error occurred',
  }
}

/**
 * Extract field-specific errors from FastAPI validation detail
 * 
 * FastAPI returns validation errors in this format:
 * {
 *   "detail": [
 *     { "loc": ["body", "email"], "msg": "Invalid email format", "type": "value_error" },
 *     { "loc": ["body", "password"], "msg": "String should have at least 8 characters", "type": "string_too_short" }
 *   ]
 * }
 * 
 * @param detail - Detail field from error response
 * @returns Object mapping field names to error messages
 */
function extractFieldErrors(
  detail: string | { loc: string[]; msg: string; type: string }[] | undefined
): Record<string, string> {
  if (!detail || typeof detail === 'string') {
    return {}
  }

  const fieldErrors: Record<string, string> = {}

  for (const err of detail) {
    // loc format: ["body", "fieldName"] or ["query", "page"]
    const fieldName = err.loc[err.loc.length - 1] // Get last element (field name)
    fieldErrors[fieldName] = err.msg
  }

  return fieldErrors
}

/**
 * Local Axios-like error type and type guard to check if an object is axios-like without
 * relying on the Axios package's type exports (which may vary by version).
 */
type AxiosLikeError = {
  isAxiosError?: boolean
  response?: {
    status?: number
    data?: BackendErrorDetail
    headers?: Record<string, string | number | undefined>
  }
}

function isAxiosError(error: unknown): error is AxiosLikeError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in (error as Record<string, unknown>)
}

/**
 * Hook for handling rate limit cooldowns with countdown timer
 * 
 * Usage:
 * ```typescript
 * const [cooldownSeconds, setCooldown] = useState(0)
 * 
 * // In error handler:
 * const mappedError = mapBackendError(err, 'login')
 * if (mappedError.retryAfter) {
 *   handleRateLimitError(mappedError.retryAfter, setCooldown)
 *   toast.error(mappedError.message)
 * }
 * 
 * // In render:
 * <button disabled={cooldownSeconds > 0 || isLoading}>
 *   {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Submit'}
 * </button>
 * ```
 * 
 * @param retryAfterSeconds - Seconds until retry allowed (from error.retryAfter)
 * @param setCooldown - State setter for cooldown countdown
 */
export function handleRateLimitError(
  retryAfterSeconds: number,
  setCooldown: React.Dispatch<React.SetStateAction<number>>
): void {
  setCooldown(retryAfterSeconds)
  
  const interval = setInterval(() => {
    setCooldown((prev: number) => {
      if (prev <= 1) {
        clearInterval(interval)
        return 0
      }
      return prev - 1
    })
  }, 1000)
}

