import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { ObjectStorageService } from '@/server/objectStorage';
import { optimizeImage } from '@/server/lib/imageOptimizer';
import { insertCustomerSuccessStorySchema } from '@shared/schema';
import { sendSuccessStoryNotificationEmail } from '@/server/email';

// Rate limiting Map (in-memory - simple approach for MVP)
const submissionRateLimit = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const now = Date.now();
    
    const body = await req.json();
    
    // Spam protection 1: Honeypot field check
    if (body.website || body.url || body.company_website) {
      console.log('[Spam] Honeypot triggered for success story from IP:', clientIp);
      return NextResponse.json(
        { message: "Invalid form submission" },
        { status: 400 }
      );
    }
    
    // Spam protection 2: Rate limiting (1 minute window)
    const lastSubmission = submissionRateLimit.get(clientIp);
    if (lastSubmission && (now - lastSubmission < 60000)) {
      console.log('[Spam] Rate limit exceeded for IP:', clientIp);
      return NextResponse.json(
        { message: "Too many submissions. Please wait a moment before trying again." },
        { status: 429 }
      );
    }
    
    // Spam protection 3: Timestamp validation
    if (body.formStartTime) {
      const formStartTime = parseInt(body.formStartTime);
      const fillTime = now - formStartTime;
      if (fillTime < 3000) {
        console.log('[Spam] Success story form filled too quickly for IP:', clientIp, 'Fill time:', fillTime);
        return NextResponse.json(
          { message: "Invalid form submission" },
          { status: 400 }
        );
      }
    }
    
    // Remove spam protection fields and extract photo data
    const { website, url, company_website, formStartTime, beforePhoto, afterPhoto, ...storyData } = body;
    
    // Validate that photos are provided
    if (!beforePhoto || !afterPhoto) {
      return NextResponse.json(
        { message: "Both before and after photos are required" },
        { status: 400 }
      );
    }
    
    // Initialize Object Storage Service
    const objectStorageService = new ObjectStorageService();
    
    // Upload photos to object storage (.private directory since they need approval)
    const publicSearchPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0];
    if (!publicSearchPath) {
      throw new Error('Object storage not configured');
    }
    
    // Extract bucket ID from path like /replit-objstore-xxx/public
    const bucketId = publicSearchPath.split('/').filter((p: string) => p.startsWith('replit-objstore-'))[0];
    if (!bucketId) {
      throw new Error('Could not determine bucket ID');
    }
    
    const timestamp = Date.now();
    
    // Optimize and convert photos to WebP (handles HEIC conversion automatically)
    const beforeBuffer = await optimizeImage(beforePhoto, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 85,
      format: 'webp'
    });
    const afterBuffer = await optimizeImage(afterPhoto, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 85,
      format: 'webp'
    });
    
    const beforePhotoPath = `/${bucketId}/.private/success_stories/before_${timestamp}.webp`;
    const afterPhotoPath = `/${bucketId}/.private/success_stories/after_${timestamp}.webp`;
    
    const beforeUrl = await objectStorageService.uploadBuffer(beforeBuffer, beforePhotoPath, 'image/webp');
    const afterUrl = await objectStorageService.uploadBuffer(afterBuffer, afterPhotoPath, 'image/webp');
    
    // Create success story with photo URLs
    const storyWithPhotos = {
      ...storyData,
      beforePhotoUrl: beforeUrl,
      afterPhotoUrl: afterUrl
    };
    
    const validatedData = insertCustomerSuccessStorySchema.parse(storyWithPhotos);
    const story = await storage.createCustomerSuccessStory(validatedData);
    
    // Update rate limit tracking
    submissionRateLimit.set(clientIp, now);
    
    // Send email notification to admin
    try {
      await sendSuccessStoryNotificationEmail({
        customerName: validatedData.customerName,
        email: validatedData.email || undefined,
        phone: validatedData.phone || undefined,
        story: validatedData.story,
        serviceCategory: validatedData.serviceCategory,
        location: validatedData.location,
        beforePhotoUrl: beforeUrl,
        afterPhotoUrl: afterUrl,
        storyId: story.id
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails - submission is still saved
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Thank you for sharing your story! We'll review it and publish it soon.",
      storyId: story.id 
    });
  } catch (error: any) {
    console.error('Success story submission error:', error);
    return NextResponse.json(
      { message: "Error submitting story: " + error.message },
      { status: 400 }
    );
  }
}
