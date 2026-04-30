'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useApp()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email || !phone) {
      setError('الرجاء إدخال البريد الإلكتروني ورقم الهاتف')
      setIsLoading(false)
      return
    }

    try {
      const success = await login(email, phone)
      if (success) {
        router.push('/dashboard')
      } else {
        setError('البريد الإلكتروني أو رقم الهاتف غير صحيح')
      }
    } catch (err: any) {
      console.error('Login page error:', err)
      setError(err?.message || 'حدث خطأ أثناء تسجيل الدخول')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-slate bg-with-logo px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img src="/imd-logo.jpeg" alt="IMD System Logo" className="logo-image mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">IMD System</h1>
          <p className="text-gray-400">نظام إدارة المتاجر الذكي</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6 text-center">تسجيل الدخول</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
                dir="ltr"
              />
            </div>

            {/* Phone Input (Password) */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                رقم الهاتف (كلمة المرور)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="أدخل رقم الهاتف"
                className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
                dir="ltr"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري تسجيل الدخول...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="text-electric-blue hover:text-cyan-accent font-semibold transition-colors">
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">للدعم الفني:</p>
          <p className="text-electric-blue text-sm">01558905021 - 01558905023</p>
        </div>
      </div>
    </div>
  )
}