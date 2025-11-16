# Playwright Testing Setup Notes

## Current Status

Playwright is installed and configured to work in the Replit environment.

**Working:**
- ✅ Playwright framework installed
- ✅ System Chromium browser configured
- ✅ Auto-start dev server on http://localhost:5000
- ✅ Test directory structure created
- ✅ Helper utilities for auth and navigation
- ✅ Basic tests for public, portal, and admin sections
- ✅ HTML report generation
- ✅ Screenshot on failure

**Test Results (Initial Run):**
- Public website: 6/7 passing (1 skipped - needs data-testid attributes)
- Admin panel: 2/3 passing (1 requires correct environment credentials)
- Portal: Tests skipped (require SMS verification mock)

## To Make Tests Fully Functional

### 1. Add data-testid Attributes to Contact Form

The contact form components need `data-testid` attributes for reliable testing:

```tsx
// In your contact form component:
<input data-testid="input-name" ... />
<input data-testid="input-email" ... />
<input data-testid="input-phone" ... />
<textarea data-testid="input-message" ... />
```

### 2. Admin Credentials Must Be Set

Admin login tests require actual credentials:

```bash
# In Replit Secrets or .env:
ADMIN_USERNAME=your_actual_username
ADMIN_PASSWORD=your_actual_password
```

### 3. Portal Tests Need SMS Mocking

Customer portal tests are currently skipped because they require SMS verification. To enable:

- Mock the SMS verification endpoint in test environment
- Or use a test-only bypass code
- Or set up a test customer with known verification code

## Running Tests

```bash
# All tests
npx playwright test

# Specific sections
npx playwright test tests/public
npx playwright test tests/admin
npx playwright test tests/portal

# Interactive UI mode
npx playwright test --ui

# View last report
npx playwright show-report
```

## Adding New Tests

1. Create `.spec.ts` file in appropriate directory
2. Use helpers from `tests/helpers/` for common operations
3. Add `data-testid` attributes to components being tested
4. Follow existing patterns in test files

## CI/CD Integration

Tests are configured for CI with:
- Retries (2x in CI mode)
- Single worker for consistency
- HTML report generation
- Screenshot capture on failure

Set `CI=true` environment variable to enable CI mode.
