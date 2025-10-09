/**
 * Automated Blog Generation System
 * 
 * Runs weekly to check for unused photos and automatically generates
 * blog posts scheduled 1 per week indefinitely into the future
 */

import type { IStorage } from '../storage';

const CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
const MIN_PHOTOS_THRESHOLD = 10; // Minimum photos needed to trigger generation
const POSTS_TO_GENERATE = 20; // Generate 20 posts at a time (20 weeks of content)

// Concurrency control - prevent overlapping runs
let isGenerating = false;

export async function startAutoBlogGeneration(storage: IStorage) {
  console.log('[Auto Blog Generator] Starting automated blog generation system...');
  console.log(`[Auto Blog Generator] Will check weekly for unused photos (every ${CHECK_INTERVAL / (24 * 60 * 60 * 1000)} days)`);
  
  // Run immediately on startup
  await checkAndGenerateBlogs(storage);
  
  // Then run weekly (await to prevent overlapping runs)
  setInterval(async () => {
    await checkAndGenerateBlogs(storage);
  }, CHECK_INTERVAL);
}

async function checkAndGenerateBlogs(storage: IStorage) {
  // Prevent concurrent runs
  if (isGenerating) {
    console.log('[Auto Blog Generator] Already generating blogs, skipping this run...');
    return;
  }
  
  isGenerating = true;
  
  try {
    console.log('[Auto Blog Generator] Checking for unused photos...');
    
    // Get unused photos
    const unusedPhotos = await storage.getPhotosWithoutBlogTopic();
    
    console.log(`[Auto Blog Generator] Found ${unusedPhotos.length} unused photos`);
    
    // Only generate if we have enough photos
    if (unusedPhotos.length < MIN_PHOTOS_THRESHOLD) {
      console.log(`[Auto Blog Generator] Not enough photos (${unusedPhotos.length} < ${MIN_PHOTOS_THRESHOLD}). Skipping generation.`);
      return;
    }
    
    console.log(`[Auto Blog Generator] Generating ${POSTS_TO_GENERATE} blog posts scheduled 1 per week...`);
    
    // Import required functions
    const { suggestBlogTopic, generateBlogPost } = await import("./blogTopicAnalyzer");
    const { scheduleBlogs, formatScheduleForDb } = await import("./blogScheduler");
    const { processBlogImage } = await import("./blogImageProcessor");
    
    // Select photos to use
    const photosToUse = unusedPhotos.slice(0, Math.min(POSTS_TO_GENERATE, unusedPhotos.length));
    
    const blogTopicSuggestions = [];
    
    // Step 1: Analyze photos and suggest blog topics
    console.log(`[Auto Blog Generator] Analyzing ${photosToUse.length} photos for blog topics...`);
    for (const photo of photosToUse) {
      try {
        const topicSuggestion = await suggestBlogTopic(photo);
        await storage.updatePhotoWithBlogTopic(photo.id, topicSuggestion.title);
        blogTopicSuggestions.push({
          photo,
          topicSuggestion
        });
      } catch (error: any) {
        console.error(`[Auto Blog Generator] Error suggesting topic for photo ${photo.id}:`, error.message);
      }
    }
    
    console.log(`[Auto Blog Generator] Generated ${blogTopicSuggestions.length} topic suggestions`);
    
    // Step 2: Generate blog posts from topics
    const generatedBlogs = [];
    for (const { photo, topicSuggestion } of blogTopicSuggestions) {
      try {
        const blogPost = await generateBlogPost(photo, topicSuggestion);
        generatedBlogs.push({
          ...blogPost,
          photoId: photo.id,
          topicSuggestion
        });
      } catch (error: any) {
        console.error(`[Auto Blog Generator] Error generating blog for topic "${topicSuggestion.title}":`, error.message);
      }
    }
    
    console.log(`[Auto Blog Generator] Generated ${generatedBlogs.length} blog posts`);
    
    // Step 3: Schedule blog posts (1 per week, indefinitely)
    // 20% backdated (3-6 months ago), 80% scheduled for future (1 per week)
    const scheduledBlogs = scheduleBlogs(generatedBlogs, {
      totalPosts: generatedBlogs.length,
      startDate: new Date(),
      postsPerWeek: 1,
      backdatePercentage: 0.2 // 20% backdated, 80% future (1 per week)
    });
    
    // Step 4: Save to database
    let savedCount = 0;
    for (const scheduledBlog of scheduledBlogs) {
      try {
        const scheduleData = formatScheduleForDb(scheduledBlog);
        
        // Get photo and process image for proper cropping
        let featuredImage = null;
        if (scheduledBlog.photoId) {
          const photo = await storage.getPhotoById(scheduledBlog.photoId);
          if (photo?.photoUrl) {
            featuredImage = await processBlogImage(photo.photoUrl, scheduledBlog.title);
          }
        }
        
        const saved = await storage.createBlogPost({
          title: scheduledBlog.title,
          slug: scheduledBlog.slug,
          content: scheduledBlog.content,
          excerpt: scheduledBlog.excerpt,
          metaDescription: scheduledBlog.metaDescription,
          category: scheduledBlog.category,
          featuredImage,
          author: "Economy Plumbing",
          published: true,
        });
        
        // Update blog post with schedule data
        await storage.updateBlogPost(saved.id, {
          ...scheduleData as any,
        });
        
        // Mark photo as used
        if (scheduledBlog.photoId) {
          await storage.markPhotoAsUsed(scheduledBlog.photoId, saved.id);
        }
        
        savedCount++;
      } catch (error: any) {
        console.error(`[Auto Blog Generator] Error saving blog "${scheduledBlog.title}":`, error.message);
      }
    }
    
    console.log(`[Auto Blog Generator] ✅ Successfully generated and scheduled ${savedCount} blog posts (1 per week for next ${savedCount} weeks)`);
    
  } catch (error: any) {
    console.error('[Auto Blog Generator] Error in automated blog generation:', error.message);
  } finally {
    isGenerating = false;
  }
}

// Manual trigger function for testing
export async function manuallyGenerateBlogs(storage: IStorage) {
  console.log('[Auto Blog Generator] Manual trigger initiated...');
  await checkAndGenerateBlogs(storage);
}
