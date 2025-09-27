'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const ALLOWED_DOMAINS = ["usc.edu", "lausd.net", "gmail.com"]

export async function processAuthToken(token: string) {
  const cookieStore = await cookies()
  
  // Create a server-side Supabase client using createClient
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // We're handling the token manually
        storage: {
          getItem: (key) => {
            return cookieStore.get(key)?.value ?? null
          },
          setItem: (key, value) => {
            cookieStore.set({ name: key, value, path: '/' })
          },
          removeItem: (key) => {
            cookieStore.set({ name: key, value: '', path: '/', maxAge: 0 })
          },
        },
      },
    }
  )

  try {
    // Update to use verifyOtp with token_hash
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    })
    
    if (error) {
      console.error("Session exchange error:", error)
      return { success: false, error: error.message }
    }

    const user = data.user
    if (!user?.email) {
      console.error("No user or email found after auth")
      return { success: false, error: "No user found" }
    }

    // Validate the user's email domain
    const emailDomain = user.email.split('@')[1]
    if (!ALLOWED_DOMAINS.includes(emailDomain)) {
      console.error(`Unauthorized email domain: ${emailDomain}`)
      await supabase.auth.signOut()
      return { success: false, error: "Email domain not authorized" }
    }

    // Successfully authenticated
    const role = user.user_metadata?.role
    let redirectPath = '/dashboard'
    
    // Role-specific redirects
    if (role === "student") {
      redirectPath = '/dashboard/student'
    } else if (role === "org") {
      redirectPath = '/dashboard/org'
    }
    
    return { success: true, redirectPath, user }
  } catch (error: any) {
    console.error("Error in auth processing:", error)
    return { success: false, error: error.message || "Authentication failed" }
  }
}