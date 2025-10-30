import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';
import { processBlogImage } from '@/server/lib/blogImageProcessor';
import { generateH1FromTitle } from '@/server/lib/generateH1';
import { ObjectStorageService } from '@/server/objectStorage';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { photoId, title, content } = await req.json();
    
    if (!photoId || !title || !content) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    console.log(`[Manual Blog Post] Creating blog post...`);

    // Get the photo
    const photo = await storage.getPhotoById(photoId);

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create blog post (backdated by 1-3 months for SEO)
    const monthsAgo = Math.floor(Math.random() * 3) + 1;
    const publishDate = new Date();
    publishDate.setMonth(publishDate.getMonth() - monthsAgo);

    // Process image and generate JPEG version
    let featuredImage = photo.photoUrl;
    let jpegFeaturedImage = null;
    
    if (photo.photoUrl) {
      try {
        console.log(`[Manual Blog Post] Processing image for: ${title}`);
        const processed = await processBlogImage(photo.photoUrl, title);
        
        featuredImage = processed.imagePath;
        jpegFeaturedImage = processed.jpegImagePath;
        console.log(`[Manual Blog Post] ✅ Image processed - WebP: ${featuredImage}, JPEG: ${jpegFeaturedImage}`);
      } catch (imageError) {
        console.error(`[Manual Blog Post] ⚠️ Image processing failed, attempting simple conversion:`, imageError);
        // Fallback: Convert WebP to JPEG without cropping
        try {
          const objectStorage = new ObjectStorageService();
          
          // Download WebP image
          const webpBuffer = await objectStorage.downloadBuffer(photo.photoUrl);
          if (webpBuffer) {
            // Convert to JPEG
            const jpegBuffer = await sharp(webpBuffer)
              .jpeg({ quality: 90 })
              .toBuffer();
            
            // Upload JPEG with same path but .jpg extension
            const jpegPath = photo.photoUrl.replace(/\.webp$/i, '.jpg');
            await objectStorage.uploadBuffer(jpegBuffer, jpegPath, 'image/jpeg');
            
            featuredImage = photo.photoUrl;
            jpegFeaturedImage = jpegPath;
            console.log(`[Manual Blog Post] ✅ Fallback JPEG created: ${jpegPath}`);
          } else {
            // Last resort: use WebP for both
            featuredImage = photo.photoUrl;
            jpegFeaturedImage = photo.photoUrl;
            console.warn(`[Manual Blog Post] ⚠️ Using WebP for both formats`);
          }
        } catch (conversionError) {
          console.error(`[Manual Blog Post] ❌ JPEG conversion failed:`, conversionError);
          // Last resort: use WebP for both
          featuredImage = photo.photoUrl;
          jpegFeaturedImage = photo.photoUrl;
        }
      }
    }

    const post = await storage.createBlogPost({
      title,
      content,
      slug,
      excerpt: content.substring(0, 150).replace(/#+\s*/g, '').trim() + '...',
      featuredImage,
      jpegFeaturedImage,
      imageId: photoId,
      author: 'Economy Plumbing Services',
      category: photo.category || 'General',
      published: true,
      h1: generateH1FromTitle(title),
    });

    // Mark photo as used
    await storage.markPhotoAsUsed(photoId, post.id.toString(), 'blog_post');

    console.log(`[Manual Blog Post] ✅ Blog post created: ${post.id}`);

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error("[Manual Blog Post] Error creating blog post:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
