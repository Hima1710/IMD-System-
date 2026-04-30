import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Product, Purchase, PurchaseItem } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplier_name, items, shop_id } = body

    if (!shop_id || !supplier_name || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.unit_cost * item.quantity)
    }, 0)

    // Insert purchase record
    const purchaseData: Omit<Purchase, 'id' | 'created_at'> = {
      shop_id,
      supplier_name,
      supplier_id: null,
      total_amount: totalAmount,
      status: 'completed'
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseData)
      .select()
      .single()

    if (purchaseError || !purchase) {
      console.error('Purchase insert error:', purchaseError)
      return NextResponse.json({ error: 'Failed to create purchase: ' + purchaseError?.message }, { status: 500 })
    }

    const purchaseId = purchase.id

    // Prepare purchase items for insert
    const purchaseItems: Omit<PurchaseItem, 'id'>[] = items.map((item: any) => ({
      purchase_id: purchaseId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost
    }))

    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(purchaseItems)

    if (itemsError) {
      console.error('Purchase items insert error:', itemsError)
      // Rollback purchase
      await supabase.from('purchases').delete().eq('id', purchaseId)
      return NextResponse.json({ error: 'Failed to save items: ' + itemsError.message }, { status: 500 })
    }

    // Update stock for each product (increments by quantity)
    // Using fetch-then-update approach for reliable atomic increment
    const stockUpdatePromises = items.map(async (item: any) => {
      // First, fetch the current stock quantity
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .eq('shop_id', shop_id)
        .single()

      if (fetchError || !product) {
        return { error: fetchError || new Error('Product not found') }
      }

      // Calculate new stock value
      const newStock = (product.stock_quantity || 0) + item.quantity

      // Update with the new calculated value
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', item.product_id)
        .eq('shop_id', shop_id)

      return { error: updateError }
    })

    const stockResults = await Promise.all(stockUpdatePromises)
    
    // Check for any stock update failures
    const stockErrors = stockResults.filter(r => r.error)
    if (stockErrors.length > 0) {
      console.error('Stock update errors:', stockErrors)
      // Note: We don't rollback purchases here as stock updates are critical
      // but returning warning in response
      return NextResponse.json({ 
        success: true, 
        purchase_id: purchaseId,
        warning: 'Purchase created but some stock updates may have failed'
      })
    }

    return NextResponse.json({ success: true, purchase_id: purchaseId })
  } catch (error: any) {
    console.error('Purchases API error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop_id = searchParams.get('shop_id')

    if (!shop_id) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('purchases')
      .select('*, purchase_items(*)')
      .eq('shop_id', shop_id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('GET purchases error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET purchases API error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}
