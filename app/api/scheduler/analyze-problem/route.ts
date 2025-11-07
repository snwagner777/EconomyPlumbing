/**
 * AI Problem Analyzer - Suggest Job Type from Natural Language Description
 * 
 * Uses OpenAI to analyze a user's problem description and suggest the best
 * ServiceTitan job type, along with an enriched summary for technicians.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { storage } from '@/server/storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Severity/urgency levels for routing logic
type UrgencyLevel = 'emergency' | 'urgent' | 'normal';

interface AIAnalysisResult {
  suggestedJobTypeId: number;
  suggestedJobTypeName: string;
  confidence: number; // 0-100
  urgency: UrgencyLevel;
  enrichedSummary: string; // For ServiceTitan job summary
  keyIssues: string[]; // Bullet points extracted from description
  reasoning: string; // Why AI chose this job type
}

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { error: 'Description too short - please provide more details' },
        { status: 400 }
      );
    }

    // Fetch available job types from ServiceTitan
    const jobTypesResponse = await fetch(`${req.nextUrl.origin}/api/scheduler/options`);
    const jobTypesData = await jobTypesResponse.json();
    
    if (!jobTypesData.success || !jobTypesData.jobTypes) {
      return NextResponse.json(
        { error: 'Failed to load job types' },
        { status: 500 }
      );
    }

    const jobTypes = jobTypesData.jobTypes;

    // Build job type catalog for AI
    const jobTypeCatalog = jobTypes.map((jt: any) => 
      `ID: ${jt.id}, Name: "${jt.name}", Code: "${jt.code}"`
    ).join('\n');

    // AI analysis prompt
    const prompt = `You are an expert plumbing dispatcher analyzing a customer's problem description to match them with the correct service type.

Available Job Types:
${jobTypeCatalog}

Customer's Problem Description:
"${description}"

Analyze the description and respond with a JSON object (ONLY JSON, no markdown):
{
  "suggestedJobTypeId": <number>,
  "suggestedJobTypeName": "<exact name from catalog>",
  "confidence": <number 0-100>,
  "urgency": "<emergency|urgent|normal>",
  "enrichedSummary": "<2-3 sentence summary for technician including key details from description>",
  "keyIssues": ["<issue 1>", "<issue 2>", ...],
  "reasoning": "<1 sentence explaining why you chose this job type>"
}

Guidelines:
- Match keywords: "leak" → leak repair, "clog/drain/backup" → drain cleaning, "water heater/no hot water" → water heater, "toilet/faucet" → plumbing service
- Emergency indicators: "flooding", "burst pipe", "gushing water", "no water at all" → mark as emergency
- Urgent indicators: "spreading leak", "completely backed up", "won't stop running" → mark as urgent
- Normal: routine repairs, slow leaks, minor issues → mark as normal
- If unsure between two types, choose the more general one (e.g., "Plumbing Service" over specific repair)
- enrichedSummary should include: location (if mentioned), symptoms, duration/severity, any sounds/smells
- keyIssues should be 2-4 bullet points extracting the main problems`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a plumbing dispatch AI. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent categorization
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim() || '{}';
    
    // Parse AI response (handle markdown code blocks if present)
    let analysis: AIAnalysisResult;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/```\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[AI Analyzer] Failed to parse AI response:', aiResponse);
      
      // Fallback: choose most general job type
      const generalService = jobTypes.find((jt: any) => 
        jt.name.toLowerCase().includes('plumbing service') ||
        jt.name.toLowerCase().includes('repair')
      ) || jobTypes[0];

      analysis = {
        suggestedJobTypeId: generalService.id,
        suggestedJobTypeName: generalService.name,
        confidence: 50,
        urgency: 'normal',
        enrichedSummary: description,
        keyIssues: [description.substring(0, 100)],
        reasoning: 'AI parsing failed - defaulted to general service',
      };
    }

    // Validate suggested job type exists
    const suggestedJobType = jobTypes.find((jt: any) => jt.id === analysis.suggestedJobTypeId);
    if (!suggestedJobType) {
      // Fallback to first job type if suggested ID doesn't exist
      analysis.suggestedJobTypeId = jobTypes[0].id;
      analysis.suggestedJobTypeName = jobTypes[0].name;
      analysis.confidence = Math.min(analysis.confidence, 60);
    }

    return NextResponse.json({
      success: true,
      analysis,
      originalDescription: description,
    });

  } catch (error) {
    console.error('[AI Analyzer] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze problem description' },
      { status: 500 }
    );
  }
}
