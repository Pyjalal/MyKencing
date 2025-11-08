/**
 * Error handling utilities to prevent error cascades and provide better user feedback
 */

/**
 * Safely handle async operations with automatic error logging
 * Prevents uncaught promise rejections from cascading
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${context || 'safeAsync'}] Error:`, errorMessage);
    return fallback;
  }
}

/**
 * Wrap a function to catch and log errors without throwing
 * Useful for event handlers and callbacks
 */
export function safeCallback<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[${context || 'safeCallback'}] Error:`, errorMessage);
        });
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${context || 'safeCallback'}] Error:`, errorMessage);
    }
  }) as T;
}

/**
 * Log error with structured context
 * Useful for debugging and monitoring
 */
export function logError(error: unknown, context: string, metadata?: Record<string, any>): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${context}] Error:`, {
    message: errorMessage,
    stack: errorStack,
    metadata,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('api error') ||
      message.includes('connection')
    );
  }
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (isNetworkError(error)) {
      return 'Unable to connect. Please check your internet connection.';
    }

    // API errors
    if (error.message.includes('API error: 400')) {
      return 'Invalid data. Please try again.';
    }
    if (error.message.includes('API error: 404')) {
      return 'Medicine information not found.';
    }
    if (error.message.includes('API error: 500')) {
      return 'Service temporarily unavailable. Please try again later.';
    }

    // Default to error message if it's user-friendly
    if (error.message && error.message.length < 100) {
      return error.message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Retry an operation with exponential backoff
 * Useful for transient failures like network issues
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  context?: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Don't retry on 400 errors (bad request)
      if (errorMessage.includes('API error: 400')) {
        throw error;
      }

      // Don't retry on validation errors
      if (errorMessage.includes('Invalid') || errorMessage.includes('validation')) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(
          `[${context || 'retryWithBackoff'}] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
