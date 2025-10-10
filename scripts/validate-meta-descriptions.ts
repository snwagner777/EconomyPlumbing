#!/usr/bin/env tsx

/**
 * Meta Description Validation Script
 * 
 * RULE: Anytime we change meta descriptions, verify they are all within character limits
 * 
 * This script validates that all meta descriptions across the site meet SEO best practices:
 * - Minimum length: 120 characters (too short looks incomplete)
 * - Maximum length: 160 characters (optimal for search results display)
 * - Recommended: 150-160 characters for best desktop/mobile display
 */

import { readFileSync } from 'fs';
import { globSync } from 'glob';

interface MetaDescriptionIssue {
  file: string;
  pageTitle: string;
  description: string;
  length: number;
  issue: 'too_short' | 'too_long' | 'ok';
  recommendation?: string;
}

const MIN_LENGTH = 120;
const MAX_LENGTH = 160;
const OPTIMAL_MIN = 150;

function extractMetaDescriptions(): MetaDescriptionIssue[] {
  const issues: MetaDescriptionIssue[] = [];
  
  // Find all page files
  const pageFiles = globSync('client/src/pages/**/*.tsx');
  
  for (const file of pageFiles) {
    const content = readFileSync(file, 'utf-8');
    
    // Extract SEOHead description prop
    const seoHeadMatch = content.match(/<SEOHead[\s\S]*?description="([^"]*)"[\s\S]*?\/>/);
    const titleMatch = content.match(/<SEOHead[\s\S]*?title="([^"]*)"[\s\S]*?\/>/);
    
    if (seoHeadMatch && titleMatch) {
      const description = seoHeadMatch[1];
      const title = titleMatch[1];
      const length = description.length;
      
      let issue: 'too_short' | 'too_long' | 'ok' = 'ok';
      let recommendation: string | undefined;
      
      if (length < MIN_LENGTH) {
        issue = 'too_short';
        recommendation = `Add ${MIN_LENGTH - length} more characters (looks incomplete in search results)`;
      } else if (length > MAX_LENGTH) {
        issue = 'too_long';
        recommendation = `Remove ${length - MAX_LENGTH} characters (will be truncated in search results)`;
      } else if (length < OPTIMAL_MIN) {
        recommendation = `Consider adding ${OPTIMAL_MIN - length} more characters for optimal display`;
      }
      
      issues.push({
        file: file.replace('client/src/pages/', '').replace('.tsx', ''),
        pageTitle: title,
        description,
        length,
        issue,
        recommendation
      });
    }
  }
  
  return issues;
}

function validateMetaDescriptions() {
  console.log('🔍 Validating meta descriptions across all pages...\n');
  
  const issues = extractMetaDescriptions();
  const errors = issues.filter(i => i.issue !== 'ok');
  const warnings = issues.filter(i => i.issue === 'ok' && i.recommendation);
  const perfect = issues.filter(i => i.issue === 'ok' && !i.recommendation);
  
  if (errors.length > 0) {
    console.log('❌ ERRORS - Must fix before deployment:\n');
    errors.forEach(issue => {
      const emoji = issue.issue === 'too_short' ? '📏' : '✂️';
      console.log(`${emoji} ${issue.file}`);
      console.log(`   Title: ${issue.pageTitle}`);
      console.log(`   Length: ${issue.length} chars`);
      console.log(`   Description: "${issue.description}"`);
      console.log(`   ⚠️  ${issue.recommendation}\n`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS - Consider optimizing:\n');
    warnings.forEach(issue => {
      console.log(`💡 ${issue.file}`);
      console.log(`   Length: ${issue.length} chars`);
      console.log(`   ${issue.recommendation}\n`);
    });
  }
  
  if (perfect.length > 0) {
    console.log(`✅ PERFECT (${OPTIMAL_MIN}-${MAX_LENGTH} chars): ${perfect.length} pages\n`);
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Total pages: ${issues.length}`);
  console.log(`   ✅ Perfect: ${perfect.length}`);
  console.log(`   ⚠️  Warnings: ${warnings.length}`);
  console.log(`   ❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Validation failed! Fix errors before deploying.');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n✅ Validation passed with warnings. Consider optimizing for best SEO.');
    process.exit(0);
  } else {
    console.log('\n✅ All meta descriptions are perfect!');
    process.exit(0);
  }
}

validateMetaDescriptions();
