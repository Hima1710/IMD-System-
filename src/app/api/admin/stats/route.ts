import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize admin client with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// GET platform-wide stats
export async function GET() {
  try {
    // Fetch all shops
    const { data: shops, error: shopsError } = await supabaseAdmin
      .from('shops')
      .select('id, name, is_active, created_at, owner_id, business_type, profiles(full_name, email, phone)')

    if (shopsError) {
      console.error('Error fetching shops:', shopsError)
      return NextResponse.json(
        { error: shopsError.message },
        { status: 500 }
      )
    }

    // Calculate stats
    const totalShops = shops?.length || 0
    const activeShops = shops?.filter((s: any) => s.is_active).length || 0
    const suspendedShops = totalShops - activeShops

    // Calculate total revenue from all invoices across all shops
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('total')

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    }

    const totalRevenue = (invoices || []).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)

    // Fetch total users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id')

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    const totalUsers = users?.length || 0

    return NextResponse.json({
      totalShops,
      activeShops,
      suspendedShops,
      totalRevenue,
      totalUsers,
      shops: shops || [],
    })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err?.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}

