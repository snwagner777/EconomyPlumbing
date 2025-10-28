module.exports=[32991,e=>{"use strict";var r=e.i(57420),n=e.i(18899),i=e.i(54799);async function t(r,n,i){let{emailPreferences:t}=await e.A(24067),s=await a(r,i);if("transactional"===n.type)return{canSend:!0,unsubscribeUrl:`${l()}/email-preferences/${s.unsubscribeToken}`,listUnsubscribeHeader:`<${l()}/email-preferences/${s.unsubscribeToken}>`,token:s.unsubscribeToken};if(s.transactionalOnly)return{canSend:!1,reason:"Recipient has unsubscribed from all non-transactional emails"};let o=!0,c="";switch(n.type){case"marketing":o=s.marketingEmails,c="Recipient has opted out of marketing emails";break;case"review":o=s.reviewRequests,c="Recipient has opted out of review requests";break;case"referral":o=s.referralEmails,c="Recipient has opted out of referral emails";break;case"service_reminder":o=s.serviceReminders,c="Recipient has opted out of service reminders"}if(!o)return{canSend:!1,reason:c};let u=`${l()}/email-preferences/${s.unsubscribeToken}`,m=`<${u}>`;return{canSend:!0,unsubscribeUrl:u,listUnsubscribeHeader:m,token:s.unsubscribeToken}}async function a(t,a){let{emailPreferences:s}=await e.A(24067),[o]=await r.db.select().from(s).where(n.sql`${s.email} = ${t.toLowerCase()}`).limit(1);if(o)return o;let l=i.default.randomBytes(32).toString("hex"),[c]=await r.db.insert(s).values({email:t.toLowerCase(),customerId:a||null,unsubscribeToken:l,marketingEmails:!0,reviewRequests:!0,referralEmails:!0,serviceReminders:!0,transactionalOnly:!1}).returning();return c}function s(e,r){let n=`
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p style="margin: 0 0 8px 0;">
        You're receiving this email because you're a valued customer of Economy Plumbing Services.
      </p>
      <p style="margin: 0;">
        <a href="${r}" style="color: #3b82f6; text-decoration: underline;">Manage your email preferences</a> or 
        <a href="${r}" style="color: #3b82f6; text-decoration: underline;">unsubscribe</a>
      </p>
      <p style="margin: 8px 0 0 0; font-size: 11px;">
        Economy Plumbing Services | Serving Austin & Central Texas<br/>
        \xa9 ${new Date().getFullYear()} All rights reserved
      </p>
    </div>
  `;return e.includes("</body>")?e.replace("</body>",`${n}</body>`):e+n}function o(e,r){return e+`

---
You're receiving this email because you're a valued customer of Economy Plumbing Services.

Manage your email preferences: ${r}
Unsubscribe: ${r}

Economy Plumbing Services | Serving Austin & Central Texas
\xa9 ${new Date().getFullYear()} All rights reserved
`}function l(){return"https://plumbersthatcare.com"}e.s(["addUnsubscribeFooter",()=>s,"addUnsubscribeFooterPlainText",()=>o,"canSendEmail",()=>t])},24067,e=>{e.v(e=>Promise.resolve().then(()=>e(90337)))}];

//# sourceMappingURL=_7e89414a._.js.map