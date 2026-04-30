'use client'

import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-slate bg-with-logo px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img src="/imd-logo.jpeg" alt="IMD System Logo" className="logo-image mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">IMD System</h1>
          <p className="text-gray-400">نظام إدارة المتاجر الذكي</p>
        </div>

        {/* Closed Registration Message */}
        <div className="card text-center py-12">
          <div className="w-20 h-20 rounded-full bg-electric-blue/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">التسجيل مغلق</h2>

          <p className="text-gray-300 text-lg mb-2">
            التسجيل متاح فقط من خلال الإدارة
          </p>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gray-700"></div>
            <svg className="w-5 h-5 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div className="h-px w-12 bg-gray-700"></div>
          </div>

          <p className="text-electric-blue text-xl font-bold mb-8" dir="ltr">
            01558905021
          </p>

          <Link
            href="/login"
            className="inline-block bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:opacity-90"
          >
            العودة لتسجيل الدخول
          </Link>
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

