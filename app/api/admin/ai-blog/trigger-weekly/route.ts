/**
 * Admin API - Manually Trigger Weekly Blog Generation
 * 
 * Triggers the automated blog generation process immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { storage } from '@/server/storage';

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Manual Weekly Blog Trigger] Starting blog generation...');

    // Import the weekly blog generation logic
    const { suggestBlogTopic, generateBlogPost } = await import('@/server/lib/blogTopicAnalyzer');
    const { processBlogImage } = await import('@/server/lib/blogImageProcessor');
    
    // Get unused photos
    const unusedPhotos = await storage.getPhotosWithoutBlogTopic();
    
    console.log(`[Manual Weekly Blog Trigger] Found ${unusedPhotos.length} unused photos`);
    
    if (unusedPhotos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unused photos available for blog generation',
        photosFound: 0,
        blogsGenerated: 0
      });
    }
    
    // Generate 1 blog post (weekly cadence)
    const photo = unusedPhotos[0];
    
    // Step 1: Suggest blog topic
    console.log(`[Manual Weekly Blog Trigger] Analyzing photo ${photo.id} for blog topic...`);
    const topicSuggestion = await suggestBlogTopic(photo);
    await storage.updatePhotoWithBlogTopic(photo.id, topicSuggestion.title);
    
    // Step 2: Generate blog post
    console.log(`[Manual Weekly Blog Trigger] Generating blog post for "${topicSuggestion.title}"...`);
    const blogPost = await generateBlogPost(photo, topicSuggestion);
    
    // Step 3: Process image for blog
    let featuredImage = null;
    let jpegFeaturedImage = null;
    let focalPointX = null;
    let focalPointY = null;
    
    if (photo.photoUrl) {
      const imageData = await processBlogImage(photo.photoUrl, blogPost.title);
      featuredImage = imageData.imagePath;
      jpegFeaturedImage = imageData.jpegImagePath;
      focalPointX = imageData.focalPointX;
      focalPointY = imageData.focalPointY;
    }
    
    // Step 4: Save to database
    const currentDate = new Date();
    const savedBlog = await storage.createBlogPost({
      title: blogPost.title,
      slug: blogPost.slug,
      content: blogPost.content,
      excerpt: blogPost.excerpt,
      metaDescription: blogPost.metaDescription,
      category: blogPost.category,
      publishedAt: currentDate,
      featuredImage,
      jpegFeaturedImage,
      focalPointX,
      focalPointY,
      generatedByAI: true,
      imageId: photo.id,
    });
    
    // Step 5: Mark photo as used
    await storage.markPhotoAsUsed(photo.id, savedBlog.id);
    
    console.log(`[Manual Weekly Blog Trigger] ✅ Blog post created: ${savedBlog.slug}`);
    
    return NextResponse.json({
      success: true,
      message: 'Blog post generated successfully',
      photosFound: unusedPhotos.length,
      blogsGenerated: 1,
      blog: {
        id: savedBlog.id,
        title: savedBlog.title,
        slug: savedBlog.slug,
      }
    });

  } catch (error: any) {
    console.error('[Manual Weekly Blog Trigger] Error:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('[Manual Weekly Blog Trigger] API error status:', error.response.status);
      console.error('[Manual Weekly Blog Trigger] API error data:', JSON.stringify(error.response.data, null, 2));
    }
    
    const errorMessage = error.response?.data?.error?.message 
      || error.message 
      || "Unknown error occurred";
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
