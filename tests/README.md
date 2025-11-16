# Automated Testing with Playwright

This project uses Playwright for end-to-end testing of the entire application.

## Test Structure

```
tests/
├── public/          # Public website tests
│   ├── homepage.spec.ts
│   └── contact.spec.ts
├── portal/          # Customer portal tests  
│   ├── login.spec.ts
│   └── appointments.spec.ts
├── admin/           # Admin panel tests
│   ├── login.spec.ts
│   └── dashboard.spec.ts
└── helpers/         # Shared test utilities
    ├── auth.ts      # Authentication helpers
    └── navigation.ts # Navigation helpers
```

## Running Tests

**Run all tests:**
```bash
npx playwright test
```

**Run specific test suites:**
```bash
npx playwright test tests/public    # Public website tests
npx playwright test tests/portal    # Customer portal tests  
npx playwright test tests/admin     # Admin panel tests
```

**Run with UI mode (interactive):**
```bash
npx playwright test --ui
```

**View test report:**
```bash
npx playwright show-report
```

**Run specific test file:**
```bash
npx playwright test tests/admin/login.spec.ts
```

## Test Data

- **Test Customer ID:** 27881198 (real ServiceTitan test customer)
- **Test Phone Numbers:** Use format (512) 555-XXXX for mock data
- **Admin Credentials:** Set via `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables

## Writing New Tests

1. Create a new `.spec.ts` file in the appropriate directory
2. Use helpers from `tests/helpers/` for common operations
3. Add `data-testid` attributes to components for reliable selectors
4. Follow the existing test patterns

## CI/CD Integration

Tests are configured to run in CI environments with:
- Automatic retries (2 retries in CI)
- Single worker for consistency
- HTML report generation

The test server will automatically start on `http://localhost:5000` before running tests.

## Best Practices

- ✅ Use `data-testid` attributes instead of fragile CSS selectors
- ✅ Test user flows, not implementation details
- ✅ Mock external APIs (ServiceTitan, Stripe) to avoid real charges
- ✅ Use the test customer ID for ServiceTitan operations
- ✅ Keep tests independent - don't rely on test execution order
- ❌ Never use production data or real customer information
- ❌ Avoid hardcoding wait times - use Playwright's auto-waiting
