/**
 * Notify Google when sitemap is updated (e.g., new blog post published)
 */
export async function pingGoogleSitemap(sitemapUrl: string = 'https://plumbersthatcare.com/sitemap.xml'): Promise<boolean> {
  try {
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    console.log(`[Sitemap] Pinging Google: ${pingUrl}`);
    
    const response = await fetch(pingUrl);
    
    if (response.ok) {
      console.log('[Sitemap] ✅ Google notified successfully');
      return true;
    } else {
      console.error(`[Sitemap] Google ping failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('[Sitemap] Error pinging Google:', error);
    return false;
  }
}

/**
 * Notify Bing when sitemap is updated
 */
export async function pingBingSitemap(sitemapUrl: string = 'https://plumbersthatcare.com/sitemap.xml'): Promise<boolean> {
  try {
    const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    console.log(`[Sitemap] Pinging Bing: ${pingUrl}`);
    
    const response = await fetch(pingUrl);
    
    if (response.ok) {
      console.log('[Sitemap] ✅ Bing notified successfully');
      return true;
    } else {
      console.error(`[Sitemap] Bing ping failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('[Sitemap] Error pinging Bing:', error);
    return false;
  }
}

/**
 * Ping all search engines about sitemap update
 */
export async function pingAllSearchEngines(sitemapUrl?: string): Promise<void> {
  console.log('[Sitemap] Notifying search engines of sitemap update...');
  
  await Promise.all([
    pingGoogleSitemap(sitemapUrl),
    pingBingSitemap(sitemapUrl),
  ]);
  
  console.log('[Sitemap] Search engine notifications complete');
}
