module.exports=[224943,e=>{"use strict";var r=e.i(457420),t=e.i(190337),a=e.i(875225);e.i(889228);let i=new(e.i(91601)).default({apiKey:process.env.OPENAI_API_KEY});async function n(e){let r,{campaignType:t,emailNumber:a,jobDetails:n,phoneNumber:s,referralLink:o,strategy:l}=e,{season:u,context:m}=(r=new Date().getMonth())>=11||r<=1?{season:"winter",context:"Winter freeze protection is critical in Texas. Mention protecting pipes, water heater maintenance before cold snaps, and emergency service availability."}:r>=2&&r<=4?{season:"spring",context:"Spring is the perfect time for plumbing maintenance. Mention checking for winter damage, preparing for summer heat, and scheduling annual inspections."}:r>=5&&r<=7?{season:"summer",context:"Summer heat stresses plumbing systems. Mention water heater efficiency, increased water usage, A/C condensate line maintenance, and irrigation system checks."}:{season:"fall",context:"Fall is ideal for preparing plumbing for winter. Mention water heater inspections before winter, outdoor faucet winterization, and scheduling service before holidays."},c=l||("review_request"===t||"referral_nurture"===t?({1:"value",2:"trust",3:"social_proof",4:"urgency"})[a]||"value":({1:"value",2:"trust",3:"seasonal",4:"urgency"})[a]||"value"),d=`Email ${a} of 4`,p="referral_nurture"===t?[14,60,150,210][a-1]:[1,7,14,21][a-1],f=`You are an expert email copywriter for Economy Plumbing Services, a family-owned plumbing company serving Austin and Central Texas.

Brand Voice:
- Friendly, professional, and trustworthy
- Texas-local feel (but not overly "y'all")
- Focus on quality service and customer relationships
- Value honesty and transparency
- Family-owned business for 20+ years

CRITICAL: Template Generation Rules:
- You are creating TEMPLATES with merge fields, not personalized emails
- Use merge field syntax: {{customerName}}, {{serviceType}}, {{jobAmount}}, {{location}}
- NEVER use hardcoded names like "John" or "Sarah"
- DO NOT include seasonal content (fall, winter, summer, etc.) - that will be added dynamically at send-time
- DO NOT reference specific job details - use merge fields instead
- Templates should be evergreen and work year-round
- The admin will approve the template structure/tone, then AI will personalize for each customer at send-time
- Available merge fields: {{customerName}}, {{serviceType}}, {{jobAmount}}, {{location}}, {{jobDate}}

Email Guidelines:
- Keep subject lines under 50 characters, compelling and personal
- Preheader should complement subject (40-80 chars)
- Use HTML formatting with proper structure
- Include clear call-to-action buttons
- Mobile-friendly layout
- Use merge fields for personalization ({{customerName}}, {{serviceType}}, etc.)
- ${s?`Include phone number ${s} for tracking`:"No phone number tracking"}`,h="";h="review_request"===t?`
Generate a review request email with these specifications:

Campaign Details:
- Type: Review Request Drip Campaign
- ${d} in sequence (sent ${p} days after service completion)
- Strategy: ${c}
- NOTE: Do NOT include seasonal context in template - it will be added dynamically when sending

Template Context (use merge fields, not actual values):
- Example Customer Name: ${n.customerName} → Use {{customerName}} in template
- Example Service: ${n.serviceType||"plumbing service"} → Use {{serviceType}} in template
- Example Job Amount: ${n.jobAmount?`$${(n.jobAmount/100).toFixed(2)}`:"varies"} → Use {{jobAmount}} in template
- Example Location: ${n.location||"Central Texas"} → Use {{location}} in template

IMPORTANT: Create a TEMPLATE using {{merge_fields}}, not a personalized email with hardcoded values!

Email Objectives:
${1===a?`
- Thank customer for choosing Economy Plumbing
- Emphasize quality of service provided
- Make leaving a review EASY (mention Google, Facebook, direct links)
- Light ask, not pushy
`:2===a?`
- Gentle reminder about review request
- Emphasize how feedback helps improve service
- Show appreciation for their business
- Mention we're always here if they need anything
`:3===a?`
- Social proof: mention that other customers love sharing experiences
- Explain how reviews help local families find great plumbers
- Still friendly, slightly more direct
- Offer to address any concerns if they haven't reviewed
`:`
- Final gentle reminder
- Express that we'd love to hear their feedback
- Last chance framing (but warm, not desperate)
- Thank them regardless of whether they review
`}

${s?`IMPORTANT: Include the phone number ${s} in the email signature for tracking purposes. Format: "Questions? Call us at ${s}"`:""}

Include a clear CTA button with text like "Leave a Review" that links to: https://plumbersthatcare.com/leave-review

CRITICAL UTM TRACKING REQUIREMENT:
ALL links in the email MUST include UTM parameters for attribution tracking:
- utm_source=review_request_email
- utm_medium=email
- utm_campaign=review_drip_email_${a}

Example: https://plumbersthatcare.com/leave-review?utm_source=review_request_email&utm_medium=email&utm_campaign=review_drip_email_${a}

Apply these UTM parameters to ALL website links in the email (buttons, text links, footer links, etc.).

Generate:
1. Subject line (under 50 chars, ${c} focused)
2. Preheader text (40-80 chars)
3. HTML email body (well-formatted, professional, mobile-friendly)
4. Plain text version (clean, readable)

Return as JSON:
{
  "subject": "...",
  "preheader": "...",
  "bodyHtml": "...",
  "bodyPlain": "..."
}
`:"referral_nurture"===t?`
Generate a referral nurture email with these specifications:

Campaign Details:
- Type: Referral Nurture Campaign
- ${d} in sequence (sent ${p} days after positive review)
- Strategy: ${c}
- NOTE: Do NOT include seasonal context in template - it will be added dynamically when sending

Template Context (use merge fields, not actual values):
- Example Customer Name: ${n.customerName} → Use {{customerName}} in template
- Example Service: ${n.serviceType||"plumbing service"} → Use {{serviceType}} in template
- Example Location: ${n.location||"Central Texas"} → Use {{location}} in template

IMPORTANT: Create a TEMPLATE using {{merge_fields}}, not a personalized email with hardcoded values!

Referral Program Details:
- Referrer earns $25 account credit for each successful referral
- Referee gets quality service from trusted local plumber
- Simple process: share unique link or referral code

Email Objectives:
${1===a?`
- Introduce referral program (they left positive review, so they're happy!)
- Explain $25 credit reward per referral
- Make it EASY to share (unique link, simple process)
- Focus on helping friends/family find great plumber
- Mention referral link available in customer portal
`:2===a?`
- Gentle reminder about referral program
- Emphasize helping friends/neighbors
- Share that they're earning rewards for referrals
- Maybe include a mini success story
- Reinforce trust and quality service
`:3===a?`
- Social proof: mention how many customers have referred friends
- Success stories from referral program
- Emphasize community benefit (helping local families)
- Reminder of $25 per referral reward
`:`
- Final touch: opportunity still available
- Soft close with appreciation
- Thank them for being valued customer
- Leave door open for future referrals
- No pressure, just gratitude
`}

${s?`IMPORTANT: Include the phone number ${s} in the email signature for tracking purposes. Format: "Questions? Call us at ${s}"`:""}

${o?`CRITICAL: Include their unique referral link in the email: ${o}

Instructions for including the referral link:
- Prominently display their referral link: ${o}
- Explain they can share this link with friends, family, and neighbors
- When someone books service through their link, they earn $25 credit
- Make the link easy to copy and share (formatted as clickable button and also plain text)
- Include a clear CTA button that links to: ${o}`:"CRITICAL: Tell them to visit https://plumbersthatcare.com/customer-portal to get their personalized referral link. Include a CTA button that links to: https://plumbersthatcare.com/customer-portal"}

CRITICAL UTM TRACKING REQUIREMENT:
ALL links to plumbersthatcare.com in the email MUST include UTM parameters for attribution tracking:
- utm_source=referral_nurture_email
- utm_medium=email
- utm_campaign=referral_drip_email_${a}

Example for customer portal link: https://plumbersthatcare.com/customer-portal?utm_source=referral_nurture_email&utm_medium=email&utm_campaign=referral_drip_email_${a}

Apply these UTM parameters to ALL plumbersthatcare.com links (buttons, text links, footer links, etc.).
NOTE: Do NOT add UTM parameters to the unique referral link ${o||""} - only to regular website links.

Generate:
1. Subject line (under 50 chars, ${c} focused)
2. Preheader text (40-80 chars)
3. HTML email body (well-formatted, professional, mobile-friendly, includes referral link instructions)
4. Plain text version (clean, readable)

Return as JSON:
{
  "subject": "...",
  "preheader": "...",
  "bodyHtml": "...",
  "bodyPlain": "..."
}
`:`
Generate a quote follow-up email with these specifications:

Campaign Details:
- Type: Quote Follow-up Campaign (for customers who received estimate but no work completed)
- ${d} in sequence (sent ${p} days after quote/estimate)
- Strategy: ${c}
- NOTE: Do NOT include seasonal context in template - it will be added dynamically when sending

Template Context (use merge fields, not actual values):
- Example Customer Name: ${n.customerName} → Use {{customerName}} in template
- Example Service: ${n.serviceType||"plumbing service"} → Use {{serviceType}} in template
- Example Location: ${n.location||"Central Texas"} → Use {{location}} in template

IMPORTANT: Create a TEMPLATE using {{merge_fields}}, not a personalized email with hardcoded values!

Important Context:
- This customer received a quote/estimate but NO WORK WAS DONE (invoice was $0)
- We want to stay top-of-mind for when they're ready to move forward
- Focus on nurturing the relationship, not pressuring them
- If they appreciated our professionalism during the estimate, that's worth mentioning

Email Objectives:
${1===a?`
- Thank them for considering Economy Plumbing
- Acknowledge that they received a quote but haven't moved forward yet
- Let them know we're here when they're ready
- Soft ask: if they appreciated our professionalism during the quote, we'd love to hear about it
- NO PRESSURE - just staying in touch
`:2===a?`
- Gentle check-in: "Just following up on your estimate"
- Offer help: "Do you have any questions about the quote?"
- Reinforce our value: quality work, fair pricing, family-owned
- Mention we're always here to help, even with questions
- Build trust and stay top-of-mind
`:3===a?`
- Seasonal reminder: ${m}
- Timely service recommendation based on season
- Educational value: why this service matters now
- Still warm and helpful, not salesy
- "When you're ready, we're here"
`:`
- Final soft touch: limited-time seasonal offer or discount (if appropriate)
- Express appreciation for their consideration
- Leave door open: "We hope to earn your business in the future"
- Include testimonial or social proof
- Thank them regardless of whether they book
`}

${s?`IMPORTANT: Include the phone number ${s} in the email signature for tracking purposes. Format: "Questions? Call us at ${s}"`:""}

Include a clear CTA button with text like "Get a Quote" or "Schedule Service" that links to: https://plumbersthatcare.com/contact

CRITICAL UTM TRACKING REQUIREMENT:
ALL links in the email MUST include UTM parameters for attribution tracking:
- utm_source=quote_followup_email
- utm_medium=email
- utm_campaign=quote_followup_drip_email_${a}

Example: https://plumbersthatcare.com/contact?utm_source=quote_followup_email&utm_medium=email&utm_campaign=quote_followup_drip_email_${a}

Apply these UTM parameters to ALL website links in the email (buttons, text links, footer links, etc.).

Generate:
1. Subject line (under 50 chars, ${c} focused, NOT pushy)
2. Preheader text (40-80 chars)
3. HTML email body (well-formatted, professional, mobile-friendly)
4. Plain text version (clean, readable)

Return as JSON:
{
  "subject": "...",
  "preheader": "...",
  "bodyHtml": "...",
  "bodyPlain": "..."
}
`;try{let e=await i.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:f},{role:"user",content:h}],response_format:{type:"json_object"},temperature:.7}),r=e.choices[0]?.message?.content;if(!r)throw Error("No content generated from AI");let t=JSON.parse(r);return{subject:t.subject,preheader:t.preheader,bodyHtml:t.bodyHtml,bodyPlain:t.bodyPlain,strategy:c,seasonalContext:`${u}: ${m}`}}catch(e){throw console.error("[AI Email Generator] Error:",e),Error(`Failed to generate email: ${e.message}`)}}var s=e.i(246245);class o{async createCampaignForReviewer(e,i,n){try{let s=await r.db.query.referralNurtureCampaigns.findFirst({where:(0,a.eq)(t.referralNurtureCampaigns.customerId,e)});if(s)return console.log(`[Referral Nurture] Campaign already exists for customer ${e}`),s.id;let[o]=await r.db.insert(t.referralNurtureCampaigns).values({customerId:e,customerEmail:i,originalReviewId:n,status:"queued",createdAt:new Date}).returning();return console.log(`[Referral Nurture] Created campaign ${o.id} for customer ${e}`),o.id}catch(r){return console.error(`[Referral Nurture] Error creating campaign for customer ${e}:`,r),null}}async getEmailSettings(){try{let e=await r.db.select().from(t.systemSettings),a=new Map(e.map(e=>[e.key,e.value]));return{masterEmailEnabled:"true"===a.get("review_master_email_switch"),reviewRequestEnabled:"true"===a.get("review_drip_enabled"),referralNurturePhone:a.get("referral_nurture_phone_number")||null}}catch(e){return console.error("[Referral Nurture] Error fetching settings:",e),{masterEmailEnabled:!1,reviewRequestEnabled:!1,referralNurturePhone:null}}}async canSendEmails(){let e=await this.getEmailSettings();return e.masterEmailEnabled?e.reviewRequestEnabled?e.referralNurturePhone?{allowed:!0}:{allowed:!1,reason:"Referral nurture phone number not configured"}:{allowed:!1,reason:"Review/referral drip campaigns disabled"}:{allowed:!1,reason:"Email system disabled"}}async getEmailContent(e,i,s){let o=await r.db.query.reviewEmailTemplates.findFirst({where:(0,a.and)((0,a.eq)(t.reviewEmailTemplates.campaignType,"referral_nurture"),(0,a.eq)(t.reviewEmailTemplates.emailNumber,e))});return o?(console.log(`[Referral Nurture] Using database template for email ${e}`),{subject:o.subject,htmlContent:o.htmlContent,plainTextContent:o.plainTextContent}):(console.log(`[Referral Nurture] Generating AI content for email ${e}`),await n({campaignType:"referral_nurture",emailNumber:e,customer:i,phoneNumber:s.referralNurturePhone}))}async sendReferralEmail(i,n){try{let o=await r.db.query.referralNurtureCampaigns.findFirst({where:(0,a.eq)(t.referralNurtureCampaigns.id,i)});if(!o)return console.error(`[Referral Nurture] Campaign ${i} not found`),!1;if("paused"===o.status)return console.log(`[Referral Nurture] Campaign ${i} is paused (${o.pauseReason})`),!1;let l=await this.getEmailSettings(),{emailSuppressionList:u}=await e.A(24067),m=await r.db.query.emailSuppressionList.findFirst({where:(0,a.eq)(u.email,o.customerEmail)});if(m)return console.log(`[Referral Nurture] Email ${o.customerEmail} is suppressed (${m.reason}), pausing campaign`),await r.db.update(t.referralNurtureCampaigns).set({status:"paused",pausedAt:new Date,pauseReason:m.reason}).where((0,a.eq)(t.referralNurtureCampaigns.id,i)),!1;let{canSendEmail:c,addUnsubscribeFooter:d,addUnsubscribeFooterPlainText:p}=await e.A(61778),f=await c(o.customerEmail,{type:"referral"});if(!f.canSend)return console.log(`[Referral Nurture] Skipping email - ${f.reason}`),await r.db.update(t.referralNurtureCampaigns).set({status:"paused",pausedAt:new Date,pauseReason:"opted_out"}).where((0,a.eq)(t.referralNurtureCampaigns.id,i)),!1;let h=await this.getEmailContent(n,{id:o.customerId,customerName:"",customerEmail:o.customerEmail},l);if(!process.env.RESEND_API_KEY)return console.error("[Referral Nurture] RESEND_API_KEY not configured"),!1;let g=new s.Resend(process.env.RESEND_API_KEY),w=d(h.htmlContent,f.unsubscribeUrl),b=p(h.plainTextContent,f.unsubscribeUrl);console.log(`[Referral Nurture] Sending email ${n} to ${o.customerEmail}`);let y=await g.emails.send({from:"Economy Plumbing Services <reviews@economyplumbing.com>",to:o.customerEmail,subject:h.subject,html:w,text:b,headers:{"List-Unsubscribe":f.listUnsubscribeHeader,"List-Unsubscribe-Post":"List-Unsubscribe=One-Click"}});if(y.error)return console.error("[Referral Nurture] Resend error:",y.error),!1;console.log(`[Referral Nurture] Email sent successfully. Resend ID: ${y.data?.id}`),await r.db.insert(t.emailSendLog).values({campaignType:"referral_nurture",campaignRecordId:i,emailNumber:n,recipientEmail:o.customerEmail,recipientName:"",customerId:o.customerId,resendEmailId:y.data?.id||null,resendStatus:"sent"});let v={};return v.consecutiveUnopened=o.consecutiveUnopened+1,1===n&&(v.email1SentAt=new Date,v.status="email1_sent"),2===n&&(v.email2SentAt=new Date,v.status="email2_sent"),3===n&&(v.email3SentAt=new Date,v.status="email3_sent"),4===n&&(v.email4SentAt=new Date,v.status="completed",v.completedAt=new Date),v.consecutiveUnopened>=2&&(v.status="paused",v.pausedAt=new Date,v.pauseReason="low_engagement",console.log(`[Referral Nurture] Auto-pausing campaign ${i} due to 2 consecutive unopened emails`)),await r.db.update(t.referralNurtureCampaigns).set(v).where((0,a.eq)(t.referralNurtureCampaigns.id,i)),console.log(`[Referral Nurture] Successfully sent email ${n} for campaign ${i}`),!0}catch(e){return console.error(`[Referral Nurture] Error sending email ${n} for campaign ${i}:`,e),!1}}async processPendingEmails(){try{let{allowed:e,reason:i}=await this.canSendEmails();if(!e)return void console.log(`[Referral Nurture] Skipping email sends: ${i}`);let n=new Date,s=await r.db.select().from(t.referralNurtureCampaigns).where((0,a.and)((0,a.or)((0,a.eq)(t.referralNurtureCampaigns.status,"queued"),(0,a.eq)(t.referralNurtureCampaigns.status,"email1_sent"),(0,a.eq)(t.referralNurtureCampaigns.status,"email2_sent"),(0,a.eq)(t.referralNurtureCampaigns.status,"email3_sent")),(0,a.lt)(t.referralNurtureCampaigns.consecutiveUnopened,2)));for(let e of(console.log(`[Referral Nurture] Found ${s.length} active campaigns`),s)){let r=Math.floor((n.getTime()-e.createdAt.getTime())/864e5),t=null;r>=14&&!e.email1SentAt?t=1:r>=60&&!e.email2SentAt?t=2:r>=150&&!e.email3SentAt?t=3:r>=210&&!e.email4SentAt&&(t=4),t&&(console.log(`[Referral Nurture] Sending email ${t} for campaign ${e.id} (${r} days since creation)`),await this.sendReferralEmail(e.id,t))}}catch(e){console.error("[Referral Nurture] Error processing pending emails:",e)}}}let l=null;function u(){return l||(l=new o),l}e.s(["ReferralNurtureScheduler",()=>o,"getReferralNurtureScheduler",()=>u],224943)}];

//# sourceMappingURL=server_lib_referralNurtureScheduler_ts_1ef64976._.js.map