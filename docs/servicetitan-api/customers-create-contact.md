# ServiceTitan API - Create Customer Contact

## Endpoint
**POST** `https://api.servicetitan.io/crm/v2/tenant/{tenant}/customers/{id}/contacts`

## Request Parameters
- `id` (template, required, integer) - Customer ID
- `tenant` (template, required, integer) - Tenant ID

## Request Body Schema
```json
{
  "type": "One of: Crm.V2.ContactType",
  "value": "string",
  "memo": "string"
}
```

### Fields
- `type` (required) - Landline, mobile, e-mail, or fax
- `value` (required) - The email, phone number, or fax number for the contact
- `memo` (optional) - Short description about this contact (e.g., "work #" or "Owner's daughter - Kelly")

## Response: 200 OK
```json
{
  "id": 0,
  "type": {},
  "value": "string",
  "memo": "string",
  "modifiedOn": "string",
  "phoneSettings": {
    "phoneNumber": "string",
    "doNotText": true
  },
  "createdOn": "string",
  "preferences": {
    "jobRemindersEnabled": true,
    "marketingUpdatesEnabled": true,
    "invoiceStatementNotification": true
  }
}
```

### Response Fields
- `id` (integer) - ID of the contact
- `type` - Contact type (Landline, mobile, e-mail, or fax)
- `value` - The email, phone number, or fax number
- `memo` - Short description
- `modifiedOn` (date-time) - Modified On (UTC) for the record
- `phoneSettings` - Phone settings of the customer contact
- `createdOn` (date-time) - Created On (UTC) for the record
- `preferences` - Contact Preferences
