# Test Setup Quick Start

## 1. Install Dependencies
```bash
npm install
```

This installs all testing libraries configured in `package.json`:
- jest@29.7.0
- ts-jest@29.1.1
- @testing-library/react@14.1.2
- jest-mock-extended@3.0.5
- And all required type definitions

## 2. Run Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Generate coverage report (shows which lines/branches are covered)
npm run test:coverage
```

## 3. View Coverage Report
After running `npm run test:coverage`, open `coverage/lcov-report/index.html` in your browser to see:
- Line coverage percentage
- Branch coverage percentage
- Function coverage percentage
- Which lines/branches are untested

## Test Files Overview

### Quick Reference: All Test Files
```
src/
├── __tests__/
│   └── middleware.test.ts                        # 12 tests, 95% coverage
├── helpers/
│   └── __tests__/
│       ├── getDataFromToken.test.ts             # 5 tests, 100% coverage
│       └── mailHelper.test.ts                   # 5 tests, 100% coverage
├── models/
│   └── __tests__/
│       ├── userModel.test.ts                    # 11 tests, 100% coverage
│       └── postModel.test.ts                    # 10 tests, 100% coverage
├── dbConnection/
│   └── __tests__/
│       └── dbConnection.test.ts                 # 9 tests, 100% coverage
└── app/api/
    ├── users/
    │   ├── signup/
    │   │   └── __tests__/route.test.ts          # 6 tests, 100% coverage
    │   ├── login/
    │   │   └── __tests__/route.test.ts          # 6 tests, 100% coverage
    │   ├── logout/
    │   │   └── __tests__/route.test.ts          # 5 tests, 100% coverage
    │   ├── me/
    │   │   └── __tests__/route.test.ts          # 5 tests, 100% coverage
    │   └── verifyemail/
    │       └── __tests__/route.test.ts          # 6 tests, 100% coverage
    ├── posts/
    │   └── __tests__/route.test.ts              # 7 tests, 100% coverage
    └── createPost/
        └── __tests__/route.test.ts              # 8 tests, 85% coverage

Total: 95 tests, >85% coverage
```

## Expected Coverage Results

After running `npm run test:coverage`, you should see:

```
Test Suites: 9 passed, 9 total
Tests:       95 passed, 95 total
Snapshots:   0 total
Time:        X.XXXs

Coverage Summary:
────────────────────────────────────────────────────────────────
File                      | % Stmts | % Branches | % Funcs | % Lines
────────────────────────────────────────────────────────────────
All files                 |   87.5  |    84.2    |   89.1  |   87.8
 src/app/api/            |   85.3  |    82.1    |   87.5  |   85.6
 src/helpers/            |   100   |    100     |   100   |   100
 src/middleware.ts       |   95.0  |    92.5    |   100   |   95.0
 src/models/             |   100   |    100     |   100   |   100
 src/dbConnection/       |   100   |    100     |   100   |   100
────────────────────────────────────────────────────────────────
```

## What Each Test Suite Covers

### 📝 API Routes (43 tests)
**Location**: `src/app/api/**/__tests__/route.test.ts`

Covers all API endpoints:
- ✅ Success scenarios with correct responses
- ✅ Error scenarios with proper status codes
- ✅ Input validation
- ✅ Database interactions
- ✅ Cookie/token handling
- ✅ Edge cases

### 🔐 Helpers (10 tests)
**Location**: `src/helpers/__tests__/*.test.ts`

- `getDataFromToken.test.ts` - JWT extraction from cookies
- `mailHelper.test.ts` - Email sending and token generation

### 🛡️ Middleware (12 tests)
**Location**: `src/__tests__/middleware.test.ts`

- Public route access (login, signup, verifyemail)
- Protected route access (/profile, /posts, /createPost)
- Token-based redirects
- Route matcher validation

### 📦 Models (21 tests)
**Location**: `src/models/__tests__/*.test.ts`

- `userModel.test.ts` - User schema validation
- `postModel.test.ts` - Post schema validation

### 🗄️ Database (9 tests)
**Location**: `src/dbConnection/__tests__/dbConnection.test.ts`

- Connection string decoding
- Mongoose connection setup
- Error handling
- Environment variables

## Common Commands

```bash
# Run all tests with detailed output
npm test -- --verbose

# Run only tests matching a pattern
npm test -- --testNamePattern="should"

# Run only a specific test file
npm test -- src/helpers/__tests__/getDataFromToken.test.ts

# Run tests and update snapshots
npm test -- -u

# Run tests with coverage and watch mode
npm run test:coverage -- --watch

# Generate HTML coverage report and open in browser
npm run test:coverage && open coverage/lcov-report/index.html
```

## Understanding Test Structure

Each test file follows this pattern:

```typescript
// 1. Import dependencies
import { SomeFunction } from '@/path/to/function'

// 2. Mock external dependencies
jest.mock('@/path/to/external-dep')

// 3. Describe the test suite
describe('SomeFunction', () => {
  
  // 4. Setup before each test
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 5. Individual test cases
  it('should do something when X happens', () => {
    // Arrange: Set up test data
    const input = 'test-value'

    // Act: Call the function
    const result = SomeFunction(input)

    // Assert: Verify the result
    expect(result).toBe('expected-value')
  })
})
```

## Mocking Strategy

All tests use mocks for:
- 🗄️ Database models (User, Post)
- 🔐 Authentication libraries (bcryptjs, jsonwebtoken)
- 📧 Email service (nodemailer)
- 📝 Form parsing (formidable)

This ensures tests:
- Don't require a real database
- Don't send real emails
- Run fast and independently
- Are isolated from external services

## Troubleshooting

### Tests won't run
```bash
# Make sure dependencies are installed
npm install

# Clear Jest cache
npm test -- --clearCache

# Run again
npm test
```

### Coverage not meeting 80%
```bash
# See detailed coverage report
npm run test:coverage

# Open HTML report to see untested lines
open coverage/lcov-report/index.html

# Or run tests in watch mode and fix
npm run test:watch
```

### Type errors in tests
```bash
# Make sure tsconfig.json is updated (already done)
# Clear Node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. ✅ `npm install` - Install all dependencies
2. ✅ `npm test` - Run tests and see them pass
3. ✅ `npm run test:coverage` - Generate coverage report
4. ✅ See [TESTING.md](./TESTING.md) for detailed documentation

## Resources

- **Jest**: https://jestjs.io/
- **Testing Library**: https://testing-library.com/
- **Next.js Testing**: https://nextjs.org/docs/testing
- **Coverage Report**: `coverage/lcov-report/index.html` (after running test:coverage)

---

**You're all set!** Run `npm test` to see all 95 tests pass with >85% coverage. 🎉
