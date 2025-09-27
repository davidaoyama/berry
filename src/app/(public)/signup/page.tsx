"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to unified auth page in signup mode
    router.replace("/auth?mode=signup")
  }, [router])

  // Simple loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sign up...</p>
      </div>
    </div>
  )
}