# Testing Guide

This document describes the testing setup and how to run tests in the auth-signup project.

## Setup

Tests are configured with Jest and use the following libraries:
- **jest** - Test runner
- **ts-jest** - TypeScript support for Jest
- **@testing-library/react** - React component testing utilities
- **jest-mock-extended** - Enhanced mocking capabilities

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Structure

Tests are organized in `__tests__` directories next to the code they test:

```
src/
  helpers/
    __tests__/
      getDataFromToken.test.ts
      mailHelper.test.ts
  app/
    api/
      users/
        signup/
          __tests__/
            route.test.ts
        login/
          __tests__/
            route.test.ts
        logout/
          __tests__/
            route.test.ts
        me/
          __tests__/
            route.test.ts
        verifyemail/
          __tests__/
            route.test.ts
      createPost/
        __tests__/
          route.test.ts
      posts/
        __tests__/
          route.test.ts
  models/
    __tests__/
      userModel.test.ts
      postModel.test.ts
  dbConnection/
    __tests__/
      dbConnection.test.ts
  __tests__/
    middleware.test.ts
```

## Test Coverage

The project aims for **>80% coverage** across:
- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 80%+
- **Statements**: 80%+

### Coverage Exclusions

The following files are excluded from coverage requirements:
- `src/app/page.tsx` - Default landing page
- `src/app/layout.tsx` - App layout wrapper
- Page components in `src/app/*/page.tsx` - Client-side UI components
- Test files themselves

## Test Categories

### API Route Tests
Located in `src/app/api/**/__tests__/route.test.ts`

Tests cover:
- ✅ Successful request handling
- ✅ Error responses with correct status codes
- ✅ Input validation
- ✅ Database operations
- ✅ Cookie/token handling
- ✅ Edge cases and error scenarios

**Routes tested:**
- `POST /api/users/signup` - User registration
- `POST /api/users/login` - User authentication
- `POST /api/users/verifyemail` - Email verification
- `GET /api/users/logout` - User logout
- `POST /api/users/me` - Get current user
- `POST /api/createPost` - Create blog post
- `GET /api/posts` - Fetch all posts

### Helper Tests
Located in `src/helpers/__tests__/*.test.ts`

Tests cover:
- ✅ Token extraction and decoding
- ✅ Email sending with correct templates
- ✅ Environment variable handling
- ✅ Error handling and logging
- ✅ Token expiration logic

**Helpers tested:**
- `getDataFromToken.ts` - JWT extraction from cookies
- `mailHelper.ts` - Email sending via Nodemailer

### Middleware Tests
Located in `src/__tests__/middleware.test.ts`

Tests cover:
- ✅ Public route access
- ✅ Protected route access
- ✅ Token-based redirects
- ✅ Unauthenticated user redirection
- ✅ Authenticated user access

### Model Tests
Located in `src/models/__tests__/*.test.ts`

Tests cover:
- ✅ Schema field definitions
- ✅ Required field validation
- ✅ Unique constraints
- ✅ Default values
- ✅ Field types and structure

**Models tested:**
- `userModel.js` - User schema
- `postModel.js` - Post schema

### Database Connection Tests
Located in `src/dbConnection/__tests__/dbConnection.test.ts`

Tests cover:
- ✅ Connection string decoding
- ✅ Mongoose connection setup
- ✅ Connection event handling
- ✅ Error handling and process exit
- ✅ Environment variable parsing

## Mocking Strategy

### Database Mocks
```typescript
jest.mock('@/models/userModel')
jest.mock('@/models/postModel')
```

Models are mocked to avoid real database calls. Mock implementations return test data.

### Third-Party Library Mocks
```typescript
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')
jest.mock('nodemailer')
jest.mock('formidable')
```

External dependencies are mocked to isolate unit tests.

### Environment Variables
Test environment variables are set in `jest.setup.js`:
```typescript
process.env.MONGO_URL = Buffer.from('mongodb://localhost:27017/test').toString('base64')
process.env.TOKEN_SECRET = Buffer.from('test-secret-key-for-jwt').toString('base64')
process.env.DOMAIN = 'http://localhost:3000'
```

## Example Test Cases

### Testing API Route Success
```typescript
it('should successfully create a new user and send verification email', async () => {
  const requestBody = {
    userName: 'testuser',
    email: 'test@example.com',
    password: 'Password123',
  }

  // Mock database to return null (user doesn't exist)
  ;(User.findOne as jest.Mock).mockResolvedValue(null)
  
  // Mock password hashing
  ;(bcryptjs.genSalt as jest.Mock).mockResolvedValue(10)
  ;(bcryptjs.hash as jest.Mock).mockResolvedValueOnce('hashedPassword')

  const request = new NextRequest('http://localhost:3000/api/users/signup', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  })

  const response = await signupHandler(request)
  const data = await response.json()

  expect(response.status).toBe(200)
  expect(data.success).toBe(true)
})
```

### Testing Error Handling
```typescript
it('should return error if user already exists', async () => {
  ;(User.findOne as jest.Mock).mockResolvedValue({ email: 'existing@example.com' })

  const request = new NextRequest('http://localhost:3000/api/users/signup', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  })

  const response = await signupHandler(request)
  const data = await response.json()

  expect(response.status).toBe(400)
  expect(data.error).toBe('User already exists.')
})
```

## Best Practices

1. **Mock External Dependencies** - Always mock database calls, third-party APIs, and file I/O
2. **Test Happy Path and Error Cases** - Cover both successful scenarios and error handling
3. **Use Descriptive Test Names** - Test names should clearly describe what is being tested
4. **Isolate Tests** - Each test should be independent and not rely on execution order
5. **Clear Assertions** - Use specific assertions to verify expected behavior
6. **Setup and Teardown** - Use `beforeEach` and `afterEach` for test isolation

## Debugging Tests

### Run Single Test File
```bash
npm test -- src/helpers/__tests__/getDataFromToken.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should successfully"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Issues

### Issue: "Cannot find module '@/...'"
**Solution**: Ensure `moduleNameMapper` in `jest.config.js` matches `tsconfig.json` paths

### Issue: "TypeError: Cannot read property 'get' of undefined"
**Solution**: When testing Next.js Request/Response objects, properly mock the cookies property

### Issue: "Timeout exceeded"
**Solution**: Ensure all mocked promises are properly resolved/rejected and test doesn't hang

## Contributing

When adding new features:
1. Write tests alongside the code
2. Ensure coverage remains >80%
3. Run `npm run test:coverage` to verify
4. Update this guide if test structure changes

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Docs](https://testing-library.com/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
