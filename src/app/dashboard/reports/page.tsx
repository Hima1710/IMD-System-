'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import { BarChart3, Loader2, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalSales: number
  totalPurchases: number
  totalDebt: number
  totalAccounts: number
}

interface TopItem {
  product_name: string
  total_quantity: number
}

export default function ReportsPage() {
  const { shop, isAuthenticated } = useApp()
  const router = useRouter()

  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalPurchases: 0,
    totalDebt: 0,
    totalAccounts: 0
  })
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (shop?.id) {
      fetchReports()
    }
  }, [shop?.id])

  const fetchReports = async () => {
    if (!shop?.id) return

    setIsLoading(true)
    setError('')
    
    try {
      // Parallel fetches
      const [salesRes, purchasesRes, debtRes, accountsRes, topItemsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_amount')
          .eq('shop_id', shop.id)
          .eq('status', 'paid'), // or invoice_type = 'sale' if exists
        supabase
          .from('purchases')
          .select('total_amount')
          .eq('shop_id', shop.id),
        supabase
          .from('customers')
          .select('total_debt')
          .eq('shop_id', shop.id),
        supabase
          .from('accounts')
          .select('balance')
          .eq('shop_id', shop.id),
        supabase
          .from('invoice_items')
          .select(`
            quantity,
            products!inner(name)
          `)
          .eq('shop_id', shop.id)
          .order('quantity', { ascending: false })
          .limit(10)
      ])

      if (salesRes.error) console.error('Sales error:', salesRes.error)
      if (purchasesRes.error) console.error('Purchases error:', purchasesRes.error)
      if (debtRes.error) console.error('Debt error:', debtRes.error)
      if (accountsRes.error) console.error('Accounts error:', accountsRes.error)
      if (topItemsRes.error) console.error('Top items error:', topItemsRes.error)

      const totalSales = salesRes.data?.reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0) || 0
      const totalPurchases = purchasesRes.data?.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0) || 0
      const totalDebt = debtRes.data?.reduce((sum: number, c: any) => sum + (c.total_debt || 0), 0) || 0
      const totalAccounts = accountsRes.data?.reduce((sum: number, a: any) => sum + (a.balance || 0), 0) || 0
      const topSoldItems = topItemsRes.data?.map((item: any) => ({
        product_name: item.products?.name || 'غير معروف',
        total_quantity: item.quantity
      })) || []

      setStats({ totalSales, totalPurchases, totalDebt, totalAccounts })
      setTopItems(topSoldItems)
    } catch (err) {
      console.error('Reports fetch error:', err)
      setError('فشل في تحميل التقارير')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const netProfit = stats.totalSales - stats.totalPurchases

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">التقارير والإحصائيات</h1>
          <p className="text-gray-400 mt-1">نظرة شاملة على أداء المتجر</p>
        </div>
        <button
          onClick={fetchReports}
          disabled={isLoading}
          className="px-6 py-2 bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 size={20} />}
          تحديث
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-400">
          {error} <button onClick={fetchReports} className="underline ml-2">إعادة المحاولة</button>
        </div>
      )}

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-8 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-12 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-8 text-right">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <DollarSign className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">{stats.totalSales.toLocaleString()}</h3>
            <p className="text-gray-400">إجمالي المبيعات</p>
          </div>

          <div className="card p-8 text-right">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <DollarSign className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white" style={{color: netProfit >= 0 ? 'emerald' : 'red'}}>
              {netProfit.toLocaleString()}
            </h3>
            <p className="text-gray-400">صافي الربح</p>
          </div>

          <div className="card p-8 text-right">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <DollarSign className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-orange-400">{stats.totalDebt.toLocaleString()}</h3>
            <p className="text-gray-400">مستحقات العملاء</p>
          </div>

          <div className="card p-8 text-right">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-blue-400">{stats.totalAccounts.toLocaleString()}</h3>
            <p className="text-gray-400">رصيد الحسابات</p>
          </div>
        </div>
      )}

      {/* Top Sold Items Table */}
      <div className="card">
        <div className="p-8 border-b border-gray-800">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 size={28} />
            الأكثر مبيعاً
          </h3>
        </div>
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">جاري تحميل البيانات...</p>
          </div>
        ) : topItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            لا توجد بيانات مبيعات بعد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">#</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">المنتج</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">الكمية المباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {topItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-white">{item.product_name}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">{item.total_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple Bar Chart */}
      <div className="card">
        <div className="p-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <BarChart3 size={28} />
            اتجاه المبيعات
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-gradient-to-b from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-400/30">
              <p className="text-sm text-gray-400 mb-2">الشهر الحالي</p>
              <div className="h-3 bg-gray-800 rounded-full mb-2 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full w-3/4" />
              </div>
              <p className="font-bold text-emerald-400">{stats.totalSales.toLocaleString()} ج.م</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-b from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-400/30">
              <p className="text-sm text-gray-400 mb-2">إجمالي المشتريات</p>
              <div className="h-3 bg-gray-800 rounded-full mb-2 overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full w-2/3" />
              </div>
              <p className="font-bold text-blue-400">{stats.totalPurchases.toLocaleString()} ج.م</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-b from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-400/30">
              <p className="text-sm text-gray-400 mb-2">صافي الربح</p>
              <div className="h-3 bg-gray-800 rounded-full mb-2 overflow-hidden">
                <div className={`h-full ${netProfit >= 0 ? 'bg-orange-400' : 'bg-red-400'} rounded-full w-${netProfit > stats.totalPurchases * 0.5 ? '4/5' : '1/2'}`} />
              </div>
              <p className={`font-bold ${netProfit >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
                {netProfit.toLocaleString()} ج.م
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
