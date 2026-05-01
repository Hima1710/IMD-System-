'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit3, Trash2, Package, AlertTriangle } from 'lucide-react'

interface Product {
  id: string
  name: string
  category_id: string | null
  barcode: string | null
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock: number
  is_active: boolean
  image_url?: string
}

interface Category {
  id: string
  name: string
}

export default function InventoryPage() {
  const { shop, isAuthenticated, isLoading: appLoading } = useApp()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)
const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')
const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('') // for category dropdown
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)

  // Ref to track if component is mounted and prevent duplicate fetches
  const isMountedRef = useRef(true)
  const lastFetchShopId = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auth check - ONLY run once when component mounts and auth is definitively false
  useEffect(() => {
    // Only redirect if app has finished loading AND user is not authenticated
    if (!appLoading && !isAuthenticated && isMountedRef.current) {
      router.push('/login')
    }
  }, [appLoading, isAuthenticated, router])

  // Data fetch - ONLY run when shop.id is available and different
  useEffect(() => {
    const shopId = shop?.id
    
    // Skip if no shop, still loading, or already fetched for this shop
    if (!shopId || appLoading) {
      return
    }
    
    // Skip if we already fetched for this shop
    if (lastFetchShopId.current === shopId) {
      return
    }
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Set up new abort controller
    abortControllerRef.current = new AbortController()
    lastFetchShopId.current = shopId
    isMountedRef.current = true
    
    const fetchInventoryData = async () => {
      setIsLoading(true)
      setError('')
      try {
        // Fetch products from Supabase scoped to shop
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopId)
          .order('name')

        if (!isMountedRef.current) return

        if (productsError) {
          console.error('Error fetching products:', productsError)
          setError('فشل في تحميل المنتجات')
        } else {
          setProducts(productsData || [])
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('shop_id', shopId)
          .order('name')

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError)
        } else {
          setCategories(categoriesData || [])
        }
      } catch (err) {
        console.error('Error:', err)
        setError('حدث خطأ')
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchInventoryData()

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
}, [shop?.id, appLoading])

  // Standalone fetch function for manual refresh
  const fetchInventoryData = async () => {
    if (!shop?.id) return
    
    setIsLoading(true)
    setError('')
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .order('name')

      if (productsError) {
        console.error('Error fetching products:', productsError)
        setError('فشل في تحميل المنتجات')
      } else {
        setProducts(productsData || [])
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shop.id)
        .order('name')

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
      } else {
        setCategories(categoriesData || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search) ||
    (!selectedCategory || p.category_id === selectedCategory)
  )

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop?.id) return
    
    const formData = new FormData(e.target as HTMLFormElement)
const productData: any = {
      name: formData.get('name') as string,
      category_id: formData.get('category_id') as string || null,
      barcode: formData.get('barcode') as string || null,
      // cost_price is optional - only include if not 0 to avoid/schema errors
      ...(Number(formData.get('cost_price') || 0) > 0 && { cost_price: Number(formData.get('cost_price')) }),
      selling_price: Number(formData.get('selling_price') || 0),
      stock_quantity: Number(formData.get('stock_quantity') || 0),
      min_stock: Number(formData.get('min_stock') || 5),
      shop_id: shop.id,
    }

    if (!editingProduct) {
      productData.is_active = true
    }


    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .eq('shop_id', shop.id)

        if (error) {
          console.error('Update error:', error)
          setError('فشل في تحديث المنتج')
          return
        }
      } else {
        // Insert new product
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) {
          console.error('Insert error:', error)
          setError('فشل في إضافة المنتج')
          return
        }
      }
      
      // Refresh data
      fetchInventoryData()
      setShowAddModal(false)
      setEditingProduct(null)
      setError('')
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    }
  }

const lowStockProducts = filteredProducts.filter(p => p.stock_quantity < (p.min_stock || 5))

  const isLowStock = (stock: number, minStock?: number) => stock < (minStock || 5)

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
        return
      }

      // Refresh data
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    }
  }

const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowAddModal(true)
  }

  // Handle add new category from dropdown
  const handleAddCategory = async () => {
    if (!shop?.id || !newCategoryName.trim()) return
    try {
      const { error } = await supabase
        .from('categories')
        .insert({ name: newCategoryName.trim(), shop_id: shop.id })
      if (error) {
        console.error('Error adding category:', error)
        setError('فشل في إضافة الفئة')
        return
      }
      // Refresh categories
      fetchInventoryData()
      setNewCategoryName('')
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    }
  }

  // Handle category selection change - show input for new category
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value)
    if (e.target.value === '__new__') {
      // Show new category input logic would be handled via state
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header with Blue Gradient */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 p-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <h1 className="text-2xl font-bold text-white">إدارة المخزون</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm">
            <Package className="w-4 h-4 text-blue-200" />
            <span className="font-bold text-white">{products.length}</span>
            <span className="text-blue-200">منتج</span>
            {lowStockProducts.length > 0 && (
              <div className="ml-2 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-xs font-bold text-red-400">
                {lowStockProducts.length} منخفض
              </div>
            )}
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setShowAddModal(true) }}
            className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-xl font-bold shadow-md hover:bg-blue-50 transition-all"
          >
            <Plus className="w-4 h-4" />
            منتج جديد
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="p-6 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الباركود..."
              className="w-full pr-12 pl-4 py-3 bg-dark-card border border-gray-700 rounded-2xl text-lg font-semibold text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 backdrop-blur"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-dark-card border border-gray-700 rounded-2xl text-base font-semibold"
          >
            <option value="">الكل</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>

                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">جاري تحميل المخزون...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="w-24 h-24 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-300 mb-2">لا توجد منتجات</h3>
            <p className="text-slate-500 mb-6">ابدأ بإضافة منتج جديد للمخزون</p>
            <button 
              onClick={() => { setEditingProduct(null); setShowAddModal(true) }}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              أضف أول منتج
            </button>
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700">
                  <th className="px-4 py-3 text-left font-bold text-slate-300">الصورة</th>
                  <th className="px-4 py-3 font-bold text-slate-300">الاسم</th>
                  <th className="px-4 py-3 font-bold text-slate-300">الفئة</th>
                  <th className="px-4 py-3 font-bold text-slate-300">الباركود</th>
                  <th className="px-4 py-3 font-bold text-slate-300">سعر الشراء</th>
                  <th className="px-4 py-3 font-bold text-slate-300">سعر البيع</th>
                  <th className="px-4 py-3 font-bold text-slate-300">المخزون</th>
                  <th className="px-4 py-3 font-bold text-slate-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{product.name}</td>
                    <td className="px-4 py-3 text-slate-400">{categories.find(c => c.id === product.category_id)?.name || '-'}</td>
                    <td className="px-4 py-3 font-mono text-sm bg-slate-800/50 px-2 py-1 rounded text-slate-300">{product.barcode}</td>
<td className="px-4 py-3 text-emerald-400 font-bold">{product.cost_price.toFixed(2)} ج.م</td>
                    <td className="px-4 py-3 text-blue-400 font-bold">{product.selling_price.toFixed(2)} ج.م</td>
                    <td className="px-4 py-3 font-bold">
                      <div className="flex items-center gap-1">
<span className={isLowStock(product.stock_quantity, product.min_stock) ? 'text-red-400' : 'text-slate-300'}>
                          {product.stock_quantity}
                        </span>
                        {isLowStock(product.stock_quantity, product.min_stock) && (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-blue-500/20 rounded-lg transition-all"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="max-w-md w-full max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-600 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {editingProduct ? 'تعديل المنتج' : 'منتج جديد'}
              </h2>
<form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">اسم المنتج</label>
                  <input 
                    name="name"
                    type="text" 
                    defaultValue={editingProduct?.name || ''} 
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-right focus:ring-2 focus:ring-blue-500/50"
                    placeholder="اسم المنتج"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">الفئة</label>
                  <div className="relative">
                    <select name="category_id" className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-right" defaultValue={editingProduct?.category_id || ''}>
                      <option value="">اختر الفئة</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                      <option value="__new__">+ إضافة فئة جديدة</option>
                    </select>
                  </div>
                </div>
<div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">سعر الشراء</label>
                    <input 
                      name="cost_price"
                      type="number" 
                      step="0.01"
                      defaultValue={editingProduct?.cost_price || ''} 
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-right"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">سعر البيع</label>
                    <input 
                      name="selling_price"
                      type="number" 
                      step="0.01"
                      defaultValue={editingProduct?.selling_price || ''} 
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-right"
                      placeholder="0.00"
                    />
                  </div>
                </div>
<div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">الباركود</label>
                    <input 
                      name="barcode"
                      type="text" 
                      defaultValue={editingProduct?.barcode || ''} 
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-right font-mono"
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">المخزون</label>
                    <input 
                      name="stock_quantity"
                      type="number" 
                      defaultValue={editingProduct?.stock_quantity || ''} 
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-right"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">حد التنبيه (الحد الأدنى للمخزون)</label>
                  <input 
                    name="min_stock"
                    type="number" 
                    defaultValue={editingProduct?.min_stock || 5} 
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-right"
                    placeholder="5"
                  />
                  <p className="text-xs text-slate-400 mt-1">سيتم إرسال تنبيه عند انخفاض المخزون عن هذا الحد</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-3 rounded-xl font-bold transition-all"
                    onClick={() => setShowAddModal(false)}
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-emerald-500/25 transition-all"
                  >
                    {editingProduct ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
