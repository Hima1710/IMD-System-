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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([])
  const [showNewSupplier, setShowNewSupplier] = useState(false)

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
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .order('name')

      setProducts(prodData || [])

      const { data: purchData } = await supabase
        .from('purchases')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentPurchases(purchData || [])

    } catch (err) {
      setError('خطأ في تحميل البيانات')
    } finally {
      setIsLoading(false)
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
        throw new Error(result.error || 'خطأ في الحفظ')
      }

      loadData()
      setPurchaseItems([])
      setSupplierName('')
      setError('تم حفظ المشتريات بنجاح!')
    } catch (err: any) {
      setError(err.message)
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
              <input
                type="text"
                placeholder="اسم المورد"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
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
        ) : recentPurchases.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center text-gray-400 backdrop-blur-sm">
            لا توجد مشتريات بعد. أضف مشترية جديدة لتبدأ!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPurchases.slice(0, 6).map(purchase => (
              <div key={purchase.id} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-6 hover:shadow-xl hover:shadow-blue-500/20 transition-all backdrop-blur-sm cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full group-hover:animate-ping" />
                    <span className="text-xs text-emerald-400 font-mono">حديث</span>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-900/50 px-2 py-1 rounded font-mono">
                    #{purchase.id.slice(-6).toUpperCase()}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2 line-clamp-1">{purchase.supplier_name}</h3>
                <p className="text-emerald-400 font-mono text-2xl mb-3 font-black">
                  {Number(purchase.total_amount).toLocaleString()} ج.م
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  {new Date(purchase.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                  })}
                </p>
              </div>
            ))}
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
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl mb-8 text-lg font-semibold text-right focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-white placeholder-gray-400"
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (supplierName.trim()) {
                    setSuppliers(prev => [...prev, supplierName.trim()])
                    setShowNewSupplier(false)
                    setSupplierName('')
                  }
                }}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                حفظ المورد
              </button>
              <button
                onClick={() => {
                  setShowNewSupplier(false)
                  setSupplierName('')
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
