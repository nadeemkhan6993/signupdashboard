// Example: src/app/verifyemail/page.tsx
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('Verifying...')

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      axios.post('/api/users/verifyemail', { token })
        .then(() => {
          setStatus('Email verified! Redirecting to login...')
          setTimeout(() => router.push('/login'), 2000)
        })
        .catch(() => setStatus('Verification failed.'))
    } else {
      setStatus('No token provided.')
    }
  }, [searchParams, router])

  return <div className="flex items-center justify-center min-h-screen">{status}</div>
}