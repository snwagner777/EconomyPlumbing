import type { BeforeAfterComposite, InsertBeforeAfterComposite } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

interface FacebookPageInfo {
  id: string;
  accessToken: string;
}

interface InstagramBusinessAccount {
  id: string;
}

/**
 * Facebook/Instagram Social Media Poster using Meta Graph API
 */
export class SocialMediaPoster {
  private facebookAccessToken: string;
  private facebookPageId: string;
  private instagramBusinessAccountId: string | null;

  constructor() {
    this.facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN || '';
    this.facebookPageId = process.env.FACEBOOK_PAGE_ID || '';
    this.instagramBusinessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || null;
  }

  /**
   * Get Instagram Business Account ID from Facebook Page
   */
  async getInstagramBusinessAccount(): Promise<string | null> {
    if (this.instagramBusinessAccountId) {
      return this.instagramBusinessAccountId;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.facebookPageId}?fields=instagram_business_account&access_token=${this.facebookAccessToken}`
      );

      if (!response.ok) {
        console.error('[Social Media] Failed to get Instagram account:', await response.text());
        return null;
      }

      const data = await response.json();
      this.instagramBusinessAccountId = data.instagram_business_account?.id || null;
      return this.instagramBusinessAccountId;
    } catch (error) {
      console.error('[Social Media] Error getting Instagram account:', error);
      return null;
    }
  }

  /**
   * Upload photo to Facebook Page
   */
  async postToFacebook(imageUrl: string, caption: string): Promise<string | null> {
    if (!this.facebookAccessToken || !this.facebookPageId) {
      console.error('[Social Media] Facebook credentials not configured');
      return null;
    }

    try {
      console.log(`[Social Media] Posting to Facebook...`);

      // For local images, we need to upload them
      // For remote images, we can use the URL directly
      const isLocal = imageUrl.startsWith('/');

      let photoUrl = imageUrl;
      if (isLocal) {
        // Convert local path to full URL (assumes running on Replit)
        const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER 
          ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
          : 'http://localhost:5000';
        photoUrl = `${replitDomain}${imageUrl}`;
      }

      // Post photo to Facebook Page
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.facebookPageId}/photos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: photoUrl,
            caption: caption,
            access_token: this.facebookAccessToken,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Social Media] Facebook post failed:', error);
        return null;
      }

      const data = await response.json();
      console.log(`[Social Media] ✅ Posted to Facebook: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('[Social Media] Error posting to Facebook:', error);
      return null;
    }
  }

  /**
   * Post photo to Instagram (requires Instagram Business Account)
   */
  async postToInstagram(imageUrl: string, caption: string): Promise<string | null> {
    const igAccountId = await this.getInstagramBusinessAccount();
    
    if (!igAccountId) {
      console.error('[Social Media] Instagram Business Account not configured');
      return null;
    }

    try {
      console.log(`[Social Media] Posting to Instagram...`);

      // Convert local path to full URL
      const isLocal = imageUrl.startsWith('/');
      let photoUrl = imageUrl;
      if (isLocal) {
        const replitDomain = process.env.REPL_SLUG && process.env.REPL_OWNER 
          ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
          : 'http://localhost:5000';
        photoUrl = `${replitDomain}${imageUrl}`;
      }

      // Step 1: Create media container
      const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: photoUrl,
            caption: caption,
            access_token: this.facebookAccessToken,
          }),
        }
      );

      if (!containerResponse.ok) {
        const error = await containerResponse.text();
        console.error('[Social Media] Instagram container creation failed:', error);
        return null;
      }

      const containerData = await containerResponse.json();
      const creationId = containerData.id;

      // Step 2: Publish the media container
      // Wait a few seconds for Instagram to process the image
      await new Promise(resolve => setTimeout(resolve, 5000));

      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: this.facebookAccessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        const error = await publishResponse.text();
        console.error('[Social Media] Instagram publish failed:', error);
        return null;
      }

      const publishData = await publishResponse.json();
      console.log(`[Social Media] ✅ Posted to Instagram: ${publishData.id}`);
      return publishData.id;
    } catch (error) {
      console.error('[Social Media] Error posting to Instagram:', error);
      return null;
    }
  }

  /**
   * Post to both Facebook and Instagram
   */
  async postToAll(imageUrl: string, caption: string): Promise<{
    facebookPostId: string | null;
    instagramPostId: string | null;
  }> {
    const [facebookPostId, instagramPostId] = await Promise.all([
      this.postToFacebook(imageUrl, caption),
      this.postToInstagram(imageUrl, caption),
    ]);

    return { facebookPostId, instagramPostId };
  }
}

/**
 * Post a before/after composite to social media
 */
export async function postCompositeToSocialMedia(
  composite: BeforeAfterComposite
): Promise<{
  facebookPostId: string | null;
  instagramPostId: string | null;
}> {
  const poster = new SocialMediaPoster();
  const caption = composite.caption || 'Before and after! Quality plumbing work. 📞';

  return await poster.postToAll(composite.compositeUrl, caption);
}
