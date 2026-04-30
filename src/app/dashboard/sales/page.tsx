'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { ShoppingCart, ArrowRight, ArrowLeft, Receipt, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function SalesPage() {
  const { isAuthenticated, shopError, shop } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  if (shopError || !shop?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center">
          <AlertTriangle size={64} className="mx-auto text-red-400 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">متجر غير متوفر</h2>
          <p className="text-gray-400 max-w-md">{shopError || 'لا يمكن تحميل بيانات المتجر.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">المبيعات</h1>
          <p className="text-gray-400 mt-1">إدارة فواتير ومبيعات المتجر</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/sales/new" className="group glow-card p-8 text-center hover:scale-[1.02] transition-all duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-6 transition-transform">
            <ShoppingCart className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">فاتورة جديدة</h3>
          <p className="text-gray-400">إنشاء مبيعات سريعة بنقرة واحدة</p>
        </Link>

        <Link href="/dashboard/sales/new" className="group glow-card p-8 text-center hover:scale-[1.02] transition-all duration-300 border-2 border-dashed border-gray-700">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 10l-4-4m0 0l4-4m-4 4h12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">باركود سريع</h3>
          <p className="text-gray-400 mb-4">مسح مباشر وإضافة فورية</p>
          <kbd className="px-2 py-1 bg-gray-800 text-xs rounded">Enter</kbd>
        </Link>

        <div className="glow-card p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <Receipt className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white mb-1">0</p>
            <p className="text-gray-400 text-sm mb-4">فواتير اليوم</p>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="glow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">آخر الفواتير</h3>
          <Link href="/dashboard/reports" className="text-electric-blue hover:text-cyan-accent flex items-center gap-1 text-sm">
            عرض الكل <ArrowLeft size={16} />
          </Link>
        </div>
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">لا توجد فواتير بعد</p>
          <p className="text-sm text-gray-500 mt-1">ابدأ بإنشاء فاتورة جديدة</p>
        </div>
      </div>
    </div>
  )
}