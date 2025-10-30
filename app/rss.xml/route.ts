import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const posts = await storage.getBlogPosts();
    const baseUrl = "https://www.plumbersthatcare.com";
    
    const rssItems = posts
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .map(post => {
        const postUrl = `${baseUrl}/${post.slug}`;
        
        // Use pre-generated JPEG version for RSS feed
        let imageUrl = `${baseUrl}/attached_assets/logo.jpg`; // Default fallback
        
        if (post.jpegFeaturedImage) {
          // Use the pre-generated JPEG version (created at blog post creation)
          imageUrl = post.jpegFeaturedImage.startsWith('http') 
            ? post.jpegFeaturedImage 
            : `${baseUrl}${post.jpegFeaturedImage}`;
        } else if (post.featuredImage) {
          // Fallback: use featuredImage if no JPEG version exists (for old posts)
          imageUrl = post.featuredImage.startsWith('http') 
            ? post.featuredImage 
            : `${baseUrl}${post.featuredImage}`;
        }
        
        // HTML-escape the title for safe use in attributes
        const escapedTitle = post.title
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        
        // Always use JPEG for RSS feed enclosures
        const imageType = 'image/jpeg';
        
        // Create content with image embedded for better RSS reader display
        const contentWithImage = post.featuredImage 
          ? `<img src="${imageUrl}" alt="${escapedTitle}" style="max-width: 100%; height: auto; margin-bottom: 1em;" /><br/>${post.content}`
          : post.content;
        
        const pubDate = new Date(post.publishDate).toUTCString();
        
        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="false">${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${post.category}</category>
      <description><![CDATA[${contentWithImage}]]></description>
      <enclosure url="${imageUrl}" length="0" type="${imageType}" />
    </item>`;
      }).join('');
    
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Economy Plumbing - Blog</title>
    <link>${baseUrl}</link>
    <description>Professional plumbing tips, news, and expert advice from Economy Plumbing</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, must-revalidate'
      }
    });
  } catch (error) {
    console.error('[RSS] Error generating RSS feed:', error);
    return NextResponse.json(
      { error: "Failed to generate RSS feed" },
      { status: 500 }
    );
  }
}
