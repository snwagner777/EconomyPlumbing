import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { generatedPlumbingImages } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch last 12 dog plumbing images
    const images = await db
      .select()
      .from(generatedPlumbingImages)
      .where(eq(generatedPlumbingImages.animalType, 'dog'))
      .orderBy(desc(generatedPlumbingImages.createdAt))
      .limit(12);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://plumbersthatcare.com';
    const feedUrl = `${baseUrl}/rss/dogs-plumbing.xml`;
    const pageUrl = `${baseUrl}/dogs-plumbing`;

    // Generate RSS 2.0 feed with Media RSS namespace
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:media="http://search.yahoo.com/mrss/" 
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Dogs Doing Plumbing - Economy Plumbing Services</title>
    <link>${pageUrl}</link>
    <description>AI-generated images of adorable dogs doing plumbing work. Just for fun from your friends at Economy Plumbing Services!</description>
    <language>en-us</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Economy Plumbing Services</generator>
${images.map((image, index) => `    <item>
      <title>Dog Plumber #${images.length - index}</title>
      <link>${pageUrl}</link>
      <guid isPermaLink="false">dog-plumber-${image.id}</guid>
      <pubDate>${new Date(image.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[
        <p>AI-generated image of a talented canine plumber at work!</p>
        <img src="${image.imageUrl}" alt="Dog doing plumbing work" />
      ]]></description>
      <enclosure url="${image.imageUrl}" type="image/jpeg" length="500000" />
      <media:content url="${image.imageUrl}" type="image/jpeg" medium="image" width="1024" height="1024" />
      <media:title>Dog Plumber #${images.length - index}</media:title>
      <media:description>AI-generated image of a dog doing professional plumbing work</media:description>
    </item>`).join('\n')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    console.error('[RSS Dogs Feed]', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
