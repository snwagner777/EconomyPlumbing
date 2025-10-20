/**
 * Zoom OAuth stub - Zoom Phone integration not currently configured
 * This file prevents import errors in sms.ts
 */

export function isZoomOAuthConfigured(): boolean {
  const hasClientId = !!process.env.ZOOM_CLIENT_ID;
  const hasClientSecret = !!process.env.ZOOM_CLIENT_SECRET;
  const hasAccountId = !!process.env.ZOOM_ACCOUNT_ID;
  
  return hasClientId && hasClientSecret && hasAccountId;
}

export async function getValidAccessToken(): Promise<string> {
  throw new Error('Zoom OAuth not fully implemented - use Twilio for SMS');
}
