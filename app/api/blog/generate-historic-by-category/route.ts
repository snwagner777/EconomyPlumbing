import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { db } from '@/server/db';
import { blogPosts } from '@shared/schema';
import { ObjectStorageService } from '@/server/objectStorage';
import { generateH1FromTitle } from '@/server/lib/generateH1';

export async function POST(req: NextRequest) {
  try {
    const { category, postsPerCategory = 9 } = await req.json();
    
    console.log(`[Historic Blog Generation] Starting generation of ${postsPerCategory} posts per category...`);
    
    // Get all blog categories from database
    const categoryResult = await db.select({ category: blogPosts.category })
      .from(blogPosts)
      .groupBy(blogPosts.category);
    
    const categories = categoryResult.map(r => r.category);
    console.log(`[Historic Blog Generation] Found ${categories.length} categories:`, categories);
    
    // Filter to specific category if provided
    const targetCategories = category ? [category] : categories;
    
    const { suggestBlogTopic, generateBlogPost } = await import("@/server/lib/blogTopicAnalyzer");
    
    const allGeneratedBlogs = [];
    
    for (const targetCategory of targetCategories) {
      console.log(`[Historic Blog Generation] Processing category: ${targetCategory}`);
      
      // Get available photos for this category
      const photos = await storage.getPhotosWithoutBlogTopic();
      const categoryPhotos = photos.filter(p => {
        const photoCategory = p.category?.toLowerCase() || '';
        const targetCat = targetCategory.toLowerCase();
        
        // Match by category name
        return photoCategory.includes(targetCat.replace(/\s+/g, '_')) || 
               targetCat.includes(photoCategory.replace(/\s+/g, '_'));
      });
      
      console.log(`[Historic Blog Generation] Found ${categoryPhotos.length} unused photos for ${targetCategory}`);
      
      if (categoryPhotos.length === 0) {
        console.warn(`[Historic Blog Generation] No photos available for ${targetCategory}, skipping...`);
        continue;
      }
      
      // Use up to postsPerCategory photos
      const photosToUse = categoryPhotos.slice(0, Math.min(postsPerCategory, categoryPhotos.length));
      
      // Generate blog posts
      for (const photo of photosToUse) {
        try {
          // Step 1: Suggest blog topic (same params as before: gpt-4o, temp 0.8)
          const topicSuggestion = await suggestBlogTopic(photo);
          await storage.updatePhotoWithBlogTopic(photo.id, topicSuggestion.title);
          
          // Step 2: Generate blog post (same params: gpt-4o, temp 0.9)
          const blogPost = await generateBlogPost(photo, topicSuggestion);
          
          // Step 3: Create historic date (1-3 years ago, random)
          const now = new Date();
          const minDaysAgo = 365; // 1 year ago minimum
          const maxDaysAgo = 1095; // 3 years ago maximum
          const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo) + minDaysAgo);
          const publishDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          
          // Step 4: Process image with smart crop (16:9 @ 1200x675)
          let featuredImage = null;
          let jpegFeaturedImage = null;
          if (photo.photoUrl) {
            try {
              console.log(`[Historic Blog Generation] Processing image for: ${blogPost.title}`);
              const { processBlogImage } = await import('@/server/lib/blogImageProcessor');
              const processedImage = await processBlogImage(photo.photoUrl, blogPost.title);
              featuredImage = processedImage.imagePath;
              jpegFeaturedImage = processedImage.jpegImagePath;
              console.log(`[Historic Blog Generation] Cropped images saved - WebP: ${featuredImage}, JPEG: ${jpegFeaturedImage}`);
            } catch (imageError) {
              console.error(`[Historic Blog Generation] ⚠️ Image processing failed, attempting simple conversion:`, imageError);
              // Fallback: Convert WebP to JPEG without cropping
              try {
                const sharpLib = (await import("sharp")).default;
                const objectStorage = new ObjectStorageService();
                
                // Download WebP image
                const webpBuffer = await objectStorage.downloadBuffer(photo.photoUrl);
                if (webpBuffer) {
                  // Convert to JPEG
                  const jpegBuffer = await sharpLib(webpBuffer)
                    .jpeg({ quality: 90 })
                    .toBuffer();
                  
                  // Upload JPEG with same path but .jpg extension
                  const jpegPath = photo.photoUrl.replace(/\.webp$/i, '.jpg');
                  await objectStorage.uploadBuffer(jpegBuffer, jpegPath, 'image/jpeg');
                  
                  featuredImage = photo.photoUrl;
                  jpegFeaturedImage = jpegPath;
                  console.log(`[Historic Blog Generation] ✅ Fallback JPEG created: ${jpegPath}`);
                } else {
                  // Last resort: use WebP for both (RSS readers may support it)
                  featuredImage = photo.photoUrl;
                  jpegFeaturedImage = photo.photoUrl;
                  console.warn(`[Historic Blog Generation] ⚠️ Using WebP for both formats`);
                }
              } catch (conversionError) {
                console.error(`[Historic Blog Generation] ❌ JPEG conversion failed:`, conversionError);
                // Last resort: use WebP for both
                featuredImage = photo.photoUrl;
                jpegFeaturedImage = photo.photoUrl;
              }
            }
          }
          
          // Step 5: Save to database
          const saved = await storage.createBlogPost({
            title: blogPost.title,
            slug: blogPost.slug,
            content: blogPost.content,
            excerpt: blogPost.excerpt,
            metaDescription: blogPost.metaDescription,
            category: blogPost.category,
            featuredImage,
            jpegFeaturedImage,
            author: "Economy Plumbing",
            published: true,
            h1: generateH1FromTitle(blogPost.title),
          });
          
          // Update with historic date and metadata
          await storage.updateBlogPost(saved.id, {
            publishDate,
            imageId: photo.id,
            generatedByAI: true,
          } as any);
          
          // Mark photo as used
          await storage.markPhotoAsUsed(photo.id, saved.id);
          
          allGeneratedBlogs.push({
            ...saved,
            publishDate,
            category: targetCategory
          });
          
          console.log(`[Historic Blog Generation] ✅ Created: "${blogPost.title}" (${targetCategory}, ${publishDate.toISOString().split('T')[0]})`);
        } catch (error: any) {
          console.error(`[Historic Blog Generation] Error generating blog for photo ${photo.id}:`, error);
        }
      }
    }
    
    console.log(`[Historic Blog Generation] Successfully generated ${allGeneratedBlogs.length} historic blog posts`);
    
    // Group by category for response
    const blogsByCategory: Record<string, any[]> = {};
    for (const blog of allGeneratedBlogs) {
      if (!blogsByCategory[blog.category]) {
        blogsByCategory[blog.category] = [];
      }
      blogsByCategory[blog.category].push({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        publishDate: blog.publishDate,
        excerpt: blog.excerpt
      });
    }
    
    return NextResponse.json({
      success: true,
      generated: allGeneratedBlogs.length,
      categories: Object.keys(blogsByCategory).length,
      blogsByCategory,
      message: `Successfully generated ${allGeneratedBlogs.length} historic blog posts across ${Object.keys(blogsByCategory).length} categories`
    });
  } catch (error: any) {
    console.error("[Historic Blog Generation] Error:", error);
    return NextResponse.json(
      {
        message: "Historic blog generation failed",
        error: error.message
      },
      { status: 500 }
    );
  }
}
