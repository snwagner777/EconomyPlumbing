# Google My Business OAuth Setup Guide

This guide will help you set up Google OAuth credentials to connect your Google Business Profile for automated review management.

## 📋 Prerequisites

- Google Business Profile account (formerly Google My Business)
- Google Cloud Platform account (free)
- Admin access to your Replit project

---

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project (5 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it: "Economy Plumbing GMB Integration"
   - Click "Create"
   - Wait for project creation (usually takes 10-20 seconds)

3. **Select Your New Project**
   - Click the project dropdown again
   - Select your newly created project

---

### Step 2: Enable Required APIs (3 minutes)

1. **Navigate to API Library**
   - In the left sidebar, go to: **APIs & Services** → **Library**
   - Or visit: https://console.cloud.google.com/apis/library

2. **Enable Google Business Profile API**
   - Search for: "Google Business Profile API"
   - Click on it
   - Click **"Enable"**
   - Wait for it to enable (~10 seconds)

3. **Enable Business Account Management API**
   - Click "APIs & Services" → "Library" again
   - Search for: "Business Account Management API"
   - Click on it
   - Click **"Enable"**

4. **Request API Access** ⚠️ **IMPORTANT**
   - The Business Profile APIs require approval
   - Fill out the access request form: https://developers.google.com/my-business/content/basic-setup#request-access
   - Google typically approves within 2-3 business days
   - **Note:** You can continue with the setup, but the API won't work until approved

---

### Step 3: Configure OAuth Consent Screen (5 minutes)

1. **Navigate to OAuth Consent Screen**
   - In left sidebar: **APIs & Services** → **OAuth consent screen**
   - Or visit: https://console.cloud.google.com/apis/credentials/consent

2. **Choose User Type**
   - Select **"External"** (unless you have a Google Workspace org)
   - Click **"Create"**

3. **Fill Out App Information**
   - **App name:** Economy Plumbing Admin
   - **User support email:** Your email
   - **Developer contact email:** Your email
   - Click **"Save and Continue"**

4. **Add Scopes**
   - Click **"Add or Remove Scopes"**
   - Search for: `business.manage`
   - Check the box for: `https://www.googleapis.com/auth/business.manage`
   - Click **"Update"**
   - Click **"Save and Continue"**

5. **Test Users** (Skip this step)
   - Click **"Save and Continue"**

6. **Summary**
   - Review your settings
   - Click **"Back to Dashboard"**

---

### Step 4: Create OAuth 2.0 Credentials (5 minutes)

1. **Navigate to Credentials**
   - In left sidebar: **APIs & Services** → **Credentials**
   - Or visit: https://console.cloud.google.com/apis/credentials

2. **Create OAuth Client ID**
   - Click **"+ Create Credentials"** at the top
   - Select **"OAuth client ID"**

3. **Configure the OAuth Client**
   - **Application type:** Web application
   - **Name:** Economy Plumbing GMB OAuth
   
4. **Add Authorized Redirect URIs** ⚠️ **CRITICAL**
   - Click **"+ Add URI"** under "Authorized redirect URIs"
   - Add your production URL:
     ```
     https://YOUR-REPLIT-DOMAIN.replit.app/api/google/oauth/callback
     ```
   - **Important:** Replace `YOUR-REPLIT-DOMAIN` with your actual Replit domain
   - For development, also add:
     ```
     http://localhost:5000/api/google/oauth/callback
     ```

5. **Create the Client**
   - Click **"Create"**
   - A popup will show your **Client ID** and **Client Secret**
   - **⚠️ IMPORTANT:** Copy both values immediately!
   - Click **"Download JSON"** to save a backup
   - Click **"OK"**

---

### Step 5: Add Credentials to Replit (2 minutes)

1. **Open Replit Secrets**
   - In your Replit project, click the lock icon (🔒) in the left sidebar
   - Or go to: Tools → Secrets

2. **Add Google Client ID**
   - Click **"+ New Secret"**
   - Key: `GOOGLE_CLIENT_ID`
   - Value: Paste the Client ID from Google Cloud Console
   - Click **"Add Secret"**

3. **Add Google Client Secret**
   - Click **"+ New Secret"** again
   - Key: `GOOGLE_CLIENT_SECRET`
   - Value: Paste the Client Secret from Google Cloud Console
   - Click **"Add Secret"**

4. **Verify Environment Variables**
   - Make sure these two secrets appear in your Secrets list:
     - ✅ `GOOGLE_CLIENT_ID`
     - ✅ `GOOGLE_CLIENT_SECRET`

---

### Step 6: Authorize Your Google Business Profile (2 minutes)

1. **Go to GMB Setup Page**
   - In your browser, visit: `https://YOUR-DOMAIN.replit.app/admin/gmb-setup`
   - Or from admin panel: Admin → GMB Setup

2. **Click "Authorize with Google"**
   - This will redirect you to Google
   - Sign in with the Google account that manages your Business Profile

3. **Grant Permissions**
   - Review the permissions requested
   - Click **"Allow"** or **"Continue"**

4. **Verify Connection**
   - You'll be redirected back to `/admin/gmb-setup?success=true`
   - You should see:
     - ✅ Connection Status: Connected
     - Account ID displayed
     - Location ID displayed
     - Token expiry date

---

## ✅ Verification & Testing

### Check if Everything Works

1. **View Admin Dashboard**
   - Go to `/admin` or `/admin/reputation`
   - Check if reviews are appearing

2. **Manual Review Fetch** (Optional)
   - Open browser console
   - Check for GMB-related logs
   - Look for: "Successfully fetched X reviews"

3. **Monitor Background Jobs**
   - Reviews fetch automatically every **6 hours**
   - AI replies post automatically every **15 minutes**
   - Check Replit logs for activity

---

## 🔧 Troubleshooting

### Problem: "invalid_client" Error

**Cause:** OAuth credentials are incorrect or missing

**Solution:**
1. Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Replit Secrets
2. Make sure there are no extra spaces or line breaks
3. Verify the credentials match what's in Google Cloud Console

---

### Problem: "redirect_uri_mismatch" Error

**Cause:** The redirect URI in your OAuth request doesn't match what's configured in Google Cloud Console

**Solution:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", make sure you have:
   ```
   https://YOUR-ACTUAL-REPLIT-DOMAIN.replit.app/api/google/oauth/callback
   ```
4. Make sure the URL is **exact** (https, correct domain, correct path)
5. Save changes and try again

---

### Problem: "Access Not Configured" Error

**Cause:** Google Business Profile API not enabled or not approved

**Solution:**
1. Make sure you enabled both APIs in Step 2
2. Check if Google approved your API access request
3. Wait 2-3 business days if you just submitted the request
4. Check your email for approval notification from Google

---

### Problem: No Reviews Fetching

**Possible Causes:**
- OAuth token expired
- Account/Location IDs not captured during authorization
- API rate limits

**Solution:**
1. Check `/admin/gmb-setup` for connection status
2. Try re-authorizing (click "Reconnect Google Account")
3. Check Replit logs for error messages
4. Make sure you have the Business Profile account with reviews

---

## 📊 What Happens After Setup

### Automatic Review Fetching
- Runs every **6 hours**
- Fetches all reviews from Google Business Profile
- Saves to your database with categories and metadata

### AI Auto-Reply System
- Checks for unreplied reviews every **15 minutes**
- Uses **GPT-4o** to generate personalized responses
- Different prompts for positive (4-5 star) vs negative (1-3 star) reviews
- Automatically posts replies back to Google Business Profile

### Admin Dashboard
- View all reviews at `/admin/reputation`
- Manually generate/edit replies before posting
- Monitor auto-reply status
- Track review metrics

---

## 🎯 Next Steps After Setup

1. **Test the AI Replies**
   - Check a few auto-generated replies
   - Adjust the prompts in `server/lib/gmbAutomation.ts` if needed

2. **Customize AI Prompts** (Optional)
   - Edit the prompt templates in `generateAIReply()` function
   - Adjust tone, length, sign-off, etc.

3. **Monitor Performance**
   - Check review response rate
   - Monitor customer sentiment
   - Track review volume over time

---

## 🔐 Security Best Practices

- ✅ Never commit `GOOGLE_CLIENT_SECRET` to version control
- ✅ Use Replit Secrets for all credentials
- ✅ Regularly refresh OAuth tokens (happens automatically)
- ✅ Monitor access logs for suspicious activity
- ✅ Use the same Google account that manages your Business Profile

---

## 📞 Support Resources

- **Google Business Profile API Docs:** https://developers.google.com/my-business
- **OAuth 2.0 Setup Guide:** https://developers.google.com/my-business/content/implement-oauth
- **API Access Request:** https://developers.google.com/my-business/content/basic-setup

---

## ✨ You're Done!

Once everything is set up, your system will:
- 🔄 Automatically fetch new reviews every 6 hours
- 🤖 Generate AI-powered responses every 15 minutes
- 📊 Track all reviews in your admin dashboard
- 🎯 Maintain your brand voice with customizable prompts

Good luck! 🚀
