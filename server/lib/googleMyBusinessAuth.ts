import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/business.manage'];

export class GoogleMyBusinessAuth {
  private oauth2Client: OAuth2Client;
  private static instance: GoogleMyBusinessAuth;

  private constructor() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:5000/api/oauth/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Missing Google OAuth credentials');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  static getInstance(): GoogleMyBusinessAuth {
    if (!GoogleMyBusinessAuth.instance) {
      GoogleMyBusinessAuth.instance = new GoogleMyBusinessAuth();
    }
    return GoogleMyBusinessAuth.instance;
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  async getTokenFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials;
  }

  getClient(): OAuth2Client {
    return this.oauth2Client;
  }

  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }
}
