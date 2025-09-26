"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

interface EmailVerificationProps {
  email: string
  onVerified: () => void
  onCancel: () => void
}

export default function EmailVerification({ email, onVerified, onCancel }: EmailVerificationProps) {
  const [codes, setCodes] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)
  
  // Use useRef to track if email has been sent (persists across renders and strict mode)
  const hasEmailBeenSent = useRef(false)
  // Also track the email we sent for, in case email prop changes
  const lastEmailSent = useRef<string>('')

  // Use useCallback to memoize the function and prevent unnecessary re-creations
  const sendVerificationCode = useCallback(async (isResend = false) => {
    console.log("📤 EmailVerification: Sending verification code to:", email)
    console.log("📤 isResend:", isResend)
    console.log("📤 hasEmailBeenSent.current:", hasEmailBeenSent.current)
    console.log("📤 lastEmailSent.current:", lastEmailSent.current)
    
    // If this is not a resend and we've already sent an email for this address, skip
    if (!isResend && hasEmailBeenSent.current && lastEmailSent.current === email) {
      console.log("📤 Email already sent to this address, skipping...")
      return
    }
    
    // If email changed, reset the tracking
    if (lastEmailSent.current !== email) {
      console.log("📤 Email changed, resetting tracking...")
      hasEmailBeenSent.current = false
      lastEmailSent.current = ''
    }
    
    try {
      console.log("📤 Making API call to send verification code...")
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          action: 'send'
        })
      })
      
      const data = await response.json()
      console.log("📬 EmailVerification: Send verification response:", data)
      
      if (response.ok) {
        // Mark as sent using ref (persists across renders and strict mode)
        hasEmailBeenSent.current = true
        lastEmailSent.current = email
        console.log("✅ EmailVerification: Email sent successfully")
      } else {
        throw new Error(data.error || 'Failed to send verification code')
      }
    } catch (error) {
      console.error("❌ EmailVerification: Error sending verification code:", error)
      setError('Failed to send verification code. Please try again.')
    }
  }, [email]) // Only depend on email

  // Send verification code when component mounts (only once per email)
  useEffect(() => {
    console.log("📧 EmailVerification useEffect running for:", email)
    console.log("📧 hasEmailBeenSent.current:", hasEmailBeenSent.current)
    console.log("📧 lastEmailSent.current:", lastEmailSent.current)
    
    // Only send if we haven't sent already for this email address
    if (!hasEmailBeenSent.current || lastEmailSent.current !== email) {
      console.log("📧 Calling sendVerificationCode...")
      sendVerificationCode(false) // false = initial send, not resend
    } else {
      console.log("📧 Email already sent for this address, skipping...")
    }
  }, [email, sendVerificationCode]) // Depend on email and sendVerificationCode

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newCodes = [...codes]
      newCodes[index] = value
      setCodes(newCodes)

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`)
        nextInput?.focus()
      }

      // Auto-verify when all codes are entered
      if (newCodes.every(code => code !== '') && newCodes.join('').length === 6) {
        handleVerify(newCodes.join(''))
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async (code?: string) => {
    const verificationCode = code || codes.join('')
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log("🔍 Verifying code:", verificationCode, "for email:", email)
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          action: 'verify',
          code: verificationCode
        })
      })

      const data = await response.json()
      console.log("✅ Verification response:", data)

      if (response.ok) {
        console.log("🎉 Email verified successfully!")
        onVerified()
      } else {
        setError(data.error || 'Invalid verification code')
        // Clear codes on error
        setCodes(['', '', '', '', '', ''])
        const firstInput = document.getElementById('code-0')
        firstInput?.focus()
      }
    } catch (error) {
      console.error("💥 Verification error:", error)
      setError('Failed to verify code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    console.log("🔄 Resending verification code...")
    setIsResending(true)
    setError('')
    setCodes(['', '', '', '', '', ''])
    
    try {
      // For resend, we explicitly allow sending another email
      await sendVerificationCode(true) // true = this is a resend
      // Focus first input after resending
      setTimeout(() => {
        const firstInput = document.getElementById('code-0')
        firstInput?.focus()
      }, 100)
    } catch (error) {
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-medium text-gray-900">{email}</p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 text-center">
              Enter verification code
            </label>
            
            <div className="flex justify-center space-x-3">
              {codes.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value.replace(/\D/, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  disabled={isLoading || isResending}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleVerify()}
              disabled={isLoading || codes.join('').length !== 6 || isResending}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={isResending || isLoading}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              disabled={isLoading}
            >
              ← Back to sign up
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium">Check your email</p>
                <p>The code might be in your spam folder if you don't see it in your inbox.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}