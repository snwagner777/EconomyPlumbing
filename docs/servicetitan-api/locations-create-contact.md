# ServiceTitan API - Create Location Contact

## Endpoint
**POST** `https://api.servicetitan.io/crm/v2/tenant/{tenant}/locations/{id}/contacts`

## Request Parameters
- `id` (template, required, integer) - Location ID
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
- `type` (required) - Type of contact (Landline, mobile, e-mail, or fax)
- `value` (required) - Value of contact
- `memo` (optional) - Memo of contact

## Response: 200 OK
```json
{
  "id": 0,
  "type": {},
  "value": "string",
  "memo": "string",
  "phoneSettings": {
    "phoneNumber": "string",
    "doNotText": true
  },
  "modifiedOn": "string",
  "createdOn": "string",
  "preferences": {
    "jobRemindersEnabled": true,
    "marketingUpdatesEnabled": true,
    "invoiceStatementNotification": true
  }
}
```
