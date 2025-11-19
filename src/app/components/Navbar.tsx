"use client"

import { useAuth } from "@/app/components/Providers"
import { supabase } from "@/app/lib/supabaseClient"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

export default function Navbar() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  // Don't show navbar on auth pages and org registration
  if (pathname === "/auth" || pathname === "/org" || pathname === "/org/login" || pathname.startsWith("/auth/")) {
    return null
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path)
  }

  const getActiveClass = (path: string) => {
    return isActive(path)
      ? "bg-[#f77fbe] text-white"
      : "text-indigo-100 hover:bg-[#f77fbe] hover:text-white"
  }

  // Extract user information from Supabase user object
  const name = user ? (
    user.user_metadata?.full_name ||
    [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ") ||
    user.email?.split("@")[0]
  ) : null

  // determine role for conditional links
  const userRole = user?.user_metadata?.role

  return (
    <nav className="bg-[#52b2bf] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-white font-[Atelia]">Berry</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Public Navigation - When Not Logged In */}
            {!loading && !user && (
              <>
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm text-white hover:bg-white hover:text-[#f77fbe] font-[Marble] transition-colors ${getActiveClass("/")}`}
                >
                  Home
                </Link>
                <Link
                  href="/auth?mode=signin"
                  className="bg-[#f77fbe] text-white hover:bg-white hover:text-[#f77fbe] px-4 py-2 rounded-md text-sm font-[Marble] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="bg-[#f77fbe] text-white hover:bg-white hover:text-[#f77fbe] px-4 py-2 rounded-md text-sm font-[Marble] transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/org"
                  className="bg-[#52b2bf] hover:bg-white hover:text-[#52b2bf] px-4 py-2 rounded-md text-sm font-[Marble] transition-colors"
                >
                  Org Registration
                </Link>
                <Link
                  href="/dashboard/admin"
                  className="bg-[#52b2bf] hover:bg-white hover:text-[#52b2bf] px-4 py-2 rounded-md text-sm font-[Marble] transition-colors"
                >
                  Admin
                </Link>
              </>
            )}

            {/* Authenticated Navigation - When Logged In */}
            {!loading && user && (
              <>
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-white hover:bg-white hover:text-[#f77fbe] text-sm font-[Marble] transition-colors ${getActiveClass("/")}`}
                >
                  Home
                </Link>
                
                {/* Dashboard Links */}
                <div className="relative group">
                  <button className="px-3 py-2 rounded-md text-sm font-[Marble] text-indigo-100 hover:bg-[#f77fbe] hover:text-white transition-colors">
                    Dashboards
                    <svg className="ml-1 h-4 w-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm font-[Marble] text-gray-700 hover:bg-gray-100"
                      >
                        Main Dashboard
                      </Link>
                      <Link
                        href="/dashboard/student"
                        className="block px-4 py-2 text-sm font-[Marble] text-gray-700 hover:bg-gray-100"
                      >
                        Student Dashboard
                      </Link>
                      <Link
                        href="/dashboard/org"
                        className="block px-4 py-2 text-sm font-[Marble] text-gray-700 hover:bg-gray-100"
                      >
                        Organization Dashboard
                      </Link>
                      <Link
                        href="/dashboard/admin"
                        className="block px-4 py-2 text-sm font-[Marble] text-gray-700 hover:bg-gray-100"
                      >
                        Admin Dashboard
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Student-only: My Feed (desktop only - add mobile) */}
                {userRole === "student" && (
                  <Link
                    href="/dashboard/student/student-feed"
                    className={`px-3 py-2 rounded-md text-sm font-[Marble] transition-colors ${getActiveClass("/dashboard/student/student-feed")}`}
                  >
                    My Feed
                  </Link>
                )}

                { /* Student-only: Explore page (desktop only - add mobile) */}
                {userRole === "student" && (
                  <Link
                    href="/dashboard/student/student-explore"
                    className={`px-3 py-2 rounded-md text-sm font-[Marble] transition-colors ${getActiveClass("/dashboard/student/explore")}`}
                  >
                    Explore
                  </Link>
                )}

                {userRole === "student" && (
                  <Link
                    href="/dashboard/student/student-profile"
                    className={`px-3 py-2 rounded-md text-sm font-[Marble] transition-colors ${getActiveClass("/dashboard/student/profile")}`}
                  >
                    Profile
                  </Link>
                )}


                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <span className="text-indigo-100 text-sm font-[Marble]">
                    Welcome, {name || 'User'}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-[#52b2bf] hover:bg-white hover:text-[#52b2bf] px-4 py-2 rounded-md text-sm font-[Marble] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-indigo-100 hover:text-white focus:outline-none focus:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-indigo-700">
              {!loading && !user && (
                <>
                  <Link
                    href="/"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${getActiveClass("/")}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/auth?mode=signin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/org"
                    className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Org Registration
                  </Link>
                  <Link
                    href="/dashboard/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-red-200 hover:bg-red-600 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                </>
              )}

              {!loading && user && (
                <>
                  <Link
                    href="/"
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${getActiveClass("/")}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Main Dashboard
                  </Link>
                  <Link
                    href="/dashboard/student"
                    className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Student Dashboard
                  </Link>
                  <Link
                    href="/dashboard/org"
                    className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Organization Dashboard
                  </Link>
                  <Link
                    href="/dashboard/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                  <div className="border-t border-indigo-500 pt-3 mt-3">
                    <div className="px-3 py-2 text-indigo-100 text-sm">
                      Welcome, {name || 'User'}
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-200 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}

              {/* Loading state for mobile */}
              {loading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}