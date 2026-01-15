import { sendMail } from '@/helpers/mailHelper'
import User from '@/models/userModel'
import bcryptjs from 'bcryptjs'
import nodemailer from 'nodemailer'

// Mock dependencies
jest.mock('@/models/userModel')
jest.mock('bcryptjs')
jest.mock('nodemailer')

describe('sendMail', () => {
  const mockUserId = '507f1f77bcf86cd799439011'
  const mockEmail = 'test@example.com'
  const mockHashedToken = 'hashed_token_12345'

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DOMAIN = 'http://localhost:3000'
  })

  it('should send verification email and update user token', async () => {
    ;(bcryptjs.hash as jest.Mock).mockResolvedValue(mockHashedToken)
    ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
      _id: mockUserId,
      email: mockEmail,
    })

    const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    ;(nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    })

    const result = await sendMail({
      email: mockEmail,
      emailType: 'VERIFY',
      userID: mockUserId,
    })

    expect(bcryptjs.hash).toHaveBeenCalledWith(mockUserId.toString(), 10)
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        verifyToken: mockHashedToken,
        verifyTokenExpiry: expect.any(Number),
      })
    )
    expect(mockSendMail).toHaveBeenCalled()
    expect(result.messageId).toBe('test-message-id')
  })

  it('should send password reset email', async () => {
    ;(bcryptjs.hash as jest.Mock).mockResolvedValue(mockHashedToken)
    ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
      _id: mockUserId,
      email: mockEmail,
    })

    const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'reset-message-id' })
    ;(nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    })

    const result = await sendMail({
      email: mockEmail,
      emailType: 'RESET',
      userID: mockUserId,
    })

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        forgotPasswordToken: mockHashedToken,
        forgotPasswordTokenExpiry: expect.any(Number),
      })
    )
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Reset your password',
      })
    )
  })

  it('should include correct email link in verification email', async () => {
    ;(bcryptjs.hash as jest.Mock).mockResolvedValue(mockHashedToken)
    ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

    const mockSendMail = jest.fn().mockResolvedValue({})
    ;(nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    })

    await sendMail({
      email: mockEmail,
      emailType: 'VERIFY',
      userID: mockUserId,
    })

    const mailCall = mockSendMail.mock.calls[0][0]
    expect(mailCall.html).toContain(`${process.env.DOMAIN}/verifyemail?token=${mockHashedToken}`)
    expect(mailCall.subject).toBe('Verify your email')
  })

  it('should throw error when email sending fails', async () => {
    ;(bcryptjs.hash as jest.Mock).mockResolvedValue(mockHashedToken)
    ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue({})
    ;(nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: jest.fn().mockRejectedValue(new Error('SMTP connection failed')),
    })

    await expect(
      sendMail({
        email: mockEmail,
        emailType: 'VERIFY',
        userID: mockUserId,
      })
    ).rejects.toThrow('SMTP connection failed')
  })

  it('should set token expiry to 1 hour from now', async () => {
    ;(bcryptjs.hash as jest.Mock).mockResolvedValue(mockHashedToken)
    ;(User.findByIdAndUpdate as jest.Mock).mockResolvedValue({})
    ;(nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({}),
    })

    const beforeTime = Date.now()
    await sendMail({
      email: mockEmail,
      emailType: 'VERIFY',
      userID: mockUserId,
    })
    const afterTime = Date.now()

    const updateCall = (User.findByIdAndUpdate as jest.Mock).mock.calls[0][1]
    const expiry = updateCall.verifyTokenExpiry

    // Check expiry is approximately 1 hour from now
    const expectedExpiry = beforeTime + 3600000
    expect(expiry).toBeGreaterThanOrEqual(expectedExpiry - 1000)
    expect(expiry).toBeLessThanOrEqual(afterTime + 3600000 + 1000)
  })
})
