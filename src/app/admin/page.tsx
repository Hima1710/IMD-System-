'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import {
  Shield,
  Store,
  Users,
  TrendingUp,
  Search,
  Power,
  PowerOff,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Crown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  Zap
} from 'lucide-react'

// Types
interface Shop {
  id: string
  name: string
  business_type: string
  owner_id: string | null
  is_active: boolean
  created_at: string
  profiles?: {
    full_name: string
    email: string
    phone: string
  }
}

interface Stats {
  totalShops: number
  activeShops: number
  suspendedShops: number
  totalRevenue: number
  totalUsers: number
}

export default function AdminPage() {
  const { user, isAuthenticated, isSuperAdmin, logout } = useApp()
  const router = useRouter()

  const [shops, setShops] = useState<Shop[]>([])
  const [filteredShops, setFilteredShops] = useState<Shop[]>([])
  const [stats, setStats] = useState<Stats>({
    totalShops: 0,
    activeShops: 0,
    suspendedShops: 0,
    totalRevenue: 0,
    totalUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'shops'>('overview')
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  // Security redirect
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (!isSuperAdmin) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isSuperAdmin, router])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      if (response.ok) {
        setStats({
          totalShops: data.totalShops,
          activeShops: data.activeShops,
          suspendedShops: data.suspendedShops,
          totalRevenue: data.totalRevenue,
          totalUsers: data.totalUsers,
        })
        setShops(data.shops)
        setFilteredShops(data.shops)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (isSuperAdmin) {
      setIsLoading(true)
      fetchStats().then(() => setIsLoading(false))
    }
  }, [isSuperAdmin, fetchStats])

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setFilteredShops(shops)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (response.ok) {
        setFilteredShops(data.shops)
      }
    } catch (err) {
      console.error('Error searching:', err)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, shops])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  // Toggle shop active status
  const handleToggleShop = async (shop: Shop) => {
    setToggleLoading(shop.id)
    try {
      const response = await fetch('/api/admin/shops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          is_active: !shop.is_active,
        }),
      })

      if (response.ok) {
        // Update local state
        const updatedShops = shops.map((s) =>
          s.id === shop.id ? { ...s, is_active: !s.is_active } : s
        )
        setShops(updatedShops)
        setFilteredShops(
          filteredShops.map((s) =>
            s.id === shop.id ? { ...s, is_active: !s.is_active } : s
          )
        )
        // Update stats
        setStats((prev) => ({
          ...prev,
          activeShops: !shop.is_active ? prev.activeShops + 1 : prev.activeShops - 1,
          suspendedShops: !shop.is_active ? prev.suspendedShops - 1 : prev.suspendedShops + 1,
        }))
      }
    } catch (err) {
      console.error('Error toggling shop:', err)
    } finally {
      setToggleLoading(null)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleRefresh = () => {
    setIsLoading(true)
    fetchStats().then(() => setIsLoading(false))
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      {/* Top Navigation Bar */}
      <header className="bg-[#111318] border-b border-amber-500/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111318] animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">
                  إدارة نظام IMD المركزية
                </h1>
                <p className="text-xs text-amber-400/80">
                  المهندس إبراهيم مبروك
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">العودة للوحة التحكم</span>
              </button>
              <div className="h-8 w-px bg-gray-700 mx-1" />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.fullName || user?.email}</p>
                <p className="text-xs text-amber-400">مسؤول عام</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                title="تسجيل خروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Command Center Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <Shield className="w-6 h-6 text-amber-400" />
            <span className="text-amber-300 font-bold text-lg">مركز القيادة العليا</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Shops */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1d24] to-[#14161c] border border-amber-500/10 p-5 group hover:border-amber-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-amber-400" />
                </div>
                <BarChart3 className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-gray-400 text-sm">إجمالي المتاجر</p>
              <p className="text-2xl font-bold text-white mt-1">
                {isLoading ? (
                  <span className="inline-block w-12 h-6 bg-gray-700 rounded animate-pulse" />
                ) : (
                  stats.totalShops
                )}
              </p>
            </div>
          </div>

          {/* Active Shops */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1d24] to-[#14161c] border border-green-500/10 p-5 group hover:border-green-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <Activity className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-gray-400 text-sm">المتاجر النشطة</p>
              <p className="text-2xl font-bold text-white mt-1">
                {isLoading ? (
                  <span className="inline-block w-12 h-6 bg-gray-700 rounded animate-pulse" />
                ) : (
                  stats.activeShops
                )}
              </p>
            </div>
          </div>

          {/* Suspended Shops */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1d24] to-[#14161c] border border-red-500/10 p-5 group hover:border-red-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <AlertTriangle className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-gray-400 text-sm">المتاجر المعلقة</p>
              <p className="text-2xl font-bold text-white mt-1">
                {isLoading ? (
                  <span className="inline-block w-12 h-6 bg-gray-700 rounded animate-pulse" />
                ) : (
                  stats.suspendedShops
                )}
              </p>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1d24] to-[#14161c] border border-cyan-500/10 p-5 group hover:border-cyan-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-gray-400 text-sm">إجمالي الإيرادات</p>
              <p className="text-lg font-bold text-white mt-1">
                {isLoading ? (
                  <span className="inline-block w-20 h-6 bg-gray-700 rounded animate-pulse" />
                ) : (
                  formatCurrency(stats.totalRevenue)
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-all relative ${
              activeTab === 'overview'
                ? 'text-amber-400 bg-amber-500/5'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              نظرة عامة
            </span>
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-all relative ${
              activeTab === 'shops'
                ? 'text-amber-400 bg-amber-500/5'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              إدارة المتاجر
            </span>
            {activeTab === 'shops' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-[#111318] rounded-xl border border-gray-800 overflow-hidden">
          {activeTab === 'overview' ? (
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white mb-2">مرحباً بك في مركز القيادة</h2>
                <p className="text-gray-400">يمكنك إدارة جميع المتاجر والمستخدمين من هذه اللوحة</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Stats Summary */}
                <div className="bg-[#1a1d24] rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    إحصائيات سريعة
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">إجمالي المستخدمين</span>
                      <span className="text-white font-bold">{stats.totalUsers}</span>
                    </div>
                    <div className="h-px bg-gray-800" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">نسبة المتاجر النشطة</span>
                      <span className="text-green-400 font-bold">
                        {stats.totalShops > 0
                          ? ((stats.activeShops / stats.totalShops) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-px bg-gray-800" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">المتاجر المعلقة</span>
                      <span className="text-red-400 font-bold">{stats.suspendedShops}</span>
                    </div>
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-[#1a1d24] rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-400" />
                    حالة النظام
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-gray-300">النظام يعمل بكفاءة</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-300">قاعدة البيانات متصلة</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-300">API جاهز</span>
                    </div>
                    <div className="mt-4 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                      <p className="text-amber-400/80 text-sm text-center">
                        آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Search Bar */}
              <div className="p-4 border-b border-gray-800">
                <div className="relative max-w-md">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="البحث باسم المتجر أو بريد المالك..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1a1d24] border border-gray-700 rounded-lg py-2.5 pr-10 pl-4 text-right text-white placeholder-gray-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  />
                  {isSearching && (
                    <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* Shops Table */}
              {isLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
                  <p className="text-gray-400">جاري تحميل البيانات...</p>
                </div>
              ) : filteredShops.length === 0 ? (
                <div className="p-8 text-center">
                  <Store className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد متاجر مسجلة'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#1a1d24] border-b border-gray-800">
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          المتجر
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          المالك
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          نوع النشاط
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          تاريخ الاشتراك
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          الحالة
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                          إجراء
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredShops.map((shop) => (
                        <tr
                          key={shop.id}
                          className="hover:bg-[#1a1d24]/50 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                <Store className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {shop.name}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  ID: {shop.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-white text-sm">
                                {shop.profiles?.full_name || 'غير محدد'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-500 text-xs">
                                  {shop.profiles?.email || '-'}
                                </span>
                              </div>
                              {shop.profiles?.phone && (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Phone className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-500 text-xs">
                                    {shop.profiles.phone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-300 text-sm">
                              {shop.business_type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-400 text-sm">
                                {formatDate(shop.created_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                shop.is_active
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {shop.is_active ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  نشط
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  معلق
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleToggleShop(shop)}
                              disabled={toggleLoading === shop.id}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                shop.is_active
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {toggleLoading === shop.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : shop.is_active ? (
                                <>
                                  <PowerOff className="w-4 h-4" />
                                  <span className="hidden sm:inline">تعليق</span>
                                </>
                              ) : (
                                <>
                                  <Power className="w-4 h-4" />
                                  <span className="hidden sm:inline">تفعيل</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer */}
              {!isLoading && filteredShops.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-800 bg-[#1a1d24]/30">
                  <p className="text-gray-500 text-sm text-center">
                    إجمالي: {filteredShops.length} متجر
                    {searchQuery && ` (نتائج البحث عن "${searchQuery}")`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            نظام IMD المركزي - تطوير المهندس إبراهيم مبروك © {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  )
}

