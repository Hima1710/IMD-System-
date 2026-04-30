'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'

// Types
interface Category {
  id: string
  name: string
  shop_id: string
  created_at: string
}

export default function CategoriesPage() {
  const { user, shop, isAuthenticated, logout } = useApp()
  const router = useRouter()

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check auth
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Fetch categories
  useEffect(() => {
    if (shop?.id) {
      fetchCategories()
    }
  }, [shop?.id])

  const fetchCategories = async () => {
    if (!shop?.id) return
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching categories:', error)
        setError('فشل في تحميل الفئات')
      } else {
        setCategories(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryName(category.name)
    } else {
      setEditingCategory(null)
      setCategoryName('')
    }
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setCategoryName('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!categoryName.trim()) {
      setError('الرجاء إدخال اسم الفئة')
      return
    }

    if (!shop?.id) {
      setError('لا يوجد متجر مرتبط')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
if (editingCategory) {
        // Update
        const { error: updateError } = await supabase
          .from('categories')
          .update({ name: categoryName.trim() })
          .eq('id', editingCategory.id)
          .eq('shop_id', shop.id)

        if (updateError) {
          console.error('Update error:', updateError)
          setError('فشل في تحديث الفئة')
        } else {
          fetchCategories()
          closeModal()
        }
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('categories')
          .insert({
            name: categoryName.trim(),
            shop_id: shop.id,
          })

        if (insertError) {
          console.error('Insert error:', insertError)
          setError('فشل في إنشاء الفئة')
        } else {
          fetchCategories()
          closeModal()
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    } finally {
      setIsSubmitting(false)
    }
  }

const handleDelete = async (id: string) => {
    if (!shop?.id) return
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('shop_id', shop.id)

      if (error) {
        console.error('Delete error:', error)
        setError('فشل في حذف الفئة')
      } else {
        fetchCategories()
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    }
  }

  // Filter categories
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-slate bg-with-logo">
      {/* Header */}
      <header className="bg-dark-card border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/imd-logo.jpeg" alt="IMD System Logo" className="logo-image-small" />
              <div>
                <h1 className="text-xl font-bold text-white">IMD System</h1>
                <p className="text-xs text-gray-400">نظام إدارة المتاجر</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← العودة للوحة التحكم
              </button>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">إدارة الفئات</h2>
            <p className="text-gray-400">
              متجرك: <span className="text-electric-blue font-semibold">{shop?.name}</span>
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:opacity-90 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة فئة
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في الفئات..."
              className="w-full px-4 py-3 pr-12 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
              dir="rtl"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Categories Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">جاري التحميل...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-400">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد فئات بعد'}
              </p>
              <button
                onClick={() => openModal()}
                className="mt-4 text-electric-blue hover:underline"
              >
                إضافة أول فئة
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      اسم الفئة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredCategories.map((category, index) => (
                    <tr key={category.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                        {new Date(category.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(category)}
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/70 transition-opacity"
              onClick={closeModal}
            />

            {/* Modal Content */}
            <div className="relative bg-dark-card border border-gray-700 rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    اسم الفئة
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="أدخل اسم الفئة"
                    className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
                    dir="rtl"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري...' : editingCategory ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}