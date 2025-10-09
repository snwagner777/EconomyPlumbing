import { storage } from "../storage";
import type { BeforeAfterComposite } from "@shared/schema";
import { postCompositeToSocialMedia } from "./socialMediaPoster";

/**
 * Select the best before/after composite to post this week
 * Criteria: highest quality scores, most dramatic transformation, not yet posted
 */
async function selectBestCompositeForPosting(composites: BeforeAfterComposite[]): Promise<BeforeAfterComposite | null> {
  if (composites.length === 0) return null;

  // Filter to only unposted composites
  const unposted = composites.filter(c => !c.postedToFacebook && !c.postedToInstagram);
  
  if (unposted.length === 0) {
    console.log('[Weekly Post] No unposted composites available');
    return null;
  }

  // For now, just pick the most recent unposted one
  // In the future, could use AI to score "wow factor" or engagement potential
  const sorted = unposted.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return sorted[0];
}

/**
 * Check if it's time to post (runs weekly on Mondays at 10am)
 */
function shouldPostToday(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = now.getHours();

  // Post on Mondays (1) at 10am Central Time (adjust for your timezone)
  return dayOfWeek === 1 && hour === 10;
}

/**
 * Check if we've already posted today
 */
async function hasPostedToday(composites: BeforeAfterComposite[]): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysPosts = composites.filter(c => {
    if (!c.postedAt) return false;
    const postedDate = new Date(c.postedAt);
    postedDate.setHours(0, 0, 0, 0);
    return postedDate.getTime() === today.getTime();
  });

  return todaysPosts.length > 0;
}

/**
 * Post the best before/after composite to social media
 */
export async function postWeeklyBeforeAfter(): Promise<void> {
  try {
    console.log('[Weekly Post] Checking for composites to post...');

    // Get all composites
    const composites = await storage.getBeforeAfterComposites();

    // Check if already posted today
    if (await hasPostedToday(composites)) {
      console.log('[Weekly Post] Already posted today, skipping');
      return;
    }

    // Select best composite
    const composite = await selectBestCompositeForPosting(composites);

    if (!composite) {
      console.log('[Weekly Post] No suitable composite found');
      return;
    }

    console.log(`[Weekly Post] Selected composite: ${composite.id}`);
    console.log(`[Weekly Post] Caption: ${composite.caption}`);

    // Post to social media
    const { facebookPostId, instagramPostId } = await postCompositeToSocialMedia(composite);

    // Update database
    await storage.markCompositeAsPosted(composite.id, facebookPostId, instagramPostId);

    console.log('[Weekly Post] ✅ Successfully posted to social media!');
    if (facebookPostId) console.log(`[Weekly Post] Facebook: ${facebookPostId}`);
    if (instagramPostId) console.log(`[Weekly Post] Instagram: ${instagramPostId}`);
  } catch (error) {
    console.error('[Weekly Post] Error posting weekly before/after:', error);
  }
}

/**
 * Start the weekly posting scheduler (runs every hour to check if it's time)
 */
export function startWeeklyPostScheduler(): void {
  console.log('[Weekly Post] Scheduler started - will post Mondays at 10am');

  // Check immediately on startup
  checkAndPost();

  // Then check every hour
  setInterval(checkAndPost, 60 * 60 * 1000); // 1 hour
}

async function checkAndPost(): Promise<void> {
  if (shouldPostToday()) {
    await postWeeklyBeforeAfter();
  }
}

/**
 * Manually trigger a post (for testing or manual posting)
 */
export async function manuallyPostBest(): Promise<void> {
  console.log('[Weekly Post] Manual post triggered');
  
  const composites = await storage.getBeforeAfterComposites();
  const composite = await selectBestCompositeForPosting(composites);

  if (!composite) {
    console.log('[Weekly Post] No suitable composite found');
    return;
  }

  const { facebookPostId, instagramPostId } = await postCompositeToSocialMedia(composite);
  await storage.markCompositeAsPosted(composite.id, facebookPostId, instagramPostId);

  console.log('[Weekly Post] ✅ Manual post complete!');
}
