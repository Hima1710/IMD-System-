'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, type Profile, type Shop } from '@/lib/supabase'

// Types
interface User {
  id: string
  fullName: string
  email: string
  phone: string
  role: string | null
}

interface AppContextType {
  user: User | null
  shop: Shop | null
  shopError: string | null
  isAuthenticated: boolean
  isSuperAdmin: boolean
  isLoading: boolean
  networkError: boolean
  login: (email: string, phone: string) => Promise<boolean>
  logout: () => void
  register: (userData: RegisterData) => Promise<boolean>
  createMerchant: (data: MerchantData) => Promise<{ success: boolean; error?: string; tempPassword?: string }>
  clearNetworkError: () => void
}

interface RegisterData {
  fullName: string
  email: string
  phone: string
  shopName: string
  businessType: string
}

interface MerchantData {
  fullName: string
  email: string
  phone: string
  shopName: string
  businessType: string
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
const [shopError, setShopError] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState(false)

  // Clear network error
  const clearNetworkError = () => setNetworkError(false)

  // Helper to detect network errors
  const isNetworkError = (err: any): boolean => {
    const message = err?.message || ''
    return (
      message.includes('Failed to fetch') ||
      message.includes('Network request failed') ||
      message.includes('network') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT') ||
      !message
    )
  }

  // Ref to prevent duplicate session handling
  const isHandlingSession = React.useRef(false)
  const lastHandledUserId = React.useRef<string | null>(null)

  // Check session on mount
  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isMounted && session?.user) {
          await handleSession(session.user.id, session.user.email || '')
        }
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    checkSession()

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      
      // Prevent duplicate calls for the same user
      if (session?.user && session.user.id !== lastHandledUserId.current) {
        handleSession(session.user.id, session.user.email || '')
      } else if (!session?.user) {
        lastHandledUserId.current = null
        setUser(null)
        setShop(null)
        setIsAuthenticated(false)
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // Handle session/profile fetch
  const handleSession = async (userId: string, email: string) => {
    // Prevent duplicate calls
    if (isHandlingSession.current || lastHandledUserId.current === userId) {
      console.log('Skipping duplicate session handle for:', userId)
      return
    }
    
    isHandlingSession.current = true
    lastHandledUserId.current = userId
    
    try {
      console.log('Handling session for user:', userId)

      // Fetch profile - don't fail if missing, create it if needed
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.log('Profile fetch error (might not exist yet):', profileError.message)
        console.log('Profile error code:', profileError.code)
      }

      let fullName = ''
      let phone = ''
      let shopId = null
      let role = null

      if (profile) {
        console.log('Profile found:', profile)
        fullName = profile.full_name || ''
        phone = profile.phone || ''
        shopId = profile.shop_id
        role = profile.role
      } else {
        console.log('No profile found for user, using auth metadata')
        // Try to get from auth metadata
        const { data: { user: authUser } } = await supabase.auth.getUser()
        fullName = authUser?.user_metadata?.full_name || ''
        phone = authUser?.user_metadata?.phone || ''
        
        // Try to create profile from auth metadata
        console.log('Attempting to create profile from auth metadata')
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: fullName,
            email: email,
            phone: phone,
          })
        
        if (createProfileError) {
          console.log('Could not create profile:', createProfileError.message)
          // Continue anyway - user is authenticated
        } else {
          console.log('Profile created from auth metadata')
        }
      }

      setUser({
        id: userId,
        fullName,
        email,
        phone,
        role,
      })
      setIsAuthenticated(true)
      setIsSuperAdmin(role === 'superadmin')

      // Fetch shop if associated
      if (shopId) {
        try {
          const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('*')
            .eq('id', shopId)
            .maybeSingle()

          if (shopError) {
            console.error('Shop fetch error:', shopError)
            setShopError(`خطأ في تحميل المتجر: ${shopError.message}`)
          } else if (shopData) {
            console.log('Shop found:', shopData)
            setShop(shopData)
            setShopError(null)
          } else {
            console.warn('Shop not found for ID:', shopId, '- using default shop')
            setShop({
              id: shopId!,
              name: 'متجر جديد',
              business_type: 'general',
              owner_id: userId,
              is_active: true,
              created_at: new Date().toISOString()
            } as Shop)
            setShopError(null)
          }
        } catch (error) {
          console.error('Shop fetch exception:', error)
          setShopError('خطأ في الاتصال بالخادم')
        }
      } else {
        setShopError(null)
      }
    } catch (err) {
      console.error('Error handling session:', err)
    } finally {
      isHandlingSession.current = false
    }
  }

  // Login function
  const login = async (email: string, phone: string): Promise<boolean> => {
    console.log('Attempting login for:', email)
    try {
      // Use phone as password for login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: phone,
      })

      if (error) {
        console.error('Login error:', error.message)
        console.error('Login error code:', error.code)
        console.error('Login error status:', error.status)
        return false
      }

      if (data.user) {
        console.log('Login successful, user:', data.user.id)
        await handleSession(data.user.id, data.user.email || '')
        return true
      }

      return false
    } catch (err: any) {
      console.error('Unexpected login error:', err)
      console.error('Unexpected login error details:', err)
      return false
    }
  }

  // Register function
  const register = async (userData: RegisterData): Promise<boolean> => {
    console.log('Starting registration for:', userData.email)
    try {
      // Step A: auth.signUp (Create User)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.phone,
        options: {
          data: {
            full_name: userData.fullName,
            phone: userData.phone,
          }
        }
      })

      if (signUpError) {
        console.error('SignUp error:', signUpError.message)
        console.error('SignUp error details:', signUpError)
        
        // Check if it's an "email already exists" error
        if (signUpError.message.includes('already been registered') || 
            signUpError.message.includes('already exists') ||
            signUpError.code === 'PF200') {
          throw new Error('البريد الإلكتروني مسجل بالفعل. الرجاء تسجيل الدخول.')
        }
        throw new Error('حدث خطأ أثناء إنشاء الحساب')
      }

      const userId = authData.user?.id
      if (!userId) {
        console.error('No user ID returned from signUp')
        throw new Error('حدث خطأ في إنشاء الحساب')
      }

      console.log('User created successfully:', userId)

      // Step B: Insert into shops (Create Shop)
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .insert({
          name: userData.shopName,
          business_type: userData.businessType,
          owner_id: userId,
        })
        .select()
        .single()

      if (shopError) {
        console.error('Shop creation error:', shopError.message)
        console.error('Shop creation error details:', shopError)
        console.error('Shop error code:', shopError.code)
        
        // Shop creation failed - user is orphaned in auth
        // Try to clean up by signing out
        await supabase.auth.signOut()
        
        if (shopError.message.includes('row-level security') || 
            shopError.code === '42501') {
          throw new Error('حدث خطأ في إنشاء المتجر. يرجى التواصل مع الدعم.')
        }
        throw new Error('حدث خطأ أثناء إنشاء بيانات المتجر')
      }

      const shopId = shopData?.id
      console.log('Shop created successfully:', shopId)
      console.log('Shop owner_id:', shopData?.owner_id)

      // Step C: Update profile with shop_id
      // First try to insert profile (in case it doesn't exist)
      const { error: profileInsertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          shop_id: shopId,
        })

      if (profileInsertError) {
        console.log('Profile insert error, trying update:', profileInsertError.message)
        // Profile might already exist, try to update
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ shop_id: shopId })
          .eq('id', userId)

        if (profileUpdateError) {
          console.error('Profile update error:', profileUpdateError.message)
          console.error('Profile update error details:', profileUpdateError)
          // Continue anyway - user and shop are created
        } else {
          console.log('Profile updated with shop_id successfully')
        }
      } else {
        console.log('Profile created with shop_id successfully')
      }

      console.log('Registration complete')

      // Set local state
      setUser({
        id: userId,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: null,
      })
      setShop(shopData)
      setIsAuthenticated(true)
      setIsSuperAdmin(false)

      return true
    } catch (err: any) {
      console.error('Unexpected registration error:', err)
      console.error('Registration error details:', err)
      // Re-throw with clear message
      if (err.message) {
        throw err
      }
      throw new Error('حدث خطأ أثناء إنشاء الحساب')
    }
  }

  // Create merchant function (for super admin)
  const createMerchant = async (data: MerchantData): Promise<{ success: boolean; error?: string; tempPassword?: string }> => {
    console.log('Admin creating merchant:', data.email)
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'البريد الإلكتروني غير صالح' }
    }
    
    try {
      // Generate a temporary password
      const tempPassword = generateTempPassword()
      console.log('Generated temp password for merchant')
      
      // Call the API route to create user with admin privileges
      const response = await fetch('/api/admin/create-merchant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: tempPassword,
          fullName: data.fullName,
          phone: data.phone,
          shopName: data.shopName,
          businessType: data.businessType,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('API error:', result.error)
        return { success: false, error: result.error || 'حدث خطأ' }
      }
      
      console.log('Merchant creation complete:', result.userId)
      return { success: true, tempPassword }
    } catch (err: any) {
      console.error('Admin create merchant error:', err)
      return { success: false, error: err?.message || 'حدث خطأ غير متوقع' }
    }
  }
  
  // Helper function to generate temporary password
  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    }
    setUser(null)
    setShop(null)
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-slate">
        <div className="text-center">
          <img src="/imd-logo.jpeg" alt="IMD System Logo" className="logo-image mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    )
  }

return (
    <AppContext.Provider value={{ 
      user, 
      shop, 
      shopError, 
      isAuthenticated, 
      isSuperAdmin, 
      isLoading, 
      networkError,
      login, 
      logout, 
      register, 
      createMerchant,
      clearNetworkError 
    }}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use context
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
