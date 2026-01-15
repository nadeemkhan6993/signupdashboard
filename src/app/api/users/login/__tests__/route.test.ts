import { POST as loginHandler } from '@/app/api/users/login/route'
import { NextRequest } from 'next/server'
import User from '@/models/userModel'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'

jest.mock('@/dbConnection/dbConnection')
jest.mock('@/models/userModel')
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

describe('/api/users/login', () => {
  const mockTokenSecret = Buffer.from('test-secret-key-for-jwt').toString('base64')

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TOKEN_SECRET = mockTokenSecret
  })

  it('should successfully login user with valid credentials', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'Password123',
    }

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword123',
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
    ;(bcryptjs.compare as jest.Mock).mockResolvedValue(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token')

    const request = new NextRequest('http://localhost:3000/api/users/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await loginHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Logged in success.')
  })

  it('should return error if user does not exist', async () => {
    const requestBody = {
      email: 'nonexistent@example.com',
      password: 'Password123',
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/users/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await loginHandler(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('User does not exists.')
  })

  it('should return error if password is incorrect', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'WrongPassword',
    }

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      password: 'hashedPassword123',
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
    ;(bcryptjs.compare as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/users/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await loginHandler(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Check your credentials.')
  })

  it('should create JWT token with correct payload', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'Password123',
    }

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword123',
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
    ;(bcryptjs.compare as jest.Mock).mockResolvedValue(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token')

    const request = new NextRequest('http://localhost:3000/api/users/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    await loginHandler(request)

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser._id,
        email: mockUser.email,
      }),
      decodeURIComponent(atob(mockTokenSecret)),
      { expiresIn: '1d' }
    )
  })

  it('should set JWT token cookie in response', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'Password123',
    }

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword123',
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(mockUser)
    ;(bcryptjs.compare as jest.Mock).mockResolvedValue(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token')

    const request = new NextRequest('http://localhost:3000/api/users/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await loginHandler(request)

    expect(response.cookies.get('token')).toBeDefined()
  })

  it('should handle database errors', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'Password123',
    }

    ;(User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/users/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await loginHandler(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })
})
