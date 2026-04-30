import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

// GET all shops with owner profiles
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('shops')
      .select('*, profiles(full_name, email, phone)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching shops:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ shops: data || [] })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err?.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}

// PATCH update shop status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopId, is_active } = body

    if (!shopId || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'معرف المتجر والحالة مطلوبان' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('shops')
      .update({ is_active })
      .eq('id', shopId)

    if (error) {
      console.error('Error updating shop:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err?.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}

