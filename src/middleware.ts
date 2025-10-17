import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('\n🔄 MIDDLEWARE EXECUTING FOR:', req.nextUrl.pathname);
  
  // Create a response object
  const res = NextResponse.next()
  
  // Create Supabase client with request/response
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if available for all routes
  await supabase.auth.getSession()
  
  // Only apply auth protection for dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      // Check if auth verification just happened (using cookie)
      const authJustVerified = req.cookies.get('auth_verification_success')
      
      // Get session AFTER refresh attempt
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session){
        console.log('Session found in middleware for user:', session.user.id)
      }
      if (!session) {
        console.log('No session found in middleware')
      }

      // If user just verified (cookie exists), let them through this one time
      if (authJustVerified?.value === 'true') {
        console.log('Auth just verified, bypassing session check')
        return res
      }
      
      // If no session found, try another refresh first
      if (!session) {
        // Try refreshing the session one more time
        const refreshResult = await supabase.auth.refreshSession()
        
        // If refresh worked, let them through
        if (refreshResult.data.session) {
          return res
        }
        
        // Otherwise redirect to login
        return NextResponse.redirect(new URL('/auth?mode=signin', req.url))
      }
      
      // Add role-based access control
      if (req.nextUrl.pathname.startsWith('/dashboard/student')) {
        const role = session.user?.user_metadata?.role
        if (role !== 'student') {
          // Redirect to appropriate dashboard based on role
          const redirectPath = role === 'org' ? '/dashboard/org' : '/dashboard'
          return NextResponse.redirect(new URL(redirectPath, req.url))
        }
      }
      
      if (req.nextUrl.pathname.startsWith('/dashboard/org')) {
        const role = session.user?.user_metadata?.role
        if (role !== 'org') {
          // Redirect to appropriate dashboard based on role
          const redirectPath = role === 'student' ? '/dashboard/student' : '/dashboard'
          return NextResponse.redirect(new URL(redirectPath, req.url))
        }
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      // In case of error, redirect to login
      return NextResponse.redirect(new URL('/auth?error=session_error', req.url))
    }
  }
  
  // Continue with the request and include any updated cookies
  return res
}

export const config = {
  matcher: [
    // Match all requests except for static assets, etc.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}