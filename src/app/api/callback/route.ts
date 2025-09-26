import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') // Get role from query params
  
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  console.log('🔄 Auth callback triggered with code:', !!code, 'role:', role)

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.user) {
        console.log('✅ Session exchanged successfully for user:', data.user.email)

        // Check domain restriction
        const userEmail = data.user.email
        if (userEmail) {
          const allowedDomains = ['usc.edu', 'lausd.net', 'gmail.com']
          const emailDomain = userEmail.split('@')[1]
          
          if (!allowedDomains.includes(emailDomain)) {
            console.log('❌ Domain not allowed:', emailDomain)
            await supabase.auth.signOut()
            return NextResponse.redirect(`${origin}/signup?error=domain_not_allowed`)
          }
        }

        // Update user role if provided from OAuth
        if (role && ['student', 'org'].includes(role)) {
          console.log('🏷️ Updating user role to:', role)
          
          const { error: updateError } = await supabase.auth.updateUser({
            data: { role }
          })
          
          if (updateError) {
            console.error('⚠️ Failed to update user role:', updateError)
          }
        }

        // Determine redirect based on role
        const userRole = data.user.user_metadata?.role || role
        if (userRole === 'student') {
          next = '/dashboard/student'
        } else if (userRole === 'org') {
          next = '/dashboard/org'
        } else {
          next = '/dashboard'
        }

        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    } catch (error) {
      console.error('💥 Auth callback error:', error)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}