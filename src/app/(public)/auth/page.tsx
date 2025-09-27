"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"

// Allowed email domains
const ALLOWED_DOMAINS = ["usc.edu", "lausd.net", "gmail.com"]

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState<"student" | "org">("student")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin"

  // Handle sign-in form submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      // For sign-in, use shouldCreateUser: false
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          shouldCreateUser: false // Only for sign-in
        }
      })
      
      if (signInError) throw signInError
      setEmailSent(true)
      
    } catch (err: any) {
      console.error("Sign in error:", err)
      setError(err.message || "Failed to send sign in link")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle sign-up form submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !firstName || !lastName || !role) {
      setError("Please fill in all required fields")
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // For sign-up, include user metadata
      const { error: signUpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          // shouldCreateUser: true is the default
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            role: role,
            created_at: new Date().toISOString()
          }
        }
      })
      
      if (signUpError) throw signUpError
      setEmailSent(true)
      
    } catch (err: any) {
      console.error("Sign up error:", err)
      setError(err.message || "Failed to send verification email")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Render based on mode (signup or signin)
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Email sent confirmation screen */}
      {emailSent ? (
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Check Your Email</h2>
          <p className="mb-4 text-gray-600">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-gray-600 mb-8">
            Click the link to {mode === "signup" ? "complete your registration" : "sign in"}. 
            The link will expire in 1 hour.
          </p>
          <button
            onClick={() => setEmailSent(false)}
            className="w-full py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            Back
          </button>
        </div>
      ) : (
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {mode === "signup" ? "Create an Account" : "Sign In"}
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={mode === "signup" ? handleSignUp : handleSignIn} className="space-y-4">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              />
            </div>
            
            {/* Additional fields for sign-up */}
            {mode === "signup" && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    I am a
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "student" | "org")}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={isLoading}
                  >
                    <option value="student">Student</option>
                    <option value="org">Organization</option>
                  </select>
                </div>
              </>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading 
                ? "Processing..." 
                : mode === "signup" 
                  ? "Create Account" 
                  : "Send Magic Link"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === "signup" 
                ? "Already have an account? " 
                : "Don't have an account? "}
              <a
                href={`/auth?mode=${mode === "signup" ? "signin" : "signup"}`}
                className="text-indigo-600 hover:text-indigo-500"
              >
                {mode === "signup" ? "Sign In" : "Sign Up"}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}