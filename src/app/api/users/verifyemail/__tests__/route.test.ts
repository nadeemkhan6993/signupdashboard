import { POST as verifyEmailHandler } from '@/app/api/users/verifyemail/route'
import { NextRequest } from 'next/server'
import User from '@/models/userModel'

jest.mock('@/dbConnection/dbConnection')
jest.mock('@/models/userModel')

describe('/api/users/verifyemail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should verify email with valid token', async () => {
    const token = 'valid-token'
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      isVerified: false,
      verifyToken: token,
      verifyTokenExpiry: Date.now() + 3600000,
      save: jest.fn().mockResolvedValue({}),
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/users/verifyemail', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })

    const response = await verifyEmailHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Email verified Successfully.')
    expect(mockUser.isVerified).toBe(true)
    expect(mockUser.save).toHaveBeenCalled()
  })

  it('should clear verification token after successful verification', async () => {
    const token = 'valid-token'
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      isVerified: false,
      verifyToken: token,
      verifyTokenExpiry: Date.now() + 3600000,
      save: jest.fn().mockResolvedValue({}),
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/users/verifyemail', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })

    await verifyEmailHandler(request)

    expect(mockUser.verifyToken).toBeUndefined()
    expect(mockUser.verifyTokenExpiry).toBeUndefined()
  })

  it('should return error for invalid token', async () => {
    ;(User.findOne as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/users/verifyemail', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token' }),
    })

    const response = await verifyEmailHandler(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid Token details')
  })

  it('should return error for expired token', async () => {
    const token = 'expired-token'
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      isVerified: false,
      verifyToken: token,
      verifyTokenExpiry: Date.now() - 3600000, // Expired 1 hour ago
      save: jest.fn(),
    }

    // When token is expired, findOne should return null because of {$gt: Date.now()}
    ;(User.findOne as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/users/verifyemail', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })

    const response = await verifyEmailHandler(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid Token details')
  })

  it('should only update specified fields', async () => {
    const token = 'valid-token'
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      isVerified: false,
      verifyToken: token,
      verifyTokenExpiry: Date.now() + 3600000,
      userName: 'testuser',
      password: 'hashedPassword',
      save: jest.fn().mockResolvedValue({}),
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/users/verifyemail', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })

    await verifyEmailHandler(request)

    // Verify that only verification-related fields are modified
    expect(mockUser.isVerified).toBe(true)
    expect(mockUser.userName).toBe('testuser') // Should remain unchanged
    expect(mockUser.password).toBe('hashedPassword') // Should remain unchanged
  })

  it('should handle database errors', async () => {
    ;(User.findOne as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/users/verifyemail', {
      method: 'POST',
      body: JSON.stringify({ token: 'token' }),
    })

    const response = await verifyEmailHandler(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database connection failed')
  })
})
