import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { suggestBlogTopic, generateBlogPost } from '@/server/lib/blogTopicAnalyzer';
import { scheduleBlogs, formatScheduleForDb } from '@/server/lib/blogScheduler';
import { processBlogImage } from '@/server/lib/blogImageProcessor';
import { generateH1FromTitle } from '@/server/lib/generateH1';

export async function POST(req: NextRequest) {
  try {
    const { count = 30, backdatePercentage = 0.2 } = await req.json();
    
    console.log(`[Blog Generation] Starting generation of ${count} blog posts (indefinite weekly schedule)...`);
    
    // Get photos without blog topics
    const photos = await storage.getPhotosWithoutBlogTopic();
    
    if (photos.length === 0) {
      return NextResponse.json({
        message: "No unused photos available for blog generation. Please import photos first."
      }, { status: 404 });
    }
    
    if (photos.length < count) {
      console.warn(`[Blog Generation] Only ${photos.length} photos available, requested ${count}`);
    }
    
    const photosToUse = photos.slice(0, Math.min(count, photos.length));
    
    const blogTopicSuggestions = [];
    
    // Step 1: Analyze photos and suggest blog topics
    console.log(`[Blog Generation] Analyzing ${photosToUse.length} photos for blog topics...`);
    for (const photo of photosToUse) {
      try {
        const topicSuggestion = await suggestBlogTopic(photo);
        await storage.updatePhotoWithBlogTopic(photo.id, topicSuggestion.title);
        blogTopicSuggestions.push({
          photo,
          topicSuggestion
        });
      } catch (error: any) {
        console.error(`[Blog Generation] Error suggesting topic for photo ${photo.id}:`, error);
      }
    }
    
    console.log(`[Blog Generation] Generated ${blogTopicSuggestions.length} topic suggestions`);
    
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
        console.error(`[Blog Generation] Error generating blog for topic "${topicSuggestion.title}":`, error);
      }
    }
    
    console.log(`[Blog Generation] Generated ${generatedBlogs.length} blog posts`);
    
    // Step 3: Schedule blog posts (indefinitely - 1 per week)
    const scheduledBlogs = scheduleBlogs(generatedBlogs, {
      totalPosts: generatedBlogs.length,
      startDate: new Date(),
      postsPerWeek: 1,
      backdatePercentage
    });
    
    // Step 4: Save to database
    const savedBlogs = [];
    for (const scheduledBlog of scheduledBlogs) {
      try {
        const scheduleData = formatScheduleForDb(scheduledBlog);
        
        // Get photo and process image for proper cropping
        let featuredImage = null;
        if (scheduledBlog.photoId) {
          const photo = await storage.getPhotoById(scheduledBlog.photoId);
          if (photo?.photoUrl) {
            console.log(`[Blog Generation] Processing image for: ${scheduledBlog.title}`);
            const processedImage = await processBlogImage(photo.photoUrl, scheduledBlog.title);
            featuredImage = processedImage.imagePath;
            console.log(`[Blog Generation] Cropped image saved: ${featuredImage}`);
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
          h1: generateH1FromTitle(scheduledBlog.title),
        });
        
        // Update blog post with schedule data
        await storage.updateBlogPost(saved.id, {
          ...scheduleData as any,
        });
        
        // Mark photo as used
        if (scheduledBlog.photoId) {
          await storage.markPhotoAsUsed(scheduledBlog.photoId, saved.id);
        }
        
        savedBlogs.push(saved);
      } catch (error: any) {
        console.error(`[Blog Generation] Error saving blog "${scheduledBlog.title}":`, error);
      }
    }
    
    console.log(`[Blog Generation] Successfully saved ${savedBlogs.length} blog posts`);
    
    return NextResponse.json({
      success: true,
      generated: savedBlogs.length,
      photosAnalyzed: photosToUse.length,
      blogs: savedBlogs.map(blog => ({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        category: blog.category,
        excerpt: blog.excerpt
      }))
    });
  } catch (error: any) {
    console.error("[Blog Generation] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
