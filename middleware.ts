import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next()
  
  // Create Supabase client with request/response
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if available
  await supabase.auth.getSession()
  
  // Check if auth verification just happened
  const authJustVerified = req.cookies.get('auth_verification_success')
  
  // Only check protected routes, bypass verification page
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    // Get session AFTER refresh attempt
    const { data: { session } } = await supabase.auth.getSession()
    
    // Debug
    console.log('Middleware session check for:', req.nextUrl.pathname, !!session)
    
    // If no session and not just verified, redirect to auth page
    if (!session && !authJustVerified) {
      return NextResponse.redirect(new URL('/auth?mode=signin', req.url))
    }
  }
  
  // Continue with the request and include any updated cookies
  return res
}

export const config = {
  matcher: [
    // Protect dashboard routes
    "/dashboard/:path*",
  ]
}