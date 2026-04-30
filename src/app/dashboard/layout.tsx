'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { LayoutDashboard, Package, Tags, ShoppingCart, Users, DollarSign, FileText, BarChart3, Settings, Menu, X, ChevronDown, ChevronLeft, LogOut, Search, ShieldCheck, AlertTriangle } from 'lucide-react'

// Menu items with sub-menus
const menuItems = [
  {
    title: 'لوحة التحكم',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    title: 'المخزون',
    icon: Package,
    href: '/dashboard/inventory'
  },
  {
    title: 'المبيعات',
    icon: ShoppingCart,
    href: '/dashboard/sales'
  },
{
    title: 'المشتريات',
    icon: ShoppingCart,
    href: '/dashboard/purchases'
  },
  {
    title: 'الموردين',
    icon: Users,
    href: '/dashboard/suppliers'
  },
  {
    title: 'العملاء',
    icon: Users,
    href: '/dashboard/customers'
  },
  {
    title: 'المالية',
    icon: DollarSign,
    href: '/dashboard/finances'
  },
  {
    title: 'التقارير',
    icon: BarChart3,
    href: '/dashboard/reports'
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    href: '/dashboard/settings'
  }
]

// Mobile Navigation Component
function MobileDrawer({ 
  isOpen, 
  onClose, 
  pathname, 
  isSuperAdmin,
  onLogout 
}: { 
  isOpen: boolean
  onClose: () => void
  pathname: string
  isSuperAdmin: boolean
  onLogout: () => void
}) {
  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Slide-over Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-dark-card border-l border-gray-800 z-50 md:hidden transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-accent">IMD نظام</h1>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X size={24} />
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {/* Superadmin link */}
          {isSuperAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive('/admin')
                  ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <ShieldCheck size={20} />
              <span className="font-semibold">لوحة التحكم العامة</span>
            </Link>
          )}
          
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href || '#'}
              onClick={onClose}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive(item.href || '')
                  ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800 bg-dark-card">
          <button
            onClick={() => {
              onLogout()
              onClose()
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            <span>تسجيل خروج</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, shop, shopError, logout, isSuperAdmin } = useApp()
const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['المخزون'])
  const [searchQuery, setSearchQuery] = useState('')

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [pathname])

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => pathname === href

  if (shopError) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        {/* Keep sidebar always visible */}
        <aside 
          className={`fixed top-0 right-0 h-full bg-dark-card border-l border-gray-800 transition-all duration-300 z-50 w-64`}
        >
          {/* Logo and Menu - same as original */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-accent">IMD نظام</h1>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {isSuperAdmin && (
              <Link href="/admin" className={`flex items-center gap-3 p-3 rounded-lg transition-all border border-amber-500/20 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:bg-amber-500/20 ${isActive('/admin') ? 'text-amber-300 ring-1 ring-amber-500/40' : 'text-amber-400'}`}>
                <ShieldCheck size={20} />
                <span className="font-semibold">لوحة التحكم العامة</span>
              </Link>
            )}
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isActive(item.href) ? 'bg-accent/20 text-accent' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              >
                <item.icon size={20} />
                <span>{item.title}</span>
              </Link>
            ))}
            <div className="absolute bottom-4 right-0 left-0 px-3">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={20} />
                <span>تسجيل خروج</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Error Content */}
        <main className="flex-1 mr-64 p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertTriangle size={64} className="mx-auto text-red-400 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">متجر غير موجود</h2>
            <p className="text-gray-400 mb-6">{shopError}</p>
            <div className="space-y-3">
              <Link 
                href="/admin" 
                className={`block w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 py-3 px-6 rounded-lg transition-all text-center ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                لوحة الإدارة العامة
              </Link>
              <button
                onClick={logout}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 py-3 px-6 rounded-lg transition-all"
              >
                تسجيل خروج
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
<aside 
        className={`fixed top-0 right-0 h-full bg-dark-card border-l border-gray-800 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 translate-x-full md:translate-x-0 md:w-64 md:translate-x-0 lg:w-64'}`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-accent">IMD نظام</h1>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-3 space-y-1">
          {/* Superadmin Admin Panel Link */}
          {isSuperAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 p-3 rounded-lg transition-all border border-amber-500/20 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:bg-amber-500/20 ${
                isActive('/admin')
                  ? 'text-amber-300 ring-1 ring-amber-500/40'
                  : 'text-amber-400'
              }`}
            >
              <ShieldCheck size={20} />
              {sidebarOpen && <span className="font-semibold">لوحة التحكم العامة</span>}
            </Link>
          )}
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href || '#'}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive(item.href || '')
                    ? 'bg-accent/20 text-accent'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span>{item.title}</span>}
              </Link>
            ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 right-0 left-0 px-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>تسجيل خروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'mr-64' : 'mr-20'
        }`}
      >
{/* Top Bar */}
        <header className="bg-dark-card border-b border-gray-800 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0 max-w-7xl mx-auto">
            {/* Mobile Hamburger Button - Visible only on mobile */}
            <button 
              className="md:hidden absolute left-4 top-4 p-2 rounded-lg hover:bg-gray-800 transition-colors z-50"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu size={24} />
            </button>

            {/* Search */}
            <div className="relative flex-1 w-full max-w-md mx-auto lg:mx-0 mt-8 md:mt-0">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 pr-10 pl-4 text-right focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 mr-0 md:mr-4 mt-4 md:mt-0">
              <div className="text-left">
                <p className="text-sm font-medium">{user?.email || 'المستخدم'}</p>
                <p className="text-xs text-gray-400">{shop?.name || 'المتجر'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent font-bold">
                  {(user?.email || 'م')[0].toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

{/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-100px)] w-full">
          {children}
        </div>
      </main>

      {/* Mobile Drawer - Render at bottom to ensure z-index */}
      <MobileDrawer 
        isOpen={mobileDrawerOpen} 
        onClose={() => setMobileDrawerOpen(false)} 
        pathname={pathname}
        isSuperAdmin={isSuperAdmin}
        onLogout={logout}
      />
    </div>
  )
}
