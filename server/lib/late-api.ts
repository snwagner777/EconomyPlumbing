/**
 * Late API Client - Modular Social Media Integration
 * 
 * Reusable module for posting to social media via Late API.
 * Supports: Facebook, Instagram, LinkedIn, Twitter/X, Threads, TikTok, 
 *           YouTube, Pinterest, Reddit, Bluesky
 * 
 * Usage:
 * - Share reviews to social media
 * - Post blog articles
 * - Schedule promotional content
 * - Cross-post announcements
 * 
 * Documentation: docs/late-api/late-api-documentation.txt
 */

const LATE_API_BASE_URL = 'https://getlate.dev/api/v1';

export type LatePlatform = 
  | 'facebook' 
  | 'instagram' 
  | 'linkedin' 
  | 'twitter' 
  | 'threads' 
  | 'tiktok' 
  | 'youtube' 
  | 'pinterest' 
  | 'reddit' 
  | 'bluesky';

export interface LateMediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface LatePlatformPost {
  platform: LatePlatform;
  accountId: string;
  platformSpecificData?: {
    // Reddit
    subreddit?: string;
    url?: string;
    // Pinterest
    boardId?: string;
    title?: string;
    link?: string;
    coverImageUrl?: string;
    // Instagram
    altText?: string;
    // LinkedIn
    visibility?: 'PUBLIC' | 'CONNECTIONS';
  };
}

export interface LatePostRequest {
  content: string;
  platforms: LatePlatformPost[];
  mediaItems?: LateMediaItem[];
  scheduledFor?: string; // ISO 8601 timestamp
  profileId?: string; // Optional: associate with a Late profile
}

export interface LateProfile {
  _id: string;
  name: string;
  userId: string;
  createdAt: string;
  accounts?: LateAccount[];
}

export interface LateAccount {
  _id: string;
  platform: LatePlatform;
  username?: string;
  profileId: string;
  connectedAt: string;
}

/**
 * Late API Client
 */
class LateAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Late API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated request to Late API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${LATE_API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Late API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Create a post to one or multiple social media platforms
   */
  async createPost(post: LatePostRequest): Promise<{
    id: string;
    status: 'scheduled' | 'published' | 'failed';
    platforms: Array<{
      platform: LatePlatform;
      status: 'pending' | 'published' | 'failed';
      publishedUrl?: string;
      error?: string;
    }>;
  }> {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  /**
   * Get all profiles for the authenticated account
   */
  async getProfiles(): Promise<{ profiles: LateProfile[] }> {
    return this.request('/profiles');
  }

  /**
   * Get a specific profile by ID
   */
  async getProfile(profileId: string): Promise<LateProfile> {
    return this.request(`/profiles/${profileId}`);
  }

  /**
   * Create a new profile
   */
  async createProfile(name: string): Promise<LateProfile> {
    return this.request('/profiles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Get all social accounts for a profile
   */
  async getAccounts(profileId: string): Promise<{ accounts: LateAccount[] }> {
    return this.request(`/profiles/${profileId}/accounts`);
  }

  /**
   * Create a platform connection invite
   * Returns an invite URL to send to someone to connect their social account
   */
  async createPlatformInvite(
    profileId: string,
    platform: LatePlatform
  ): Promise<{
    invite: {
      _id: string;
      token: string;
      inviteUrl: string;
      expiresAt: string;
      platform: LatePlatform;
    };
  }> {
    return this.request('/platform-invites', {
      method: 'POST',
      body: JSON.stringify({ profileId, platform }),
    });
  }

  /**
   * Get all platform invites
   */
  async getPlatformInvites(profileId?: string): Promise<{
    invites: Array<{
      _id: string;
      token: string;
      platform: LatePlatform;
      inviteUrl: string;
      expiresAt: string;
      isUsed: boolean;
      createdAt: string;
    }>;
  }> {
    const query = profileId ? `?profileId=${profileId}` : '';
    return this.request(`/platform-invites${query}`);
  }

  /**
   * Revoke an unused platform invite
   */
  async revokePlatformInvite(inviteId: string): Promise<void> {
    await this.request(`/platform-invites?id=${inviteId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<{
    currentPeriod: {
      postsCreated: number;
      postsLimit: number;
      profilesCreated: number;
      profilesLimit: number;
    };
  }> {
    return this.request('/usage');
  }

  /**
   * Get post history
   */
  async getPosts(params?: {
    profileId?: string;
    status?: 'scheduled' | 'published' | 'failed';
    limit?: number;
    page?: number;
  }): Promise<{
    posts: Array<{
      id: string;
      content: string;
      scheduledFor?: string;
      publishedAt?: string;
      status: string;
      platforms: Array<{
        platform: LatePlatform;
        status: string;
        publishedUrl?: string;
      }>;
    }>;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.profileId) queryParams.set('profileId', params.profileId);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.page) queryParams.set('page', params.page.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/posts${query}`);
  }
}

/**
 * Get Late API client instance
 */
export function getLateAPI(): LateAPI {
  const apiKey = process.env.Late_API_Key;
  
  if (!apiKey) {
    throw new Error('Late_API_Key environment variable is not set');
  }

  return new LateAPI(apiKey);
}

/**
 * Helper: Share a review to social media
 */
export async function shareReviewToSocial(params: {
  reviewText: string;
  reviewerName: string;
  rating: number;
  platforms: Array<{
    platform: LatePlatform;
    accountId: string;
  }>;
  imageUrl?: string;
  scheduledFor?: string;
}): Promise<{
  id: string;
  status: string;
  platforms: Array<{
    platform: LatePlatform;
    status: string;
    publishedUrl?: string;
  }>;
}> {
  const lateAPI = getLateAPI();

  // Format review content
  const stars = '⭐'.repeat(params.rating);
  const content = `${stars}\n\n"${params.reviewText}"\n\n— ${params.reviewerName}\n\n#CustomerReview #PlumbingServices #LocalBusiness`;

  const post: LatePostRequest = {
    content,
    platforms: params.platforms.map(p => ({
      platform: p.platform,
      accountId: p.accountId,
    })),
    mediaItems: params.imageUrl ? [{
      type: 'image' as const,
      url: params.imageUrl,
    }] : undefined,
    scheduledFor: params.scheduledFor,
  };

  return lateAPI.createPost(post);
}

/**
 * Helper: Share a blog post to social media
 */
export async function shareBlogToSocial(params: {
  title: string;
  excerpt: string;
  url: string;
  platforms: Array<{
    platform: LatePlatform;
    accountId: string;
  }>;
  imageUrl?: string;
  scheduledFor?: string;
}): Promise<{
  id: string;
  status: string;
}> {
  const lateAPI = getLateAPI();

  const content = `${params.title}\n\n${params.excerpt}\n\nRead more: ${params.url}\n\n#PlumbingTips #HomeImprovement #LocalBusiness`;

  const post: LatePostRequest = {
    content,
    platforms: params.platforms.map(p => ({
      platform: p.platform,
      accountId: p.accountId,
    })),
    mediaItems: params.imageUrl ? [{
      type: 'image' as const,
      url: params.imageUrl,
    }] : undefined,
    scheduledFor: params.scheduledFor,
  };

  return lateAPI.createPost(post);
}
