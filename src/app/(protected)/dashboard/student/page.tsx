"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { useAuth } from '@/app/components/Providers'

export default function StudentDashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log('❌ No user found, redirecting to login')
      router.push("/login")
    } else if (!loading && user) {
      // Check if user has the right role
      const userRole = user.user_metadata?.role
      console.log('👤 User role on student dashboard:', userRole)
      
      // Allow access but show a message if they're not a student
      if (userRole && userRole !== 'student') {
        console.log('⚠️ User is not a student but allowing access')
      }
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out from student dashboard...')
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-gray-500">Loading student dashboard...</div>
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
  const isStudent = userRole === 'student'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Student Dashboard</h1>
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
            {!isStudent && userRole && (
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
                      You're registered as an <strong>{userRole === 'org' ? 'Organization' : 'Admin'}</strong> but accessing the Student Dashboard. 
                      Consider switching to your <Link href="/dashboard/org" className="underline">Organization Dashboard</Link>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isStudent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      Welcome Student!
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      You're in the right place. Access all your student resources and information here.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Dashboard Content */}
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                  <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Student Dashboard
                </h2>
                <p className="text-gray-600 mb-8">
                  Access your courses, assignments, and academic resources
                </p>

                {/* Student Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-blue-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 100-2H7a1 1 0 100 2h6zm-6 4a1 1 0 100-2h6a1 1 0 100 2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">My Courses</h3>
                    <p className="text-gray-600 text-sm">View enrolled courses and schedules</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-green-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignments</h3>
                    <p className="text-gray-600 text-sm">Track assignments and deadlines</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-purple-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.894A1 1 0 0018 16V3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Announcements</h3>
                    <p className="text-gray-600 text-sm">Latest news and updates</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-red-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-3a1 1 0 00-1 1v1h2V4a1 1 0 00-1-1zM7.757 9.243a1 1 0 00-1.414 1.414L7.586 12l-1.243 1.243a1 1 0 101.414 1.414L9 13.414l1.243 1.243a1 1 0 001.414-1.414L10.414 12l1.243-1.243a1 1 0 00-1.414-1.414L9 10.586 7.757 9.243z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Grades</h3>
                    <p className="text-gray-600 text-sm">Check your academic progress</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-yellow-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
                    <p className="text-gray-600 text-sm">Communicate with instructors</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="text-indigo-600 mb-4">
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Resources</h3>
                    <p className="text-gray-600 text-sm">Access learning materials</p>
                  </div>
                </div>

                {/* User Information */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Student Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {userName}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Domain:</strong> {userDomain}</p>
                      <p><strong>Role:</strong> {isStudent ? 'Student ✓' : userRole || 'Not specified'}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>User ID:</strong> {user.id.substring(0, 8)}...</p>
                      <p><strong>Email Verified:</strong> {user.email_confirmed_at ? 'Yes ✓' : 'No'}</p>
                      <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</p>
                      <p><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
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
                    href="/dashboard/org"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Organization Dashboard
                  </Link>
                  <Link
                    href="/dashboard/admin"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">🎓 Student Portal</h4>
                  <p className="text-sm text-blue-800">
                    Access all your academic resources and track your progress in one place.
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