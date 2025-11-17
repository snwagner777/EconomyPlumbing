# ServiceTitan API - Update Location Contact

## Endpoint
**PATCH** `https://api.servicetitan.io/crm/v2/tenant/{tenant}/locations/{id}/contacts/{contactId}`

## Request Parameters
- `id` (template, required, integer) - Location ID
- `contactId` (template, required, integer) - Contact ID
- `tenant` (template, required, integer) - Tenant ID

## Request Body Schema
```json
{
  "type": {},
  "value": "string",
  "memo": "string",
  "preferences": {
    "jobRemindersEnabled": true,
    "marketingUpdatesEnabled": true,
    "invoiceStatementNotification": true
  }
}
```

### Fields (all optional)
- `type` - Type of contact
- `value` - Value of contact
- `memo` - Memo of contact
- `preferences` - Contact preference setting for Job Reminders and Marketing Updates

## Response: 200 OK
Same structure as create endpoint response.
