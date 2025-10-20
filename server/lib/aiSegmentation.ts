import OpenAI from "openai";
import { db } from "../db";
import { sql } from "drizzle-orm";
import type { IStorage } from "../storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SegmentOpportunity {
  name: string;
  description: string;
  targetCriteria: Record<string, any>;
  estimatedCustomerCount: number;
  potentialRevenue: number;
  urgencyLevel: 'low' | 'medium' | 'high';
  recommendedAction: string;
  aiReasoning: string;
}

export interface SegmentationAnalysis {
  opportunities: SegmentOpportunity[];
  totalCustomersAnalyzed: number;
  analysisDate: Date;
  aiPrompt: string;
}

/**
 * Analyze ServiceTitan customer data to identify marketing opportunities
 * Uses GPT-4o to intelligently identify segments based on:
 * - Unsold estimates
 * - Win-back opportunities (12+ months since service)
 * - High-value VIP customers
 * - Technician-noted concerns
 * - Anniversary/seasonal opportunities
 */
export async function analyzeCustomerSegments(): Promise<SegmentationAnalysis> {
  console.log('[AI Segmentation] Starting customer analysis...');

  // Gather customer data for AI analysis
  const customerData = await gatherCustomerInsights();

  console.log('[AI Segmentation] Customer insights gathered:', {
    totalCustomers: customerData.totalCustomers,
    recentJobCustomers: customerData.recentJobCustomers,
    inactiveCustomers: customerData.inactiveCustomers,
    highValueCustomers: customerData.highValueCustomers,
    techConcerns: customerData.technicianConcerns,
  });

  // Build AI prompt
  const aiPrompt = buildSegmentationPrompt(customerData);

  console.log('[AI Segmentation] Calling GPT-4o for segment analysis...');

  // Call GPT-4o for intelligent segmentation
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert marketing analyst for a plumbing services company. Your job is to analyze customer data and identify the BEST marketing opportunities to drive revenue.

CRITICAL RULES:
1. Only recommend segments with REAL revenue potential
2. Prioritize segments with HIGH URGENCY (customers ready to book NOW)
3. Each segment MUST have clear, actionable criteria
4. Estimate conservative revenue numbers
5. Focus on segments that are DIFFERENT from each other (no overlap)

SEGMENT TYPES TO CONSIDER:
- Unsold Estimates: Customers with quotes who haven't booked (HIGH URGENCY)
- Win-Back: Customers who haven't used service in 12+ months (MEDIUM URGENCY)
- High-Value VIP: Top customers with >$5K lifetime value (appreciation/loyalty)
- Technician Concerns: Tech flagged equipment issues during last visit (HIGH URGENCY)
- Anniversary Reminders: Customers due for annual maintenance (MEDIUM URGENCY)
- Seasonal Opportunities: Water heater checks before winter, etc.

OUTPUT FORMAT (JSON):
{
  "opportunities": [
    {
      "name": "Segment name",
      "description": "Clear description of who's in this segment",
      "targetCriteria": {
        "key": "value" // Specific SQL-friendly criteria
      },
      "estimatedCustomerCount": 50,
      "potentialRevenue": 150000, // In cents
      "urgencyLevel": "high" | "medium" | "low",
      "recommendedAction": "Specific marketing action to take",
      "aiReasoning": "Why this segment is a good opportunity"
    }
  ]
}`,
      },
      {
        role: "user",
        content: aiPrompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const rawContent = response.choices[0].message.content;
  if (!rawContent) {
    throw new Error('No response from GPT-4o');
  }

  const aiResponse = JSON.parse(rawContent);

  console.log('[AI Segmentation] Analysis complete. Found', aiResponse.opportunities.length, 'opportunities');

  return {
    opportunities: aiResponse.opportunities,
    totalCustomersAnalyzed: customerData.totalCustomers,
    analysisDate: new Date(),
    aiPrompt,
  };
}

/**
 * Gather key customer insights from ServiceTitan data
 */
async function gatherCustomerInsights() {
  // Inactive customers (12+ months since last job)
  const inactiveCustomersQuery = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM service_titan_customers
    WHERE last_service_date < NOW() - INTERVAL '12 months'
      AND last_service_date IS NOT NULL
  `);

  // High-value customers (>$5K lifetime value, in cents so 500000)
  const highValueCustomersQuery = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM service_titan_customers
    WHERE lifetime_value > 500000
  `);

  // Technician-flagged concerns (from job forms)
  const techConcernsQuery = await db.execute(sql`
    SELECT COUNT(DISTINCT customer_id) as count
    FROM service_titan_job_forms
    WHERE equipment_condition IN ('Poor', 'Critical', 'Fair')
      AND created_on > NOW() - INTERVAL '90 days'
  `);

  // Total active customers
  const totalCustomersQuery = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM service_titan_customers
    WHERE active = true
  `);

  // Anniversary opportunities (customers with annual maintenance history)
  const anniversaryQuery = await db.execute(sql`
    SELECT COUNT(DISTINCT customer_id) as count
    FROM service_titan_jobs
    WHERE service_category LIKE '%maintenance%'
      AND completed_on BETWEEN NOW() - INTERVAL '13 months' AND NOW() - INTERVAL '11 months'
  `);

  // Recent job customers (potential for follow-up)
  const recentJobsQuery = await db.execute(sql`
    SELECT COUNT(DISTINCT customer_id) as count
    FROM service_titan_jobs
    WHERE completed_on > NOW() - INTERVAL '90 days'
  `);

  return {
    totalCustomers: Number(totalCustomersQuery.rows[0]?.count || 0),
    inactiveCustomers: Number(inactiveCustomersQuery.rows[0]?.count || 0),
    highValueCustomers: Number(highValueCustomersQuery.rows[0]?.count || 0),
    technicianConcerns: Number(techConcernsQuery.rows[0]?.count || 0),
    anniversaryOpportunities: Number(anniversaryQuery.rows[0]?.count || 0),
    recentJobCustomers: Number(recentJobsQuery.rows[0]?.count || 0),
  };
}

/**
 * Build the AI prompt with customer data
 */
function buildSegmentationPrompt(data: ReturnType<typeof gatherCustomerInsights> extends Promise<infer T> ? T : never): string {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentSeason = getCurrentSeason();

  return `Analyze this plumbing company's customer data and recommend the TOP 3-5 marketing segments with the highest revenue potential.

CURRENT CONTEXT:
- Month: ${currentMonth}
- Season: ${currentSeason}
- Total Active Customers: ${data.totalCustomers}

CUSTOMER DATA:
- Recent Job Customers (90 days): ${data.recentJobCustomers} customers
- Inactive Customers (12+ months): ${data.inactiveCustomers} customers
- High-Value VIP Customers (>$5K lifetime): ${data.highValueCustomers} customers
- Technician-Flagged Concerns (90 days): ${data.technicianConcerns} customers
- Anniversary Maintenance Due (11-13 months ago): ${data.anniversaryOpportunities} customers

INSTRUCTIONS:
1. Identify 3-5 segments with HIGHEST revenue potential
2. Prioritize URGENT opportunities (customers ready to buy NOW)
3. Consider seasonal factors (e.g., water heater checks before winter)
4. Provide specific targetCriteria that can be used to query the database
5. Estimate conservative revenue per segment (average job value in Austin is $800-1500)
6. Different segments should target DIFFERENT customers (no overlap)

Return JSON with your recommended segments.`;
}

/**
 * Get current season for seasonal marketing
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

/**
 * Create customer segments in the database from AI analysis
 */
export async function createSegmentsFromAnalysis(
  analysis: SegmentationAnalysis,
  storage: IStorage
): Promise<string[]> {
  const createdSegmentIds: string[] = [];

  console.log('[AI Segmentation] Creating segments in database...');

  for (const opportunity of analysis.opportunities) {
    try {
      // Create segment using storage
      const segment = await storage.createCustomerSegment({
        name: opportunity.name,
        description: opportunity.description,
        segmentType: determineSegmentType(opportunity.name),
        targetCriteria: opportunity.targetCriteria,
        generatedByAI: true,
        aiPrompt: analysis.aiPrompt,
        aiReasoning: opportunity.aiReasoning,
        memberCount: opportunity.estimatedCustomerCount,
        status: 'awaiting_campaign',
        totalRevenue: 0,
        totalJobsBooked: 0,
      });

      createdSegmentIds.push(segment.id);
      console.log(`[AI Segmentation] Created segment: ${segment.name} (${segment.id})`);
    } catch (error) {
      console.error(`[AI Segmentation] Error creating segment ${opportunity.name}:`, error);
    }
  }

  console.log(`[AI Segmentation] Created ${createdSegmentIds.length} segments successfully`);

  return createdSegmentIds;
}

/**
 * Determine if segment should be evergreen or one-time
 */
function determineSegmentType(segmentName: string): 'evergreen' | 'one_time' {
  const evergreenKeywords = ['win-back', 'anniversary', 'maintenance', 'unsold', 'technician'];
  const nameLower = segmentName.toLowerCase();

  return evergreenKeywords.some(keyword => nameLower.includes(keyword))
    ? 'evergreen'
    : 'one_time';
}

/**
 * Run complete AI segmentation analysis and create segments
 */
export async function runAISegmentation(storage: IStorage): Promise<{
  segmentIds: string[];
  analysis: SegmentationAnalysis;
}> {
  console.log('[AI Segmentation] Starting complete segmentation run...');

  const analysis = await analyzeCustomerSegments();
  const segmentIds = await createSegmentsFromAnalysis(analysis, storage);

  console.log('[AI Segmentation] Segmentation run complete!', {
    opportunitiesFound: analysis.opportunities.length,
    segmentsCreated: segmentIds.length,
  });

  return {
    segmentIds,
    analysis,
  };
}
