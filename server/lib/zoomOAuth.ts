import type { ZoomOAuthToken } from "@shared/schema";
import { storage } from "../storage";

const CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const USER_ID = process.env.ZOOM_USER_ID;

// OAuth configuration
const REDIRECT_URI = process.env.NODE_ENV === 'production'
  ? 'https://economyplumbing.repl.co/api/zoom/oauth/callback'
  : 'http://localhost:5000/api/zoom/oauth/callback';

const SCOPES = [
  'phone_sms:write:admin',
  'phone_sms:read:admin',
  'phone:read:admin'
].join(' ');

/**
 * Get authorization URL for user to grant permissions
 */
export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
  });

  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<ZoomOAuthToken> {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Zoom OAuth] Token exchange failed:', error);
    throw new Error(`Failed to exchange authorization code: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('[Zoom OAuth] Token exchange successful');

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

  // Save to database
  const tokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    scope: data.scope,
    tokenType: data.token_type || 'bearer',
  };

  const savedToken = await storage.saveZoomOAuthToken(tokenData);
  return savedToken;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string, tokenId: string): Promise<ZoomOAuthToken> {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Zoom OAuth] Token refresh failed:', error);
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('[Zoom OAuth] Token refreshed successfully');

  // Calculate new expiration time
  const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

  // Update token in database
  const tokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep old one
    expiresAt,
    scope: data.scope,
    tokenType: data.token_type || 'bearer',
  };

  const updatedToken = await storage.updateZoomOAuthToken(tokenId, tokenData);
  return updatedToken;
}

/**
 * Get valid access token (refreshes if expired)
 */
export async function getValidAccessToken(): Promise<string> {
  const token = await storage.getZoomOAuthToken();

  if (!token) {
    throw new Error('No Zoom OAuth token found. Please authorize the application first.');
  }

  // Check if token is expired (with 5-minute buffer)
  const now = new Date();
  const expiryWithBuffer = new Date(token.expiresAt.getTime() - 5 * 60 * 1000);

  if (now >= expiryWithBuffer) {
    console.log('[Zoom OAuth] Token expired, refreshing...');
    const refreshedToken = await refreshAccessToken(token.refreshToken, token.id);
    return refreshedToken.accessToken;
  }

  return token.accessToken;
}

/**
 * Check if OAuth is configured
 */
export function isZoomOAuthConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && ACCOUNT_ID && USER_ID);
}
