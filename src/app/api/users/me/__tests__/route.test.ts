import { POST as meHandler } from '@/app/api/users/me/route'
import { NextRequest } from 'next/server'
import User from '@/models/userModel'
import { getDataFromToken } from '@/helpers/getDataFromToken'

jest.mock('@/dbConnection/dbConnection')
jest.mock('@/models/userModel')
jest.mock('@/helpers/getDataFromToken')

describe('/api/users/me', () => {
  const mockUserId = '507f1f77bcf86cd799439011'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return authenticated user data without password', async () => {
    const mockUser = {
      _id: mockUserId,
      userName: 'testuser',
      email: 'test@example.com',
      isVerified: true,
      isAdmin: false,
    }

    ;(getDataFromToken as jest.Mock).mockReturnValue(mockUserId)
    ;(User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    })

    const request = new NextRequest('http://localhost:3000/api/users/me', {
      method: 'POST',
      headers: {
        Cookie: 'token=mock-jwt-token',
      },
    })

    const response = await meHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('User Found')
    expect(data.data).toEqual(mockUser)
  })

  it('should exclude password field from response', async () => {
    const mockUserId = '507f1f77bcf86cd799439011'
    const mockUser = {
      _id: mockUserId,
      userName: 'testuser',
      email: 'test@example.com',
      isVerified: true,
    }

    ;(getDataFromToken as jest.Mock).mockReturnValue(mockUserId)
    ;(User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    })

    const request = new NextRequest('http://localhost:3000/api/users/me', {
      method: 'POST',
      headers: {
        Cookie: 'token=mock-jwt-token',
      },
    })

    await meHandler(request)

    expect(User.findOne).toHaveBeenCalledWith({ _id: mockUserId })
    expect((User.findOne() as any).select).toHaveBeenCalledWith('-password')
  })

  it('should extract user ID from token', async () => {
    const mockUser = {
      _id: mockUserId,
      userName: 'testuser',
      email: 'test@example.com',
    }

    ;(getDataFromToken as jest.Mock).mockReturnValue(mockUserId)
    ;(User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    })

    const request = new NextRequest('http://localhost:3000/api/users/me', {
      method: 'POST',
      headers: {
        Cookie: 'token=mock-jwt-token',
      },
    })

    await meHandler(request)

    expect(getDataFromToken).toHaveBeenCalledWith(request)
  })

  it('should handle invalid token error', async () => {
    ;(getDataFromToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    const request = new NextRequest('http://localhost:3000/api/users/me', {
      method: 'POST',
    })

    // The handler doesn't have error handling, so it will throw
    await expect(meHandler(request)).rejects.toThrow('Invalid token')
  })

  it('should handle user not found scenario', async () => {
    ;(getDataFromToken as jest.Mock).mockReturnValue(mockUserId)
    ;(User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    })

    const request = new NextRequest('http://localhost:3000/api/users/me', {
      method: 'POST',
      headers: {
        Cookie: 'token=mock-jwt-token',
      },
    })

    const response = await meHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeNull()
  })
})
