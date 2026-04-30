'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase, type Supplier } from '@/lib/supabase'
import { Users, Search, Plus, Edit3, Trash2, DollarSign, Phone, AlertTriangle, Loader2 } from 'lucide-react'

const ITEMS_PER_PAGE = 10

export default function SuppliersPage() {
  const { shop, isAuthenticated } = useApp()
  const router = useRouter()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (shop?.id) {
      fetchSuppliers()
    }
  }, [shop?.id])

  const fetchSuppliers = async () => {
    if (!shop?.id) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching suppliers:', error)
        setError('فشل في تحميل الموردين')
      } else {
        setSuppliers(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name || '',
        phone: supplier.phone || '',
      })
    } else {
      setEditingSupplier(null)
      setFormData({
        name: '',
        phone: '',
      })
    }
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSupplier(null)
    setFormData({ name: '', phone: '' })
    setError('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('الرجاء إدخال اسم المورد')
      return
    }

    if (!shop?.id) {
      setError('لا يوجد متجر مرتبط')
      return
    }

    setIsSubmitting(true)
    setError('')

    const supplierData = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      shop_id: shop.id,
    }

    try {
      if (editingSupplier) {
        // Update
        const { error: updateError } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id)
          .eq('shop_id', shop.id)

        if (updateError) {
          console.error('Update error:', updateError)
          setError('فشل في تحديث المورد')
        } else {
          fetchSuppliers()
          closeModal()
        }
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('suppliers')
          .insert(supplierData)

        if (insertError) {
          console.error('Insert error:', insertError)
          setError('فشل في إنشاء المورد')
        } else {
          fetchSuppliers()
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
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('shop_id', shop?.id)

      if (error) {
        console.error('Delete error:', error)
        setError('فشل في حذف المورد')
      } else {
        fetchSuppliers()
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    }
  }

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.includes(searchQuery)
  )

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  if (!isAuthenticated) {
    return null
  }

  const totalOwed = suppliers.reduce((sum, s) => sum + (s.total_owed || 0), 0)

  return (
    <div className="min-h-screen bg-dark-slate">
      {/* Header */}
      <div className="bg-dark-card border-b border-gray-800 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة الموردين</h1>
            <p className="text-gray-400 mt-1">
              إجمالي المستحق للموردين: <span className="text-red-400 font-bold">{totalOwed.toLocaleString()} ج.م</span>
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold py-3 px-6 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <Users size={20} />
            مورد جديد
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو الهاتف..."
              className="w-full pl-12 pr-4 py-3 bg-slate-dark border border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent text-right"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} />
              {error}
            </div>
          </div>
        )}

        {/* Table Card */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-400 mt-4">جاري التحميل...</p>
            </div>
          ) : paginatedSuppliers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد موردين بعد'}
              </p>
              <button
                onClick={() => openModal()}
                className="bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold py-2 px-6 rounded-lg"
              >
                إضافة أول مورد
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">#</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">الاسم</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">الهاتف</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">المستحق</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {paginatedSuppliers.map((supplier, index) => (
                      <tr key={supplier.id} className="hover:bg-gray-800/30">
                        <td className="px-6 py-4 text-gray-400">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-white">
                          {supplier.name || 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {supplier.phone || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold">
                            {supplier.total_owed?.toLocaleString() || 0} ج.م
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(supplier)}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                              title="تعديل"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-900/50">
                  <div className="text-sm text-gray-400">
                    عرض {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredSuppliers.length)} من {filteredSuppliers.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm disabled:opacity-50"
                    >
                      السابق
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm rounded ${currentPage === page ? 'bg-electric-blue text-slate-dark font-bold' : 'hover:bg-gray-700'}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm disabled:opacity-50"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-card border border-gray-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingSupplier ? 'تعديل المورد' : 'مورد جديد'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  الاسم <span className="text-red-400">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg focus:border-electric-blue"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الهاتف</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg focus:border-electric-blue"
                  dir="ltr"
                />
              </div>
              {error && <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 border border-gray-700 rounded-lg hover:bg-gray-700 text-gray-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري...
                    </>
                  ) : editingSupplier ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
