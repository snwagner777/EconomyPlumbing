/**
 * Automated Blog Generation System
 * 
 * Runs once per week to check for unused photos and generates
 * blog posts with the current date (date when generated)
 */

import type { IStorage } from '../storage';
import { processBlogImage } from './blogImageProcessor';

const CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
const MIN_PHOTOS_THRESHOLD = 10; // Minimum photos needed to trigger generation
const POSTS_TO_GENERATE = 1; // Generate 1 post per week

// Concurrency control - prevent overlapping runs
let isGenerating = false;

export async function startAutoBlogGeneration(storage: IStorage) {
  console.log('[Auto Blog Generator] Starting automated blog generation system...');
  console.log(`[Auto Blog Generator] Will check weekly for unused photos (every ${CHECK_INTERVAL / (24 * 60 * 60 * 1000)} days)`);
  
  // DON'T run immediately on startup - let photos accumulate
  // Run weekly only (await to prevent overlapping runs)
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
    
    console.log(`[Auto Blog Generator] Generating 1 blog post with today's date...`);
    
    // Import required functions
    const { suggestBlogTopic, generateBlogPost } = await import("./blogTopicAnalyzer");
    
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
    
    // Step 3: Save to database with current date
    let savedCount = 0;
    const currentDate = new Date();
    
    for (const generatedBlog of generatedBlogs) {
      try {
        // Get photo and process image for proper cropping
        let featuredImage = null;
        let jpegFeaturedImage = null;
        let focalPointX = null;
        let focalPointY = null;
        
        if (generatedBlog.photoId) {
          const photo = await storage.getPhotoById(generatedBlog.photoId);
          if (photo?.photoUrl) {
            const imageData = await processBlogImage(photo.photoUrl, generatedBlog.title);
            featuredImage = imageData.imagePath;
            jpegFeaturedImage = imageData.jpegImagePath;
            focalPointX = imageData.focalPointX;
            focalPointY = imageData.focalPointY;
          }
        }
        
        const saved = await storage.createBlogPost({
          title: generatedBlog.title,
          slug: generatedBlog.slug,
          content: generatedBlog.content,
          excerpt: generatedBlog.excerpt,
          metaDescription: generatedBlog.metaDescription,
          category: generatedBlog.category,
          featuredImage,
          jpegFeaturedImage,
          focalPointX,
          focalPointY,
          author: "Economy Plumbing",
          published: true,
          isScheduled: false,
          scheduledFor: null,
          generatedByAI: true,
          imageId: generatedBlog.photoId || null
        });
        
        // Mark photo as used
        if (generatedBlog.photoId) {
          await storage.markPhotoAsUsed(generatedBlog.photoId, saved.id);
        }
        
        savedCount++;
      } catch (error: any) {
        console.error(`[Auto Blog Generator] Error saving blog "${generatedBlog.title}":`, error.message);
      }
    }
    
    console.log(`[Auto Blog Generator] ✅ Successfully generated ${savedCount} blog post(s) with today's date`);
    
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
