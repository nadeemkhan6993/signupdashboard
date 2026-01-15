import '@testing-library/jest-dom'

// Mock environment variables
process.env.MONGO_URL = Buffer.from('mongodb://localhost:27017/test').toString('base64')
process.env.TOKEN_SECRET = Buffer.from('test-secret-key-for-jwt').toString('base64')
process.env.DOMAIN = 'http://localhost:3000'

// Polyfill TextEncoder for Jest
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}
