# Auth-Signup Codebase AI Agent Instructions

## Project Overview
A **Next.js 14 full-stack authentication and blogging application** with email verification, JWT token authentication, and post creation. Uses MongoDB for persistence and Nodemailer for email verification flows.

## Architecture

### Authentication Flow
1. **Signup** → User registers with email/password (password hashed with bcryptjs)
2. **Email Verification** → Verification token sent via Nodemailer, user clicks link to verify
3. **Login** → User authenticates, JWT token stored in httpOnly cookie
4. **Protected Routes** → Middleware checks for valid JWT token cookie

### Key Components

**API Layer** (`src/app/api/`)
- `/users/signup` - Register new user, send verification email
- `/users/login` - Authenticate user, set JWT token cookie
- `/users/verifyemail` - Verify email token and mark user as verified
- `/users/logout` - Clear authentication tokens
- `/createPost` - Create post with file upload (multipart form data)
- `/posts` - Fetch all posts

**Helpers** (`src/helpers/`)
- `getDataFromToken.ts` - Extract user ID from JWT cookie using token secret
- `mailHelper.ts` - Send verification/reset emails via Nodemailer (uses Mailtrap in dev)

**Models** (`src/models/`)
- `userModel.js` - User schema with email verification tokens and password reset fields
- `postModel.js` - Post schema with headline, content, author, and image buffer

**Middleware** (`src/middleware.ts`)
- Protects routes based on token/verifyToken cookies
- Redirects authenticated users away from login/signup
- Redirects unauthenticated users to login

## Critical Patterns & Conventions

### Environment Variables (Encrypted Base64)
```typescript
// Decrypt pattern used throughout:
const mongodburl = decodeURIComponent(atob(`${process.env.MONGO_URL}`))
const tokenSecret = decodeURIComponent(atob(`${process.env.TOKEN_SECRET}`))
```
All sensitive env vars are base64 encoded. Always use `decodeURIComponent(atob(...))` when accessing.

### JWT Token Implementation
- **Token Secret**: Retrieved from `process.env.TOKEN_SECRET`
- **Expiry**: 1 day (`expiresIn: '1d'`)
- **Storage**: httpOnly cookie (prevents XSS access)
- **Extraction**: Use `getDataFromToken()` helper in protected routes

### Email Verification Flow
- Verification token expires in 1 hour (3600000ms)
- Hash token with bcryptjs before storing in DB
- Email link format: `${DOMAIN}/verifyemail?token=${hashedToken}`
- Update user's `isVerified` flag on successful verification

### File Upload Handling
- Uses `formidable` library for multipart form parsing
- Set `export const dynamic = 'force-dynamic'` on upload routes
- Convert web streams to Node.js IncomingMessage for formidable compatibility
- Store file as Buffer in MongoDB (see `createPost/route.ts`)

### Client-Side Authentication
- Use client components (`'use client'`) for forms with user state
- Use `axios` for API calls (e.g., signup, login, post creation)
- Use `react-hot-toast` for user feedback
- Redirect with `useRouter()` from `next/navigation` after auth success

### Database Connection
- Call `connectDB()` once per API route file
- Connection listens to 'connected' and 'error' events
- Uses Mongoose with models that check for existing models: `mongoose.models.users || mongoose.model(...)`

## Development Commands
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run Next.js linter
```

## Key Files to Reference
- [src/middleware.ts](src/middleware.ts) - Route protection logic
- [src/app/api/users/signup/route.ts](src/app/api/users/signup/route.ts) - Registration with email send
- [src/helpers/mailHelper.ts](src/helpers/mailHelper.ts) - Email configuration
- [src/app/signup/page.tsx](src/app/signup/page.tsx) - Client-side form patterns
- [src/models/userModel.js](src/models/userModel.js) - Database schema definitions

## Dependencies to Know
- **next@14.2.5** - React framework with API routes
- **mongoose@8.5.2** - MongoDB ODM
- **bcryptjs@2.4.3** - Password hashing
- **jsonwebtoken@9.0.2** - JWT authentication
- **nodemailer@6.9.14** - Email sending (Mailtrap in dev)
- **formidable@3.5.4** - Multipart form parsing
- **axios** - Client-side HTTP requests
- **react-hot-toast** - Toast notifications
- **tailwindcss** - Utility-first CSS

## When Adding Features
1. **Protected API routes**: Import `getDataFromToken()` to extract user ID from request
2. **New email notifications**: Use `sendMail()` helper; configure new `emailType` condition
3. **New pages**: Add to middleware matcher array if route should be protected
4. **Database changes**: Update corresponding model file (JS, not TS) and re-run dev server
