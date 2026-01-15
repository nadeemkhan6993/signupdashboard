import { GET as logoutHandler } from '@/app/api/users/logout/route'
import { NextRequest } from 'next/server'

jest.mock('@/dbConnection/dbConnection')

describe('/api/users/logout', () => {
  it('should clear token cookie and return success message', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/logout', {
      method: 'GET',
    })

    const response = await logoutHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Logout Successfully.')
  })

  it('should set token cookie with empty value', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/logout', {
      method: 'GET',
    })

    const response = await logoutHandler(request)
    const tokenCookie = response.cookies.get('token')

    expect(tokenCookie).toBeDefined()
    expect(tokenCookie?.value).toBe('')
  })

  it('should set token cookie with httpOnly flag', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/logout', {
      method: 'GET',
    })

    const response = await logoutHandler(request)
    const tokenCookie = response.cookies.get('token')

    expect(tokenCookie?.httpOnly).toBe(true)
  })

  it('should set token cookie expiry to past date', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/logout', {
      method: 'GET',
    })

    const response = await logoutHandler(request)
    const tokenCookie = response.cookies.get('token')

    // The cookie should be expired
    expect(tokenCookie?.expires?.getTime()).toBeLessThanOrEqual(0)
  })

  it('should handle errors gracefully', async () => {
    // Mock console.log to avoid test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => {})

    const request = new NextRequest('http://localhost:3000/api/users/logout', {
      method: 'GET',
    })

    const response = await logoutHandler(request)

    expect(response.status).toBe(200)
    expect(response.ok).toBe(true)
  })
})
