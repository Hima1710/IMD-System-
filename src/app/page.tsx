'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-slate bg-with-logo">
      <div className="text-center">
        <img src="/imd-logo.jpeg" alt="IMD System Logo" className="logo-image-large mx-auto mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold text-white mb-4">IMD System</h1>
        <p className="text-gray-400">جاري التحميل...</p>
      </div>
    </div>
  )
}