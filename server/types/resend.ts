// Type definitions for Resend connection settings from Replit Connector API
export interface ResendConnectionSettings {
  items?: Array<{
    settings: {
      api_key: string;
      from_email: string;
    };
  }>;
}

export interface ResendCredentials {
  apiKey: string;
  fromEmail: string;
}
