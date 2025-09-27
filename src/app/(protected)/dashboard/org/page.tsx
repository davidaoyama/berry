"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { useAuth } from '@/app/components/Providers'

export default function OrgDashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log('❌ No user found, redirecting to login')
      router.push("/login")
    } else if (!loading && user) {
      // Check if user has the right role
      const userRole = user.user_metadata?.role
      console.log('👤 User role on org dashboard:', userRole)
      
      // Allow access but show a message if they're not an org
      if (userRole && userRole !== 'org') {
        console.log('⚠️ User is not an org but allowing access')
      }
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out from org dashboard...')
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <div className="text-gray-500">Loading organization dashboard...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // Get user info
  const userRole = user.user_metadata?.role
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0]
  const userDomain = user.email?.split('@')[1]
  const isOrg = userRole === 'org'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Organization Dashboard</h1>
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
          <div className="space-y-6">
            {/* Role Status Alert */}
            {!isOrg && userRole && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-amber-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">
                      Role Notice
                    </h3>
                    <p className="mt-1 text-sm text-amber-700">
                      You're registered as a <strong>{userRole === 'student' ? 'Student' : 'Admin'}</strong> but accessing the Organization Dashboard. 
                      Consider switching to your <Link href="/dashboard/student" className="underline">Student Dashboard</Link>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isOrg && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      Welcome Organization Admin!
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      You have full access to organization management tools and settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Dashboard Content */}
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Organization Dashboard
                </h2>
                <p className="text-gray-600 mb-8">
                  Manage your organization, members, and administrative settings
                </p>

                {/* Organization Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-green-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM9 4a1 1 0 000 2v1a1 1 0 102 0V6a1 1 0 100-2H9zM7 8a1 1 0 000 2v6a1 1 0 102 0v-6a1 1 0 100-2H7z" />
                        <path d="M17 15v-3a1 1 0 10-2 0v3a1 1 0 11-2 0V9a1 1 0 10-2 0v6a1 1 0 11-2 0v-3a1 1 0 10-2 0v3a1 1 0 11-2 0V8a1 1 0 10-2 0v7a1 1 0 11-2 0v-3a1 1 0 10-2 0v3a3 3 0 003 3h12a3 3 0 003-3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Member Management</h3>
                    <p className="text-gray-600 text-sm">Add, remove, and manage organization members</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-blue-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
                    <p className="text-gray-600 text-sm">View organization performance and metrics</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-purple-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
                    <p className="text-gray-600 text-sm">Configure organization preferences</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-red-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
                    <p className="text-gray-600 text-sm">Manage access controls and permissions</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-yellow-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Communications</h3>
                    <p className="text-gray-600 text-sm">Send announcements and messages</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-indigo-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 100-2H7a1 1 0 100 2h6zm-6 4a1 1 0 100-2h6a1 1 0 100 2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
                    <p className="text-gray-600 text-sm">Access organizational resources</p>
                  </div>
                </div>

                {/* Organization Information */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Organization Admin Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {userName}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Domain:</strong> {userDomain}</p>
                      <p><strong>Role:</strong> {isOrg ? 'Organization Admin ✓' : userRole || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>User ID:</strong> {user.id.substring(0, 8)}...</p>
                      <p><strong>Email Verified:</strong> {user.email_confirmed_at ? 'Yes ✓' : 'No'}</p>
                      <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</p>
                      <p><strong>Admin Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/dashboard"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Main Dashboard
                  </Link>
                  <Link
                    href="/dashboard/student"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Student Dashboard
                  </Link>
                  <Link
                    href="/dashboard/admin"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">🏢 Organization Control Center</h4>
                  <p className="text-sm text-green-800">
                    Manage all aspects of your organization from this centralized dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}