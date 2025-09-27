"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { useAuth } from '@/app/components/Providers'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log('❌ No user found, redirecting to login')
      router.push("/login")
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out from main dashboard...')
      await signOut()
      console.log('✅ Signed out successfully, redirecting to login')
      router.push("/login")
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // Get user role for conditional rendering
  const userRole = user.user_metadata?.role
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0]
  const userDomain = user.email?.split('@')[1]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Berry Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {userName}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Choose Your Dashboard
              </h2>
              
              {/* Show role-specific message if user has a role */}
              {userRole && (
                <div className="mb-8 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-indigo-800">
                    You're registered as a <strong>{userRole === 'org' ? 'Organization' : 'Student'}</strong>. 
                    You can access your dedicated dashboard below or explore other areas.
                  </p>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* Student Dashboard */}
                <Link href="/dashboard/student">
                  <div className={`bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500 ${
                    userRole === 'student' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}>
                    <div className="text-blue-600 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Student Dashboard
                      {userRole === 'student' && (
                        <span className="ml-2 text-blue-600 text-sm">
                          ✓ Your Role
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600">
                      Access student-specific features and information
                    </p>
                  </div>
                </Link>

                {/* Organization Dashboard */}
                <Link href="/dashboard/org">
                  <div className={`bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500 ${
                    userRole === 'org' ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}>
                    <div className="text-green-600 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Organization Dashboard
                      {userRole === 'org' && (
                        <span className="ml-2 text-green-600 text-sm">
                          ✓ Your Role
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600">
                      Manage organization settings and members
                    </p>
                  </div>
                </Link>
              </div>

              <div className="mt-8 bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  User Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {userName}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Domain:</strong> {userDomain}</p>
                  <p><strong>Role:</strong> {userRole ? (userRole === 'org' ? 'Organization' : 'Student') : 'Not specified'}</p>
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Email Verified:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
                  <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</p>
                </div>
              </div>

              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">🎉 Supabase Auth Active!</h4>
                <p className="text-sm text-green-800">
                  You're now using Supabase Auth with automatic email verification and Google OAuth!
                </p>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/dashboard/admin"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    View Signup Page
                  </Link>
                  <Link
                    href="/"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Home Page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}