'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase, type Shop } from '@/lib/supabase'
import { Settings, Save, Phone, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const { shop, user, logout, isAuthenticated } = useApp()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    business_type: '',
    phone: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Redirect to complete shop profile if shop is not set up
  useEffect(() => {
    if (isAuthenticated && !shop?.id && !isLoading) {
      // Check if we need to complete shop profile
      // If shop is null, we should let them create one in settings
    }
  }, [isAuthenticated, shop, isLoading])

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        business_type: shop.business_type || '',
        phone: shop.phone || '',
      })
      setIsLoading(false)
    }
  }, [shop])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!shop?.id) {
      setError('لا يوجد متجر مرتبط')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: formData.name.trim(),
          business_type: formData.business_type,
          phone: formData.phone.trim() || null,
        })
        .eq('id', shop.id)

      if (error) {
        console.error('Update error:', error)
        setError('فشل في تحديث بيانات المتجر')
      } else {
        setSuccess('تم تحديث بيانات المتجر بنجاح!')
        router.refresh()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ غير متوقع')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!isAuthenticated || isLoading) {
    return null
  }

  const businessTypes = [
    { value: 'retail', label: 'تجزئة' },
    { value: 'wholesale', label: 'جملة' },
    { value: 'supermarket', label: 'سوبر ماركت' },
    { value: 'pharmacy', label: 'صيدلية' },
    { value: 'restaurant', label: 'مطعم' },
    { value: 'general', label: 'عام' },
  ]

  return (
    <div className="min-h-screen bg-dark-slate">
      {/* Header */}
      <div className="bg-dark-card border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold gradient-text mb-2">إعدادات المتجر</h1>
          <p className="text-gray-400">قم بتحديث بيانات متجرك</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success */}
        {success && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl flex items-center gap-3">
            <Save className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-400 font-medium">{success}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3">
            <Phone className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Shop Profile Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                اسم المتجر <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-xl focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/50 text-lg font-medium"
                dir="rtl"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  نوع النشاط التجاري <span className="text-red-400">*</span>
                </label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-xl focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/50 text-lg"
                  dir="rtl"
                  required
                >
                  <option value="">اختر النوع</option>
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">رقم الهاتف</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-xl focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/50"
                  dir="ltr"
                  type="tel"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-electric-blue/25 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-6 h-6 border-2 border-slate-dark border-t-white rounded-full animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ التغييرات
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:opacity-90 shadow-lg hover:shadow-red-500/25 transition-all"
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          </form>
        </div>

        {/* Current User Info */}
        <div className="card p-8 mt-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Settings className="w-6 h-6 text-electric-blue" />
            بيانات الحساب
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <span className="text-gray-400">الاسم:</span>
              <span className="font-medium text-white">{user?.fullName}</span>
            </div>
            <div className="space-y-2">
              <span className="text-gray-400">البريد:</span>
              <span className="font-medium text-white">{user?.email}</span>
            </div>
            <div className="space-y-2">
              <span className="text-gray-400">الهاتف:</span>
              <span className="font-medium text-white">{user?.phone}</span>
            </div>
            <div className="space-y-2">
              <span className="text-gray-400">المتجر:</span>
              <span className="font-bold text-electric-blue">{shop?.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
