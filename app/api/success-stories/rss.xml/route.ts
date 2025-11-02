import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const stories = await storage.getApprovedSuccessStories();
    const baseUrl = 'https://www.plumbersthatcare.com';

    // Build RSS XML from customer success stories
    const rssItems = stories.slice(0, 20).map(story => {
      const pubDate = new Date(story.submittedAt).toUTCString();
      
      // Use pre-generated JPEG version for RSS feed
      let imageUrl = `${baseUrl}/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg`; // Default fallback
      
      if (story.jpegCollagePhotoUrl) {
        // Use the pre-generated JPEG version (created at approval)
        imageUrl = story.jpegCollagePhotoUrl.startsWith('http') 
          ? story.jpegCollagePhotoUrl 
          : `${baseUrl}${story.jpegCollagePhotoUrl}`;
      } else if (story.collagePhotoUrl) {
        // Fallback: use collagePhotoUrl if no JPEG version exists (for old stories)
        imageUrl = story.collagePhotoUrl.startsWith('http') 
          ? story.collagePhotoUrl 
          : `${baseUrl}${story.collagePhotoUrl}`;
      }
      
      return `
    <item>
      <title><![CDATA[${story.customerName} - ${story.serviceCategory}]]></title>
      <link>${baseUrl}/success-stories</link>
      <guid isPermaLink="false">${story.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${story.serviceCategory}</category>
      <description><![CDATA[
        <img src="${imageUrl}" alt="${story.customerName} success story" style="max-width: 100%;" />
        <p><strong>${story.location}</strong></p>
        <p>${story.story}</p>
      ]]></description>
      <enclosure url="${imageUrl}" type="image/jpeg" />
    </item>`;
    }).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Economy Plumbing Services - Success Stories</title>
    <link>${baseUrl}/success-stories</link>
    <description>Real customer testimonials and before/after photos from our plumbing projects in Austin and Marble Falls. Water heater installations, leak repairs, drain cleaning, and more.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/api/success-stories/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error("[Success Stories RSS] Error generating RSS feed:", error);
    return NextResponse.json(
      { error: "Failed to generate RSS feed" },
      { status: 500 }
    );
  }
}
