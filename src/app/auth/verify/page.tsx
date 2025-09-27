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
      // First check for error parameters from Supabase
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
      
      try {
        setStatus('Processing authentication...')
        
        // Try using the session API first
        const { data: sessionData } = await supabase.auth.getSession()
        
        // If we already have a session, use it
        if (sessionData.session) {
          console.log('Existing session found')
          const role = sessionData.session.user.user_metadata?.role
          const redirectPath = role === 'student' ? '/dashboard/student' : 
                              role === 'org' ? '/dashboard/org' : 
                              '/dashboard'
          
          setStatus(`Authentication successful! Redirecting...`)
          router.push(redirectPath)
          return
        }
        
        // Otherwise try to get session from URL
        // For implicit flow, we need to check if we have a hash in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken) {
          // We have tokens in the URL, set them directly
          console.log('Found access token in URL')
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          
          if (sessionError) throw sessionError
          
          // Get the session again to get user data
          const { data: newSession } = await supabase.auth.getSession()
          
          if (!newSession.session) {
            throw new Error('Failed to create session from tokens')
          }
          
          const role = newSession.session.user.user_metadata?.role
          const redirectPath = role === 'student' ? '/dashboard/student' : 
                              role === 'org' ? '/dashboard/org' : 
                              '/dashboard'
          
          setStatus(`Authentication successful! Redirecting...`)
          router.push(redirectPath)
          return
        }
        
        // If we reach here, we have no authentication method that works
        throw new Error('No authentication data found in URL or cookies')
        
      } catch (err: any) {
        console.error('Auth verification error:', err)
        setError(`Authentication error: ${err.message}`)
        setTimeout(() => {
          router.push(`/auth?error=verification_error&message=${encodeURIComponent(err.message)}`)
        }, 2000)
      }
    }
    
    handleAuth()
  }, [router, searchParams])
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Authentication</h1>
        
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