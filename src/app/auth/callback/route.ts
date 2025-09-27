import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check domain
      const domain = data.user.email?.split('@')[1]
      const allowedDomains = ['usc.edu', 'lausd.net', 'gmail.com']
      
      if (!allowedDomains.includes(domain!)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/auth?error=domain_not_allowed`)
      }
      
      // Success - redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}