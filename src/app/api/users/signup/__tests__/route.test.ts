import { POST as signupHandler } from '@/app/api/users/signup/route'
import { NextRequest } from 'next/server'
import User from '@/models/userModel'
import bcryptjs from 'bcryptjs'
import { sendMail } from '@/helpers/mailHelper'

jest.mock('@/dbConnection/dbConnection')
jest.mock('@/models/userModel')
jest.mock('bcryptjs')
jest.mock('@/helpers/mailHelper')

describe('/api/users/signup', () => {
  const mockUserData = {
    userName: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully create a new user and send verification email', async () => {
    const requestBody = {
      userName: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
    }

    const mockSavedUser = {
      _id: '507f1f77bcf86cd799439011',
      ...requestBody,
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(bcryptjs.genSalt as jest.Mock).mockResolvedValue(10)
    ;(bcryptjs.hash as jest.Mock)
      .mockResolvedValueOnce('hashedPassword123')
      .mockResolvedValueOnce('hashedToken')
    ;(User.prototype.save as jest.Mock).mockResolvedValue(mockSavedUser)
    ;(sendMail as jest.Mock).mockResolvedValue({})

    const request = new NextRequest('http://localhost:3000/api/users/signup', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await signupHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('User registered Successfully.')
    expect(sendMail).toHaveBeenCalledWith({
      email: requestBody.email,
      emailType: 'VERIFY',
      userID: mockSavedUser._id,
    })
  })

  it('should return error if user already exists', async () => {
    const requestBody = {
      userName: 'testuser',
      email: 'existing@example.com',
      password: 'Password123',
    }

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

  it('should hash password with bcryptjs', async () => {
    const requestBody = {
      userName: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
    }

    const mockSavedUser = {
      _id: '507f1f77bcf86cd799439011',
      ...requestBody,
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(bcryptjs.genSalt as jest.Mock).mockResolvedValue(10)
    ;(bcryptjs.hash as jest.Mock)
      .mockResolvedValueOnce('hashedPassword123')
      .mockResolvedValueOnce('hashedToken')
    ;(User.prototype.save as jest.Mock).mockResolvedValue(mockSavedUser)
    ;(sendMail as jest.Mock).mockResolvedValue({})

    const request = new NextRequest('http://localhost:3000/api/users/signup', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    await signupHandler(request)

    expect(bcryptjs.genSalt).toHaveBeenCalledWith(10)
    expect(bcryptjs.hash).toHaveBeenCalledWith('Password123', 10)
  })

  it('should set verifyToken cookie in response', async () => {
    const requestBody = {
      userName: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
    }

    const mockSavedUser = {
      _id: '507f1f77bcf86cd799439011',
      ...requestBody,
    }

    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(bcryptjs.genSalt as jest.Mock).mockResolvedValue(10)
    ;(bcryptjs.hash as jest.Mock)
      .mockResolvedValueOnce('hashedPassword123')
      .mockResolvedValueOnce('hashedToken')
    ;(User.prototype.save as jest.Mock).mockResolvedValue(mockSavedUser)
    ;(sendMail as jest.Mock).mockResolvedValue({})

    const request = new NextRequest('http://localhost:3000/api/users/signup', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await signupHandler(request)

    expect(response.cookies.get('verifyToken')).toBeDefined()
  })

  it('should handle database errors gracefully', async () => {
    const requestBody = {
      userName: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
    }

    ;(User.findOne as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/users/signup', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await signupHandler(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database connection failed')
  })
})
