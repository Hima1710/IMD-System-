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

// GET search shops by name or owner email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      // Return all shops if no query
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
    }

    // Search by shop name
    const { data: shopsByName, error: nameError } = await supabaseAdmin
      .from('shops')
      .select('*, profiles(full_name, email, phone)')
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false })

    if (nameError) {
      console.error('Error searching shops by name:', nameError)
    }

    // Search by owner email through profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('shop_id')
      .ilike('email', `%${query}%`)

    if (profileError) {
      console.error('Error searching profiles:', profileError)
    }

    const shopIdsFromProfiles = (profiles || []).map((p: any) => p.shop_id).filter(Boolean)

    let shopsByEmail: any[] = []
    if (shopIdsFromProfiles.length > 0) {
      const { data: emailShops, error: emailError } = await supabaseAdmin
        .from('shops')
        .select('*, profiles(full_name, email, phone)')
        .in('id', shopIdsFromProfiles)

      if (emailError) {
        console.error('Error fetching shops by email:', emailError)
      } else {
        shopsByEmail = emailShops || []
      }
    }

    // Merge and deduplicate results
    const allShops = [...(shopsByName || []), ...shopsByEmail]
    const uniqueShops = allShops.filter((shop, index, self) =>
      index === self.findIndex((s) => s.id === shop.id)
    )

    return NextResponse.json({ shops: uniqueShops })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err?.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}

