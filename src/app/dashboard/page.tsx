'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { 
  TrendingUp, 
  Package, 
  Users, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Receipt,
  Activity
} from 'lucide-react'

// Types
interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  created_at: string
  status: string
}

interface Product {
  id: string
  name: string
  stock_quantity: number
  min_stock: number
  selling_price: number
  category?: string
}

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  description: string
  created_at: string
}

interface DailySales {
  date: string
  sales: number
}

interface CategoryData {
  name: string
  value: number
  color: string
}

// Colors for pie chart
const COLORS = ['#00d4ff', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc']

export default function DashboardPage() {
  const { user, shop, shopError, isAuthenticated, logout } = useApp()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'overview' | 'low-stock' | 'ledger'>('overview')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Stats
  const [todaySales, setTodaySales] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [totalDebt, setTotalDebt] = useState(0)
  const [cashBalance, setCashBalance] = useState(0)
  const [salesGrowth, setSalesGrowth] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && shop?.id) {
      fetchDashboardData()
    }
  }, [isAuthenticated, shop?.id])

  const fetchDashboardData = async () => {
    if (!shop?.id) return
    
    setIsLoading(true)
    try {
      // Fetch invoices
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setInvoices(invoiceData || [])

      // Fetch products
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
const lowStock = (productData || []).filter((p: Product) => p.stock_quantity < p.min_stock)
      setLowStockProducts(lowStock)
      setTotalItems(productData?.length || 0)

      // Category distribution
      const categoryMap = new Map<string, number>()
      ;(productData || []).forEach((p: Product) => {
        const cat = p.category || 'غير مصنف'
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
      })
      const catData: CategoryData[] = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      setCategoryData(catData)

// Fetch transactions
      const { data: transData } = await supabase
        .from('account_ledger')
        .select('id, transaction_type, amount, description, created_at')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setTransactions(transData || [])

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      
      // Today's sales
      const todayInvoices = (invoiceData || []).filter((inv: Invoice) => 
        inv.created_at.startsWith(today)
      )
const todayTotal = todayInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.total_amount || 0), 0)
      setTodaySales(todayTotal)

      // Yesterday's sales for comparison
      const yesterdayInvoices = (invoiceData || []).filter((inv: Invoice) => 
        inv.created_at.startsWith(yesterday)
      )
const yesterdayTotal = yesterdayInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.total_amount || 0), 0)
      
      // Calculate growth
      if (yesterdayTotal > 0) {
        const growth = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
        setSalesGrowth(growth)
      }

      // Total debt (from customers table)
      const { data: debtData } = await supabase
        .from('customers')
        .select('total_debt')
        .eq('shop_id', shop.id)
      const totalDebtAmount = (debtData || []).reduce((sum, c) => sum + (c.total_debt || 0), 0)
      setTotalDebt(totalDebtAmount)

// Cash balance (from ledger)
      const { data: ledgerData } = await supabase
        .from('account_ledger')
        .select('amount, transaction_type')
        .eq('shop_id', shop.id)
      
const income = (ledgerData || []).filter((t) => t.transaction_type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
      const expense = (ledgerData || []).filter((t) => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
      
      setCashBalance(income - expense)

      // Generate last 7 days sales data
      const last7Days: DailySales[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const dayInvoices = (invoiceData || []).filter((inv: Invoice) => 
          inv.created_at.startsWith(dateStr)
        )
const dayTotal = dayInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.total_amount || 0), 0)
        last7Days.push({
          date: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
          sales: dayTotal
        })
      }
      setDailySales(last7Days)

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="skeleton-card skeleton" />
  )

  const SkeletonText = ({ width = '100%' }: { width?: string }) => (
    <div className="skeleton-text skeleton" style={{ width }} />
  )

  if (!isAuthenticated) {
    return null
  }

  if (shopError || !shop?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center">
          <AlertTriangle size={64} className="mx-auto text-red-400 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">متجر غير متوفر</h2>
          <p className="text-gray-400 max-w-md">{shopError || 'لا يمكن تحميل بيانات المتجر. يرجى التحقق من الإعدادات.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">لوحة التحكم</h1>
          <p className="text-gray-400 mt-1">
            مرحباً، <span className="text-white font-semibold">{user?.fullName}</span>
            <span className="mx-2">|</span>
            <span className="text-accent">{shop?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 pulse-glow"></span>
          <span className="text-sm text-gray-400">نظام نشط</span>
        </div>
      </div>

      {/* Stats Cards with Glow Effect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Today's Sales */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="stat-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${salesGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {salesGrowth >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{Math.abs(salesGrowth).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">مبيعات اليوم</p>
            <p className="text-2xl font-bold text-white mt-1">{todaySales.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">جنية مصري</p>
          </div>
        )}

        {/* Total Products */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="stat-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-sm text-gray-400">
                <span className="text-white font-semibold">{lowStockProducts.length}</span> ناقص
              </div>
            </div>
            <p className="text-gray-400 text-sm">إجمالي المنتجات</p>
            <p className="text-2xl font-bold text-white mt-1">{totalItems}</p>
            <p className="text-xs text-gray-500 mt-1">صنف في المخزن</p>
          </div>
        )}

        {/* Total Debt */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="stat-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm">المستحقات</p>
            <p className="text-2xl font-bold text-white mt-1">{totalDebt.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">جنية مصري</p>
          </div>
        )}

        {/* Cash Balance */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="stat-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm">رصيد الخزينة</p>
            <p className="text-2xl font-bold text-white mt-1">{cashBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">جنية مصري</p>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Sales Area Chart */}
        <div className="lg:col-span-2 chart-glow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">المبيعات الأسبوعية</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          {isLoading ? (
            <div className="h-64 skeleton rounded-lg" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySales}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} ج.م`, 'المبيعات']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#00d4ff" 
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Categories Pie Chart */}
        <div className="chart-glow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">التصنيفات</h3>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          {isLoading ? (
            <div className="h-64 skeleton rounded-lg" />
          ) : categoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              لا توجد بيانات
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="glow-card">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-800 mb-6">
          {[
            { key: 'overview', label: 'الفواتير الأخيرة', icon: Receipt },
            { key: 'low-stock', label: 'نواقص المخزن', icon: AlertTriangle },
            { key: 'ledger', label: 'حركة الخزينة', icon: Wallet },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                activeTab === tab.key ? 'text-accent' : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-cyan-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 skeleton rounded-lg" />
            ))}
          </div>
        ) : activeTab === 'overview' ? (
          invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد فواتير بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/30">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">رقم الفاتورة</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">التاريخ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-4 text-white font-medium">{invoice.invoice_number || '-'}</td>
<td className="px-4 py-4 text-cyan-400 font-semibold">{invoice.total_amount?.toFixed(2) || 0} ج.م</td>
                      <td className="px-4 py-4 text-gray-400">{new Date(invoice.created_at).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' || invoice.status === 'مدفوعة'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {invoice.status === 'paid' || invoice.status === 'مدفوعة' ? 'مدفوعة' : 'معلقة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'low-stock' ? (
          lowStockProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد نواقص في المخزن</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="bg-gray-800/30 rounded-lg p-4 border border-gray-800 hover:border-red-500/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">{product.name}</h4>
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
<div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">الكمية الحالية</span>
                      <span className="text-red-400 font-medium">{product.stock_quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">الحد الأدنى</span>
                      <span className="text-yellow-400 font-medium">{product.min_stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">السعر</span>
                      <span className="text-cyan-400 font-medium">{product.selling_price?.toFixed(2) || 0} ج.م</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد معاملات بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/30">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">البيان</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">النوع</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {transactions.map((trans) => (
<tr key={trans.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-4 text-white">{trans.description || '-'}</td>
                      <td className={`px-4 py-4 font-semibold ${trans.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {trans.amount?.toFixed(2) || 0} ج.م
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          trans.transaction_type === 'income' 
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trans.transaction_type === 'income' ? 'إيراد' : 'مصروف'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-400">{new Date(trans.created_at).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}

