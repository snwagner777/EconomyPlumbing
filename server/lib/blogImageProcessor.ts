import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ImageCropAnalysis {
  orientation: "portrait" | "landscape" | "square";
  focalPoint: {
    x: number; // 0-100 percentage from left
    y: number; // 0-100 percentage from top
  };
  suggestedCrop: {
    x: number; // percentage from left
    y: number; // percentage from top
    width: number; // percentage of original width
    height: number; // percentage of original height
  };
  reasoning: string;
}

export async function analyzeImageForCropping(
  imageUrl: string,
  title?: string
): Promise<ImageCropAnalysis> {
  try {
    const systemPrompt = `You are an expert image analyst for a plumbing company blog. Your job is to identify the ENTIRE area containing important plumbing work and ensure NOTHING gets cut off.

CRITICAL REQUIREMENTS:
1. Identify ALL plumbing work, fixtures, or equipment in the image - the COMPLETE area from top to bottom
2. The focal point should be the CENTER of all important plumbing elements
3. The crop MUST include the ENTIRE extent of plumbing work - if there's a water heater, include it ALL (top to bottom)
4. NEVER cut off any part of plumbing fixtures, pipes, tools, or work being shown
5. It's better to show MORE context than to accidentally crop out important details
6. For 16:9 landscape crops, ensure the width is sufficient to capture the full horizontal extent of the work

FOCAL POINT RULES:
- The focal point (x, y) should be the CENTER of the most important plumbing element
- This is where viewer's eyes should be drawn when the image is displayed
- For blog cards and headers, this point will be used with CSS object-position to center the visible area

CROP RULES:
- The crop dimensions should encompass the FULL extent of all important plumbing work
- Width and height percentages should be generous to avoid cutting anything off
- When in doubt, include MORE of the image rather than less
- Ensure the crop maintains 16:9 ratio while showing all important content

Respond with JSON in this exact format:
{
  "orientation": "portrait" | "landscape" | "square",
  "focalPoint": {
    "x": number (0-100, center of main plumbing element),
    "y": number (0-100, center of main plumbing element)
  },
  "suggestedCrop": {
    "x": number (0-100, left edge of crop),
    "y": number (0-100, top edge of crop),
    "width": number (0-100, width of crop),
    "height": number (0-100, height of crop - will be adjusted to 16:9)
  },
  "reasoning": "Explain what plumbing work you identified and how you ensured nothing got cut off"
}`;

    const userPrompt = title
      ? `Analyze this plumbing image for a blog post titled "${title}". 
      
      INSTRUCTIONS:
      1. Identify ALL plumbing work, fixtures, equipment visible in the image
      2. Find the CENTER point of the main plumbing element (this will be the focal point for CSS positioning)
      3. Suggest a crop that captures the ENTIRE extent of the plumbing work - nothing should be cut off
      4. Ensure the crop is wide enough to show all important horizontal details
      5. The crop should work well at 16:9 ratio when resized for blog display
      
      Remember: It's better to include too much than to cut off important plumbing work!`
      : `Analyze this plumbing image and identify all plumbing work visible. Find the center of the main element and suggest a crop that captures everything important without cutting anything off.`;

    console.log("🖼️  [BlogImageProcessor] Analyzing image for cropping...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const analysis = JSON.parse(content) as ImageCropAnalysis;
    console.log("✅ [BlogImageProcessor] Analysis complete:", analysis.reasoning);
    return analysis;
  } catch (error) {
    console.error("❌ [BlogImageProcessor] Error analyzing image:", error);
    // Return a safe default crop (center crop)
    return {
      orientation: "square",
      focalPoint: { x: 50, y: 50 },
      suggestedCrop: { x: 0, y: 25, width: 100, height: 56.25 }, // 16:9 ratio from center
      reasoning: "Analysis failed, using center crop",
    };
  }
}

export async function createSmartCrop(
  sourceImagePath: string,
  outputDir: string,
  cropData: ImageCropAnalysis
): Promise<{ webp: string; jpeg: string }> {
  try {
    console.log("✂️  [BlogImageProcessor] Creating smart crop...");
    
    // Read source image to get dimensions
    const image = sharp(sourceImagePath);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error("Could not determine image dimensions");
    }

    // Calculate crop dimensions in pixels
    const cropX = Math.round((cropData.suggestedCrop.x / 100) * metadata.width);
    const cropY = Math.round((cropData.suggestedCrop.y / 100) * metadata.height);
    const cropWidth = Math.round((cropData.suggestedCrop.width / 100) * metadata.width);
    const cropHeight = Math.round((cropData.suggestedCrop.height / 100) * metadata.height);

    // Generate base filename (always WebP for best compression)
    const sourceFilename = path.basename(sourceImagePath);
    const nameWithoutExt = sourceFilename.replace(/\.[^.]+$/, ""); // Remove any extension
    const timestamp = Date.now();
    const baseFilename = `${timestamp}_${nameWithoutExt}_cropped_blog`;

    // Create the cropped base image
    const croppedImage = sharp(sourceImagePath).extract({
      left: cropX,
      top: cropY,
      width: cropWidth,
      height: cropHeight,
    });

    // Generate multiple sizes for responsive images (400w, 800w, 1200w)
    const sizes = [
      { width: 400, height: 225, suffix: '_400w' },
      { width: 800, height: 450, suffix: '_800w' },
      { width: 1200, height: 675, suffix: '_1200w' }
    ];

    const { ObjectStorageService } = await import("../objectStorage");
    const objectStorage = new ObjectStorageService();
    const publicSearchPaths = objectStorage.getPublicObjectSearchPaths();

    // Generate and upload all sizes (both WebP and JPEG)
    for (const size of sizes) {
      // Generate WebP version
      const webpFilename = `${baseFilename}${size.suffix}.webp`;
      const webpTempPath = path.join('/tmp', webpFilename);
      
      await croppedImage
        .clone()
        .resize(size.width, size.height, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 85 })
        .toFile(webpTempPath);

      const webpDestPath = `${publicSearchPaths[0]}/blog_images/${webpFilename}`;
      await objectStorage.uploadFile(webpTempPath, webpDestPath, 'image/webp');
      await fs.unlink(webpTempPath);
      
      // Generate JPEG version for RSS/social media
      const jpegFilename = `${baseFilename}${size.suffix}.jpg`;
      const jpegTempPath = path.join('/tmp', jpegFilename);
      
      await croppedImage
        .clone()
        .resize(size.width, size.height, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 90 })
        .toFile(jpegTempPath);

      const jpegDestPath = `${publicSearchPaths[0]}/blog_images/${jpegFilename}`;
      await objectStorage.uploadFile(jpegTempPath, jpegDestPath, 'image/jpeg');
      await fs.unlink(jpegTempPath);
      
      console.log(`✅ [BlogImageProcessor] Created and uploaded ${size.width}w images (WebP & JPEG)`);
    }
    
    // Return both WebP and JPEG public URL paths for the largest image (1200w)
    return {
      webp: `/public-objects/blog_images/${baseFilename}_1200w.webp`,
      jpeg: `/public-objects/blog_images/${baseFilename}_1200w.jpg`
    };
  } catch (error) {
    console.error("❌ [BlogImageProcessor] Error creating crop:", error);
    throw error;
  }
}

export async function processBlogImage(
  sourceImagePath: string,
  blogTitle?: string
): Promise<{ imagePath: string; jpegImagePath: string; focalPointX: number; focalPointY: number }> {
  try {
    console.log(`📸 [BlogImageProcessor] Processing blog image: ${sourceImagePath}`);

    // Get the image URL for OpenAI analysis
    const imageUrl = `https://www.plumbersthatcare.com${sourceImagePath.replace(/^\./, "")}`;
    
    // Analyze image for smart cropping
    const analysis = await analyzeImageForCropping(imageUrl, blogTitle);
    
    // Create the cropped version
    const fullSourcePath = sourceImagePath.startsWith("/") 
      ? `.${sourceImagePath}` 
      : sourceImagePath;
    
    const outputDir = "./attached_assets/blog_images";
    const croppedImages = await createSmartCrop(fullSourcePath, outputDir, analysis);
    
    return {
      imagePath: croppedImages.webp,
      jpegImagePath: croppedImages.jpeg,
      focalPointX: Math.round(analysis.focalPoint.x),
      focalPointY: Math.round(analysis.focalPoint.y)
    };
  } catch (error) {
    console.error("❌ [BlogImageProcessor] Error processing blog image:", error);
    // Return original image with centered focal point if processing fails
    return {
      imagePath: sourceImagePath,
      jpegImagePath: sourceImagePath.replace(/\.(webp|png)$/i, '.jpg'), // Fallback JPEG path
      focalPointX: 50,
      focalPointY: 50
    };
  }
}
