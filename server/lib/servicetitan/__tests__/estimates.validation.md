# ServiceTitan Estimates Normalization - Validation Test Cases

## Purpose
Document all test cases for the `extractNumericValue()` helper and estimate normalization logic to ensure all monetary fields are properly extracted from nested ServiceTitan objects.

## Runtime Validation
The system includes three layers of validation:

1. **extractNumericValue()** - Validates and logs during extraction
2. **validateEstimateItem()** - Validates each item after parsing
3. **Debug Endpoint** - `/api/portal/estimates/debug/[id]` compares raw vs normalized

## Test Cases for extractNumericValue()

### Flat Numbers
- ✅ Input: `100` → Output: `100`
- ✅ Input: `0` → Output: `0`
- ✅ Input: `99.99` → Output: `99.99`

### Null and Undefined
- ✅ Input: `null` → Output: `0`
- ✅ Input: `undefined` → Output: `0`

### Single-Level Nesting
- ✅ Input: `{ amount: 100 }` → Output: `100`
- ✅ Input: `{ unitPrice: 129 }` → Output: `129`
- ✅ Input: `{ total: 200 }` → Output: `200`
- ✅ Input: `{ value: 150 }` → Output: `150`
- ✅ Input: `{ price: 75 }` → Output: `75`
- ✅ Input: `{ unitCost: 50 }` → Output: `50`

### Double-Level Nesting
- ✅ Input: `{ amount: { value: 100 } }` → Output: `100`
- ✅ Input: `{ unitPrice: { amount: 129 } }` → Output: `129`
- ✅ Input: `{ total: { amount: 200 } }` → Output: `200`
- ✅ Input: `{ price: { unitPrice: 99 } }` → Output: `99`

### Currency Objects
- ✅ Input: `{ currency: 'USD', amount: 100 }` → Output: `100`
- ✅ Input: `{ currency: 'USD', total: { amount: 200 } }` → Output: `200`

### Non-Finite Numbers
- ✅ Input: `Infinity` → Output: `0` (logged as warning)
- ✅ Input: `-Infinity` → Output: `0` (logged as warning)
- ✅ Input: `NaN` → Output: `0` (logged as warning)

### Invalid Types
- ✅ Input: `'100'` (string) → Output: `0`
- ✅ Input: `true` (boolean) → Output: `0`
- ✅ Input: `[]` (array) → Output: `0`

### Edge Cases
- ✅ Input: `{}` (empty object) → Output: `0` (logged as warning)
- ✅ Input: `{ foo: 100, bar: 200 }` (unrecognized keys) → Output: `0` (logged as warning)

### Mixed Structures (Real ServiceTitan Patterns)
- ✅ Input: `{ currency: 'USD', unitPrice: { amount: 129.99 } }` → Output: `129.99`

## Integration Test Cases

### Estimate-Level Fields
```typescript
// ServiceTitan estimate subtotal
const stSubtotal = { amount: 250.00 };
const normalized = extractNumericValue(stSubtotal);
assert(normalized === 250);
assert(Number.isFinite(normalized));
```

### Item-Level Fields
```typescript
// ServiceTitan item price (double nested)
const stItemPrice = { unitPrice: { amount: 129.00 } };
const normalized = extractNumericValue(stItemPrice);
assert(normalized === 129);
assert(Number.isFinite(normalized));
```

### Arithmetic Safety
```typescript
// Ensure normalized values work in calculations
const price = extractNumericValue({ unitPrice: { amount: 100 } });
const quantity = 2;
const total = price * quantity;
assert(Number.isFinite(total));
assert(total === 200);
```

### Currency Formatting Safety
```typescript
// Ensure normalized values work with toFixed()
const price = extractNumericValue({ unitPrice: { amount: 99.99 } });
const formatted = price.toFixed(2);
assert(formatted === '99.99');
assert(!formatted.includes('[object Object]'));
assert(!formatted.includes('NaN'));
```

## Validation Checklist

When testing with real ServiceTitan data, verify:

### Using Debug Endpoint
```bash
# Call the debug endpoint for a real estimate
curl https://your-app.replit.app/api/portal/estimates/debug/12345

# Check the response
{
  "validation": {
    "subtotalIsNumber": true,  // ← Must be true
    "totalIsNumber": true,     // ← Must be true
    "items": [
      {
        "priceIsNumber": true,        // ← Must be true for all items
        "totalIsNumber": true,        // ← Must be true for all items
        "costIsNumber": true,         // ← Must be true for all items
        "memberPriceIsNumber": true   // ← Must be true or N/A
      }
    ],
    "allValid": true  // ← This should be true!
  }
}
```

### Console Logs
Monitor for these patterns:
- ✅ `PASS ✓` in console = All validation passed
- ❌ `FAIL ✗` in console = Validation failed
- ⚠️ `VALIDATION FAILED:` = Specific field failed validation
- ⚠️ `Non-finite number in` = Found Infinity/NaN
- ⚠️ `Could not extract numeric value` = Unknown structure

### Frontend Rendering
After normalization, verify:
- ✅ Currency amounts display correctly (no `[object Object]`)
- ✅ No `NaN` in displayed values
- ✅ Arithmetic works (subtotals match item totals)
- ✅ Status filters work (Open/Sold/Dismissed)
- ✅ Detail modal displays all item data

## Test Execution Plan

1. **Runtime Validation** (Already Implemented)
   - Automatic validation during normalization
   - Console warnings/errors for issues
   - No crashes on invalid data

2. **Debug Endpoint Testing**
   - Access `/api/portal/estimates/debug/[id]` for each estimate
   - Verify `validation.allValid === true`
   - Inspect raw vs normalized for any mismatches

3. **Integration Testing**
   - Test in Customer Portal with real data
   - Verify Documents section renders correctly
   - Test detail modals display proper values
   - Test PDF downloads work

4. **Regression Prevention**
   - Console logs catch future ServiceTitan schema changes
   - Debug endpoint available for QA testing
   - Type safety prevents accidental regressions

## Success Criteria

✅ All monetary fields are finite numbers
✅ No NaN in currency formatting
✅ Arithmetic operations work correctly
✅ Frontend renders all values properly
✅ Status normalization works
✅ Debug endpoint returns `allValid: true`
✅ No validation errors in console logs
✅ PDF downloads succeed
