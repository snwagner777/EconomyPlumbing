# ServiceTitan API - Create Location

## Endpoint
**POST** `https://api.servicetitan.io/crm/v2/tenant/{tenant}/locations`

## Request Body Schema
```json
{
  "name": "string",
  "address": {
    "street": "string",
    "unit": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "country": "string",
    "latitude": 0,
    "longitude": 0
  },
  "contacts": [{
    "type": {},
    "value": "string",
    "memo": "string"
  }],
  "customFields": [{
    "typeId": 0,
    "value": "string"
  }],
  "tagTypeIds": [0],
  "externalData": {
    "applicationGuid": "string",
    "externalData": [{
      "key": "string",
      "value": "string"
    }]
  },
  "coordinatesSource": {},
  "coordinatesVerificationStatus": {},
  "customerId": 0
}
```

### Required Fields
- `name` - Name of the location
- `address` - Address of the location record
- `customerId` - ID of the location's customer

### Optional Fields
- `contacts` - Array of contacts for the location
- `customFields` - Location record's custom fields
- `tagTypeIds` - Tag type ids for the location
- `externalData` - External data items
- `coordinatesSource` - Source of the coordinates
- `coordinatesVerificationStatus` - Verification status of coordinates
