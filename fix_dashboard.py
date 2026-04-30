content = r"""'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

export default function DashboardPage() {
  const { user, shop, isAuthenticated, logout } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-slate bg-with-logo">
      <header className="bg-dark-card border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/imd-logo.jpeg" alt="IMD System Logo" className="logo-image-small" />
              <div>
                <h1 className="text-xl font-bold text-white">IMD System</h1>
                <p className="text-xs text-gray-400">نظام إدارة المتاجر</p>
              </div>
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-white font-medium">{user?.fullName}</p>
                <p className="text-gray-400 text-sm">{shop?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            مرحباً، {user?.fullName} 👋
          </h2>
          <p className="text-gray-400">
            إليك نظرة عامة على متجرك <span className="text-electric-blue font-semibold">{shop?.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">المبيعات اليومية</p>
                <p className="text-2xl font-bold text-white mt-1">12,500 ج.م</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-electric-blue/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            <p className="text-green-400 text-sm mt-3">+15% من الأسبوع الماضي</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">الطلبات</p>
                <p className="text-2xl font-bold text-white mt-1">48</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-cyan-accent/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            <p className="text-green-400 text-sm mt-3">+8% من أمس</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">المنتجات</p>
                <p className="text-2xl font-bold text-white mt-1">156</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            <p className="text-gray-400 text-sm mt-3">منتج جديد هذا الأسبوع</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">العملاء</p>
                <p className="text-2xl font-bold text-white mt-1">892</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            <p className="text-green-400 text-sm mt-3">+23 عميل جديد</p>
          </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="card hover:border-electric-blue cursor-pointer flex flex-col items-center gap-2 py-4">
              <div className="w-12 h-12 rounded-full bg-electric-blue/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-white text-sm">إضافة منتج</span>
            </button>
            <button className="card hover:border-electric-blue cursor-pointer flex flex-col items-center gap-2 py-4">
              <div className="w-12 h-12 rounded-full bg-cyan-accent/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-white text-sm">طلب جديد</span>
            </button>
            <button className="card hover:border-electric-blue cursor-pointer flex flex-col items-center gap-2 py-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-white text-sm">التقارير</span>
            </button>
            <button className="card hover:border-electric-blue cursor-pointer flex flex-col items-center gap-2 py-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-white text-sm">الإعدادات</span>
            </button>
          </div>

        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">أحدث الطلبات</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-right text-gray-400 text-sm py-3 px-4">رقم الطلب</th>
                  <th className="text-right text-gray-400 text-sm py-3 px-4">العميل</th>
                  <th className="text-right text-gray-400 text-sm py-3 px-4">المنتجات</th>
                  <th className="text-right text-gray-400 text-sm py-3 px-4">المبلغ</th>
                  <th className="text-right text-gray-400 text-sm py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 text-white">#ORD-001</td>
                  <td className="py-3 px-4 text-white">أحمد محمد</td>
                  <td className="py-3 px-4 text-gray-300">3 منتجات</td>
                  <td className="py-3 px-4 text-white">1,250 ج.م</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">مكتمل</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 text-white">#ORD-002</td>
                  <td className="py-3 px-4 text-white">سارة علي</td>
                  <td className="py-3 px-4 text-gray-300">5 منتجات</td>
                  <td className="py-3 px-4 text-white">2,100 ج.م</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">قيد التجهيز</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 text-white">#ORD-003</td>
                  <td className="py-3 px-4 text-white">محمد حسن</td>
                  <td className="py-3 px-4 text-gray-300">2 منتجات</td>
                  <td className="py-3 px-4 text-white">850 ج.م</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">قيد التوصيل</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-white">#ORD-004</td>
                  <td className="py-3 px-4 text-white">خالد عمر</td>
                  <td className="py-3 px-4 text-gray-300">1 منتج</td>
                  <td className="py-3 px-4 text-white">450 ج.م</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">جديد</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </main>
    </div>
  )
}
"""

with open('src/app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('File written successfully')
