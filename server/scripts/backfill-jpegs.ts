import { db } from '../db';
import { blogPosts, customerSuccessStories } from '@shared/schema';
import { isNull, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { ObjectStorageService } from '../objectStorage';

async function backfillBlogJpegs() {
  console.log('Starting blog post JPEG backfill...');
  
  const posts = await db
    .select()
    .from(blogPosts)
    .where(isNull(blogPosts.jpegFeaturedImage));
  
  console.log(`Found ${posts.length} blog posts without JPEG versions`);
  
  const objectStorage = new ObjectStorageService();
  const publicPaths = objectStorage.getPublicObjectSearchPaths();
  const publicPath = publicPaths[0];
  
  let successful = 0;
  let failed = 0;
  
  for (const post of posts) {
    if (!post.featuredImage) continue;
    
    try {
      // Handle both old format (/replit-objstore-xxx/public/...) and new format (/public-objects/...)
      let imagePath = post.featuredImage
        .replace(/^\/replit-objstore-[^/]+\/public\//, '')
        .replace(/^\/public-objects\//, '');
      const jpegPath = imagePath.replace(/\.webp$/, '.jpg');
      
      const existingJpeg = await objectStorage.searchPublicObject(jpegPath);
      if (existingJpeg) {
        await db
          .update(blogPosts)
          .set({ jpegFeaturedImage: `/public-objects/${jpegPath}` })
          .where(eq(blogPosts.id, post.id));
        successful++;
        console.log(`✓ Blog ${post.id}: JPEG already exists`);
        continue;
      }
      
      const webpFile = await objectStorage.searchPublicObject(imagePath);
      if (!webpFile) {
        throw new Error(`WebP file not found: ${imagePath}`);
      }
      
      const [webpBuffer] = await webpFile.download();
      const jpegBuffer = await sharp(webpBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      
      await objectStorage.uploadBuffer(jpegBuffer, `${publicPath}/${jpegPath}`, 'image/jpeg');
      
      await db
        .update(blogPosts)
        .set({ jpegFeaturedImage: `/public-objects/${jpegPath}` })
        .where(eq(blogPosts.id, post.id));
      
      successful++;
      console.log(`✓ Blog ${post.id}: Created JPEG`);
    } catch (error) {
      failed++;
      console.error(`✗ Blog ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log(`\nBlog backfill complete: ${successful} successful, ${failed} failed`);
}

async function backfillSuccessStoryJpegs() {
  console.log('\nStarting success story JPEG backfill...');
  
  const stories = await db
    .select()
    .from(customerSuccessStories)
    .where(isNull(customerSuccessStories.jpegCollagePhotoUrl));
  
  console.log(`Found ${stories.length} success stories without JPEG versions`);
  
  const objectStorage = new ObjectStorageService();
  const publicPaths = objectStorage.getPublicObjectSearchPaths();
  const publicPath = publicPaths[0];
  
  let successful = 0;
  let failed = 0;
  
  for (const story of stories) {
    if (!story.collagePhotoUrl) continue;
    
    try {
      // Handle both old format (/replit-objstore-xxx/public/...) and new format (/public-objects/...)
      let imagePath = story.collagePhotoUrl
        .replace(/^\/replit-objstore-[^/]+\/public\//, '')
        .replace(/^\/public-objects\//, '');
      const jpegPath = imagePath.replace(/\.webp$/, '.jpg');
      
      const existingJpeg = await objectStorage.searchPublicObject(jpegPath);
      if (existingJpeg) {
        await db
          .update(customerSuccessStories)
          .set({ jpegCollagePhotoUrl: `/public-objects/${jpegPath}` })
          .where(eq(customerSuccessStories.id, story.id));
        successful++;
        console.log(`✓ Story ${story.id}: JPEG already exists`);
        continue;
      }
      
      const webpFile = await objectStorage.searchPublicObject(imagePath);
      if (!webpFile) {
        throw new Error(`WebP file not found: ${imagePath}`);
      }
      
      const [webpBuffer] = await webpFile.download();
      const jpegBuffer = await sharp(webpBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      
      await objectStorage.uploadBuffer(jpegBuffer, `${publicPath}/${jpegPath}`, 'image/jpeg');
      
      await db
        .update(customerSuccessStories)
        .set({ jpegCollagePhotoUrl: `/public-objects/${jpegPath}` })
        .where(eq(customerSuccessStories.id, story.id));
      
      successful++;
      console.log(`✓ Story ${story.id}: Created JPEG`);
    } catch (error) {
      failed++;
      console.error(`✗ Story ${story.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log(`\nSuccess story backfill complete: ${successful} successful, ${failed} failed`);
}

async function main() {
  try {
    await backfillBlogJpegs();
    await backfillSuccessStoryJpegs();
    console.log('\n✅ All backfill operations complete');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
