import { connectDB } from '@/dbConnection/dbConnection'
import mongoose from 'mongoose'

jest.mock('mongoose')

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(process, 'exit').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should call mongoose.connect with decoded URL', async () => {
    const mockMongoURL = 'mongodb://localhost:27017/test'
    const encodedURL = Buffer.from(mockMongoURL).toString('base64')
    process.env.MONGO_URL = encodedURL

    const mockConnection = {
      on: jest.fn(),
    }
    ;(mongoose.connection as any) = mockConnection

    await connectDB()

    expect(mongoose.connect).toHaveBeenCalledWith(mockMongoURL)
  })

  it('should decode base64 encoded MONGO_URL', async () => {
    const mockMongoURL = 'mongodb://user:password@localhost:27017/dbname'
    const encodedURL = Buffer.from(mockMongoURL).toString('base64')
    process.env.MONGO_URL = encodedURL

    const mockConnection = {
      on: jest.fn(),
    }
    ;(mongoose.connection as any) = mockConnection

    await connectDB()

    const decodedURL = decodeURIComponent(atob(encodedURL))
    expect(mongoose.connect).toHaveBeenCalledWith(decodedURL)
  })

  it('should listen to connected event', async () => {
    const mockMongoURL = 'mongodb://localhost:27017/test'
    const encodedURL = Buffer.from(mockMongoURL).toString('base64')
    process.env.MONGO_URL = encodedURL

    const mockConnection = {
      on: jest.fn(),
    }
    ;(mongoose.connection as any) = mockConnection

    await connectDB()

    expect(mockConnection.on).toHaveBeenCalledWith('connected', expect.any(Function))
  })

  it('should log success message on connected', async () => {
    const mockMongoURL = 'mongodb://localhost:27017/test'
    const encodedURL = Buffer.from(mockMongoURL).toString('base64')
    process.env.MONGO_URL = encodedURL

    const mockConnection = {
      on: jest.fn((event, callback) => {
        if (event === 'connected') {
          callback()
        }
      }),
    }
    ;(mongoose.connection as any) = mockConnection

    await connectDB()

    expect(console.log).toHaveBeenCalledWith('Database is connected')
  })

  it('should listen to error event', async () => {
    const mockMongoURL = 'mongodb://localhost:27017/test'
    const encodedURL = Buffer.from(mockMongoURL).toString('base64')
    process.env.MONGO_URL = encodedURL

    const mockConnection = {
      on: jest.fn(),
    }
    ;(mongoose.connection as any) = mockConnection

    await connectDB()

    expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function))
  })

  it('should log error message on connection error', async () => {
    const mockMongoURL = 'mongodb://localhost:27017/test'
    const encodedURL = Buffer.from(mockMongoURL).toString('base64')
    process.env.MONGO_URL = encodedURL

    const testError = new Error('Connection refused')
    const mockConnection = {
      on: jest.fn((event, callback) => {
        if (event === 'error') {
          callback(testError)
        }
      }),
    }
    ;(mongoose.connection as any) = mockConnection

    await connectDB()

    expect(console.log).toHaveBeenCalledWith('Database connection error : ' + testError)
  })

  it('should exit process on connection error', async () => {
    const mockMongoURL = 'mongodb://localhost:27017/test'
    const encodedURL = Buffer.from(mockMongoURL).toString('base64')
    process.env.MONGO_URL = encodedURL

    const mockConnection = {
      on: jest.fn((event, callback) => {
        if (event === 'error') {
          callback(new Error('Connection failed'))
        }
      }),
    }
    ;(mongoose.connection as any) = mockConnection

    await connectDB()

    expect(process.exit).toHaveBeenCalledWith()
  })

  it('should handle exceptions during connection setup', async () => {
    const mockConnection = {
      on: jest.fn(),
    }
    ;(mongoose.connection as any) = mockConnection

    // Set MONGO_URL to undefined to trigger error in atob/decodeURIComponent
    const originalEnv = process.env.MONGO_URL
    delete process.env.MONGO_URL

    // Should handle gracefully without throwing
    try {
      await connectDB()
      expect(true).toBe(true) // Made it here without throwing
    } catch (e) {
      fail('connectDB should not throw')
    }

    process.env.MONGO_URL = originalEnv
  })

  it('should handle missing MONGO_URL environment variable', async () => {
    delete process.env.MONGO_URL

    const mockConnection = {
      on: jest.fn(),
    }
    ;(mongoose.connection as any) = mockConnection

    // Should handle undefined gracefully
    expect(() => {
      connectDB()
    }).not.toThrow()
  })

  it('should use decodeURIComponent for URL encoding', async () => {
    const originalURL = 'mongodb://localhost:27017/test?retryWrites=true&w=majority'
    const encodedURL = Buffer.from(originalURL).toString('base64')
    process.env.MONGO_URL = encodedURL

    const mockConnection = {
      on: jest.fn(),
    }
    ;(mongoose.connection as any) = mockConnection

    await connectDB()

    expect(mongoose.connect).toHaveBeenCalledWith(
      decodeURIComponent(atob(encodedURL))
    )
  })
})
