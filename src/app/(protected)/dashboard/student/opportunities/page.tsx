"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/app/lib/supabaseClient"

type OppRow = {
  id: number
  title: string
  description: string | null
  link: string | null
  phone: string | null
  location: string | null
  is_active: boolean
  created_at: string
  organizations?: {
    org_name: string
    org_email: string
  } | null
}

const PAGE_SIZE = 10

export default function StudentOpportunitiesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<OppRow[]>([])
  const [page, setPage] = useState(1)

  // filters
  const [q, setQ] = useState("")           // text search
  const [onlyWithLink, setOnlyWithLink] = useState(false)
  const [onlyWithPhone, setOnlyWithPhone] = useState(false)
  const [locationQ, setLocationQ] = useState("")

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1


  const fetchKey = useMemo(
    () => JSON.stringify({ page, q, onlyWithLink, onlyWithPhone, locationQ }),
    [page, q, onlyWithLink, onlyWithPhone, locationQ]
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      let query = supabase
        .from("opportunities")
        .select("id,title,description,link,phone,location,is_active,created_at,organizations(org_name,org_email)", { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (q.trim()) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      }
      if (locationQ.trim()) {
        query = query.ilike("location", `%${locationQ}%`)
      }
      if (onlyWithLink) {
        query = query.not("link", "is", null).neq("link", "")
      }
      if (onlyWithPhone) {
        query = query.not("phone", "is", null).neq("phone", "")
      }

      const { data, error } = await query
        if (error) {
        setError(error.message)
        setRows([])
        } else {
        const normalized = (data || []).map((r: any) => ({
            ...r,
            organizations: Array.isArray(r.organizations)
            ? (r.organizations[0] ?? null)
            : r.organizations ?? null,
        }))
        setRows(normalized as any) 
        }
      setLoading(false)
    }

    load()
  }, [fetchKey])

  const nextPage = () => setPage(p => p + 1)
  const prevPage = () => setPage(p => Math.max(1, p - 1))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold">Student · Opportunities</h1>
            <a href="/dashboard/student" className="text-indigo-600 hover:underline text-sm">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-6">
          {/* Filters */}
          <section className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Search</label>
                <input
                  value={q}
                  onChange={e => { setPage(1); setQ(e.target.value) }}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Title or description…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  value={locationQ}
                  onChange={e => { setPage(1); setLocationQ(e.target.value) }}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="e.g., Los Angeles, Remote"
                />
              </div>
              <div className="flex items-center gap-2 mt-6 md:mt-0">
                <input
                  id="onlyWithLink"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={onlyWithLink}
                  onChange={e => { setPage(1); setOnlyWithLink(e.target.checked) }}
                />
                <label htmlFor="onlyWithLink" className="text-sm">Has Link</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="onlyWithPhone"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={onlyWithPhone}
                  onChange={e => { setPage(1); setOnlyWithPhone(e.target.checked) }}
                />
                <label htmlFor="onlyWithPhone" className="text-sm">Has Phone</label>
              </div>
            </div>
          </section>

          {/* List */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Open Opportunities</h2>

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div>Loading…</div>
            ) : rows.length === 0 ? (
              <div className="text-gray-600">No results.</div>
            ) : (
              <ul className="space-y-4">
                {rows.map((opp) => (
                  <li key={opp.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{opp.title}</h3>
                        <div className="text-sm text-gray-600">
                          {opp.organizations?.org_name ? (
                            <span>{opp.organizations.org_name}</span>
                          ) : (
                            <span>Organization</span>
                          )}
                          {opp.location ? <span> · {opp.location}</span> : null}
                        </div>
                        {opp.description && (
                          <p className="mt-2 text-gray-800 whitespace-pre-wrap">{opp.description}</p>
                        )}
                        <div className="mt-2 text-sm flex flex-wrap gap-3">
                          {opp.link && (
                            <a
                              href={opp.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 underline"
                            >
                              Visit Link
                            </a>
                          )}
                          {opp.phone && <span className="text-gray-800">📞 {opp.phone}</span>}
                          {opp.organizations?.org_email && (
                            <a
                              href={`mailto:${opp.organizations.org_email}`}
                              className="text-indigo-600 underline"
                            >
                              Email Org
                            </a>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Posted {new Date(opp.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={prevPage}
                disabled={page === 1}
                className="border px-3 py-1 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">Page {page}</div>
              <button
                onClick={nextPage}
                className="border px-3 py-1 rounded"
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
