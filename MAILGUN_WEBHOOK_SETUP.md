# Mailgun Webhook Setup - ServiceTitan PDF Processing

## Overview

The email-based job tracking system processes ServiceTitan PDFs sent via email to automatically trigger review request and quote follow-up campaigns. A **unified webhook** intelligently detects document type and routes to the appropriate processing pipeline.

---

## Webhook URL

**Single Endpoint:** `https://your-domain.replit.app/api/webhooks/mailgun/servicetitan`

This unified webhook:
- ✅ Receives **all** ServiceTitan emails (invoices and estimates) at one endpoint
- ✅ Automatically detects document type based on filename and subject
- ✅ Routes to the correct database table (invoice_processing_log or estimate_processing_log)
- ✅ Handles unknown document types gracefully (defaults to invoice processing)
- ✅ Verifies HMAC-SHA256 signatures for security

---

## Mailgun Dashboard Configuration

### Step 1: Create Route
1. Go to **Mailgun Dashboard** → **Sending** → **Routes**
2. Click **Create Route**
3. Configure as follows:

**Priority:** `0` (highest - process first)

**Match Recipient (Expression Type):**
```
match_recipient("servicetitan@your-domain.com")
```
Or if using a forwarding address:
```
match_recipient(".*@your-domain.com")
```

**Actions:**
```
forward("https://your-domain.replit.app/api/webhooks/mailgun/servicetitan")
store(notify="https://your-domain.replit.app/api/webhooks/mailgun/servicetitan")
```

**Description:** "ServiceTitan PDF Processing - Unified Webhook"

4. Click **Create Route**

---

## How Document Type Detection Works

The webhook analyzes **both** the email subject and PDF filename to determine document type:

### Invoice Keywords (triggers invoice processing):
- `invoice`
- `receipt`
- `payment`
- `completed job`

### Estimate Keywords (triggers estimate processing):
- `estimate`
- `quote`
- `proposal`
- `bid`

### Unknown Documents:
- Default to **invoice processing** if no keywords match
- Admin can manually review and reclassify in the Email Processing section

---

## Email Routing Setup

Configure ServiceTitan to forward PDFs to your Mailgun inbox:

### Option 1: Direct Forwarding
1. In ServiceTitan, set up email forwarding rules
2. Forward to: `servicetitan@your-mailgun-domain.com`

### Option 2: Manual Forwarding (for testing)
1. When you receive a ServiceTitan email
2. Forward it to: `servicetitan@your-mailgun-domain.com`
3. The webhook will automatically process it

---

## Security

### HMAC-SHA256 Signature Verification
The webhook verifies **every** request using Mailgun's signing key.

**Required Secret:** `MAILGUN_SIGNING_KEY`

**How to find your signing key:**
1. Go to Mailgun Dashboard → **Sending** → **Domain Settings**
2. Click **Domain Details** for your domain
3. Copy the **HTTP webhook signing key**
4. Add to Replit Secrets as `MAILGUN_SIGNING_KEY`

**What happens without the signing key:**
- ❌ Webhook returns `500 Internal Server Error`
- ❌ Email is NOT processed
- ❌ Mailgun will retry delivery

---

## Webhook Responses

### Success (200 OK)
```json
{
  "message": "Invoice received and logged",
  "documentType": "invoice",
  "filename": "Invoice-12345.pdf"
}
```

### No PDF Attachment (200 OK)
```json
{
  "message": "No PDF attachment found"
}
```
*Note: Returns 200 so Mailgun doesn't retry - this is expected for some emails*

### Authentication Errors

**Missing Signature (401 Unauthorized):**
```json
{
  "error": "Missing signature fields"
}
```

**Invalid Signature (403 Forbidden):**
```json
{
  "error": "Invalid signature"
}
```

### Processing Errors (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```
*Mailgun will retry these failures*

---

## Admin Monitoring

View all webhook attempts in the **Admin Dashboard:**

1. Go to `/admin` (login required)
2. Click **Email Processing** in the sidebar
3. View tabs:
   - **Invoice Logs** - Completed job PDFs
   - **Estimate Logs** - Quote PDFs

### Log Information Displayed:
- ✅ Email sender, subject, received timestamp
- ✅ PDF filename and file size
- ✅ Processing status (Pending, Parsed, Completed, Failed)
- ✅ Error messages (if any)
- ✅ Extracted data (once PDF parsing is implemented)

---

## Testing

### Test with Sample Email

1. **Send a test email** to your Mailgun route with:
   - Subject containing "invoice" or "estimate"
   - PDF attachment

2. **Check webhook logs:**
   ```bash
   # In your Replit console
   tail -f logs/workflow.log | grep "Mailgun Webhook"
   ```

3. **Check admin dashboard:**
   - Go to `/admin` → Email Processing
   - Verify the log entry appears with "Pending" status

### Example Test Email
```
To: servicetitan@your-mailgun-domain.com
Subject: Invoice for Job #12345
Attachment: Invoice-12345.pdf
```

---

## Troubleshooting

### Email Not Appearing in Admin Dashboard

**Check 1:** Verify Mailgun route is active
- Go to Mailgun Dashboard → Routes
- Ensure route is **not disabled**

**Check 2:** Verify webhook URL is correct
- Should be: `https://your-domain.replit.app/api/webhooks/mailgun/servicetitan`
- **Not** `/invoices` or `/estimates` (those are separate endpoints)

**Check 3:** Check Mailgun logs
- Go to Mailgun Dashboard → Logs
- Search for your email
- Check webhook delivery status

**Check 4:** Verify signing key
- Ensure `MAILGUN_SIGNING_KEY` is set in Replit Secrets
- Key should match your Mailgun domain settings

### PDF Not Being Detected

**Check:** Email must have a PDF attachment
- File extension must be `.pdf`
- MIME type must be `application/pdf`

### Wrong Document Type Detected

**Solution:** Manually update in admin dashboard (coming soon)
- Or update detection keywords in:
  ```
  app/api/webhooks/mailgun/servicetitan/route.ts
  ```
- Function: `detectDocumentType()`

---

## Next Steps (After PDF Parsing is Implemented)

Once PDF parsing is complete, the webhook will automatically:

1. **Extract data** from PDF (customer name, email, phone, amount, etc.)
2. **Match customer** to existing database records
3. **For invoices:**
   - Create `jobCompletion` record
   - Trigger review request campaign
4. **For estimates:**
   - Skip $0 quotes
   - Trigger quote follow-up campaign for non-zero estimates

All of this happens automatically - no manual intervention required!

---

## Support

**Webhook Endpoint:** `/api/webhooks/mailgun/servicetitan`
**Admin Dashboard:** `/admin` → Email Processing
**Documentation:** This file

For questions or issues, check the admin dashboard logs first - they show detailed error messages for every webhook attempt.
