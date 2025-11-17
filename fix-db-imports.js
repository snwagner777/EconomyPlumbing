#!/usr/bin/env node

/**
 * Script to convert top-level db imports to lazy loading
 * This fixes production 500 errors caused by database initialization at module load time
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  'app/api/review-feedback/route.ts',
  'app/api/chatbot/route.ts',
  'app/api/chatbot/end-conversation/route.ts',
  'app/api/chatbot/feedback/route.ts',
  'app/api/chatbot/conversation/[conversationId]/route.ts',
  'app/api/portal/estimates/[id]/pdf/route.ts',
  'app/api/portal/invoices/[id]/pdf/route.ts',
  'app/api/customer-portal/reschedule-appointment/route.ts',
  'app/api/customer-portal/cancel-job/route.ts',
  'app/api/customer-portal/jobs/route.ts',
  'app/api/portal/request-pdf/route.ts',
  'app/api/customer-portal/account/route.ts',
  'app/api/generate-plumbing-image/route.ts',
  'app/api/admin/seo-audits/route.ts',
  'app/api/blog/generate-historic-by-category/route.ts',
  'app/api/portal/customer-stats/[customerId]/route.ts',
  'app/api/admin/seo-audits/[jobId]/route.ts',
  'app/api/admin/seo-audits/[jobId]/cancel/route.ts',
  'app/api/contact/route.ts',
  'app/api/admin/seo-audits/batches/route.ts',
  'app/api/portal/auth/lookup-by-phone/route.ts',
  'app/api/admin/sync-status/route.ts',
  'app/api/admin/contact-submissions/route.ts',
  'app/api/portal/auth/verify-account/route.ts',
  'app/api/portal/auth/send-phone-magic-link/route.ts',
  'app/api/portal/auth/send-code/route.ts',
  'app/api/admin/portal-analytics/route.ts',
  'app/api/admin/sms-campaigns/route.ts',
  'app/api/portal/auth/verify-code/route.ts',
  'app/api/portal/auth/lookup/route.ts',
  'app/api/admin/estimate-logs/route.ts',
  'app/api/portal/rate-technician/route.ts',
  'app/api/public/complete-membership/route.ts',
  'app/api/portal/recent-jobs/route.ts',
  'app/api/admin/referrals/route.ts',
  'app/api/email-preferences/route.ts',
  'app/api/admin/invoice-logs/route.ts',
  'app/api/admin/conversion-stats/route.ts',
  'app/api/admin/referrals/success-emails/route.ts',
  'app/api/admin/referrals/thank-you-emails/route.ts',
  'app/api/email-preferences/[token]/route.ts',
  'app/api/admin/top-customers/route.ts',
  'app/api/photos/import-google-drive/route.ts',
  'app/api/admin/reprocess-photos/route.ts',
  'app/api/email-preferences/[token]/unsubscribe-all/route.ts',
  'app/api/email-preferences/unsubscribe/route.ts',
  'app/api/admin/customer-imports/route.ts',
  'app/api/customers/leaderboard/route.ts',
  'app/api/referrals/referrer/[customerId]/route.ts',
  'app/api/conversions/track/route.ts',
  'app/api/referrals/capture-referee/route.ts',
  'app/api/admin/referral-email-settings/route.ts',
  'app/api/referrals/capture-landing/route.ts',
  'app/api/admin/referrals/approve-success-email/[id]/route.ts',
  'app/api/referrals/code/route.ts',
  'app/api/admin/referral-email-preview/route.ts',
  'app/api/admin/customer-metrics/route.ts',
  'app/api/referrals/code/[customerId]/route.ts',
  'app/api/admin/portal-stats/route.ts',
  'app/api/referrals/customer/route.ts',
  'app/api/referrals/customer/[customerId]/route.ts',
  'app/api/referrals/leaderboard/route.ts',
  'app/api/admin/referral-stats/route.ts',
  'app/api/scheduler/otp/verify/route.ts',
  'app/api/referrals/submit/route.ts',
  'app/api/admin/custom-campaigns/route.ts',
  'app/api/admin/custom-campaigns/[id]/route.ts',
  'app/api/admin/custom-campaigns/[id]/send-log/route.ts',
  'app/api/admin/custom-campaigns/[id]/emails/route.ts',
  'app/api/admin/custom-campaigns/[id]/emails/[emailId]/route.ts',
  'app/api/admin/customer-segments/route.ts',
  'app/api/admin/customer-segments/[id]/route.ts',
  'app/api/admin/customer-segments/[id]/members/route.ts',
  'app/api/admin/campaign-analytics/recent/route.ts',
  'app/api/scheduler/complete-backflow-booking/route.ts',
  'app/api/scheduler/ensure-customer/route.ts',
  'app/api/scheduler/lookup-customer/route.ts',
  'app/api/scheduler/smart-availability/route.ts',
  'app/api/admin/campaign-analytics/by-type/route.ts',
  'app/api/admin/referrals/approve-thank-you-email/[id]/route.ts',
  'app/api/admin/page-metadata/route.ts',
  'app/api/scheduler/book/route.ts',
  'app/api/admin/campaign-analytics/overview/route.ts',
  'app/api/reviews/feedback/route.ts',
  'app/api/admin/email-send-log/route.ts',
  'app/api/admin/emails/sample-customer/route.ts',
  'app/api/vouchers/customer/[customerId]/route.ts',
  'app/api/admin/emails/templates/route.ts',
  'app/api/admin/chatbot/route.ts',
  'app/api/admin/chatbot/quick-responses/route.ts',
  'app/api/admin/referrals/generate-success-email/route.ts',
  'app/api/admin/emails/templates/[campaignType]/[emailNumber]/route.ts',
  'app/api/admin/photos/[id]/focal-point/route.ts',
  'app/api/admin/chatbot/quick-responses/[id]/route.ts',
  'app/api/vouchers/lookup/route.ts',
  'app/api/admin/settings/route.ts',
  'app/api/admin/emails/save-template/route.ts',
  'app/api/admin/review-requests/settings/route.ts',
  'app/api/admin/referrals/generate-thank-you-email/route.ts',
  'app/api/admin/customers/route.ts',
  'app/api/admin/chatbot/conversation/[id]/route.ts',
  'app/api/admin/referrals/[id]/credit/route.ts',
  'app/api/admin/referrals/[id]/issue-credit/route.ts',
  'app/api/admin/referrals/[id]/ineligible/route.ts',
  'app/api/admin/chatbot/conversation/[id]/email/route.ts',
  'app/api/admin/referrals/[id]/route.ts',
  'app/api/admin/chatbot/analytics/route.ts',
  'app/api/admin/referrals/record-credit-usage/route.ts',
  'app/api/admin/chatbot/conversations/route.ts',
  'app/api/admin/success-stories/route.ts',
  'app/api/admin/success-stories/[id]/route.ts',
  'app/api/admin/reviews/[id]/post-reply/route.ts',
  'app/api/admin/reviews/clear/route.ts',
  'app/api/admin/reviews/[id]/generate-reply/route.ts',
  'app/api/admin/reviews/serpapi/sync/route.ts',
  'app/api/admin/reviews/serpapi/stats/route.ts',
  'app/api/admin/success-stories/[id]/approve/route.ts',
  'app/api/admin/photo-fetch-jobs/route.ts',
  'app/api/admin/photo-fetch-jobs/retry/route.ts'
];

let successCount = 0;
let failCount = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    failCount++;
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it has the import
  const hasDbImport = /import\s+\{\s*db\s*\}\s+from\s+['"](\.\.\/)*(@\/)?server\/db['"];?/.test(content);
  
  if (!hasDbImport) {
    console.log(`⏭️  Skipping ${file} - no db import found`);
    return;
  }

  // Remove the import line
  content = content.replace(/import\s+\{\s*db\s*\}\s+from\s+['"](\.\.\/)*(@\/)?server\/db['"];?\s*\n/g, '');
  
  // Add lazy import at the start of each handler function (GET, POST, PUT, DELETE, PATCH)
  content = content.replace(
    /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{/g,
    (match) => {
      return match + '\n  const { db } = await import(\'@/server/db\');';
    }
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed ${file}`);
  successCount++;
});

console.log(`\n✅ Fixed ${successCount} files`);
if (failCount > 0) {
  console.log(`❌ Failed ${failCount} files`);
}
