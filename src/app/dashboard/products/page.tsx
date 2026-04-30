'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'

// Types
interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  category_id: string | null
  barcode: string | null
  purchase_price: number
  sale_price: number
  stock: number
  min_stock: number
  is_active: boolean
  created_at: string
  categories?: {
    name: string
  }
}

const ITEMS_PER_PAGE = 10

export default function ProductsPage() {
  const { user, shop, isAuthenticated, logout } = useApp()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    barcode: '',
    purchase_price: '',
    sale_price: '',
    stock: '',
    min_stock: '',
    is_active: true,
  })

  // Check auth
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Fetch categories and products
  useEffect(() => {
    if (shop?.id) {
      fetchCategories()
      fetchProducts()
    }
  }, [shop?.id])

  const fetchCategories = async () => {
    if (!shop?.id) return
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('shop_id', shop.id)
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
      } else {
        setCategories(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const fetchProducts = async () => {
    if (!shop?.id) return
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        setError('فشل في تحميل المنتجات')
      } else {
        setProducts(data || [])
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

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        category_id: product.category_id || '',
        barcode: product.barcode || '',
        purchase_price: product.purchase_price.toString(),
        sale_price: product.sale_price.toString(),
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
        is_active: product.is_active,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        category_id: '',
        barcode: '',
        purchase_price: '',
        sale_price: '',
        stock: '',
        min_stock: '',
        is_active: true,
      })
    }
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      category_id: '',
      barcode: '',
      purchase_price: '',
      sale_price: '',
      stock: '',
      min_stock: '',
      is_active: true,
    })
    setError('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('الرجاء إدخال اسم المنتج')
      return
    }

    if (!formData.sale_price || parseFloat(formData.sale_price) <= 0) {
      setError('الرجاء إدخال سعر البيع')
      return
    }

    if (!shop?.id) {
      setError('لا يوجد متجر مرتبط')
      return
    }

    setIsSubmitting(true)
    setError('')

    const productData = {
      name: formData.name.trim(),
      category_id: formData.category_id || null,
      barcode: formData.barcode.trim() || null,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      sale_price: parseFloat(formData.sale_price) || 0,
      stock: parseInt(formData.stock) || 0,
      min_stock: parseInt(formData.min_stock) || 0,
      is_active: formData.is_active,
      shop_id: shop.id,
    }

    try {
if (editingProduct) {
        // Update
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .eq('shop_id', shop.id)

        if (updateError) {
          console.error('Update error:', updateError)
          setError('فشل في تحديث المنتج')
        } else {
          fetchProducts()
          closeModal()
        }
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('products')
          .insert(productData)

        if (insertError) {
          console.error('Insert error:', insertError)
          setError('فشل في إنشاء المنتج')
        } else {
          fetchProducts()
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
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('shop_id', shop.id)

      if (error) {
        console.error('Delete error:', error)
        setError('فشل في حذف المنتج')
      } else {
        fetchProducts()
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    }
  }

  const handleToggleActive = async (product: Product) => {
    if (!shop?.id) return
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)
        .eq('shop_id', shop.id)

      if (error) {
        console.error('Toggle error:', error)
      } else {
        fetchProducts()
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

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
            <h2 className="text-2xl font-bold text-white mb-2">إدارة المنتجات</h2>
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
            إضافة منتج
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
              placeholder="البحث بالاسم أو الباركود..."
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

        {/* Products Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">جاري التحميل...</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-400">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد منتجات بعد'}
              </p>
              <button
                onClick={() => openModal()}
                className="mt-4 text-electric-blue hover:underline"
              >
                إضافة أول منتج
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">اسم المنتج</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الفئة</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الباركود</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">سعر الشراء</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">سعر البيع</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">المخزون</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedProducts.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-gray-400">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-white font-medium">
                        {product.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                        {(product as any).categories?.name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-400 font-mono text-sm">
                        {product.barcode || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                        {product.purchase_price.toFixed(2)} ج.م
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-electric-blue font-semibold">
                        {product.sale_price.toFixed(2)} ج.م
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-sm ${
                          product.stock <= product.min_stock 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`px-2 py-1 rounded text-sm ${
                            product.is_active 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {product.is_active ? 'نشط' : 'غير نشط'}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(product)}
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                عرض {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} من {filteredProducts.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  السابق
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-electric-blue text-slate-dark font-bold'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    } transition-colors`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  التالي
                </button>
              </div>
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
            <div className="relative bg-dark-card border border-gray-700 rounded-xl shadow-xl w-full max-w-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    اسم المنتج <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم المنتج"
                    className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
                    dir="rtl"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    الفئة
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white focus:border-electric-blue transition-colors"
                    dir="rtl"
                  >
                    <option value="">اختر الفئة</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    الباركود
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    placeholder="أدخل الباركود"
                    className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
                    dir="ltr"
                  />
                </div>

                {/* Prices Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      سعر الشراء (ج.م)
                    </label>
                    <input
                      type="number"
                      name="purchase_price"
                      value={formData.purchase_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      سعر البيع (ج.م) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="sale_price"
                      value={formData.sale_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Stock Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      الكمية الحالية
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      حد الطلب (التنبيهات)
                    </label>
                    <input
                      type="number"
                      name="min_stock"
                      value={formData.min_stock}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-electric-blue transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-gray-600 bg-slate-dark text-electric-blue focus:ring-electric-blue"
                  />
                  <label htmlFor="is_active" className="text-gray-300">
                    منتج نشط
                  </label>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
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
                    {isSubmitting ? 'جاري...' : editingProduct ? 'تحديث' : 'إضافة'}
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