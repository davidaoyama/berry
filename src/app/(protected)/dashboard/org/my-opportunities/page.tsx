'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'

interface Opportunity {
  id: string
  opportunity_name: string
  category: string
  opportunity_type: string
  brief_description: string
  location_type: string
  location_address: string | null
  location_state: string | null
  cost: number
  has_stipend: boolean
  application_deadline: string
  application_url: string
  is_active: boolean
  created_at: string
  start_date: string | null
  end_date: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  stem_innovation: 'STEM & Innovation',
  arts_design: 'Art & Design',
  humanities_social_sciences: 'Humanities & Social Sciences',
  civic_engagement_leadership: 'Civic Engagement & Leadership',
  health_sports_sustainability: 'Health, Sports & Sustainability',
  business_entrepreneurship: 'Business & Entrepreneurship',
  trades_technical: 'Trade & Technical Careers'
}

const TYPE_LABELS: Record<string, string> = {
  program: 'Program',
  summer_opportunity: 'Summer Opportunity',
  internship: 'Internship',
  mentorship: 'Mentorship',
  volunteering: 'Volunteering'
}

export default function MyOpportunitiesPage() {
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [opportunityToDelete, setOpportunityToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMyOpportunities()
  }, [])

  const fetchMyOpportunities = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth?mode=signin')
        return
      }

      // Fetch opportunities created by this user
      const { data, error: fetchError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setOpportunities(data || [])
    } catch (err) {
      console.error('Error fetching opportunities:', err)
      setError(err instanceof Error ? err.message : 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (opportunityId: string) => {
    setOpportunityToDelete(opportunityId)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!opportunityToDelete) return

    try {
      setDeleting(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('You must be signed in')
      }

      const response = await fetch(`/api/opportunities?id=${opportunityToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to delete opportunity')
      }

      // Refresh the list
      await fetchMyOpportunities()

      // Close modal
      setDeleteModalOpen(false)
      setOpportunityToDelete(null)
    } catch (err) {
      console.error('Error deleting opportunity:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete opportunity')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Opportunities</h1>
            <p className="mt-2 text-gray-600">
              Manage all the opportunities you've posted
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/dashboard/org/post-opportunity')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Post New Opportunity
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Opportunities List */}
        {opportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by posting your first opportunity.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard/org/post-opportunity')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post New Opportunity
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  !opp.is_active
                    ? 'border-gray-400 opacity-60'
                    : isDeadlinePassed(opp.application_deadline)
                    ? 'border-orange-500'
                    : 'border-green-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Title and Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">{opp.opportunity_name}</h2>
                      {!opp.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Deleted
                        </span>
                      ) : isDeadlinePassed(opp.application_deadline) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Deadline Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Category and Type */}
                    <div className="flex gap-2 mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {CATEGORY_LABELS[opp.category]}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {TYPE_LABELS[opp.opportunity_type]}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">{opp.brief_description}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {opp.location_type === 'in_person' ? 'In-Person' : opp.location_type === 'online' ? 'Online' : 'Hybrid'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cost</p>
                        <p className="font-medium text-gray-900">
                          {opp.cost === 0 ? 'Free' : `$${opp.cost}`}
                          {opp.has_stipend && <span className="ml-1 text-green-600">(+Stipend)</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Application Deadline</p>
                        <p className={`font-medium ${isDeadlinePassed(opp.application_deadline) ? 'text-orange-600' : 'text-gray-900'}`}>
                          {formatDate(opp.application_deadline)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Posted</p>
                        <p className="font-medium text-gray-900">{formatDate(opp.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {opp.is_active && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => window.open(opp.application_url, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Application Link"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/org/my-opportunities/edit/${opp.id}`)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(opp.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Opportunity?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will remove the opportunity from the app. Students will no longer be able to see or apply to it. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false)
                    setOpportunityToDelete(null)
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}