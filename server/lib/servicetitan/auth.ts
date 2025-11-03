/**
 * ServiceTitan OAuth 2.0 Client Credentials Authentication
 * 
 * Handles token acquisition, caching, and auto-refresh for ServiceTitan API access.
 * Uses client credentials flow with automatic token refresh before expiry.
 */

interface ServiceTitanToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt: number; // Timestamp when token expires
}

class ServiceTitanAuth {
  private token: ServiceTitanToken | null = null;
  private readonly tokenUrl = 'https://auth.servicetitan.io/connect/token';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tenantId: string;

  constructor() {
    this.clientId = process.env.SERVICETITAN_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICETITAN_CLIENT_SECRET || '';
    this.tenantId = process.env.SERVICETITAN_TENANT_ID || '';

    if (!this.clientId || !this.clientSecret || !this.tenantId) {
      throw new Error('ServiceTitan credentials not configured. Required: SERVICETITAN_CLIENT_ID, SERVICETITAN_CLIENT_SECRET, SERVICETITAN_TENANT_ID');
    }
  }

  /**
   * Get a valid access token, refreshing if needed
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this.token && this.token.expiresAt > Date.now() + 60000) {
      return this.token.access_token;
    }

    // Fetch new token
    await this.refreshToken();
    return this.token!.access_token;
  }

  /**
   * Request a new access token from ServiceTitan
   */
  private async refreshToken(): Promise<void> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ServiceTitan OAuth failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      this.token = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        expiresAt: Date.now() + (data.expires_in * 1000),
      };

      console.log(`[ServiceTitan Auth] Token refreshed, expires in ${data.expires_in}s`);
    } catch (error) {
      console.error('[ServiceTitan Auth] Failed to refresh token:', error);
      throw error;
    }
  }

  /**
   * Get the tenant ID for API requests
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Make an authenticated request to ServiceTitan API
   */
  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `https://api.servicetitan.io/${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ST-App-Key': this.clientId,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ServiceTitan API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }
}

// Singleton instance
export const serviceTitanAuth = new ServiceTitanAuth();
