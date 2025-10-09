/**
 * Blog Post Scheduling System
 * 
 * Schedules blog posts strategically:
 * - Backdate posts randomly between 3-6 months ago
 * - Schedule future posts 1 per week for 200 weeks
 * - Consider seasonal timing for relevant topics
 */

interface ScheduleConfig {
  totalPosts: number;
  startDate?: Date; // When to start scheduling from (default: now)
  backdateMonthsMin?: number; // Minimum months to backdate (default: 3)
  backdateMonthsMax?: number; // Maximum months to backdate (default: 6)
  postsPerWeek?: number; // Posts per week (default: 1)
}

interface ScheduledPost {
  publishDate: Date;
  isBackdated: boolean;
  scheduledFor: Date | null; // Future publish date
  seasonalTiming: string;
}

// Seasonal topics that should be timed appropriately
const SEASONAL_TOPICS: Record<string, string[]> = {
  'winter': [
    'frozen', 'freeze', 'cold', 'heating', 'insulation', 'pipes freezing'
  ],
  'summer': [
    'heat', 'hot water', 'ac', 'cooling', 'summer', 'drought'
  ],
  'spring': [
    'flooding', 'rain', 'storm', 'drainage', 'spring cleaning'
  ],
  'fall': [
    'preparation', 'winterize', 'maintenance', 'inspection', 'fall'
  ]
};

/**
 * Determine the season for a given date
 */
function getSeason(date: Date): string {
  const month = date.getMonth(); // 0-11
  
  if (month >= 2 && month <= 4) return 'spring';  // Mar-May
  if (month >= 5 && month <= 7) return 'summer';  // Jun-Aug
  if (month >= 8 && month <= 10) return 'fall';   // Sep-Nov
  return 'winter';  // Dec-Feb
}

/**
 * Check if a topic should be seasonal
 */
function isSeasonalTopic(title: string): { isSeasonal: boolean; preferredSeason?: string } {
  const lowerTitle = title.toLowerCase();
  
  for (const [season, keywords] of Object.entries(SEASONAL_TOPICS)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return { isSeasonal: true, preferredSeason: season };
      }
    }
  }
  
  return { isSeasonal: false };
}

/**
 * Generate a random date within a range
 */
function randomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * Adjust date to match preferred season if topic is seasonal
 */
function adjustForSeason(date: Date, preferredSeason: string): Date {
  const currentSeason = getSeason(date);
  
  // If already in the right season, return as-is
  if (currentSeason === preferredSeason) {
    return date;
  }
  
  // Calculate months to adjust to reach the preferred season
  const seasonStartMonths: Record<string, number> = {
    'spring': 2,  // March
    'summer': 5,  // June
    'fall': 8,    // September
    'winter': 11  // December
  };
  
  const targetMonth = seasonStartMonths[preferredSeason];
  const adjustedDate = new Date(date);
  adjustedDate.setMonth(targetMonth);
  
  // If we went backward too far, move forward a year
  if (adjustedDate < date && !date.toString().includes('2024')) {
    adjustedDate.setFullYear(adjustedDate.getFullYear() + 1);
  }
  
  return adjustedDate;
}

/**
 * Generate backdated publish dates (3-6 months ago, random)
 */
export function generateBackdatedSchedule(
  count: number,
  baseDate: Date = new Date()
): ScheduledPost[] {
  const schedule: ScheduledPost[] = [];
  const threeMonthsAgo = new Date(baseDate);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const sixMonthsAgo = new Date(baseDate);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  for (let i = 0; i < count; i++) {
    const publishDate = randomDateBetween(sixMonthsAgo, threeMonthsAgo);
    
    schedule.push({
      publishDate,
      isBackdated: true,
      scheduledFor: null,
      seasonalTiming: getSeason(publishDate)
    });
  }
  
  // Sort by publish date (oldest first)
  return schedule.sort((a, b) => a.publishDate.getTime() - b.publishDate.getTime());
}

/**
 * Generate future schedule (1 post per week for N weeks)
 */
export function generateFutureSchedule(
  count: number,
  startDate: Date = new Date(),
  postsPerWeek: number = 1
): ScheduledPost[] {
  const schedule: ScheduledPost[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    // Add one week for each post
    currentDate.setDate(currentDate.getDate() + (7 / postsPerWeek));
    
    // Add some randomness (±2 days) to make it less predictable
    const randomOffset = Math.floor(Math.random() * 5) - 2; // -2 to +2 days
    const publishDate = new Date(currentDate);
    publishDate.setDate(publishDate.getDate() + randomOffset);
    
    schedule.push({
      publishDate,
      isBackdated: false,
      scheduledFor: new Date(publishDate),
      seasonalTiming: getSeason(publishDate)
    });
  }
  
  return schedule;
}

/**
 * Main scheduling function with seasonal awareness
 */
export function scheduleBlogs(
  blogTopics: { title: string; [key: string]: any }[],
  config: ScheduleConfig
): (typeof blogTopics[number] & { schedule: ScheduledPost })[] {
  const {
    totalPosts = blogTopics.length,
    startDate = new Date(),
    backdateMonthsMin = 3,
    backdateMonthsMax = 6,
    postsPerWeek = 1
  } = config;
  
  // Determine how many posts to backdate vs schedule for future
  const backdatedCount = Math.min(blogTopics.length, Math.floor(totalPosts * 0.2)); // 20% backdated
  const futureCount = blogTopics.length - backdatedCount;
  
  const backdatedSchedule = generateBackdatedSchedule(backdatedCount, startDate);
  const futureSchedule = generateFutureSchedule(futureCount, startDate, postsPerWeek);
  
  const allSchedules = [...backdatedSchedule, ...futureSchedule];
  
  // Match topics with schedules, considering seasonal alignment
  const scheduledBlogs = blogTopics.map((topic, index) => {
    let schedule = allSchedules[index];
    
    const { isSeasonal, preferredSeason } = isSeasonalTopic(topic.title);
    
    // If topic is seasonal and we're scheduling for the future, try to align with season
    if (isSeasonal && preferredSeason && !schedule.isBackdated) {
      const adjustedDate = adjustForSeason(schedule.publishDate, preferredSeason);
      schedule = {
        ...schedule,
        publishDate: adjustedDate,
        scheduledFor: adjustedDate,
        seasonalTiming: preferredSeason
      };
    }
    
    return {
      ...topic,
      schedule
    };
  });
  
  console.log(`[Blog Scheduler] Scheduled ${backdatedCount} backdated posts and ${futureCount} future posts`);
  
  return scheduledBlogs;
}

/**
 * Helper to format schedule for database insertion
 */
export function formatScheduleForDb(scheduledBlog: ReturnType<typeof scheduleBlogs>[number]) {
  return {
    publishDate: scheduledBlog.schedule.publishDate,
    isScheduled: !scheduledBlog.schedule.isBackdated,
    scheduledFor: scheduledBlog.schedule.scheduledFor,
    generatedByAI: true
  };
}
