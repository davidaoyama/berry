"use client"

import { ReactNode } from "react"
import { AuthProvider } from "./AuthProvider"

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

// Export useAuth from here for easier imports
export { useAuth } from "./AuthProvider"