with open('src/app/dashboard/sales/new/page.tsx', 'w', encoding='utf-8') as f:
    f.write('''"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { supabase } from '@/lib/supabase'
import {
  ShoppingCart, Trash2, Plus, Minus, Search, Printer,
  CheckCircle, CreditCard, Wallet, Landmark, Package,
  AlertCircle, Volume2, VolumeX, Calculator, Receipt, Loader2
} from 'lucide-react'

const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window).webkitAudioContext)()
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain()
    osc.connect(gain); gain.connect(audioCtx.destination)
    osc.frequency.value = 1200; osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
    osc.start(); osc.stop(audioCtx.currentTime + 0.1)
  } catch(e) {}
}

const playSuccess = () => {
  try {
    const audioCtx = new (window.AudioContext || (window).webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain()
      osc.connect(gain); gain.connect(audioCtx.destination)
      osc.frequency.value = freq; osc.type = 'sine'
      const t = audioCtx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15)
      osc.start(t); osc.stop(t + 0.15)
    })
  } catch(e) {}
}

export default function NewSalePage() {
  const { user, shop, isAuthenticated } = useApp()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastInvoice, setLastInvoice] = useState(null)
  const searchInputRef = useRef(null)

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  useEffect(() => { if (shop?.id) { fetchProducts(); fetchAccounts() } }, [shop?.id])

  const fetchProducts = async () => {
    if (!shop?.id) return
    const { data } = await supabase.from('products').select('id,name,barcode,sale_price,stock').eq('shop_id', shop.id).eq('is_active', true).order('name')
    setProducts(data || []); setIsLoading(false)
  }

  const fetchAccounts = async () => {
    if (!shop?.id) return
    const { data } = await supabase.from('accounts').select('id,name,balance,type').eq('shop_id', shop.id).order('name')
    setAccounts(data || [])
    if (data?.length) { const cash = data.find(a => a.type === 'cash'); setSelectedAccountId(cash?.id || data[0].id) }
  }

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim()
    return !q || p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q))
  })

  const addToCart = useCallback((product) => {
    if (product.stock <= 0) { setError('نفذ المخزون'); setTimeout(() => setError(''), 3000); return }
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) { setError('الكمية غير كافية'); setTimeout(() => setError(''), 3000); return prev }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price } : i)
      }
      if (soundEnabled) playBeep()
      return [...prev, { product, quantity: 1, price: product.sale_price, subtotal: product.sale_price }]
    })
    setSearchQuery(''); if (searchInputRef.current) searchInputRef.current.focus()
  }, [soundEnabled])

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== id) return item
      const newQty = Math.max(1, item.quantity + delta)
      if (newQty > item.product.stock) { setError('الكمية غير كافية'); setTimeout(() => setError(''), 3000); return item }
      return { ...item, quantity: newQty, subtotal: newQty * item.price }
    }))
  }

  const removeItem = (id) => setCart(prev => prev.filter(i => i.product.id !== id))
  const clearCart = () => { setCart([]); setDiscount(0); setError('') }
  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const discountAmt = Math.min(discount, subtotal)
  const total = subtotal - discountAmt

  const onSearchKey = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault()
      const match = products.find(p => p.barcode && p.barcode.toLowerCase() === searchQuery.toLowerCase().trim())
      if (match) addToCart(match)
      else if (filteredProducts.length) addToCart(filteredProducts[0])
    }
  }

  const processSale = async () => {
    if (!cart.length) { setError('السلة فارغة'); return }
    if (!selectedAccountId) { setError('اختر حساب الدفع'); return }
    if (!shop?.id) return
    setIsProcessing(true); setError('')
    try {
      const { data: inv } = await supabase.from('invoices').insert({
        shop_id: shop.id, invoice_number: 'INV-' + Date.now(), total, discount: discountAmt, subtotal,
        status: 'paid', payment_account_id: selectedAccountId, created_by: user?.id || null
      }).select().single()
      const items = cart.map(i => ({ invoice_id: inv.id, product_id: i.product.id, product_name: i.product.name, quantity: i.quantity, price: i.price, subtotal: i.subtotal }))
      await supabase.from('invoice_items').insert(items)
      for (const i of cart) await supabase.from('products').update({ stock: i.product.stock - i.quantity }).eq('id', i.product.id)
      const acc = accounts.find(a => a.id === selectedAccountId)
      if (acc) await supabase.from('accounts').update({ balance: acc.balance + total }).eq('id', selectedAccountId)
      await supabase.from('account_ledger').insert({
        shop_id: shop.id, account_id: selectedAccountId, type: 'income', amount: total,
        description: 'بيع - #' + inv.invoice_number, reference_id: inv.id, reference_type: 'invoice', created_by: user?.id || null
      })
      if (soundEnabled) playSuccess()
      setLastInvoice(inv); setShowSuccessModal(true); clearCart(); fetchProducts()
    } catch (err) { setError(err.message || 'حدث خطأ') }
    finally { setIsProcessing(false) }
  }

  const handlePrint = () => window.print()
  if (!isAuthenticated) return null

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {showSuccessModal && lastInvoice && (
        <div className="hidden print:block print:p-8">
          <div className="text-center mb-6"><h1 className="text-2xl font-bold">{shop?.name}</h1><p className="text-gray-600">فاتورة مبيعات</p></div>
          <div className="mb-4"><p>رقم: {lastInvoice.invoice_number}</p><p>تاريخ: {new Date(lastInvoice.created_at).toLocaleString('ar-EG')}</p></div>
          <table className="w-full border-collapse border border-gray-400 mb-4">
            <thead><tr className="bg-gray-200"><th className="border p-2">المنتج</th><th className="border p-2">كمية</th><th className="border p-2">سعر</th><th className="border p-2">إجمالي</th></tr></thead>
          </table>
          <div><p>إجمالي: {lastInvoice.subtotal?.toFixed(2)}</p><p>خصم: {lastInvoice.discount?.toFixed(2)}</p><p>صافي: {lastInvoice.total?.toFixed(2)}</p></div>
      )}
      <div className={'flex-1 flex gap-4' + (showSuccessModal ? ' print:hidden' : '')}>
        <div className="flex-1 flex flex-col bg-dark-card rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input ref={searchInputRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={onSearchKey} placeholder="بحث..." className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 pr-10 pl-4 text-right focus:border-accent focus:ring-1 focus:ring-accent" />
              </div>
              <button onClick={() => setSoundEnabled(!soundEnabled)} className={'p-3 rounded-lg border ' + (soundEnabled ? 'border-accent/30 text-accent bg-accent/10' : 'border-gray-700 text-gray-500')}>{soundEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
            </div>
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{Array.from({length: 12}).map((_, i) => <div key={i} className="h-28 skeleton rounded-lg" />)}</div> :
            filteredProducts.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-gray-500"><Package size={48} className="mb-4 opacity-50"/><p>لا توجد منتجات</p></div> :
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{filteredProducts.map(product => {const inCart = cart.find(item => item.product.id === product.id); const isOutOfStock = product.stock <= 0; return (<button key={product.id} onClick={() =>addToCart(product)} disabled={isOutOfStock} className={'relative p-4 rounded-lg border text-right transition-all ' + (isOutOfStock ? 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed' : inCart ? 'border-accent bg-accent/10' : 'border-gray-800 bg-dark-bg hover:border-gray-600')}>{inCart && <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-accent text-slate-dark text-xs font-bold flex items-center justify-center">{inCart.quantity}</span>}{product.stock <= 5 && product.stock > 0 && <span className="absolute top-2 right-2 text-amber-400"><AlertCircle size={14}/></span>}<p className="font-medium text-white mb-1 truncate">{product.name}</p><p className="text-accent font-bold">{product.sale_price.toFixed(2)}</p><p className={'text-xs mt-1 ' + (isOutOfStock ? 'text-red-400' : 'text-gray-500')}>{isOutOfStock ? 'نفذ' : 'متوفر: ' + product.stock}</p></button>)})}</div>}
          </div>
        <div className="w-96 flex flex-col bg-dark-card rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2"><ShoppingCart size={20} className="text-accent"/><h2 className="font-bold text-white">فاتورة البيع</h2><span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full">{cart.length}</span></div>
            {cart.length > 0 && <button onClick={clearCart} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"><Trash2 size={14}/> إفراغ</button>}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-gray-500"><ShoppingCart size={48} className="mb-4 opacity-30"/><p>السلة فارغة</p></div> :
            <div className="space-y-3">{cart.map(item => (<div key={item.product.id} className="bg-dark-bg rounded-lg p-3 border border-gray-800"><div className="flex justify-between items-start mb-2"><p className="font-medium text-white text-sm flex-1 ml-2">{item.product.name}</p><button onClick={() => removeItem(item.product.id)} className="text-red-400 hover:text-red-300 p-1 rounded"><Trash2 size={14}/></button></div><div className="flex items-center justify-between"><div className="flex items-center gap-2"><button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 rounded-lg bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700"><Minus size={14}/></button><span className="w-8 text-center font-medium">{item.quantity}</span><button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 rounded-lg bg-accent/20 text-accent flex items-center justify-center hover:bg-accent/30"><Plus size={14}/></button></div><div className="text-left"><p className="text-accent font-bold text-sm">{item.subtotal.toFixed(2)}</p><p className="text-gray-500 text-xs">{item.price.toFixed(2)} x {item.quantity}</p></div></div>))}</div>}
          </div>
          <div className="p-4 border-t border-gray-800 bg-dark-bg/50">
            {error && <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={14}/><span>{error}</span></div>}
            <div className="mb-3"><label className="text-gray-400 text-sm flex items-center gap-2 mb-1"><Calculator size={14}/>الخصم</label><input type="number" min="0" value={discount || ''} onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} className="w-full bg-dark-card border border-gray-700 rounded-lg py-2 px-3 text-right focus:border-accent"/></div>
            <div className="mb-3"><label className="text-gray-400 text-sm flex items-center gap-2 mb-1"><CreditCard size={14}/>حساب الدفع</label><select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full bg-dark-card border border-gray-700 rounded-lg py-2 px-3 text-right focus:border-accent">{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.balance.toFixed(2)})</option>)}</select></div>
            <div className="space-y-1 mb-4 text-sm"><div className="flex justify-between text-gray-400"><span>إجمالي:</span><span>{subtotal.toFixed(2)}</span></div>{discountAmt > 0 && <div className="flex justify-between text-red-400"><span>خصم:</span><span>-{discountAmt.toFixed(2)}</span></div>}<div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-800"><span>صافي:</span><span className="text-accent">{total.toFixed(2)}</span></div>
            <button onClick={processSale} disabled={isProcessing || cart.length === 0} className="w-full py-3 bg-gradient-to-r from-accent to-cyan-accent text-slate-dark font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">{isProcessing ? <><Loader2 size={20} className="animate-spin"/>جاري...</> : <><Receipt size={20}/>إتمام البيع</>}</button>
          </div>
      </div>
      {showSuccessModal && lastInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowSuccessModal(false)}/>
          <div className="relative bg-dark-card border border-gray-700 rounded-xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-green-400"/></div>
            <h2 className="text-2xl font-bold text-white mb-2">تم البيع بنجاح!</h2>
            <p className="text-gray-400 mb-6">رقم: <span className="text-accent font-mono">{lastInvoice.invoice_number}</span></p>
            <div className="bg-dark-bg rounded-lg p-4 mb-6 text-right"><div className="flex justify-between text-sm mb-2"><span className="text-gray-400">منتجات:</span><span className="text-white">{cart.length}</span></div><div className="flex justify-between text-sm mb-2"><span className="text-gray-400">إجمالي:</span><span className="text-white">{lastInvoice.subtotal?.toFixed(2)}</span></div>{lastInvoice.discount > 0 && <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">خصم:</span><span className="text-red-400">{lastInvoice.discount?.toFixed(2)}</span></div>}<div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-800"><span className="text-white">صافي:</span><span className="text-accent">{lastInvoice.total?.toFixed(2)}</span></div>
            <div className="flex gap-3"><button onClick={() => setShowSuccessModal(false)} className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600">إغلاق</button><button onClick={handlePrint} className="flex-1 py-3 bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 flex items-center justify-center gap-2"><Printer size={18}/>طباعة</button></div>
        </div>
      )}
    </div>
  )
}
''')
print('Done')
