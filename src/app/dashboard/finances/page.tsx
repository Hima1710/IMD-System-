'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase, type Account, type AccountLedger } from '@/lib/supabase'
import { Wallet, TrendingUp, TrendingDown, DollarSign, Clock, Search, AlertTriangle } from 'lucide-react'

export default function FinancesPage() {
  const { shop, isAuthenticated } = useApp()
  const router = useRouter()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [ledger, setLedger] = useState<AccountLedger[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

  // Stats
  const [totalCash, setTotalCash] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (shop?.id) {
      fetchFinanceData()
    }
  }, [shop?.id])

  const fetchFinanceData = async () => {
    if (!shop?.id) return

    setIsLoading(true)
    try {
      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('shop_id', shop.id)

      // Fetch recent ledger
      const { data: ledgerData } = await supabase
        .from('account_ledger')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setAccounts(accountsData || [])
      setLedger(ledgerData || [])

      // Calculate stats
      const cashBalance = accountsData?.filter(a => a.account_type === 'cash').reduce((sum, a) => sum + (a.balance || 0), 0) || 0
      const incomeSum = ledgerData?.filter(l => l.transaction_type === 'income').reduce((sum, l) => sum + (l.amount || 0), 0) || 0
      const expenseSum = ledgerData?.filter(l => l.transaction_type === 'expense').reduce((sum, l) => sum + (l.amount || 0), 0) || 0

      setTotalCash(cashBalance)
      setTotalIncome(incomeSum)
      setTotalExpense(expenseSum)

    } catch (err) {
      console.error('Error fetching finance data:', err)
      setError('فشل في تحميل البيانات المالية')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLedger = ledger.filter(item =>
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.transaction_type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-slate">
      {/* Header */}
      <div className="bg-dark-card border-b border-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold gradient-text mb-2">المالية</h1>
          <p className="text-gray-400">إدارة الخزينة والحسابات المالية للمتجر</p>
        </div>
      </div>

<div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 space-y-8">
        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} />
              {error}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{totalCash.toLocaleString()}</h3>
            <p className="text-gray-400 text-sm">رصيد الخزينة</p>
          </div>

          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-green-400 mb-1">{totalIncome.toLocaleString()}</h3>
            <p className="text-gray-400 text-sm">إجمالي الإيرادات</p>
          </div>

          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-red-400 mb-1">{totalExpense.toLocaleString()}</h3>
            <p className="text-gray-400 text-sm">إجمالي المصروفات</p>
          </div>

          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-blue-400 mb-1">
              {(totalIncome - totalExpense).toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">صافي الربح</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">الحركات الأخيرة</h2>
              <p className="text-gray-400">آخر 50 معاملة مالية</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في الوصف..."
                className="w-64 pl-10 pr-4 py-2 bg-slate-dark border border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent text-right"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">جاري التحميل...</p>
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">لا توجد حركات مالية</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">التاريخ</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">النوع</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">المبلغ</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">الوصف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredLedger.slice(0, 20).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(item.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.transaction_type === 'income' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {item.transaction_type === 'income' ? 'إيراد' : 'مصروف'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-lg">
                        <span className={`${
                          item.transaction_type === 'income' 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {item.amount?.toLocaleString()} ج.م
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 max-w-md truncate">
                        {item.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
