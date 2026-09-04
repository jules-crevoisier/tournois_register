/**
 * Next.js Instrumentation
 *
 * Initializes Sentry for error monitoring and captures server-side errors.
 * This file is loaded once when the Next.js server starts.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

import type { Instrumentation } from 'next';
import * as Sentry from '@sentry/nextjs';

/**
 * Called when the Next.js server starts.
 * Initializes Sentry for the appropriate runtime (Node.js or Edge).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
    console.log('[Instrumentation] Sentry server instrumentation registered');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
    console.log('[Instrumentation] Sentry edge instrumentation registered');
  }
}

/**
 * Paperclip error notification payload structure
 */
interface PaperclipErrorPayload {
  source: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  context: {
    routerKind: string;
    routeType: string;
    routePath: string;
    method: string;
    url: string;
    userAgent?: string;
    errorName?: string;
    errorStack?: string;
  };
}

/**
 * Send error notification to Paperclip API
 */
async function notifyPaperclip(payload: PaperclipErrorPayload): Promise<void> {
  const paperclipApiUrl = process.env.PAPERCLIP_LOG_ENDPOINT;
  const paperclipApiKey = process.env.PAPERCLIP_LOG_API_KEY;

  // Skip if Paperclip logging is not configured
  if (!paperclipApiUrl) {
    console.warn('[Instrumentation] PAPERCLIP_LOG_ENDPOINT not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(paperclipApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(paperclipApiKey && { 'Authorization': `Bearer ${paperclipApiKey}` }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Instrumentation] Failed to notify Paperclip: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Don't throw - we don't want error reporting to break the request
    console.error('[Instrumentation] Error sending notification to Paperclip:', error);
  }
}

/**
 * Called whenever an unhandled error is thrown on the server.
 * This includes errors from:
 * - Server Components rendering
 * - Route Handlers
 * - Server Actions
 * - Middleware
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation#onrequesterror-optional
 */
/**
 * Safely extract header value from request headers
 */
function getHeaderValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  key: string
): string | undefined {
  if (!headers) return undefined;
  const value = headers[key];
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  // Capture error with Sentry (primary monitoring)
  Sentry.captureException(error, {
    tags: {
      routerKind: context.routerKind,
      routeType: context.routeType,
    },
    extra: {
      routePath: context.routePath,
      method: request.method,
      url: request.path,
      userAgent: getHeaderValue(request.headers, 'user-agent'),
    },
  });

  // Also send to Paperclip if configured (legacy fallback)
  const payload: PaperclipErrorPayload = {
    source: 'next.js-server',
    level: 'error',
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
    context: {
      routerKind: context.routerKind,
      routeType: context.routeType,
      routePath: context.routePath,
      method: request.method,
      url: request.path,
      userAgent: getHeaderValue(request.headers, 'user-agent'),
      errorName: error instanceof Error ? error.name : undefined,
      errorStack: error instanceof Error ? error.stack : undefined,
    },
  };

  // Log locally for debugging
  console.error('[Instrumentation] Server error captured:', {
    message: payload.message,
    routePath: payload.context.routePath,
    routeType: payload.context.routeType,
  });

  // Send to Paperclip asynchronously if configured
  await notifyPaperclip(payload);
};
