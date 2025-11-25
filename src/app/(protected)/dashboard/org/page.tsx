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

interface OpportunityRow {
  id: string
  opportunity_name: string
  created_at: string
  start_date: string | null
  end_date: string | null
  location_type: string
  application_deadline: string | null
  is_active: boolean
}

export default function OrgDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([])

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth?mode=signin")
        return
      }

      const userRole = session.user.user_metadata?.role
      if (userRole !== "org") {
        router.push(userRole === "student" ? "/dashboard/student" : "/dashboard")
        return
      }

      setUser(session.user)

      const { data: orgData, error } = await supabase
        .from("organizations")
        .select(
          "id, org_name, org_type, org_email, contact_name, contact_role, contact_email, verification_status, approved, created_at"
        )
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (!error && orgData) {
        setOrganization(orgData)
      }

      const { data: oppData, error: oppError } = await supabase
        .from("opportunities")
        .select(
          "id, opportunity_name, created_at, start_date, end_date, location_type, application_deadline, is_active"
        )
        .eq("created_by", session.user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (!oppError && oppData) {
        setOpportunities(oppData)
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
      <div className="min-h-screen flex items-center justify-center bg-[#004aad]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    )
  }

  if (!user) return null

  const formatDate = (value: string | null) => {
    if (!value) return "—"
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-[#004aad] text-white font-[Marble]">
      {/* Top bar – BERRY + Sign Out */}
      <nav>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="text-3xl font-[Atelia] tracking-wide text-[#f77fbe] select-none">
              BERRY
            </span>

            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full border border-white/60 text-sm font-[Marble] hover:bg-white hover:text-[#004aad] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl mb-6 text-center">
          Welcome back,{" "}
          <span className="text-[#f77fbe]">
            {organization?.org_name || "Organization"}
          </span>
          !
        </h2>

        {/* Quick actions – same logic, new colors */}
        <section className="mb-10 rounded-2xl bg-white/10 border-2 border-white/40 shadow-lg px-6 py-5 backdrop-blur">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Post new opportunity */}
            <button
              disabled={!organization?.approved}
              onClick={() => router.push("/dashboard/org/post-opportunity")}
              className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#004aad] border border-white/30 hover:bg-[#00327a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                className="h-8 w-8 text-[#f77fbe] mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm font-[Marble]">Post New Opportunity</span>
              {!organization?.approved && (
                <span className="mt-1 text-xs text-blue-100">
                  Approval required
                </span>
              )}
            </button>

            {/* View opportunities */}
            <button
              disabled={!organization?.approved}
              onClick={() => router.push("/dashboard/org/my-opportunities")}
              className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#004aad] border border-white/30 hover:bg-[#00327a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                className="h-8 w-8 text-[#52b2bf] mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-[Marble]">
                View My Opportunities
              </span>
              {!organization?.approved && (
                <span className="mt-1 text-xs text-blue-100">
                  Approval required
                </span>
              )}
            </button>

            {/* Account settings */}
            <button
              onClick={() => router.push("/dashboard/org/account-settings")}
              className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#004aad] border border-white/30 hover:bg-[#00327a] transition-colors"
            >
              <svg
                className="h-8 w-8 text-purple-300 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm font-[Marble]">Account Settings</span>
            </button>
          </div>
        </section>

        {/* Active Opportunities grid – styled like the mockup */}
        <section className="rounded-2xl border-2 border-white/40 bg-[#004aad] shadow-2xl overflow-hidden">
          <header className="flex items-center justify-between px-6 pt-6 pb-4">
            <h3 className="text-2xl font-[Marble]">Active Opportunities</h3>
            <button
              onClick={() =>
                organization?.approved &&
                router.push("/dashboard/org/post-opportunity")
              }
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f77fbe] text-[#004aad] text-2xl leading-none font-[Marble] hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!organization?.approved}
              aria-label="Add opportunity"
            >
              +
            </button>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm font-[Marble] border-t border-white/30">
              <thead className="text-white">
                <tr>
                  {[
                    "Name",
                    "Posted",
                    "Active Dates",
                    "Location",
                    "Favorited",
                    "Followed Link",
                    "Deadline",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-3 border-r border-white/20 last:border-r-0 font-normal tracking-wide"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-blue-50">
                {opportunities.length === 0 ? (
                  <tr className="h-14 border-t border-white/15 last:border-b border-white/20">
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-white/80"
                    >
                      No active opportunities yet.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp) => (
                    <tr
                      key={opp.id}
                      className="h-14 border-t border-white/15 last:border-b border-white/20"
                    >
                      <td className="px-6 border-r border-white/10">
                        {opp.opportunity_name || "—"}
                      </td>
                      <td className="px-6 border-r border-white/10">
                        {formatDate(opp.created_at)}
                      </td>
                      <td className="px-6 border-r border-white/10">
                        {opp.start_date || opp.end_date
                          ? `${formatDate(opp.start_date)} - ${formatDate(opp.end_date)}`
                          : "—"}
                      </td>
                      <td className="px-6 border-r border-white/10">
                        {opp.location_type
                          ? opp.location_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
                          : "—"}
                      </td>
                      <td className="px-6 border-r border-white/10 text-center">
                        —
                      </td>
                      <td className="px-6 border-r border-white/10 text-center">
                        —
                      </td>
                      <td className="px-6">
                        {formatDate(opp.application_deadline)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
