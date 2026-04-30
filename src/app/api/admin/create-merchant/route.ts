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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, phone, shopName, businessType } = body

    // Validate required fields
    if (!email || !password || !fullName || !phone || !shopName || !businessType) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      )
    }

    console.log('Creating merchant via admin API:', email)

    // Step A: Create user in Auth using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
      },
    })

    if (authError) {
      console.error('Auth creation error:', authError.message)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: 'لم يتم إنشاء المستخدم' },
        { status: 500 }
      )
    }

    console.log('User created:', userId)

    // Step B: Create shop
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('shops')
      .insert({
        name: shopName,
        business_type: businessType,
        owner_id: userId,
        is_active: true,
      })
      .select()
      .single()

    if (shopError) {
      console.error('Shop creation error:', shopError.message)
      // Try to clean up the user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: shopError.message },
        { status: 400 }
      )
    }

    const shopId = shopData?.id
    console.log('Shop created:', shopId)

    // Step C: Create profile with role = 'admin'
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        email,
        phone,
        shop_id: shopId,
        role: 'admin',
        is_active: true,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError.message)
      // Try to clean up
      await supabaseAdmin.from('shops').delete().eq('id', shopId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    console.log('Merchant created successfully:', userId)

    return NextResponse.json({
      success: true,
      userId,
      shopId,
    })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err?.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}