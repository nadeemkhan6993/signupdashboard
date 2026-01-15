import { getDataFromToken } from '@/helpers/getDataFromToken'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

// Mock jsonwebtoken
jest.mock('jsonwebtoken')

describe('getDataFromToken', () => {
  const mockTokenSecret = Buffer.from('test-secret-key-for-jwt').toString('base64')
  const mockUserId = '507f1f77bcf86cd799439011'
  const mockToken = 'mock.jwt.token'

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TOKEN_SECRET = mockTokenSecret
  })

  it('should extract user ID from valid token', () => {
    const mockRequest = {
      cookies: {
        get: jest.fn((name: string) => {
          if (name === 'token') {
            return { value: mockToken }
          }
          return null
        }),
      },
    } as unknown as NextRequest

    ;(jwt.verify as jest.Mock).mockReturnValue({
      id: mockUserId,
      email: 'test@example.com',
    })

    const result = getDataFromToken(mockRequest)

    expect(result).toBe(mockUserId)
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      decodeURIComponent(atob(mockTokenSecret))
    )
  })

  it('should throw error for invalid token', () => {
    const mockRequest = {
      cookies: {
        get: jest.fn((name: string) => {
          if (name === 'token') {
            return { value: 'invalid.token' }
          }
          return null
        }),
      },
    } as unknown as NextRequest

    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    expect(() => {
      getDataFromToken(mockRequest)
    }).toThrow('Invalid token')
  })

  it('should handle missing token gracefully', () => {
    const mockRequest = {
      cookies: {
        get: jest.fn(() => null),
      },
    } as unknown as NextRequest

    ;(jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt malformed')
    })

    expect(() => {
      getDataFromToken(mockRequest)
    }).toThrow()
  })

  it('should decode base64 encoded token secret correctly', () => {
    const mockRequest = {
      cookies: {
        get: jest.fn((name: string) => {
          if (name === 'token') {
            return { value: mockToken }
          }
          return null
        }),
      },
    } as unknown as NextRequest

    ;(jwt.verify as jest.Mock).mockReturnValue({ id: mockUserId })

    getDataFromToken(mockRequest)

    const decodedSecret = decodeURIComponent(atob(mockTokenSecret))
    expect(jwt.verify).toHaveBeenCalledWith(mockToken, decodedSecret)
  })
})
