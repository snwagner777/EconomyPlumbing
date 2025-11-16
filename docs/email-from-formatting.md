# Email Address Formatting

This document explains how to include customer names in email recipient addresses and company branding in sender addresses.

## Overview

All emails sent through the Resend connector now support:
- **FROM field**: Always shows "Economy Plumbing Services <hello@plumbersthatcare.com>"
- **TO field**: Can include customer name like "John Smith <customer@example.com>"

## How It Works

### Basic Email (No Customer Name in TO field)
```typescript
import { formatEmailAddress } from '@/server/email';

const { client, fromEmail } = await getUncachableResendClient();
// fromEmail = "Economy Plumbing Services <hello@plumbersthatcare.com>"

await client.emails.send({
  from: fromEmail,
  to: 'customer@example.com',
  subject: 'Thank you for your business',
  html: '...'
});
```

### Email with Customer Name in TO field
```typescript
import { formatEmailAddress } from '@/server/email';

const { client, fromEmail } = await getUncachableResendClient();
const toAddress = formatEmailAddress('customer@example.com', 'John Smith');
// toAddress = "John Smith <customer@example.com>"

await client.emails.send({
  from: fromEmail,
  to: toAddress,
  subject: 'Thank you for your business',
  html: '...'
});
```

### Using sendEmail Helper
```typescript
import { sendEmail } from '@/server/email';

// Without customer name in TO field
await sendEmail({
  to: 'customer@example.com',
  subject: 'Thank you',
  html: '<h1>Thanks!</h1>'
});
// TO: "customer@example.com"

// With customer name in TO field
await sendEmail({
  to: 'customer@example.com',
  subject: 'Service Reminder',
  html: '<h1>Hi John!</h1>',
  toName: 'John Smith'
});
// TO: "John Smith <customer@example.com>"
```

## Use Cases

### 1. Sending to Customers with Their Name
Make emails more personal by including the customer's name:
```typescript
const customer = await serviceTitan.getCustomer(customerId);

await sendEmail({
  to: customer.email,
  toName: customer.name,  // Shows "John Smith <email@example.com>"
  subject: 'Service Reminder',
  html: serviceReminderHtml
});
```

### 2. Membership Renewal Emails
```typescript
await sendEmail({
  to: member.email,
  toName: member.name,
  subject: 'Your VIP Membership Renewal',
  html: renewalHtml
});
// Recipient sees: "John Smith <member@email.com>"
```

### 3. Appointment Confirmations
```typescript
await sendEmail({
  to: appointment.customerEmail,
  toName: appointment.customerName,
  subject: 'Appointment Confirmed',
  html: confirmationHtml
});
```

### 4. Invoice and Receipt Emails
```typescript
await sendEmail({
  to: invoice.customerEmail,
  toName: invoice.customerName,
  subject: `Invoice #${invoice.number}`,
  html: invoiceHtml
});
```

## Benefits

1. **Personal Touch**: Customers see their name in the TO field, making emails feel more personalized
2. **Professional Appearance**: All emails come from "Economy Plumbing Services"
3. **Better Inbox Display**: Email clients show customer names instead of just email addresses
4. **Improved Open Rates**: Personalized recipient names can improve email engagement

## Technical Details

- **FROM field**: Always "Economy Plumbing Services <hello@plumbersthatcare.com>"
- **TO field**: Can be formatted as "Customer Name <email>" or just "email"
- Works with all major email clients (Gmail, Outlook, Apple Mail, etc.)
- Fully compatible with Resend's email delivery system
- The `formatEmailAddress()` helper is exported for custom use cases
