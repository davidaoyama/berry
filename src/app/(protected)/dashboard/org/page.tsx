"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabaseClient"

type Opp = {
  id: number
  title: string
  description: string | null
  link: string | null
  phone: string | null
  location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function OrgDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<any>(null)

  const [oppLoading, setOppLoading] = useState(true)
  const [opps, setOpps] = useState<Opp[]>([])
  const [form, setForm] = useState<Partial<Opp>>({
    title: "",
    description: "",
    link: "",
    phone: "",
    location: "",
    is_active: true,
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setLoading(false)

      const { data: orgRow, error: orgErr } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_user_id", session.user.id)
        .single()
      if (!orgErr && orgRow) setOrg(orgRow)

      setLoading(false)

    }
    
    checkUser()
  }, [router])

  useEffect(() => {
    const loadOpps = async () => {
      if (!org?.id) return
      setOppLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,description,link,phone,location,is_active,created_at,updated_at")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false })
      if (error) setError(error.message)
      setOpps(data || [])
      setOppLoading(false)
    }
    loadOpps()
  }, [org?.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth?mode=signin")
  }

  const resetForm = () => {
    setForm({ title: "", description: "", link: "", phone: "", location: "", is_active: true })
    setEditingId(null)
  }

  const refreshOpps = async () => {
    if (!org?.id) return
    const { data } = await supabase
      .from("opportunities")
      .select("id,title,description,link,phone,location,is_active,created_at,updated_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
    setOpps(data || [])
  }

  const createOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || form.title.trim().length === 0) {
      setError("Title is required")
      return
    }
    if (!org?.id) {
      setError("No organization found for this account.")
      return
    }

    setSaving(true)
    setError(null)
    if (editingId) {
      const { error } = await supabase
        .from("opportunities")
        .update({
          title: form.title,
          description: form.description ?? null,
          link: form.link ?? null,
          phone: form.phone ?? null,
          location: form.location ?? null,
          is_active: form.is_active ?? true,
        })
        .eq("id", editingId)
        .eq("org_id", org.id)
      if (error) setError(error.message)
    } else {
      const { error } = await supabase
        .from("opportunities")
        .insert([{
          org_id: org.id,
          title: form.title,
          description: form.description ?? null,
          link: form.link ?? null,
          phone: form.phone ?? null,
          location: form.location ?? null,
          is_active: form.is_active ?? true,
        }])
      if (error) setError(error.message)
    }
    setSaving(false)
    await refreshOpps()
    resetForm()
  }

  const onEdit = (opp: Opp) => {
    setEditingId(opp.id)
    setForm({
      title: opp.title,
      description: opp.description ?? "",
      link: opp.link ?? "",
      phone: opp.phone ?? "",
      location: opp.location ?? "",
      is_active: opp.is_active,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const onDelete = async (id: number) => {
    if (!confirm("Delete this opportunity?")) return
    const { error } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id)
    if (error) { setError(error.message); return }
    setOpps(prev => prev.filter(x => x.id !== id))
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
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Organization Dashboard
              </h2>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  User Information
                </h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {user.user_metadata?.first_name} {user.user_metadata?.last_name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> Organization Admin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Opportunities – inline CRUD */}
          {org ? (
            <section className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Opportunities</h3>

              {/* Form */}
              <form onSubmit={createOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.title || ""}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    value={form.location || ""}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2"
                    rows={4}
                    value={form.description || ""}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">External Link</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full border rounded-md px-3 py-2"
                    value={form.link || ""}
                    onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="+1 555-123-4567"
                    value={form.phone || ""}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="is_active"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">Active</label>
                </div>

                <div className="md:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                  >
                    {editingId ? (saving ? "Saving..." : "Update") : (saving ? "Creating..." : "Create")}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="border px-4 py-2 rounded-md"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {error && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 mb-4">
                  {error}
                </div>
              )}

              {/* List */}
              {oppLoading ? (
                <div>Loading opportunities…</div>
              ) : opps.length === 0 ? (
                <div className="text-gray-600">No opportunities yet. Create your first one above.</div>
              ) : (
                <ul className="space-y-4">
                  {opps.map(opp => (
                    <li key={opp.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold">{opp.title}</h4>
                          <div className="text-sm text-gray-600">
                            {opp.location && <span>{opp.location} · </span>}
                            <span>{opp.is_active ? "Active" : "Inactive"}</span>
                          </div>
                          {opp.description && (
                            <p className="mt-2 text-gray-800 whitespace-pre-wrap">{opp.description}</p>
                          )}
                          <div className="mt-2 text-sm">
                            {opp.link && (
                              <a href={opp.link} target="_blank" rel="noreferrer" className="text-indigo-600 underline mr-3">
                                Visit Link
                              </a>
                            )}
                            {opp.phone && <span className="text-gray-800">📞 {opp.phone}</span>}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Created {new Date(opp.created_at).toLocaleString()} · Updated {new Date(opp.updated_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEdit(opp)}
                            className="border px-3 py-1 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(opp.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              No organization found for your account. Please create one or contact support.
            </div>
          )}
      </main>
    </div>
  )
}