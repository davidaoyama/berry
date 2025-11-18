"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/app/lib/supabaseClient"

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
  stem_innovation: "STEM & Innovation",
  arts_design: "Art & Design",
  humanities_social_sciences: "Humanities & Social Sciences",
  civic_engagement_leadership: "Civic Engagement & Leadership",
  health_sports_sustainability: "Health, Sports & Sustainability",
  business_entrepreneurship: "Business & Entrepreneurship",
  trades_technical: "Trade & Technical Careers",
}

const TYPE_LABELS: Record<string, string> = {
  program: "Program",
  summer_opportunity: "Summer Opportunity",
  internship: "Internship",
  mentorship: "Mentorship",
  volunteering: "Volunteering",
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
        router.push("/auth?mode=signin")
        return
      }

      const { data, error: fetchError } = await supabase
        .from("opportunities")
        .select("*")
        .eq("created_by", session.user.id)
        .order("created_at", { ascending: false })

      if (fetchError) throw new Error(fetchError.message)

      setOpportunities(data || [])
    } catch (err) {
      console.error("Error fetching opportunities:", err)
      setError(err instanceof Error ? err.message : "Failed to load opportunities")
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

      if (!session) throw new Error("You must be signed in")

      const response = await fetch(`/api/opportunities?id=${opportunityToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to delete opportunity")
      }

      await fetchMyOpportunities()
      setDeleteModalOpen(false)
      setOpportunityToDelete(null)
    } catch (err) {
      console.error("Error deleting opportunity:", err)
      setError(err instanceof Error ? err.message : "Failed to delete opportunity")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isDeadlinePassed = (deadline: string) =>
    new Date(deadline) < new Date()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "var(--berry-blue)" }}></div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-10 px-4 sm:px-6 lg:px-8"
      style={{ background: "#f3f4ff" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">
              Opportunities
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              My posted opportunities
            </h1>
            <p className="mt-2 text-sm text-gray-600 max-w-xl">
              View, update, or retire opportunities that your organization has shared with students.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard/org")}
              className="button ghost"
            >
              Back to org dashboard
            </button>
            <button
              onClick={() => router.push("/dashboard/org/post-opportunity")}
              className="button secondary"
            >
              Post new opportunity
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {opportunities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              No opportunities yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Post your first opportunity to start reaching students.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/dashboard/org/post-opportunity")}
                className="button secondary"
              >
                Post a new opportunity
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${
                  !opp.is_active
                    ? "opacity-60"
                    : isDeadlinePassed(opp.application_deadline)
                    ? "border-orange-200"
                    : "border-emerald-200"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Title + status */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {opp.opportunity_name}
                      </h2>
                      {!opp.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Deleted
                        </span>
                      ) : isDeadlinePassed(opp.application_deadline) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Deadline passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {CATEGORY_LABELS[opp.category]}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        {TYPE_LABELS[opp.opportunity_type]}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {opp.brief_description}
                    </p>

                    {/* Detail grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {opp.location_type === "in_person"
                            ? "In-person"
                            : opp.location_type === "online"
                            ? "Online"
                            : "Hybrid"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cost</p>
                        <p className="font-medium text-gray-900">
                          {opp.cost === 0 ? "Free" : `$${opp.cost}`}
                          {opp.has_stipend && (
                            <span className="ml-1 text-emerald-600">
                              (+ stipend)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Deadline</p>
                        <p
                          className={`font-medium ${
                            isDeadlinePassed(opp.application_deadline)
                              ? "text-orange-600"
                              : "text-gray-900"
                          }`}
                        >
                          {formatDate(opp.application_deadline)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Posted</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(opp.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {opp.is_active && (
                    <div className="flex flex-col gap-2 ml-2">
                      <button
                        onClick={() => window.open(opp.application_url, "_blank")}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View application link"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/org/my-opportunities/edit/${opp.id}`)
                        }
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Edit opportunity"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(opp.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete opportunity"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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

        {/* Delete modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete opportunity?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Students will no longer be able to see or apply to this opportunity. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false)
                      setOpportunityToDelete(null)
                    }}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:bg-gray-400"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
