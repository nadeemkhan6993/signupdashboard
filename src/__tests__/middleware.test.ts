import { middleware } from '@/middleware'
import { NextRequest, NextResponse } from 'next/server'

describe('Middleware', () => {
  const createMockRequest = (pathname: string, cookies: Record<string, string> = {}) => {
    const url = new URL(`http://localhost:3000${pathname}`)
    const request = {
      nextUrl: {
        pathname,
        clone: () => new URL(url),
      },
      cookies: {
        get: (name: string) => {
          const value = cookies[name]
          return value ? { value } : undefined
        },
      },
      url,
    } as unknown as NextRequest

    return request
  }

  describe('Public routes (/login, /signup, /verifyemail)', () => {
    it('should redirect authenticated user from login to profile', () => {
      const request = createMockRequest('/login', { token: 'valid-jwt-token' })
      const response = middleware(request)

      expect(response).toBeDefined()
      expect(response?.status).toBe(307) // redirect status
    })

    it('should redirect user with verifyToken from signup to verifyemail', () => {
      const request = createMockRequest('/signup', { verifyToken: 'verify-token' })
      const response = middleware(request)

      expect(response).toBeDefined()
      expect(response?.status).toBe(307)
    })

    it('should allow unauthenticated user to access login', () => {
      const request = createMockRequest('/login')
      const response = middleware(request)

      expect(response).toBeUndefined()
    })

    it('should allow unauthenticated user to access signup', () => {
      const request = createMockRequest('/signup')
      const response = middleware(request)

      expect(response).toBeUndefined()
    })

    it('should allow unauthenticated user to access verifyemail', () => {
      const request = createMockRequest('/verifyemail')
      const response = middleware(request)

      expect(response).toBeUndefined()
    })
  })

  describe('Protected routes (/profile, /posts, /createPost, /)', () => {
    it('should redirect unauthenticated user from profile to login', () => {
      const request = createMockRequest('/profile')
      const response = middleware(request)

      expect(response).toBeDefined()
      expect(response?.status).toBe(307)
    })

    it('should redirect unauthenticated user from posts to login', () => {
      const request = createMockRequest('/posts')
      const response = middleware(request)

      expect(response).toBeDefined()
      expect(response?.status).toBe(307)
    })

    it('should redirect unauthenticated user from createPost to login', () => {
      const request = createMockRequest('/createPost')
      const response = middleware(request)

      expect(response).toBeDefined()
      expect(response?.status).toBe(307)
    })

    it('should redirect unauthenticated user from home to login', () => {
      const request = createMockRequest('/')
      const response = middleware(request)

      expect(response).toBeDefined()
      expect(response?.status).toBe(307)
    })

    it('should allow authenticated user to access profile', () => {
      const request = createMockRequest('/profile', { token: 'valid-jwt-token' })
      const response = middleware(request)

      expect(response).toBeUndefined()
    })

    it('should allow authenticated user to access posts', () => {
      const request = createMockRequest('/posts', { token: 'valid-jwt-token' })
      const response = middleware(request)

      expect(response).toBeUndefined()
    })

    it('should allow authenticated user to access createPost', () => {
      const request = createMockRequest('/createPost', { token: 'valid-jwt-token' })
      const response = middleware(request)

      expect(response).toBeUndefined()
    })

    it('should allow authenticated user to access home', () => {
      const request = createMockRequest('/', { token: 'valid-jwt-token' })
      const response = middleware(request)

      expect(response).toBeUndefined()
    })
  })

  describe('Token priority handling', () => {
    it('should prefer token over verifyToken for redirect decision', () => {
      const request = createMockRequest('/login', {
        token: 'valid-jwt-token',
        verifyToken: 'verify-token',
      })
      const response = middleware(request)

      expect(response).toBeDefined()
      // Should redirect to profile (token check happens first)
    })

    it('should redirect to verifyemail if verifyToken exists but no token', () => {
      const request = createMockRequest('/login', { verifyToken: 'verify-token' })
      const response = middleware(request)

      expect(response).toBeDefined()
      expect(response?.status).toBe(307)
    })
  })

  describe('Unmatched routes', () => {
    it('should not affect routes with valid token', () => {
      // When a route has a valid token and is not a public path, it should not redirect
      const request = createMockRequest('/profile', { token: 'valid-token' })
      const response = middleware(request)

      // Should not redirect since token is present
      expect(response).toBeUndefined()
    })
  })
})
