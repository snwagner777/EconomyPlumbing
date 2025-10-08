// Auto-categorize reviews based on keywords in review text

export type ReviewCategory = 
  | 'water_heater'
  | 'drain'
  | 'toilet'
  | 'leak'
  | 'faucet'
  | 'pipe'
  | 'sewer'
  | 'gas'
  | 'backflow'
  | 'slab_leak'
  | 'repiping'
  | 'garbage_disposal'
  | 'general';

interface CategoryKeywords {
  category: ReviewCategory;
  keywords: string[];
}

const categoryKeywords: CategoryKeywords[] = [
  {
    category: 'water_heater',
    keywords: ['water heater', 'tankless', 'hot water', 'heater'],
  },
  {
    category: 'drain',
    keywords: ['drain', 'clog', 'unclog', 'backup', 'snake', 'clear'],
  },
  {
    category: 'toilet',
    keywords: ['toilet', 'commode', 'bowl', 'flush'],
  },
  {
    category: 'leak',
    keywords: ['leak', 'leaking', 'drip', 'dripping'],
  },
  {
    category: 'faucet',
    keywords: ['faucet', 'tap', 'sink'],
  },
  {
    category: 'pipe',
    keywords: ['pipe', 'piping', 'burst'],
  },
  {
    category: 'sewer',
    keywords: ['sewer', 'septic', 'main line'],
  },
  {
    category: 'gas',
    keywords: ['gas line', 'gas', 'natural gas'],
  },
  {
    category: 'backflow',
    keywords: ['backflow', 'back flow', 'cross connection'],
  },
  {
    category: 'slab_leak',
    keywords: ['slab leak', 'under slab', 'foundation'],
  },
  {
    category: 'repiping',
    keywords: ['repipe', 'repiping', 'replace pipe', 'new pipe'],
  },
  {
    category: 'garbage_disposal',
    keywords: ['garbage disposal', 'disposal', 'disposer'],
  },
];

/**
 * Auto-categorize a review based on keywords in the review text
 * Returns an array of categories (can be multiple if review mentions multiple services)
 * Returns ['general'] if no specific service is mentioned
 */
export function categorizeReview(reviewText: string): ReviewCategory[] {
  const lowerText = reviewText.toLowerCase();
  const categories: ReviewCategory[] = [];

  for (const { category, keywords } of categoryKeywords) {
    const hasKeyword = keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    if (hasKeyword) {
      categories.push(category);
    }
  }

  // If no categories found, mark as general
  if (categories.length === 0) {
    return ['general'];
  }

  return categories;
}

/**
 * Filter reviews by category
 */
export function filterReviewsByCategory(
  reviews: Array<{ categories?: string[] }>,
  category: ReviewCategory
): Array<{ categories?: string[] }> {
  return reviews.filter(review => 
    review.categories && review.categories.includes(category)
  );
}
