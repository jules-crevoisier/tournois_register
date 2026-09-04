import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Sentry Webhook Integration
 *
 * This endpoint receives webhooks from Sentry when errors are captured.
 * It creates Paperclip issues automatically for monitoring and tracking.
 *
 * Setup in Sentry:
 * 1. Go to Settings > Integrations > Internal Integrations
 * 2. Create a new integration with the Webhook URL
 * 3. Enable "issue" alert triggers
 * 4. Copy the Client Secret to SENTRY_WEBHOOK_SECRET
 *
 * @see https://docs.sentry.io/product/integrations/integration-platform/webhooks/
 */

interface SentryIssueData {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  permalink: string;
  logger: string | null;
  level: string;
  status: string;
  metadata: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
  };
  project: {
    id: string;
    name: string;
    slug: string;
    platform: string;
  };
}

interface SentryWebhookPayload {
  action: string;
  installation: {
    uuid: string;
  };
  data: {
    issue?: SentryIssueData;
    error?: {
      title: string;
      web_url: string;
    };
  };
  actor: {
    type: string;
    id?: string;
    name: string;
  };
}

function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

async function createPaperclipIssue(
  sentryIssue: SentryIssueData
): Promise<{ success: boolean; issueId?: string; error?: string }> {
  const paperclipApiUrl = process.env.PAPERCLIP_API_URL;
  const paperclipApiKey = process.env.PAPERCLIP_WEBHOOK_API_KEY;
  const paperclipCompanyId = process.env.PAPERCLIP_COMPANY_ID;
  const paperclipProjectId = process.env.PAPERCLIP_PROJECT_ID;

  if (!paperclipApiUrl || !paperclipApiKey || !paperclipCompanyId) {
    return { success: false, error: 'Paperclip configuration missing' };
  }

  const baseUrl = paperclipApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  const issuePayload = {
    title: `[Sentry] ${sentryIssue.title}`,
    description: `## Error Details

**Error:** ${sentryIssue.metadata.type || 'Unknown'}: ${sentryIssue.metadata.value || sentryIssue.title}
**Level:** ${sentryIssue.level}
**Project:** ${sentryIssue.project.name}
**Status:** ${sentryIssue.status}

### Location
- **File:** ${sentryIssue.metadata.filename || 'N/A'}
- **Function:** ${sentryIssue.metadata.function || 'N/A'}
- **Culprit:** ${sentryIssue.culprit}

### Links
- [View in Sentry](${sentryIssue.permalink})
- Sentry Issue ID: ${sentryIssue.shortId}

---
*This issue was created automatically from Sentry webhook*`,
    priority: sentryIssue.level === 'fatal' || sentryIssue.level === 'error' ? 'high' : 'medium',
    status: 'todo',
    ...(paperclipProjectId && { projectId: paperclipProjectId }),
  };

  try {
    const response = await fetch(`${baseUrl}/api/companies/${paperclipCompanyId}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${paperclipApiKey}`,
      },
      body: JSON.stringify(issuePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Paperclip API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return { success: true, issueId: result.identifier || result.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(request: NextRequest) {
  const sentrySecret = process.env.SENTRY_WEBHOOK_SECRET;

  // Get raw body for signature verification
  const rawBody = await request.text();

  // Verify webhook signature if secret is configured
  if (sentrySecret) {
    const signature = request.headers.get('sentry-hook-signature');
    if (!verifySignature(rawBody, signature, sentrySecret)) {
      console.error('[Sentry Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let payload: SentryWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[Sentry Webhook] Invalid JSON payload');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[Sentry Webhook] Received:', {
    action: payload.action,
    hasIssue: !!payload.data?.issue,
  });

  // Handle different webhook actions
  // We primarily care about "triggered" (new issue alert) and "created" (new issue)
  if (payload.action === 'triggered' || payload.action === 'created') {
    const issueData = payload.data?.issue;
    if (!issueData) {
      console.log('[Sentry Webhook] No issue data in payload');
      return NextResponse.json({ status: 'ok', message: 'No issue data' });
    }

    // Skip if issue is already resolved or ignored
    if (issueData.status === 'resolved' || issueData.status === 'ignored') {
      console.log('[Sentry Webhook] Issue already resolved/ignored, skipping');
      return NextResponse.json({ status: 'ok', message: 'Issue resolved/ignored' });
    }

    const result = await createPaperclipIssue(issueData);

    if (result.success) {
      console.log('[Sentry Webhook] Paperclip issue created:', result.issueId);
      return NextResponse.json({
        status: 'ok',
        paperclipIssueId: result.issueId,
      });
    } else {
      console.error('[Sentry Webhook] Failed to create Paperclip issue:', result.error);
      return NextResponse.json({
        status: 'error',
        error: result.error,
      }, { status: 500 });
    }
  }

  // For other actions (resolved, assigned, etc.), just acknowledge
  return NextResponse.json({ status: 'ok', action: payload.action });
}

// Sentry sends OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, sentry-hook-signature',
    },
  });
}
