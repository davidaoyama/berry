"use client"

import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import EmailVerification from "@/components/EmailVerification"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState("")
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    // Check if user is already logged in AND has completed verification
    const checkSession = async () => {
      console.log("🔍 =======================================")
      console.log("🔍 CHECKING SESSION IN useEffect")
      console.log("🔍 =======================================")
      
      const session = await getSession()
      console.log("🔍 Session from useEffect:", JSON.stringify(session, null, 2))
      
      if (session?.user?.email) {
        console.log("🔍 Found session with email:", session.user.email)
        
        // Check if user has already verified their email
        const verificationKey = `emailVerified_${session.user.email}`
        const hasCompletedVerification = localStorage.getItem(verificationKey)
        
        console.log("🔍 Verification check:")
        console.log("🔍 - Key:", verificationKey)
        console.log("🔍 - Value:", hasCompletedVerification)
        
        if (hasCompletedVerification === 'true') {
          console.log("🔍 ✅ User has completed verification, redirecting to dashboard")
          router.push("/dashboard")
        } else {
          console.log("🔍 ❌ User has session but hasn't completed verification")
          console.log("🔍 📧 Setting up email verification screen (but NOT sending email yet)")
          
          // Set up email verification screen but DON'T send email
          setPendingEmail(session.user.email)
          localStorage.setItem("userRole", "student")
          setShowEmailVerification(true) // Show verification screen
          
          // DON'T send email here - let EmailVerification component handle it
        }
      } else {
        console.log("🔍 No session found")
      }
      
      console.log("🔍 Setting sessionChecked to true")
      setSessionChecked(true)
    }
    
    checkSession()
  }, [router])

  // Don't render anything until we've checked the session
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <div className="text-gray-500">Checking account status...</div>
        </div>
      </div>
    )
  }

  const handleGoogleSignUp = async () => {
    console.log("🚀 ==============================================")
    console.log("🚀 handleGoogleSignUp STARTED")
    console.log("🚀 ==============================================")
    
    setIsLoading(true)
    setError("")
    
    try {
      console.log("📞 About to call signIn...")
      const result = await signIn("google", {
        redirect: false,
      })
      
      console.log("📋 SignIn result received:", JSON.stringify(result, null, 2))
      
      if (result?.error) {
        console.log("❌ SignIn had error:", result.error)
        setError("Sign up failed. Please make sure you're using an authorized email address.")
        setIsLoading(false)
      } else if (result?.ok) {
        console.log("✅ SignIn was successful!")
        console.log("⏳ Waiting 1.5 seconds for session to be established...")
        
        setTimeout(async () => {
          console.log("🔍 Getting session after timeout...")
          const session = await getSession()
          console.log("👤 Retrieved session:", JSON.stringify(session, null, 2))
          
          if (session?.user?.email) {
            console.log("📧 Found email in session:", session.user.email)
            
            // Check if user has already verified this email
            const verificationKey = `emailVerified_${session.user.email}`
            const hasCompletedVerification = localStorage.getItem(verificationKey)
            console.log("🔍 Checking verification status:", { verificationKey, hasCompletedVerification })
            
            if (hasCompletedVerification === 'true') {
              console.log("📧 Email already verified, redirecting to dashboard")
              router.push("/dashboard")
              return
            }
            
            console.log("📧 Email not yet verified, starting verification process...")
            localStorage.setItem("userRole", "student")
            setPendingEmail(session.user.email)
            
            // Send verification code immediately
            try {
              console.log("📤 =======================================")
              console.log("📤 SENDING VERIFICATION EMAIL")
              console.log("📤 Email:", session.user.email)
              console.log("📤 =======================================")
              
              const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: session.user.email,
                  action: 'send'
                })
              })
              
              console.log("📬 Response status:", response.status)
              console.log("📬 Response ok:", response.ok)
              
              const data = await response.json()
              console.log("📬 Response data:", JSON.stringify(data, null, 2))
              
              if (response.ok) {
                console.log("✅ =======================================")
                console.log("✅ VERIFICATION EMAIL SENT SUCCESSFULLY!")
                console.log("✅ =======================================")
                setShowEmailVerification(true)
              } else {
                console.error("❌ =======================================")
                console.error("❌ FAILED TO SEND VERIFICATION EMAIL")
                console.error("❌ Status:", response.status)
                console.error("❌ Error:", data.error)
                console.error("❌ =======================================")
                setError(`Failed to send verification email: ${data.error}`)
              }
            } catch (emailError) {
              console.error("💥 =======================================")
              console.error("💥 EXCEPTION SENDING VERIFICATION EMAIL")
              console.error("💥 Error:", emailError)
              console.error("💥 =======================================")
              setError("Failed to send verification email. Please try again.")
            }
          } else {
            console.log("❌ No email found in session")
            setError("Unable to retrieve email address. Please try again.")
          }
          setIsLoading(false)
        }, 1500)
        return
      } else {
        console.log("❓ Unexpected signIn result:", result)
        setError("An unexpected error occurred. Please try again.")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("💥 Exception in handleGoogleSignUp:", error)
      setError("An error occurred during sign up.")
      setIsLoading(false)
    }
  }

  const handleEmailVerified = async () => {
    console.log("✅ Email verified, redirecting to dashboard...")
    
    // Mark email as verified in localStorage
    if (pendingEmail) {
      localStorage.setItem(`emailVerified_${pendingEmail}`, 'true')
    }
    
    // Redirect to student dashboard
    router.push("/dashboard/student")
  }

  const handleCancelVerification = async () => {
    console.log("❌ Cancelling verification...")
    setShowEmailVerification(false)
    setPendingEmail("")
    localStorage.removeItem("userRole")
    
    // Sign out to clear session
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch (error) {
      console.log("Error signing out:", error)
    }
    
    router.refresh()
  }

  // If showing email verification, render the EmailVerification component
  if (showEmailVerification) {
    return (
      <EmailVerification
        email={pendingEmail}
        onVerified={handleEmailVerified}
        onCancel={handleCancelVerification}
      />
    )
  }

  // Otherwise, show the normal signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your student account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Berry with your authorized email address
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-900">Student Account</h3>
                <p className="text-sm text-blue-700">Access student resources, connect with peers, and join organizations</p>
              </div>
            </div>
          </div>
          
          <div>
            <button
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Create Student Account
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </span>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Two-Factor Authentication Required
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>After signing in with Google, you'll receive a 6-digit verification code via email to complete your account setup.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Must use an authorized email address (@usc.edu, @lausd.net, or @gmail.com)</li>
              <li>• Email verification required for security</li>
              <li>• Access to your email inbox to receive verification code</li>
              <li>• Student dashboard and resources access after verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}