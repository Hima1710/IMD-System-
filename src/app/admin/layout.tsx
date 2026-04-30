'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isSuperAdmin, isLoading } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!isSuperAdmin) {
        router.push('/dashboard')
      }
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router])

  if (isLoading || !isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-slate">
        <div className="text-center">
          <img src="/imd-logo.jpeg" alt="IMD System Logo" className="logo-image mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

