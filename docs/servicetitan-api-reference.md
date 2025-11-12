# ServiceTitan API v2 Reference - Customer Portal Implementation

**Last Updated:** January 12, 2025  
**Purpose:** Complete API documentation for customer portal self-service features

---

## Table of Contents
1. [Customer APIs](#customer-apis)
2. [Location APIs](#location-apis)
3. [Contact APIs](#contact-apis)
4. [Contact Method APIs](#contact-method-apis)
5. [Self-Service Permissions Matrix](#self-service-permissions-matrix)
6. [Implementation Notes](#implementation-notes)

---

## Customer APIs

### Get Customer by ID
**Endpoint:** `GET /crm/v2/tenant/{tenant}/customers/{id}`  
**Returns:** Full customer record including contacts embedded

### Search Customers
**Endpoint:** `GET /crm/v2/tenant/{tenant}/customers?phone={phone}&active=true`  
**Endpoint:** `GET /crm/v2/tenant/{tenant}/customers?email={email}&active=true`  
**Use Case:** Duplicate detection before creating new customers

### Create Customer
**Endpoint:** `POST /crm/v2/tenant/{tenant}/customers`  

**Request Body:**
```json
{
  "name": "John Doe",
  "type": "Residential",
  "address": {
    "street": "123 Main St",
    "unit": "Apt 4",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "country": "USA"
  },
  "contacts": [
    {
      "type": "MobilePhone",
      "value": "512-555-1234"
    },
    {
      "type": "Email",
      "value": "john@example.com"
    }
  ]
}
```

**⚠️ CRITICAL:** The embedded `contacts` array in POST/PATCH is the **OLD v1 pattern**. For v2, contacts should be created separately using the Contacts API (see below).

### Update Customer (PATCH)
**Endpoint:** `PATCH /crm/v2/tenant/{tenant}/customers/{id}`

**Editable Fields (Self-Service):**
- ✅ `name` - Customer billing name
- ✅ `address` - Billing address (street, unit, city, state, zip)

**Read-Only Fields (Office Managed):**
- ❌ `type` - Residential/Commercial classification
- ❌ `customFields` - Business-specific fields
- ❌ `tagTypeIds` - Customer tags
- ❌ `taxExempt` - Tax status

**Request Body Example:**
```json
{
  "name": "John A. Doe",
  "address": {
    "street": "456 Oak Ave",
    "unit": "Suite 200",
    "city": "Austin",
    "state": "TX",
    "zip": "78702",
    "country": "USA"
  }
}
```

---

## Location APIs

### Get Locations for Customer
**Endpoint:** `GET /crm/v2/tenant/{tenant}/locations?customerId={customerId}&active=true`  
**Returns:** Array of locations with contacts embedded

### Create Location
**Endpoint:** `POST /crm/v2/tenant/{tenant}/locations`

**Request Body:**
```json
{
  "customerId": 12345,
  "name": "Primary Residence",
  "address": {
    "street": "789 Elm St",
    "unit": "",
    "city": "Austin",
    "state": "TX",
    "zip": "78703",
    "country": "USA"
  },
  "contacts": [
    {
      "type": "MobilePhone",
      "value": "512-555-5678"
    }
  ]
}
```

### Update Location (PATCH)
**Endpoint:** `PATCH /crm/v2/tenant/{tenant}/locations/{id}`

**Editable Fields (Self-Service):**
- ✅ `name` - Location name/label only

**Read-Only Fields (Office Managed - Critical for Dispatch):**
- ❌ `address` - Service addresses must NOT be edited by customers (affects routing/dispatch)
- ❌ `customerId` - Cannot move location to different customer
- ❌ `zoneId` - Dispatch zone
- ❌ `taxZoneId` - Tax zone

**Request Body Example (Name Only):**
```json
{
  "name": "Vacation Home"
}
```

**UI Pattern:** Show "Managed by Office" badge on address fields

---

## Contact APIs

ServiceTitan uses a **two-entity model** for contacts:
1. **Contact Person** - Entity with name/title (GUID ID)
2. **Contact Methods** - Phone/Email attached to contact person

### Create Contact Person
**Endpoint:** `POST /crm/v2/tenant/{tenant}/contacts`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "title": "Property Manager",
  "referenceId": "external-id-123"
}
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Jane Smith",
  "title": "Property Manager",
  "isArchived": false,
  "createdOn": "2025-01-12T10:30:00Z",
  "createdBy": 456,
  "modifiedOn": "2025-01-12T10:30:00Z",
  "modifiedBy": 456
}
```

### Update Contact Person
**Endpoint:** `PATCH /crm/v2/tenant/{tenant}/contacts/{id}`

**Editable Fields:**
- ✅ `name` - Contact person's name
- ✅ `title` - Contact person's title/role
- ✅ `isArchived` - Archive status (soft delete)

**Request Body:**
```json
{
  "name": "Jane A. Smith",
  "title": "Senior Property Manager"
}
```

### Delete Contact
**Endpoint:** `DELETE /crm/v2/tenant/{tenant}/contacts/{id}`  
**Note:** Hard delete - removes contact person and all associated contact methods

### Link Contact to Customer
**Endpoint:** `POST /crm/v2/tenant/{tenant}/customers/{customerId}/contacts`  
**Note:** Links existing contact person to customer billing record

### Link Contact to Location
**Endpoint:** `POST /crm/v2/tenant/{tenant}/locations/{locationId}/contacts`  
**Note:** Links existing contact person to service location

### Unlink Contact from Customer
**Endpoint:** `DELETE /crm/v2/tenant/{tenant}/customers/{customerId}/contacts/{contactId}`  
**Note:** Soft delete - unlinks contact from customer but doesn't delete contact person

---

## Contact Method APIs

Contact methods (phone/email) are attached to contact persons.

### Create Contact Method
**Endpoint:** `POST /crm/v2/tenant/{tenant}/contacts/{contactId}/contact-methods`

**Request Body:**
```json
{
  "type": "MobilePhone",
  "value": "512-555-9999",
  "memo": "Primary cell",
  "referenceId": "external-ref"
}
```

**Contact Types:**
- `MobilePhone` - Cell phone
- `Phone` - Landline
- `Email` - Email address
- `Fax` - Fax number

**Response:**
```json
{
  "id": "method-guid-123",
  "contactId": "contact-guid-456",
  "type": "MobilePhone",
  "value": "512-555-9999",
  "memo": "Primary cell",
  "createdOn": "2025-01-12T10:35:00Z",
  "createdBy": 789,
  "modifiedOn": "2025-01-12T10:35:00Z",
  "modifiedBy": 789
}
```

### Update Contact Method
**Endpoint:** `PATCH /crm/v2/tenant/{tenant}/contacts/{contactId}/contact-methods/{contactMethodId}`

**Editable Fields:**
- ✅ `value` - Phone number or email address
- ✅ `memo` - Note about this contact method

**Request Body:**
```json
{
  "value": "512-555-8888",
  "memo": "Updated cell number"
}
```

**⚠️ Note:** Cannot change `type` - must delete and recreate to change from Phone to Email

### Delete Contact Method
**Endpoint:** `DELETE /crm/v2/tenant/{tenant}/contacts/{contactId}/contact-methods/{contactMethodId}`

---

## Self-Service Permissions Matrix

| Entity | Field | Customer Can Edit? | Notes |
|--------|-------|-------------------|-------|
| **Customer** | Name | ✅ Yes | Billing name |
| | Billing Address | ✅ Yes | Street, unit, city, state, zip |
| | Type | ❌ No | Residential/Commercial - business rule |
| | Custom Fields | ❌ No | Business-specific data |
| | Tags | ❌ No | Office categorization |
| **Location** | Name | ✅ Yes | Rename location label |
| | Service Address | ❌ No | **CRITICAL** - affects routing/dispatch |
| | Zone | ❌ No | Dispatch zone assignment |
| | Tax Zone | ❌ No | Tax calculation |
| **Contact Person** | Name | ✅ Yes | Contact's full name |
| | Title | ✅ Yes | Role/position |
| | Archive | ✅ Yes | Soft delete |
| **Contact Method** | Phone/Email Value | ✅ Yes | Update phone number or email |
| | Memo | ✅ Yes | Note about contact method |
| | Type | ❌ No | Cannot change Phone ↔ Email (delete/recreate) |

---

## Implementation Notes

### Contact Creation Workflow (3 Steps)

**Correct v2 Pattern:**
```javascript
// Step 1: Create contact person entity
const contact = await POST('/contacts', {
  name: "Jane Smith",
  title: "Property Manager"
});

// Step 2: Add phone number
await POST(`/contacts/${contact.id}/contact-methods`, {
  type: "MobilePhone",
  value: "512-555-1234",
  memo: "Primary"
});

// Step 3: Add email
await POST(`/contacts/${contact.id}/contact-methods`, {
  type: "Email",
  value: "jane@example.com",
  memo: "Work email"
});

// Step 4: Link to customer
await POST(`/customers/${customerId}/contacts`, {
  contactId: contact.id
});

// Step 5: Link to location (if needed)
await POST(`/locations/${locationId}/contacts`, {
  contactId: contact.id
});
```

**❌ OLD v1 Pattern (Deprecated):**
```javascript
// DON'T DO THIS - embedding contacts in customer/location POST
await POST('/customers', {
  name: "John Doe",
  contacts: [
    { type: "MobilePhone", value: "512-555-1234" }
  ]
});
```

### Contact Duplication Architecture

**Important:** Contacts on customers and locations are **separate records** even if they have the same phone/email.

- When you add a contact to a **new location**, ServiceTitan automatically copies it to the customer record
- Editing a contact on a location does **NOT** update the customer contact
- Each contact is a distinct entity with its own GUID

### Business Rules for Customer Portal

1. **Minimum 1 Contact Rule**
   - Customers must have at least 1 active contact method
   - Prevent deletion of last contact
   - Show error: "Account must have at least one contact"

2. **Service Address Protection**
   - Location addresses are **read-only** in customer portal
   - Critical for dispatch routing and technician navigation
   - Show "Managed by Office" badge
   - Allow office to edit via ServiceTitan UI only

3. **Location Rename Allowed**
   - Customers can rename locations for clarity
   - Example: "Primary Residence" → "Vacation Home"
   - Does not affect dispatch/routing

4. **Audit Logging Required**
   - Log all customer data changes to database
   - Track: userId, action, entityType, entityId, oldValue, newValue, timestamp
   - Compliance and customer service tracking

### UI/UX Patterns

**Read-Only Field Badge:**
```tsx
<div className="relative">
  <Input disabled value={location.address.street} />
  <Badge variant="secondary" className="absolute top-2 right-2">
    Managed by Office
  </Badge>
</div>
```

**Confirmation Dialog (Delete Contact):**
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
    <AlertDialogDescription>
      Are you sure you want to remove {contact.name}? 
      This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete Contact
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Error Handling

### Common Error Codes

**400 Bad Request**
- Invalid field values
- Missing required fields
- Validation errors

**404 Not Found**
- Customer/Location/Contact ID doesn't exist
- Entity has been deleted

**409 Conflict**
- Customer/Tax Zone not found (when updating location)
- Duplicate detection (phone/email already exists)

### Example Error Response
```json
{
  "type": "https://api.servicetitan.io/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "traceId": "abc123",
  "errors": {
    "address.zip": ["Invalid ZIP code format"]
  },
  "data": {}
}
```

---

## Rate Limits & Best Practices

1. **Token Caching**
   - OAuth access tokens valid for 15 minutes
   - Cache and reuse tokens
   - Implement automatic refresh

2. **Batch Operations**
   - Use parallel requests where possible
   - Respect rate limits (check API headers)

3. **Error Retry Logic**
   - Implement exponential backoff
   - Max 3 retries for transient errors (500, 503)
   - Don't retry 4xx errors (client errors)

4. **Data Sync**
   - ServiceTitan is single source of truth
   - Never mirror data to local DB
   - Cache temporarily for performance only

---

## Related Files

- `server/lib/servicetitan/crm.ts` - API wrapper implementation
- `server/lib/servicetitan/auth.ts` - OAuth authentication
- `src/modules/accounts/AccountForm.tsx` - Customer edit form
- `src/modules/locations/LocationForm.tsx` - Location rename form
- `src/modules/contacts/ContactForm.tsx` - Contact CRUD form
- `app/customer-portal/AuthenticatedPortal.tsx` - Portal UI
- `app/api/customer-portal/*/route.ts` - API endpoints

---

## Testing Checklist

- [ ] Create customer with billing address
- [ ] Update customer billing address
- [ ] Create location for customer
- [ ] Rename location (allowed)
- [ ] Attempt to edit location address (should be blocked)
- [ ] Create contact person
- [ ] Add phone number to contact
- [ ] Add email to contact
- [ ] Update contact name
- [ ] Update contact phone/email value
- [ ] Delete contact (with confirmation)
- [ ] Prevent deletion of last contact
- [ ] Verify audit log entries
- [ ] Test error handling (404, 400, 409)
- [ ] Verify "Managed by Office" badges on read-only fields
