import { db } from "./server/db.js";
import { blogPosts } from "./shared/schema.js";
import { processBlogImage } from "./server/lib/blogImageProcessor.js";
import { eq } from "drizzle-orm";

async function reprocess() {
  console.log("[Reprocess] Starting...");
  
  const legacyPosts = [
    { id: '062cf46e-1191-4540-b02e-4c08fe1ed03a', title: 'Does Your Home or Business Need a Re-Pipe?', image: '/replit-objstore-d3381c71-f557-457f-9913-e7cf7dce4d30/public/imported_photos/general-plumbing/gdrive-1760050988251.webp' },
    { id: '77a03ff4-1a95-4a13-b2f0-055765dc95c1', title: 'Hiring a Plumber Near Me', image: '/attached_assets/imported_photos/general/1760000954259_IMG_3921.webp' },
    { id: '762b7961-8f35-496e-8f3f-751963e3038d', title: 'How Long Do Backflow Preventers Last?', image: '/replit-objstore-d3381c71-f557-457f-9913-e7cf7dce4d30/public/imported_photos/general-plumbing/gdrive-1760050902721.webp' },
    { id: '64092c05-c3bf-4b88-bbb9-a20dcf8cffcf', title: 'How Often Should I Test My Backflow Preventer', image: '/attached_assets/imported_photos/backflow/1759997854228_ZIMG_0686.webp' },
    { id: 'c8e5e34e-ade9-4557-afc3-389ec76ddbd5', title: 'Maximize Your Water Heaters Lifespan', image: '/replit-objstore-d3381c71-f557-457f-9913-e7cf7dce4d30/public/imported_photos/water-heater/gdrive-1760050995884.webp' },
    { id: 'df00435b-fc09-4811-9b07-e564a6863192', title: 'Prevent Flooding', image: '/attached_assets/imported_photos/drain/1759997716310_ZIMG_0651.webp' },
    { id: '8af4ef2b-e2fc-413d-9097-c76936d57cf0', title: 'Protect Your Austin Home', image: '/replit-objstore-d3381c71-f557-457f-9913-e7cf7dce4d30/public/imported_photos/backflow-prevention/gdrive-1760052873123.webp' },
    { id: '2828e425-85a2-432f-89d8-74fd8d8cb5fb', title: 'Signs of a Slab Leak', image: '/attached_assets/imported_photos/general/1759997744230_ZIMG_3671.webp' },
    { id: '8159c180-d11a-44f9-b014-fecad6662869', title: 'The Importance of Slab Leak Repair', image: '/attached_assets/imported_photos/general/1760018106358_IMG_3861.webp' },
    { id: '9b5a8826-4c29-4c28-989b-918a964c1737', title: 'Why Plumbers Are Expensive', image: '/attached_assets/imported_photos/general/1759998011054_IMG_4357.webp' },
    { id: '4bd22e00-b326-45c5-b23c-f85d0d3d6364', title: 'Your Trusted Plumber', image: '/replit-objstore-d3381c71-f557-457f-9913-e7cf7dce4d30/public/imported_photos/general-plumbing/gdrive-1760051012127.webp' }
  ];
  
  let successful = 0;
  let failed = 0;
  
  for (const post of legacyPosts) {
    try {
      console.log(`\n[${successful + failed + 1}/11] Processing: ${post.title}`);
      
      const processedImage = await processBlogImage(post.image, post.title);
      
      await db.update(blogPosts)
        .set({
          featuredImage: processedImage.imagePath,
          jpegFeaturedImage: processedImage.jpegImagePath,
          focalPointX: processedImage.focalPointX,
          focalPointY: processedImage.focalPointY
        })
        .where(eq(blogPosts.id, post.id));
      
      console.log(`✅ Success!`);
      successful++;
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n[Reprocess] Complete: ${successful} successful, ${failed} failed`);
  process.exit(0);
}

reprocess().catch(console.error);
