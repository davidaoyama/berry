"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabaseClient"

interface Organization {
  id: number
  org_name: string
  org_type: string
  org_email: string
  contact_name: string
  contact_role: string
  contact_email: string
  verification_status: string
  approved: boolean
  created_at: string
}

export default function OrgDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth?mode=signin")
        return
      }

      // Verify user has the correct role
      const userRole = session.user.user_metadata?.role
      if (userRole !== 'org') {
        // If not an org, redirect to appropriate dashboard
        router.push(userRole === 'student' ? '/dashboard/student' : '/dashboard')
        return
      }

      setUser(session.user)

      // Fetch organization data from database
      console.log('Fetching org for user_id:', session.user.id)
      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('id, org_name, org_type, org_email, contact_name, contact_role, contact_email, verification_status, approved, created_at')
        .eq('user_id', session.user.id)
        .maybeSingle()

      console.log('Organization data:', orgData)
      console.log('Error:', error)

      if (error) {
        console.error('Error fetching organization:', error)
      } else if (orgData) {
        setOrganization(orgData)
      } else {
        console.warn('No organization found for this user_id')
      }

      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

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
                Welcome, {user.user_metadata?.first_name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Banner */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {organization?.org_name || 'Organization'}!
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your opportunities and connect with LAUSD students
            </p>
          </div>

          {/* Organization Info Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              Organization Information
            </h3>
            {organization ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Organization Name</p>
                  <p className="text-base font-medium text-gray-900">{organization.org_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Organization Type</p>
                  <p className="text-base font-medium text-gray-900 capitalize">{organization.org_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="text-base font-medium text-gray-900">{organization.contact_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="text-base font-medium text-gray-900">{organization.contact_role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base font-medium text-gray-900">{organization.contact_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center gap-2">
                    {organization.approved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Approved
                      </span>
                    ) : organization.verification_status === 'email_verified' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Awaiting Approval
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending Email Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading organization information...</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                disabled={!organization?.approved}
                className="flex flex-col items-center justify-center p-6 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-8 w-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium text-indigo-900">Post New Opportunity</span>
                {!organization?.approved && (
                  <span className="text-xs text-gray-500 mt-1">Approval required</span>
                )}
              </button>

              <button
                disabled={!organization?.approved}
                className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-8 w-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-green-900">View My Opportunities</span>
                {!organization?.approved && (
                  <span className="text-xs text-gray-500 mt-1">Approval required</span>
                )}
              </button>

              <button className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <svg className="h-8 w-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-purple-900">Account Settings</span>
              </button>
            </div>
          </div>

          {/* Coming Soon Notice */}
          {organization?.approved && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Opportunity Posting Coming Soon!
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Your organization is approved! The opportunity posting feature is currently under development and will be available soon.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}