'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase, type Product, type Purchase } from '@/lib/supabase'
import { Package, Plus, Loader2, ShoppingBag, UserPlus, Trash2 } from 'lucide-react'

export default function PurchasesPage() {
  const { shop, isAuthenticated } = useApp()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [purchaseItems, setPurchaseItems] = useState<{ product_id: string, product_name: string, quantity: number, unit_cost: number }[]>([])
const [supplierName, setSupplierName] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([])
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [supplierList, setSupplierList] = useState<{id: string, name: string}[]>([])
  const [newSupplierName, setNewSupplierName] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadData()
  }, [isAuthenticated, shop?.id, router])

const loadData = async () => {
    if (!shop?.id) return

    setIsLoading(true)
    try {
      // Load products
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .order('name')

      setProducts(prodData || [])

      // Load suppliers from suppliers table
      const { data: suppData } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('shop_id', shop.id)
        .order('name')

      setSupplierList(suppData || [])

      setRecentPurchases([])

    } catch (err) {
      console.error('Error loading data:', err)
      setError('خطأ في تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  // Add new supplier to database
  const handleAddSupplier = async () => {
    if (!shop?.id || !newSupplierName.trim()) return

    try {
      const { error: suppError } = await supabase
        .from('suppliers')
        .insert({
          name: newSupplierName.trim(),
          shop_id: shop.id,
          is_active: true
        })

      if (suppError) {
        console.error('Error adding supplier:', suppError)
        setError('فشل في إضافة المورد')
        return
      }

      // Refresh supplier list
      loadData()
      setShowNewSupplier(false)
      setNewSupplierName('')
      setSupplierName(newSupplierName.trim())
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    }
  }

  const addItem = () => {
    setPurchaseItems([...purchaseItems, { product_id: '', product_name: '', quantity: 1, unit_cost: 0 }])
  }

  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...purchaseItems]
    if (field === 'product_id') {
      const product = products.find(p => p.id === value as string)
      newItems[index] = { ...newItems[index], product_id: value as string, product_name: product?.name || '' }
    } else if (field === 'quantity' || field === 'unit_cost') {
      newItems[index] = { ...newItems[index], [field]: Number(value) }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setPurchaseItems(newItems)
  }

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
  }

  const handleSubmit = async () => {
    if (!shop?.id || purchaseItems.length === 0 || purchaseItems.some(item => !item.product_id || item.quantity <= 0 || item.unit_cost <= 0)) {
      setError('املأ جميع البيانات بشكل صحيح')
      return
    }

    setIsSubmitting(true)
    setError('')

try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shop.id,
          supplier_name: supplierName || 'مورد عام',
          items: purchaseItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost
          }))
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Check for table not found error
        if (result.error?.includes('purchases') || result.error?.includes('relation') || response.status === 404) {
          setError('جدول المشتريات غير موجود في قاعدة البيانات. يرجى إنشاؤه من الإعدادات.')
        } else {
          throw new Error(result.error || 'خطأ في الحفظ')
        }
        return
      }

      loadData()
      setPurchaseItems([])
      setSupplierName('')
      setError('')
      alert('تم حفظ المشتريات بنجاح!')
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const total = calculateTotal()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">
            المشتريات
          </h1>
          <p className="text-gray-400 mt-1">سجل مشتريات جديدة وحدّث المخزون تلقائياً</p>
        </div>
        <button
          onClick={addItem}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-emerald-500/25 transition-all"
        >
          <Plus size={20} />
          مشترية جديدة
        </button>
      </div>

      {purchaseItems.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
<div>
              <label className="block text-sm font-medium text-gray-400 mb-2">المورد</label>
              <div className="relative">
                <select
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                >
                  <option value="">اختر مورد أو اكتب اسم جديد</option>
                  {supplierList.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  <option value="__new__">+ إضافة مورد جديد</option>
                </select>
                {supplierName === '__new__' && (
                  <input
                    type="text"
                    placeholder="اسم المورد الجديد"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    className="w-full mt-2 p-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSupplierName.trim()) {
                        handleAddSupplier()
                      }
                    }}
                  />
                )}
              </div>
              {supplierName === '__new__' && (
                <button
                  type="button"
                  onClick={handleAddSupplier}
                  disabled={!newSupplierName.trim()}
                  className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  حفظ المورد الجديد
                </button>
              )}
            </div>
            <div className="md:col-span-2" />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/30">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="p-4 text-right font-semibold text-gray-300">المنتج</th>
                  <th className="p-4 text-right font-semibold text-gray-300">الكمية</th>
                  <th className="p-4 text-right font-semibold text-gray-300">سعر الشراء</th>
                  <th className="p-4 text-right font-semibold text-gray-300">الإجمالي</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {purchaseItems.map((item, index) => {
                  const subtotal = item.quantity * item.unit_cost
                  return (
                    <tr key={index} className="border-t border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                          className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:ring-1 focus:ring-blue-500/50"
                        >
                          <option value="">اختر منتج</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <input
                          placeholder="أو اكتب اسم المنتج"
                          value={item.product_name}
                          onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-20 p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-right font-mono text-lg font-bold"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="w-24 p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-right font-mono text-lg font-bold"
                        />
                      </td>
                      <td className="p-4 font-mono text-xl font-bold text-emerald-400">
                        {subtotal.toFixed(2)} ج.م
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all w-full h-full flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-8 border-t border-slate-700/50 mt-6">
            <div className="text-3xl font-black text-emerald-400 tracking-wide">
              المجموع الإجمالي: <span className="text-4xl">{total.toLocaleString()} ج.م</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={() => setPurchaseItems([])}
                className="px-8 py-3 bg-gradient-to-r from-slate-700/80 to-slate-800/80 hover:from-slate-600 hover:to-slate-700 text-slate-200 font-bold rounded-xl shadow-lg hover:shadow-slate-500/25 transition-all border border-slate-600 flex-1 sm:flex-none"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || total === 0 || purchaseItems.some(item => !item.product_id)}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 flex-1 sm:flex-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingBag size={20} />
                )}
                حفظ المشترية ({total.toFixed(2)} ج.م)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-2xl text-red-200 backdrop-blur-sm flex items-center gap-3">
              <Package size={20} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

<div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Package size={28} className="text-blue-400" />
          آخر المشتريات
        </h2>
        {isLoading ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            <span className="mr-3 text-slate-400 font-medium">جاري التحميل...</span>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Package size={48} className="text-blue-400" />
              <div>
                <h3 className="text-xl font-bold text-gray-200 mb-2">المشتريات</h3>
                <p className="text-gray-400">قيد الإعداد...</p>
                <p className="text-sm text-gray-500 mt-2">سيتم تفعيل هذه الصفحة بعد إنشاء الجدول في قاعدة البيانات</p>
              </div>
            </div>
          </div>
        )}
      </div>

{showNewSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl p-8 max-w-sm w-full max-h-[90vh] shadow-2xl backdrop-blur-xl">
            <h3 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              مورد جديد
            </h3>
            <input
              type="text"
              placeholder="اسم المورد الجديد"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl mb-8 text-lg font-semibold text-right focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-white placeholder-gray-400"
            />
            <div className="flex gap-4">
              <button
                onClick={handleAddSupplier}
                disabled={!newSupplierName.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/25 transition-all disabled:cursor-not-allowed"
              >
                حفظ المورد
              </button>
              <button
                onClick={() => {
                  setShowNewSupplier(false)
                  setNewSupplierName('')
                }}
                className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-slate-500/25 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
