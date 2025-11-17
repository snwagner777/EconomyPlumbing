# ServiceTitan API - Get Locations List

## Endpoint
**GET** `https://api.servicetitan.io/crm/v2/tenant/{tenant}/locations`

## Query Parameters
- `ids` - Perform lookup by multiple IDs (maximum 50)
- `name` - Filters by customer's name
- `customerId` - Filters by customer ID
- `street` - Filters by customer's street
- `unit` - Filters by customer's unit
- `city` - Filters by customer's city
- `state` - Filters by customer's state
- `zip` - Filters by customer's zip
- `country` - Filters by customer's country
- `latitude` - Filters by customer's latitude
- `longitude` - Filters by customer's longitude
- `active` - What kind of items should be returned (Values: True, Any, False)
- `page` - The logical number of page to return, starting from 1
- `pageSize` - How many records to return (50 by default)
- `includeTotal` - Whether total count should be returned
- `sort` - Applies sorting by field (e.g., "+FieldName" ascending, "-FieldName" descending)
  - Available fields: Id, ModifiedOn, CreatedOn
- `createdBefore` - Return items created before certain date/time (UTC)
- `createdOnOrAfter` - Return items created on or after certain date/time (UTC)
- `modifiedBefore` - Return items modified before certain date/time (UTC)
- `modifiedOnOrAfter` - Return items modified on or after certain date/time (UTC)
- `externalDataApplicationGuid` - Returns location records with external data for a particular GUID
- `externalDataKey` - Performs lookup by external data key (must provide externalDataValues)
- `externalDataValues` - Performs lookup by external data values (max 50, must provide externalDataKey)

## Response: 200 OK
Returns paginated response with location data.
