'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Verifying your authentication...')
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for error parameters in URL
        const errorParam = searchParams.get('error')
        const errorCode = searchParams.get('error_code')
        const errorDesc = searchParams.get('error_description')
        
        if (errorParam) {
          const errorMessage = errorDesc || `Authentication error: ${errorParam}`
          console.error('Auth error from params:', errorMessage)
          setError(errorMessage)
          setTimeout(() => {
            router.push(`/auth?error=${errorParam}&message=${encodeURIComponent(errorMessage)}`)
          }, 2000)
          return
        }
        
        setStatus('Processing your authentication...')
        console.log('Starting auth verification process')
        
        // Check for token_hash parameter per Supabase docs
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        
        if (tokenHash && type === 'email') {
          console.log('Found token_hash and type, using verifyOtp')
          // Use verifyOtp as documented for PKCE flow with token_hash
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          })
          
          if (error) {
            console.error('OTP verification error:', error)
            throw error
          }
          
          // IMPORTANT: Make sure session is established before redirect
          // Add a delay to ensure session is properly set
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Double-check that we have a valid session
          const { data: sessionCheck } = await supabase.auth.getSession()
          console.log('Session after verification:', sessionCheck.session)
          
          if (!sessionCheck.session) {
            console.error('No session established after verification')
            throw new Error('Authentication successful but no session was created')
          }
          
          // Set a cookie to indicate successful verification
          document.cookie = 'auth_verification_success=true; path=/; max-age=30'
          
          // Get user role and redirect
          const role = data.user?.user_metadata?.role
          const redirectPath = role === 'student' ? '/dashboard/student' : 
                              role === 'org' ? '/dashboard/org' : 
                              '/dashboard'
          
          console.log('Redirecting to:', redirectPath)
          setStatus(`Authentication successful! Redirecting to dashboard...`)
          
          // Use replace instead of push
          router.replace(redirectPath)
          return
        }
        
        // Fallback to code exchange if no token_hash (for older links)
        console.log('No token_hash found, trying exchangeCodeForSession')
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        
        if (error) {
          console.error('Code exchange error:', error)
          throw error
        }
        
        if (!data.session) {
          console.error('No session data found after code exchange')
          throw new Error('Failed to authenticate - no session created')
        }
        
        // Authentication successful
        console.log('Authentication successful with code exchange!', data.user)
        
        // Get user role and redirect
        const role = data.user?.user_metadata?.role
        const redirectPath = role === 'student' ? '/dashboard/student' : 
                            role === 'org' ? '/dashboard/org' : 
                            '/dashboard'
        
        setStatus(`Authentication successful! Redirecting to dashboard...`)
        router.push(redirectPath)
        
      } catch (err: any) {
        console.error('Auth verification error:', err)
        setError(`Authentication error: ${err.message}`)
        
        // Try to check if we have a session despite the error
        try {
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            // We have a session, so redirect to dashboard
            const role = data.session.user.user_metadata?.role
            const redirectPath = role === 'student' ? '/dashboard/student' : 
                              role === 'org' ? '/dashboard/org' : 
                              '/dashboard'
            
            setStatus(`Already authenticated! Redirecting...`)
            router.push(redirectPath)
            return
          }
        } catch (_) {
          // Ignore errors checking session
        }
        
        setTimeout(() => {
          router.push(`/auth?error=verification_error&message=${encodeURIComponent(err.message)}`)
        }, 2000)
      }
    }
    
    // Only run auth handling once
    handleAuth()
  }, [router, searchParams])
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Verifying Your Account</h1>
        
        {error ? (
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <p className="text-gray-600">Redirecting back to login page...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{status}</p>
          </div>
        )}
      </div>
    </div>
  )
}