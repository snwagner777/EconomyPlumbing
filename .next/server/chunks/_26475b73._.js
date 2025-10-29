module.exports=[246245,e=>{"use strict";var t=Object.defineProperty,r=Object.defineProperties,n=Object.getOwnPropertyDescriptors,o=Object.getOwnPropertySymbols,i=Object.prototype.hasOwnProperty,s=Object.prototype.propertyIsEnumerable,a=(e,r,n)=>r in e?t(e,r,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[r]=n,l=(e,t)=>{for(var r in t||(t={}))i.call(t,r)&&a(e,r,t[r]);if(o)for(var r of o(t))s.call(t,r)&&a(e,r,t[r]);return e},c=(e,t,r)=>new Promise((n,o)=>{var i=e=>{try{a(r.next(e))}catch(e){o(e)}},s=e=>{try{a(r.throw(e))}catch(e){o(e)}},a=e=>e.done?n(e.value):Promise.resolve(e.value).then(i,s);a((r=r.apply(e,t)).next())});function d(e){let t=new URLSearchParams;return void 0!==e.limit&&t.set("limit",e.limit.toString()),"after"in e&&void 0!==e.after&&t.set("after",e.after),"before"in e&&void 0!==e.before&&t.set("before",e.before),t.toString()}var u=class{constructor(e){this.resend=e}create(e){return c(this,arguments,function*(e,t={}){return yield this.resend.post("/api-keys",e,t)})}list(){return c(this,arguments,function*(e={}){let t=d(e),r=t?`/api-keys?${t}`:"/api-keys";return yield this.resend.get(r)})}remove(e){return c(this,null,function*(){return yield this.resend.delete(`/api-keys/${e}`)})}},p=class{constructor(e){this.resend=e}create(e){return c(this,arguments,function*(e,t={}){return yield this.resend.post("/audiences",e,t)})}list(){return c(this,arguments,function*(e={}){let t=d(e),r=t?`/audiences?${t}`:"/audiences";return yield this.resend.get(r)})}get(e){return c(this,null,function*(){return yield this.resend.get(`/audiences/${e}`)})}remove(e){return c(this,null,function*(){return yield this.resend.delete(`/audiences/${e}`)})}};function m(e){var t;return{attachments:null==(t=e.attachments)?void 0:t.map(e=>({content:e.content,filename:e.filename,path:e.path,content_type:e.contentType,content_id:e.contentId})),bcc:e.bcc,cc:e.cc,from:e.from,headers:e.headers,html:e.html,reply_to:e.replyTo,scheduled_at:e.scheduledAt,subject:e.subject,tags:e.tags,text:e.text,to:e.to}}function g(t){return new Promise((r,n)=>{e.A(406693).then(({render:e})=>{r(e(t))}).catch(()=>{n(Error("Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`."))})})}var h=class{constructor(e){this.resend=e}send(e,t){return c(this,null,function*(){return this.create(e,t)})}create(e,t){return c(this,null,function*(){var o;let i=[];for(let t of e)t.react&&(t.html=yield g(t.react),t.react=void 0),i.push(m(t));return yield this.resend.post("/emails/batch",i,r(l({},t),n({headers:l({"x-batch-validation":null!=(o=null==t?void 0:t.batchValidation)?o:"strict"},null==t?void 0:t.headers)})))})}},f=class{constructor(e){this.resend=e}create(e){return c(this,arguments,function*(e,t={}){return e.react&&(e.html=yield g(e.react)),yield this.resend.post("/broadcasts",{name:e.name,audience_id:e.audienceId,preview_text:e.previewText,from:e.from,html:e.html,reply_to:e.replyTo,subject:e.subject,text:e.text},t)})}send(e,t){return c(this,null,function*(){return yield this.resend.post(`/broadcasts/${e}/send`,{scheduled_at:null==t?void 0:t.scheduledAt})})}list(){return c(this,arguments,function*(e={}){let t=d(e),r=t?`/broadcasts?${t}`:"/broadcasts";return yield this.resend.get(r)})}get(e){return c(this,null,function*(){return yield this.resend.get(`/broadcasts/${e}`)})}remove(e){return c(this,null,function*(){return yield this.resend.delete(`/broadcasts/${e}`)})}update(e,t){return c(this,null,function*(){return t.react&&(t.html=yield g(t.react)),yield this.resend.patch(`/broadcasts/${e}`,{name:t.name,audience_id:t.audienceId,from:t.from,html:t.html,text:t.text,subject:t.subject,reply_to:t.replyTo,preview_text:t.previewText})})}},y=class{constructor(e){this.resend=e}create(e){return c(this,arguments,function*(e,t={}){return yield this.resend.post(`/audiences/${e.audienceId}/contacts`,{unsubscribed:e.unsubscribed,email:e.email,first_name:e.firstName,last_name:e.lastName},t)})}list(e){return c(this,null,function*(){let{audienceId:t}=e,r=d(((e,t)=>{var r={};for(var n in e)i.call(e,n)&&0>t.indexOf(n)&&(r[n]=e[n]);if(null!=e&&o)for(var n of o(e))0>t.indexOf(n)&&s.call(e,n)&&(r[n]=e[n]);return r})(e,["audienceId"])),n=r?`/audiences/${t}/contacts?${r}`:`/audiences/${t}/contacts`;return yield this.resend.get(n)})}get(e){return c(this,null,function*(){return e.id||e.email?yield this.resend.get(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}update(e){return c(this,null,function*(){return e.id||e.email?yield this.resend.patch(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`,{unsubscribed:e.unsubscribed,first_name:e.firstName,last_name:e.lastName}):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}remove(e){return c(this,null,function*(){return e.id||e.email?yield this.resend.delete(`/audiences/${e.audienceId}/contacts/${(null==e?void 0:e.email)?null==e?void 0:e.email:null==e?void 0:e.id}`):{data:null,error:{message:"Missing `id` or `email` field.",name:"missing_required_field"}}})}},E=class{constructor(e){this.resend=e}create(e){return c(this,arguments,function*(e,t={}){return yield this.resend.post("/domains",{name:e.name,region:e.region,custom_return_path:e.customReturnPath},t)})}list(){return c(this,arguments,function*(e={}){let t=d(e),r=t?`/domains?${t}`:"/domains";return yield this.resend.get(r)})}get(e){return c(this,null,function*(){return yield this.resend.get(`/domains/${e}`)})}update(e){return c(this,null,function*(){return yield this.resend.patch(`/domains/${e.id}`,{click_tracking:e.clickTracking,open_tracking:e.openTracking,tls:e.tls})})}remove(e){return c(this,null,function*(){return yield this.resend.delete(`/domains/${e}`)})}verify(e){return c(this,null,function*(){return yield this.resend.post(`/domains/${e}/verify`)})}},b=class{constructor(e){this.resend=e}send(e){return c(this,arguments,function*(e,t={}){return this.create(e,t)})}create(e){return c(this,arguments,function*(e,t={}){return e.react&&(e.html=yield g(e.react)),yield this.resend.post("/emails",m(e),t)})}get(e){return c(this,null,function*(){return yield this.resend.get(`/emails/${e}`)})}list(){return c(this,arguments,function*(e={}){let t=d(e),r=t?`/emails?${t}`:"/emails";return yield this.resend.get(r)})}update(e){return c(this,null,function*(){return yield this.resend.patch(`/emails/${e.id}`,{scheduled_at:e.scheduledAt})})}cancel(e){return c(this,null,function*(){return yield this.resend.post(`/emails/${e}/cancel`)})}},v="undefined"!=typeof process&&process.env&&process.env.RESEND_BASE_URL||"https://api.resend.com",$="undefined"!=typeof process&&process.env&&process.env.RESEND_USER_AGENT||"resend-node:6.1.2",x=class{constructor(e){if(this.key=e,this.apiKeys=new u(this),this.audiences=new p(this),this.batch=new h(this),this.broadcasts=new f(this),this.contacts=new y(this),this.domains=new E(this),this.emails=new b(this),!e&&("undefined"!=typeof process&&process.env&&(this.key=process.env.RESEND_API_KEY),!this.key))throw Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');this.headers=new Headers({Authorization:`Bearer ${this.key}`,"User-Agent":$,"Content-Type":"application/json"})}fetchRequest(e){return c(this,arguments,function*(e,t={}){try{let o=yield fetch(`${v}${e}`,t);if(!o.ok)try{let e=yield o.text();return{data:null,error:JSON.parse(e)}}catch(t){if(t instanceof SyntaxError)return{data:null,error:{name:"application_error",message:"Internal server error. We are unable to process your request right now, please try again later."}};let e={message:o.statusText,name:"application_error"};if(t instanceof Error){let o,i;return{data:null,error:(o=l({},e),i={message:t.message},r(o,n(i)))}}return{data:null,error:e}}return{data:yield o.json(),error:null}}catch(e){return{data:null,error:{name:"application_error",message:"Unable to fetch data. The request could not be resolved."}}}})}post(e,t){return c(this,arguments,function*(e,t,o={}){let i=new Headers(this.headers);if(o.headers)for(let[e,t]of new Headers(o.headers).entries())i.set(e,t);o.idempotencyKey&&i.set("Idempotency-Key",o.idempotencyKey);let s=r(l({method:"POST",body:JSON.stringify(t)},o),n({headers:i}));return this.fetchRequest(e,s)})}get(e){return c(this,arguments,function*(e,t={}){let o=new Headers(this.headers);if(t.headers)for(let[e,r]of new Headers(t.headers).entries())o.set(e,r);let i=r(l({method:"GET"},t),n({headers:o}));return this.fetchRequest(e,i)})}put(e,t){return c(this,arguments,function*(e,t,o={}){let i=new Headers(this.headers);if(o.headers)for(let[e,t]of new Headers(o.headers).entries())i.set(e,t);let s=r(l({method:"PUT",body:JSON.stringify(t)},o),n({headers:i}));return this.fetchRequest(e,s)})}patch(e,t){return c(this,arguments,function*(e,t,o={}){let i=new Headers(this.headers);if(o.headers)for(let[e,t]of new Headers(o.headers).entries())i.set(e,t);let s=r(l({method:"PATCH",body:JSON.stringify(t)},o),n({headers:i}));return this.fetchRequest(e,s)})}delete(e,t){return c(this,null,function*(){let r={method:"DELETE",body:JSON.stringify(t),headers:this.headers};return this.fetchRequest(e,r)})}};e.s(["Resend",()=>x])},137522,e=>{"use strict";var t=e.i(246245);async function r(){console.log("[Email Debug] Getting Resend credentials...");let e=process.env.REPLIT_CONNECTORS_HOSTNAME,t=process.env.REPL_IDENTITY?"repl "+process.env.REPL_IDENTITY:process.env.WEB_REPL_RENEWAL?"depl "+process.env.WEB_REPL_RENEWAL:null;if(console.log("[Email Debug] Connector hostname:",e?"set":"NOT SET"),console.log("[Email Debug] REPL_IDENTITY:",process.env.REPL_IDENTITY?"set":"NOT SET"),console.log("[Email Debug] WEB_REPL_RENEWAL:",process.env.WEB_REPL_RENEWAL?"set":"NOT SET"),t&&e)try{let r=await fetch("https://"+e+"/api/v2/connection?include_secrets=true&connector_names=resend",{headers:{Accept:"application/json",X_REPLIT_TOKEN:t}}),n=await r.json(),o=n.items?.[0]?.settings;if(console.log("[Email Debug] Connector settings retrieved:",o?"yes":"NO"),console.log("[Email Debug] Connector API key exists:",o?.api_key?"yes":"NO"),console.log("[Email Debug] Connector from email:",o?.from_email||"NOT SET"),o?.api_key&&o?.from_email)return console.log("[Email] Using Replit Connector credentials"),{apiKey:o.api_key,fromEmail:o.from_email};console.warn("[Email] Connector available but not configured, falling back to environment secrets")}catch(e){console.warn("[Email] Connector fetch failed, falling back to environment secrets:",e)}else console.log("[Email Debug] Connector not available, using environment secrets");let r=process.env.RESEND_API_KEY,n=process.env.RESEND_FROM_EMAIL;if(console.log("[Email Debug] Env RESEND_API_KEY:",r?"set":"NOT SET"),console.log("[Email Debug] Env RESEND_FROM_EMAIL:",n||"NOT SET"),!r||!n)throw console.error("[Email Error] Neither Replit Connector nor environment secrets are configured"),Error("Resend not configured: Please set up Resend connector or provide RESEND_API_KEY and RESEND_FROM_EMAIL environment secrets");return console.log("[Email] Using environment secret credentials"),{apiKey:r,fromEmail:n}}async function n(){let e=await r();return{client:new t.Resend(e.apiKey),fromEmail:e.fromEmail}}async function o(e){console.log("[Email] Sending generic email to:",e.to);try{let{client:t,fromEmail:r}=await n(),o=await t.emails.send({from:r,to:e.to,subject:e.subject,html:e.html,tags:e.tags});return console.log("[Email] Email sent successfully with ID:",o.data?.id),o}catch(e){throw console.error("[Email] Failed to send email:",e),e}}async function i(e){console.log("[Email] Starting sendContactFormEmail for:",e.name);try{console.log("[Email] Getting Resend client...");let{client:t,fromEmail:r}=await n(),o=process.env.CONTACT_EMAIL;if(console.log("[Email] From email:",r||"NOT SET"),console.log("[Email] To email (CONTACT_EMAIL):",o||"NOT SET"),!o)throw console.error("[Email Error] CONTACT_EMAIL not configured"),Error("CONTACT_EMAIL not configured");let i=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">New Contact Form Submission</h2>
        ${e.pageContext?`<p><strong>Submitted from:</strong> ${e.pageContext}</p>`:""}
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${e.name}</p>
          <p><strong>Phone:</strong> ${e.phone}</p>
          ${e.email?`<p><strong>Email:</strong> ${e.email}</p>`:""}
        </div>

        ${e.service||e.location||e.urgency?`
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Service Details</h3>
          ${e.service?`<p><strong>Service Needed:</strong> ${e.service}</p>`:""}
          ${e.location?`<p><strong>Location:</strong> ${e.location}</p>`:""}
          ${e.urgency?`<p><strong>Urgency:</strong> ${e.urgency}</p>`:""}
        </div>
        `:""}

        ${e.message?`
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap;">${e.message}</p>
        </div>
        `:""}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This message was sent from the Economy Plumbing Services website contact form.
        </p>
      </div>
    `;console.log("[Email] Attempting to send contact form email..."),console.log("[Email] Subject:",`New Contact: ${e.name} - ${e.service||"Inquiry"}`);let s=await t.emails.send({from:r,to:o,subject:`New Contact: ${e.name} - ${e.service||"Inquiry"}`,html:i});return console.log("[Email] ✓ Email sent successfully! Result:",JSON.stringify(s,null,2)),s}catch(e){throw console.error("[Email Error] ✗ Failed to send email:",e),console.error("[Email Error] Error details:",JSON.stringify(e,null,2)),e}}async function s(e){console.log("[Email] Starting sendSalesNotificationEmail for product:",e.productName);try{console.log("[Email] Getting Resend client...");let{client:t,fromEmail:r}=await n(),o=process.env.CONTACT_EMAIL;if(console.log("[Email] From email:",r||"NOT SET"),console.log("[Email] To email (CONTACT_EMAIL):",o||"NOT SET"),!o)throw console.error("[Email Error] CONTACT_EMAIL not configured"),Error("CONTACT_EMAIL not configured");let i="residential"===e.customerType?e.customerName:`${e.companyName} (Contact: ${e.contactPersonName})`,s=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">🎉 New Sale!</h2>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin-top: 0; color: #0369a1;">Product Purchased</h3>
          <p style="font-size: 18px; margin: 10px 0;"><strong>${e.productName}</strong></p>
          <p style="font-size: 20px; color: #0ea5e9; margin: 10px 0;"><strong>$${(e.productPrice/100).toFixed(2)}</strong></p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Type:</strong> ${"residential"===e.customerType?"Residential":"Commercial"}</p>
          <p><strong>Name:</strong> ${i}</p>
          <p><strong>Email:</strong> ${e.email}</p>
          <p><strong>Phone:</strong> ${e.phone}</p>
          <p><strong>Address:</strong> ${e.street}, ${e.city}, ${e.state} ${e.zip}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details</h3>
          <p><strong>Payment Intent ID:</strong> ${e.stripePaymentIntentId}</p>
          <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">✓ Paid</span></p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated notification from the Economy Plumbing Services online store.
        </p>
      </div>
    `;console.log("[Email] Attempting to send sales notification email..."),console.log("[Email] Subject:",`New Sale: ${e.productName} - $${(e.productPrice/100).toFixed(2)}`);let a=await t.emails.send({from:r,to:o,subject:`New Sale: ${e.productName} - $${(e.productPrice/100).toFixed(2)}`,html:s});return console.log("[Email] ✓ Sales notification sent successfully! Result:",JSON.stringify(a,null,2)),a}catch(e){throw console.error("[Email Error] ✗ Failed to send sales notification:",e),console.error("[Email Error] Error details:",JSON.stringify(e,null,2)),e}}async function a(e){console.log("[Email] Starting sendSuccessStoryNotificationEmail for:",e.customerName);try{console.log("[Email] Getting Resend client...");let{client:t,fromEmail:r}=await n(),o=process.env.CONTACT_EMAIL;if(console.log("[Email] From email:",r||"NOT SET"),console.log("[Email] To email (CONTACT_EMAIL):",o||"NOT SET"),!o)throw console.error("[Email Error] CONTACT_EMAIL not configured"),Error("CONTACT_EMAIL not configured");let i=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">New Customer Success Story Submission</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${e.customerName}</p>
          ${e.email?`<p><strong>Email:</strong> ${e.email}</p>`:""}
          ${e.phone?`<p><strong>Phone:</strong> ${e.phone}</p>`:""}
          <p><strong>Location:</strong> ${e.location}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Service Details</h3>
          <p><strong>Service Category:</strong> ${e.serviceCategory}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Story</h3>
          <p style="white-space: pre-wrap;">${e.story}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Photos</h3>
          <p><strong>Before Photo:</strong> <a href="${e.beforePhotoUrl}">${e.beforePhotoUrl}</a></p>
          <p><strong>After Photo:</strong> <a href="${e.afterPhotoUrl}">${e.afterPhotoUrl}</a></p>
        </div>

        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Action Required:</strong> Please review and approve this success story in the admin panel.</p>
          <p style="margin: 10px 0 0 0;"><a href="${process.env.REPL_URL||"https://www.plumbersthatcare.com"}/admin" style="color: #0ea5e9; text-decoration: none;">Go to Admin Panel →</a></p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This submission was received through the Success Stories page.
          Story ID: ${e.storyId}
        </p>
      </div>
    `;console.log("[Email] Attempting to send success story notification..."),console.log("[Email] Subject:",`New Success Story: ${e.customerName} - ${e.serviceCategory}`);let s=await t.emails.send({from:r,to:o,subject:`New Success Story: ${e.customerName} - ${e.serviceCategory}`,html:i});return console.log("[Email] ✓ Success story notification sent successfully! Result:",JSON.stringify(s,null,2)),s}catch(e){throw console.error("[Email Error] ✗ Failed to send success story notification:",e),console.error("[Email Error] Error details:",JSON.stringify(e,null,2)),e}}async function l(e){console.log("[Email] Starting sendMembershipPurchaseNotification for:",e.productName);try{let{client:t,fromEmail:r}=await n(),o=process.env.CONTACT_EMAIL;if(!o)throw console.error("[Email Error] CONTACT_EMAIL not configured"),Error("CONTACT_EMAIL not configured");let i=`$${(e.amount/100).toFixed(2)}`,s="residential"===e.customerType?e.customerName||e.locationName:e.companyName,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">🎉 New VIP Membership Purchase!</h2>
        ${e.testMode?`<div style="background-color: #fef3c7; padding: 10px; border-radius: 8px; margin-bottom: 20px;"><strong>⚠️ TEST MODE:</strong> This is a test transaction</div>`:""}
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Membership Details</h3>
          <p><strong>Product:</strong> ${e.productName}</p>
          <p><strong>Amount:</strong> ${i}</p>
          ${e.sku?`<p><strong>SKU:</strong> ${e.sku}</p>`:""}
          ${e.serviceTitanMembershipTypeId?`<p><strong>ServiceTitan Membership Type:</strong> ${e.serviceTitanMembershipTypeId}</p>`:""}
          ${e.durationBillingId?`<p><strong>Duration Billing ID:</strong> ${e.durationBillingId}</p>`:""}
        </div>

        ${"residential"===e.customerType?`
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Type:</strong> 🏠 Residential</p>
          <p><strong>Name:</strong> ${e.locationName}</p>
          <p><strong>Email:</strong> <a href="mailto:${e.email}">${e.email}</a></p>
          <p><strong>Phone:</strong> ${e.phone}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Location Address</h3>
          <p style="margin: 5px 0;">${e.street}</p>
          <p style="margin: 5px 0;">${e.city}, ${e.state} ${e.zip}</p>
        </div>

        ${e.billingStreet?`
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Billing Address</h3>
          ${e.billingName?`<p><strong>Billing Name:</strong> ${e.billingName}</p>`:""}
          <p style="margin: 5px 0;">${e.billingStreet}</p>
          <p style="margin: 5px 0;">${e.billingCity}, ${e.billingState} ${e.billingZip}</p>
        </div>
        `:""}
        `:`
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Company Information</h3>
          <p><strong>Type:</strong> 🏢 Commercial</p>
          <p><strong>Company:</strong> ${e.companyName}</p>
          <p><strong>Location Name:</strong> ${e.locationName}</p>
          <p><strong>Contact Person:</strong> ${e.contactPersonName}</p>
          <p><strong>Email:</strong> <a href="mailto:${e.email}">${e.email}</a></p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Location Contact</h3>
          <p><strong>Location Phone:</strong> ${e.locationPhone}${e.extension?` ext. ${e.extension}`:""}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Location Address</h3>
          <p style="margin: 5px 0;">${e.street}</p>
          <p style="margin: 5px 0;">${e.city}, ${e.state} ${e.zip}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Billing Information</h3>
          ${e.billingName?`<p><strong>Billing Contact:</strong> ${e.billingName}</p>`:""}
          <p><strong>Billing Phone:</strong> ${e.phone}</p>
          ${e.billingStreet?`
          <p style="margin-top: 10px;"><strong>Billing Address:</strong></p>
          <p style="margin: 5px 0;">${e.billingStreet}</p>
          <p style="margin: 5px 0;">${e.billingCity}, ${e.billingState} ${e.billingZip}</p>
          `:""}
        </div>
        `}

        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>✅ Next Steps:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Customer data has been saved to the database</li>
            <li>Zapier will sync this to ServiceTitan automatically</li>
            <li>Payment Intent ID: <code>${e.paymentIntentId}</code></li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This notification was triggered by a successful VIP membership purchase.
        </p>
      </div>
    `;console.log("[Email] Attempting to send membership purchase notification..."),console.log("[Email] Subject:",`New VIP Membership: ${s} - ${i}`);let l=await t.emails.send({from:r,to:o,subject:`${e.testMode?"[TEST] ":""}New VIP Membership: ${s} - ${i}`,html:a});return console.log("[Email] ✓ Membership purchase notification sent successfully! Result:",JSON.stringify(l,null,2)),l}catch(e){return console.error("[Email Error] ✗ Failed to send membership purchase notification:",e),console.error("[Email Error] Error details:",JSON.stringify(e,null,2)),null}}e.s(["getUncachableResendClient",()=>n,"sendContactFormEmail",()=>i,"sendEmail",()=>o,"sendMembershipPurchaseNotification",()=>l,"sendSalesNotificationEmail",()=>s,"sendSuccessStoryNotificationEmail",()=>a])},406693,e=>{e.v(t=>Promise.all(["server/chunks/node_modules_next_dist_compiled_react-dom_server_node_7bca5bf7.js","server/chunks/[root-of-the-server]__0c41828f._.js"].map(t=>e.l(t))).then(()=>t(701631)))}];

//# sourceMappingURL=_26475b73._.js.map