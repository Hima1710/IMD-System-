'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase, type Customer } from '@/lib/supabase'
import { Users, Search, Plus, Edit3, DollarSign, CheckCircle, X, AlertTriangle } from 'lucide-react'

const ITEMS_PER_PAGE = 10

export default function CustomersPage() {
  const { user, shop, isAuthenticated } = useApp()
  const router = useRouter()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [collectAmount, setCollectAmount] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  interface CustomerFormData {
    name: string;
    phone: string;
    total_debt: string;
    credit_limit: string;
  }

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    total_debt: '0',
    credit_limit: '0',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Fetch customers
  useEffect(() => {
    if (shop?.id) {
      fetchCustomers()
    }
  }, [shop?.id])

  const fetchCustomers = async () => {
    if (!shop?.id) return
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching customers:', error)
        setError('فشل في تحميل العملاء')
      } else {
        setCustomers(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        total_debt: customer.total_debt?.toString() || '0',
        credit_limit: customer.credit_limit?.toString() || '0',
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        name: '',
        phone: '',
        total_debt: '0',
        credit_limit: '0',
      })
    }
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
    setFormData({ name: '', phone: '', total_debt: '0', credit_limit: '0' })
    setError('')
  }

  const openCollectModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCollectAmount('')
    setIsCollectModalOpen(true)
  }

  const closeCollectModal = () => {
    setIsCollectModalOpen(false)
    setSelectedCustomer(null)
    setCollectAmount('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('الرجاء إدخال اسم العميل')
      return
    }

    if (!shop?.id) {
      setError('لا يوجد متجر مرتبط')
      return
    }

    setIsSubmitting(true)
    setError('')

    const customerData = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      total_debt: parseFloat(formData.total_debt) || 0,
      credit_limit: parseFloat(formData.credit_limit) || 0,
      shop_id: shop.id,
    }

    try {
      if (editingCustomer) {
        // Update
        const { error: updateError } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id)
          .eq('shop_id', shop.id)

        if (updateError) {
          console.error('Update error:', updateError)
          setError('فشل في تحديث العميل')
        } else {
          fetchCustomers()
          closeModal()
        }
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('customers')
          .insert(customerData)

        if (insertError) {
          console.error('Insert error:', insertError)
          setError('فشل في إنشاء العميل')
        } else {
          fetchCustomers()
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

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(collectAmount)
    if (!amount || amount <= 0 || !selectedCustomer) {
      setError('الرجاء إدخال مبلغ صحيح')
      return
    }

    if (amount > selectedCustomer.total_debt) {
      setError('المبلغ أكبر من الدين المستحق')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Update customer debt
      const newDebt = selectedCustomer.total_debt - amount
      const { error: updateError } = await supabase
        .from('customers')
        .update({ total_debt: newDebt })
        .eq('id', selectedCustomer.id)
        .eq('shop_id', shop.id)

      if (updateError) {
        console.error('Debt update error:', updateError)
        setError('فشل في تحديث الدين')
        return
      }

      // Insert ledger entry
      const { error: ledgerError } = await supabase
        .from('account_ledger')
        .insert({
          shop_id: shop.id,
          amount,
          transaction_type: 'income',
          description: `تحصيل دفعة من ${selectedCustomer.name} - ${amount.toFixed(2)} ج.م`
        })

      if (ledgerError) {
        console.error('Ledger insert error:', ledgerError)
        // Rollback debt update if ledger fails (optional in prod)
        await supabase
          .from('customers')
          .update({ total_debt: selectedCustomer.total_debt })
          .eq('id', selectedCustomer.id)
          .eq('shop_id', shop.id)
        setError('فشل في تسجيل الحركة المالية')
        return
      }

      fetchCustomers()
      closeCollectModal()
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('shop_id', shop.id)

      if (error) {
        console.error('Delete error:', error)
        setError('فشل في حذف العميل')
      } else {
        fetchCustomers()
      }
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ')
    }
  }

  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  )

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  if (!isAuthenticated) {
    return null
  }

  const totalDebt = customers.reduce((sum, c) => sum + (c.total_debt || 0), 0)

  return (
    <div className="min-h-screen bg-dark-slate">
      {/* Header */}
      <div className="bg-dark-card border-b border-gray-800 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة العملاء</h1>
            <p className="text-gray-400 mt-1">
              إجمالي المستحقات: <span className="text-electric-blue font-bold">{totalDebt.toLocaleString()} ج.م</span>
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold py-3 px-6 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <Users size={20} />
            عميل جديد
          </button>
        </div>
      </div>

<div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
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
              <p className="text-gray-400">جاري التحميل...</p>
            </div>
          ) : paginatedCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد عملاء بعد'}
              </p>
              <button
                onClick={() => openModal()}
                className="bg-gradient-to-r from-electric-blue to-cyan-accent text-slate-dark font-bold py-2 px-6 rounded-lg"
              >
                إضافة أول عميل
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
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">المستحقات</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {paginatedCustomers.map((customer, index) => (
                      <tr key={customer.id} className="hover:bg-gray-800/30">
                        <td className="px-6 py-4 text-gray-400">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-white">
                          {customer.name || 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {customer.phone || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold">
                            {customer.total_debt?.toLocaleString() || 0} ج.م
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(customer)}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                              title="تعديل"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => openCollectModal(customer)}
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              title="تحصيل دفعة"
                              disabled={customer.total_debt <= 0}
                            >
                              <DollarSign size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              title="حذف"
                            >
                              <svg size={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-900/50">
                  <div className="text-sm text-gray-400">
                    عرض {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} من {filteredCustomers.length}
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

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-card border border-gray-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingCustomer ? 'تعديل العميل' : 'عميل جديد'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الاسم <span className="text-red-400">*</span></label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg focus:border-electric-blue"
                  dir="rtl"
                />
                <label className="block text-sm font-medium text-gray-300 mb-2 mt-4">الحد الائتماني (ج.م)</label>
                <input
                  name="credit_limit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.credit_limit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg focus:border-electric-blue"
                  dir="ltr"
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الدين المستحق (ج.م)</label>
                <input
                  name="total_debt"
                  type="number"
                  value={formData.total_debt}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
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
                  ) : editingCustomer ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {isCollectModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-card border border-gray-700 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">تحصيل دفعة</h3>
                <p className="text-gray-400">{selectedCustomer.name}</p>
              </div>
            </div>
            <form onSubmit={handleCollectPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">المبلغ المحصل (ج.م) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  min="0"
                  max={selectedCustomer.total_debt}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-dark border border-gray-700 rounded-lg focus:border-emerald-500 text-right text-lg font-bold"
                  dir="ltr"
                />
                <p className="text-sm text-gray-500 mt-1">
                  الدين المستحق: <span className="font-bold text-red-400">{selectedCustomer.total_debt.toLocaleString()} ج.م</span>
                </p>
              </div>
              {error && <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeCollectModal}
                  className="flex-1 py-3 px-4 border border-gray-700 rounded-lg hover:bg-gray-700 text-gray-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !collectAmount || parseFloat(collectAmount) <= 0}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري...
                    </>
                  ) : (
                    'تحصيل'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
