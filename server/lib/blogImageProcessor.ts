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
    const systemPrompt = `You are an expert image analyst for a plumbing company blog. Analyze images to determine the best crop for web display.

For blog posts, we need landscape images (16:9 or similar ratio) that:
1. Show the main subject/focal point clearly
2. Are suitable for a blog header (wide format)
3. Don't crop out important plumbing work or details

Analyze the image and provide:
- Image orientation (portrait/landscape/square)
- Focal point location (x, y as percentages 0-100)
- Suggested crop area for 16:9 landscape format (x, y, width, height as percentages)

Respond with JSON in this exact format:
{
  "orientation": "portrait" | "landscape" | "square",
  "focalPoint": {
    "x": number (0-100),
    "y": number (0-100)
  },
  "suggestedCrop": {
    "x": number (0-100),
    "y": number (0-100),
    "width": number (0-100),
    "height": number (0-100)
  },
  "reasoning": "brief explanation of focal point and crop decision"
}`;

    const userPrompt = title
      ? `Analyze this image for a blog post titled "${title}". Determine the focal point and suggest a 16:9 landscape crop that best showcases the content.`
      : `Analyze this image. Determine the focal point and suggest a 16:9 landscape crop that best showcases the content.`;

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
): Promise<string> {
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

    // Generate output filename (always WebP for best compression)
    const sourceFilename = path.basename(sourceImagePath);
    const nameWithoutExt = sourceFilename.replace(/\.[^.]+$/, ""); // Remove any extension
    const timestamp = Date.now();
    const outputFilename = `${timestamp}_${nameWithoutExt}_cropped_blog.webp`;
    const tempOutputPath = path.join('/tmp', outputFilename); // Temp location

    // Create the cropped image (1200x675 for 16:9 blog display) as WebP
    await image
      .extract({
        left: cropX,
        top: cropY,
        width: cropWidth,
        height: cropHeight,
      })
      .resize(1200, 675, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85 }) // Convert to WebP with high quality
      .toFile(tempOutputPath);

    console.log(`✅ [BlogImageProcessor] Created cropped WebP image: ${outputFilename}`);
    
    // Upload to object storage
    const { ObjectStorageService } = await import("../objectStorage");
    const objectStorage = new ObjectStorageService();
    const publicSearchPaths = objectStorage.getPublicObjectSearchPaths();
    const destinationPath = `${publicSearchPaths[0]}/blog_images/${outputFilename}`;
    
    await objectStorage.uploadFile(tempOutputPath, destinationPath, 'image/webp');
    console.log(`☁️  [BlogImageProcessor] Uploaded to object storage: ${destinationPath}`);
    
    // Clean up temp file
    await fs.unlink(tempOutputPath);
    
    // Return the public URL path
    return `/public-objects/blog_images/${outputFilename}`;
  } catch (error) {
    console.error("❌ [BlogImageProcessor] Error creating crop:", error);
    throw error;
  }
}

export async function processBlogImage(
  sourceImagePath: string,
  blogTitle?: string
): Promise<{ imagePath: string; focalPointX: number; focalPointY: number }> {
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
    const croppedImagePath = await createSmartCrop(fullSourcePath, outputDir, analysis);
    
    return {
      imagePath: croppedImagePath,
      focalPointX: Math.round(analysis.focalPoint.x),
      focalPointY: Math.round(analysis.focalPoint.y)
    };
  } catch (error) {
    console.error("❌ [BlogImageProcessor] Error processing blog image:", error);
    // Return original image with centered focal point if processing fails
    return {
      imagePath: sourceImagePath,
      focalPointX: 50,
      focalPointY: 50
    };
  }
}
