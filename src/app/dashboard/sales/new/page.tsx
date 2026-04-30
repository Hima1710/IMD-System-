'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import {
  ShoppingCart, Trash2, Plus, Minus, Search, Printer,
  CheckCircle, CreditCard, Wallet, Landmark, Package,
  AlertCircle, Volume2, VolumeX, Calculator, Receipt, Loader2, ArrowLeft
} from 'lucide-react'

// Types
interface Product {
  id: string
  name: string
  barcode: string | null
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock: number
  is_active: boolean
}

interface Account {
  id: string
  name: string
  balance: number
  account_type: string
}


interface Customer {
  id: string
  name: string
  phone: string | null
  balance?: number
  total_debt: number
}

interface CartItem {
  product: Product
  quantity: number
  price: number
  subtotal: number
}

interface InvoiceItemData {
  product_id: string
  product_name: string
  quantity: number
  price: number
  subtotal: number
}

interface ShopFull {
  id: string
  name: string
  location: string | null
  phone: string | null
}

// Sound effects
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.frequency.value = 1200
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.1)
  } catch (e) { 
    console.log('Audio not supported') 
  }
}

const playSuccess = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.frequency.value = freq
      oscillator.type = 'sine'
      const startTime = audioCtx.currentTime + i * 0.12
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.15)
    })
  } catch (e) { 
    console.log('Audio not supported') 
  }
}

// QR Code generator using canvas
const generateQR = (text: string): string => {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  // Simple QR-like pattern (production: use qrcode lib or API)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  const size = 8
  for (let i = 0; i < canvas.width; i += size * 2) {
    for (let j = 0; j < canvas.height; j += size * 2) {
      if (Math.random() > 0.5) {
        ctx.fillRect(i, j, size, size)
      }
    }
  }
  // Mock QR - replace with real QRCode.toCanvas in production
  return canvas.toDataURL()
}

export default function NewSalePage() {
  const { user, shop, isAuthenticated } = useApp()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [paymentType, setPaymentType] = useState<'cash' | 'debt'>('cash')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoPrint, setAutoPrint] = useState(false)
  const [printMode, setPrintMode] = useState<'thermal' | 'standard'>('standard')
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<any>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemData[]>([])
const [fullShop, setFullShop] = useState<ShopFull | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // LocalStorage persistence
  useEffect(() => {
    const saved = localStorage.getItem('posPrintSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      setAutoPrint(settings.autoPrint || false)
      setPrintMode(settings.printMode || 'standard')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('posPrintSettings', JSON.stringify({ autoPrint, printMode }))
  }, [autoPrint, printMode])

  useEffect(() => { 
    if (!isAuthenticated) router.push('/login') 
  }, [isAuthenticated, router])

useEffect(() => { 
    if (shop?.id) { 
      fetchPOSData()
    } 
  }, [shop?.id])

  const fetchPOSData = async () => {
    if (!shop?.id) return
    
    setIsLoading(true)
    try {
// Fetch products from Supabase scoped to shop
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, barcode, cost_price, selling_price, stock_quantity, min_stock, is_active')
        .eq('shop_id', shop.id)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name')

      if (productsError) {
        console.error('Error fetching products:', productsError)
      } else {
        setProducts(productsData || [])
      }

      // Fetch customers from Supabase scoped to shop
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, total_debt')
        .eq('shop_id', shop.id)
        .order('name')

      if (customersError) {
        console.error('Error fetching customers:', customersError)
      } else {
        setCustomers(customersData || [])
      }

      // Fetch accounts from Supabase scoped to shop
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name, balance, account_type')
        .eq('shop_id', shop.id)
        .order('name')

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError)
      } else {
        setAccounts(accountsData || [])
        // Auto-select first account if none selected
        if (accountsData && accountsData.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accountsData[0].id)
        }
      }


      // Get full shop details
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, name, location, phone')
        .eq('id', shop.id)
        .single()

      if (!shopError && shopData) {
        setFullShop(shopData)
      }
    } catch (err) {
      console.error('Error fetching POS data:', err)
    } finally {
      setTimeout(() => setIsLoading(false), 500)
    }
  }

  const fetchFullShop = async () => {
    if (!shop?.id) return
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name, location, phone')
        .eq('id', shop.id)
        .single()
      if (error) console.error('Error fetching shop details:', error)
      else setFullShop(data)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  useEffect(() => {
    if (!isLoading && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isLoading])

  // ... (rest of functions remain the same - fetchProducts, addToCart, etc.)

  const printReceipt = (mode: 'thermal' | 'standard') => {
    const customer = customers.find(c => c.id === selectedCustomerId)
    const date = new Date(lastInvoice!.created_at).toLocaleString('ar-EG')
    const qrText = `فاتورة #${lastInvoice!.invoice_number} - ${date}`
    const qrDataUrl = generateQR(qrText)
    const shopInfo = fullShop || shop as any
    const watermark = `${shopInfo.name || ''} - ${shopInfo.location || ''}`

    let html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ${lastInvoice!.invoice_number}</title>
  <style>
    @page { margin: 5mm; }
    body { font-family: 'Arial', sans-serif; color: #333; }
    .thermal { width: 80mm; font-size: 12pt; }
    .standard { width: 210mm; font-size: 10pt; }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 40pt;
      color: rgba(0,0,0,0.1);
      font-weight: bold;
      z-index: -1;
      pointer-events: none;
    }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { font-size: 24pt; margin: 0; }
    .info { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
    th { background: #f5f5f5; }
    .total { font-size: 1.4em; font-weight: bold; }
    .qr { text-align: center; margin-top: 20px; }
  </style>
  ${mode === 'thermal' ? '@page { size: 80mm auto; margin: 2mm; } body { font-size: 14pt !important; } .total { font-size: 20pt !important; }' : '@page { size: A4; }'}
</head>
<body class="${mode}">
  <div class="watermark">${watermark}</div>
  <div class="header">
    <h1>${shopInfo.name || 'المتجر'}</h1>
    <p>${shopInfo.location || ''} | ${shopInfo.phone || ''}</p>
    <p>فاتورة مبيعات</p>
  </div>
  <div class="info">
    <p><strong>رقم الفاتورة:</strong> ${lastInvoice!.invoice_number}</p>
    <p><strong>التاريخ:</strong> ${date}</p>
    <p><strong>العميل:</strong> ${customer ? customer.name : 'عميل نقدي'}</p>
    <p><strong>نوع الدفع:</strong> ${lastInvoice!.payment_type === 'cash' ? 'نقدي' : 'آجل'}</p>
    ${customer ? `<p><strong>هاتف:</strong> ${customer.phone || ''}</p>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>المنتج</th>
        <th>الكمية</th>
        <th>السعر</th>
        <th>الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceItems.map(item => `
        <tr>
          <td>${item.product_name}</td>
          <td>${item.quantity}</td>
          <td>${item.price.toFixed(2)} ج.م</td>
          <td>${item.subtotal.toFixed(2)} ج.م</td>
        </tr>`).join('')}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">المجموع الفرعي</td>
        <td>${subtotal.toFixed(2)} ج.م</td>
      </tr>
      <tr>
        <td colspan="3">الخصم</td>
        <td>-${(subtotal - total).toFixed(2)} ج.م</td>
      </tr>
      <tr class="total">
        <td colspan="3">الإجمالي النهائي</td>
        <td>${total.toFixed(2)} ج.م</td>
      </tr>
    </tfoot>
  </table>
  <div class="qr">
    <img src="${qrDataUrl}" alt="QR Code" style="width: 60px; height: 60px;">
    <p>شكراً لكم</p>
  </div>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    printWindow!.document.write(html)
    printWindow!.document.close()
    printWindow!.focus()
    printWindow!.print()
    printWindow!.close()
  }

  const processSale = async () => {
    if (cart.length === 0) return
    if (!shop?.id) {
      setError('لا يوجد متجر مرتبط')
      return
    }
    if (paymentType === 'cash' && !selectedAccountId) {
      setError('الرجاء اختيار حساب الدفع')
      return
    }
    
    setIsProcessing(true)
    setError('')


    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`

      // 1. Create invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          shop_id: shop.id,
          invoice_number: invoiceNumber,
          customer_id: selectedCustomerId || null,
          account_id: paymentType === 'cash' ? selectedAccountId || null : null,
          invoice_type: 'sale',
          total_amount: total,
          discount: discount,
          status: paymentType === 'debt' ? 'pending' : 'paid',
          payment_type: paymentType,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (invoiceError || !invoice) {
        throw new Error('فشل في إنشاء الفاتورة: ' + invoiceError?.message)
      }

// 2. Create invoice items with schema-compliant column names
      const invoiceItemsData = cart.map(item => ({
        shop_id: shop.id,
        invoice_id: invoice.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.price,
        cost_price: item.product.cost_price || 0,
        total: item.subtotal
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItemsData)

      if (itemsError) {
        // Rollback invoice with shop_id for multi-tenancy
        await supabase.from('invoices').delete().eq('id', invoice.id).eq('shop_id', shop.id)
        throw new Error('فشل في حفظ تفاصيل الفاتورة: ' + itemsError.message)
      }

      // 3. Decrement stock_quantity for each product
      for (const item of cart) {
        const newStock = item.product.stock_quantity - item.quantity
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product.id)
          .eq('shop_id', shop.id)

        if (stockError) {
          console.error('Stock update error:', stockError)
        }
      }

      // 4. Handle cash payment - update account balance and create ledger entry
      if (paymentType === 'cash' && selectedAccountId) {
        // Get current account balance
        const { data: accountData } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', selectedAccountId)
          .eq('shop_id', shop.id)
          .single()

        const currentBalance = accountData?.balance || 0
        const newBalance = currentBalance + total

        // Update account balance
        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', selectedAccountId)
          .eq('shop_id', shop.id)

        // Record in ledger with all required schema fields
        await supabase
          .from('account_ledger')
          .insert({
            shop_id: shop.id,
            account_id: selectedAccountId,
            amount: total,
            transaction_type: 'income',
            balance_after: newBalance,
            reference_id: invoice.id,
            description: `فاتورة مبيعات #${invoiceNumber} - نقدي`
          })
      }

      // 5. If debt payment, update customer total_debt and create ledger entry
      if (paymentType === 'debt' && selectedCustomerId) {
        const customer = customers.find(c => c.id === selectedCustomerId)
        if (customer) {
          const newDebt = (customer.total_debt || 0) + total

          // Update customer debt
          await supabase
            .from('customers')
            .update({ total_debt: newDebt })
            .eq('id', selectedCustomerId)
            .eq('shop_id', shop.id)

          // Record customer debt in ledger with all required schema fields
          await supabase
            .from('account_ledger')
            .insert({
              shop_id: shop.id,
              customer_id: selectedCustomerId,
              amount: total,
              transaction_type: 'debt',
              balance_after: newDebt,
              reference_id: invoice.id,
              description: `فاتورة مبيعات #${invoiceNumber} - آجل - ${customer.name}`
            })
        }
      }

      // Prepare invoice items data for display
      const displayItemsData = cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }))

      setLastInvoice({
        invoice_number: invoiceNumber,
        created_at: new Date().toISOString(),
        total: total,
        discount,
        customer_id: selectedCustomerId || null,
        payment_type: paymentType
      })
      setInvoiceItems(displayItemsData)

      playSuccess()
      setShowSuccessModal(true)

      // Reset for new invoice
      setTimeout(() => {
        setCart([])
        setDiscount(0)
        setSelectedCustomerId('')
        setSelectedAccountId('')
        setPaymentType('cash')
      }, 2000)

    } catch (err: any) {
      setError('فشل في حفظ الفاتورة: ' + (err?.message || err))
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isAuthenticated) {

    return null
  }

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const total = subtotal - discount

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glow-card max-w-md w-full max-h-[90vh] overflow-y-auto bg-gradient-to-b from-emerald-500/10 to-emerald-600/20 border border-emerald-400/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-400/30">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">تم حفظ الفاتورة بنجاح!</h2>
              <p className="text-emerald-300/80">رقم الفاتورة: <strong>{lastInvoice?.invoice_number}</strong></p>
            </div>
            
            {/* Totals */}
            <div className="space-y-3 mb-8 text-right">
              <div className="flex justify-between text-lg">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{subtotal.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-lg text-amber-400">
                <span>الخصم:</span>
                <span>-{discount.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-emerald-400 border-t pt-4">
                <span>الإجمالي:</span>
                <span>{total.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Print Settings */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl">
                <input 
                  type="checkbox" 
                  checked={autoPrint} 
                  onChange={(e) => setAutoPrint(e.target.checked)} 
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm">طباعة تلقائي بعد الحفظ</span>
              </label>
              <select 
                value={printMode} 
                onChange={(e) => setPrintMode(e.target.value as 'thermal' | 'standard')} 
                className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-xl text-sm"
              >
                <option value="standard">فاتورة قياسية (A4)</option>
                <option value="thermal">طباعة حرارية (80mm)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  printReceipt(printMode)
                  if (autoPrint) setTimeout(() => setShowSuccessModal(false), 1000)
                }} 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                <Printer className="w-5 h-5 inline mr-2" />
                طباعة {printMode === 'thermal' ? 'حرارية' : 'فاتورة'}
              </button>
              <button 
                onClick={() => {
                  setShowSuccessModal(false)
                  setCart([])
                  setDiscount(0)
                  setSelectedCustomerId('')
                  setSelectedAccountId('')
                }} 
                className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-slate-500/25 transition-all"
              >
                فاتورة جديدة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main POS Interface - Add your existing JSX here */}
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-md border-b border-slate-700/50 p-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-700/30 px-4 py-2 rounded-xl">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-lg">{cart.length}</span>
          </div>
          <button className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30">
            <Receipt className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-6">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الباركود..."
              className="w-full pl-12 pr-6 py-4 bg-slate-800/50 border border-slate-600 rounded-2xl text-xl font-semibold text-right focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 backdrop-blur"
            />
          </div>
        </div>

        {/* Products Grid - Placeholder for dynamic products */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 h-96 overflow-y-auto">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-slate-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-400">
              لا توجد منتجات
            </div>
          ) : (
            products
              .filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.barcode?.includes(searchQuery)
              )
              .map(product => (
                <div
                  key={product.id}
                  onClick={() => {
                    playBeep()
                    const existing = cart.find(item => item.product.id === product.id)
                    if (existing) {
                      setCart(cart.map(item => 
                        item.product.id === product.id
? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.selling_price }
                          : item
                      ))
                    } else {
                      setCart([...cart, {
                        product,
                        quantity: 1,
price: product.selling_price,
                        subtotal: product.selling_price
                      }])
                    }
                  }}
                  className="group bg-gradient-to-b from-slate-800/60 to-slate-900/60 hover:from-blue-500/20 hover:to-blue-600/20 border border-slate-600/50 hover:border-blue-500/50 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/25 backdrop-blur-sm text-sm"
                >
                  <div className="w-full h-16 bg-slate-700/30 rounded-lg mb-2 flex items-center justify-center group-hover:bg-blue-500/20">
                    <Package className="w-8 h-8 text-slate-400 group-hover:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-sm mb-1 truncate">{product.name}</h3>
<p className="text-lg font-black text-emerald-400 mb-1">{product.selling_price.toFixed(2)} ج.م</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>{product.stock_quantity}</span>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Cart & Controls */}
        <div className="space-y-3">
          {/* Payment Type & Customer */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value)
                if (e.target.value === '') setPaymentType('cash')
              }}
              className="p-3 bg-slate-800/50 border border-slate-600 rounded-xl text-base font-semibold text-right"
            >
              <option value="">عميل نقدي</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} (دين: {customer.total_debt.toFixed(2)} ج.م)
                </option>
              ))}
            </select>
            {selectedCustomerId && (
              <div className="flex items-center p-3 bg-slate-800/50 border border-slate-600 rounded-xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaymentType('cash')}
                    className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                      paymentType === 'cash'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-slate-700/50 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    نقدي
                  </button>
                  <button
                    onClick={() => setPaymentType('debt')}
                    className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                      paymentType === 'debt'
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                        : 'bg-slate-700/50 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    آجل
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Discount & Total */}
          <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-600/30 backdrop-blur">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">الخصم</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl text-2xl font-bold text-right focus:ring-2 focus:ring-amber-500/50"
                placeholder="0"
              />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-emerald-400 mb-1">{total.toFixed(2)} ج.م</div>
              <div className="text-lg text-slate-400">الإجمالي النهائي</div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">

            <button className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 p-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-slate-500/25 transition-all">
              إلغاء
            </button>
            <button 
              onClick={processSale}
              disabled={cart.length === 0 || isProcessing}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-700 disabled:to-slate-800 p-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
            >

              {isProcessing ? (
                <Loader2 className="w-7 h-7 animate-spin mx-auto" />
              ) : (
                `حفظ فاتورة (${total.toFixed(2)} ج.م)`
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
