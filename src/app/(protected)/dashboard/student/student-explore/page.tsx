"use client";

import { useEffect, useState, useRef } from "react";

type Opportunity = {
  id: string;
  opportunity_name: string | null;
  brief_description: string | null;
  category: string | null;
  opportunity_type: string | null;
  application_deadline: string | null;
  org_name: string | null;

  // detailed fields (optional, fetched on demand)
  min_age?: number | null;
  max_age?: number | null;
  min_gpa?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  requirements_other?: string | null;
  grade_levels?: string[] | null;
  location_type?: string | null;
  application_url?: string | null;
  has_stipend?: boolean | null;
  contact_info?: any | null;
};

export default function StudentExplorePage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [hasMore, setHasMore] = useState(true);

  // search + categories
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const searchTimeout = useRef<number | null>(null);

  // selected opportunity details
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailAbortRef = useRef<AbortController | null>(null);

  // Format raw category keys into user-friendly labels:
  // - Replace underscores/hyphens with spaces
  // - Title-case each word
  const formatCategory = (raw: string | null | undefined) => {
    if (!raw) return "";
    const parts = String(raw)
      .replace(/[_-]+/g, " ")
      .trim()
      .split(/\s+/);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  };

  // normalize boolean-like values (TRUE/FALSE, "true"/"false", 1/0)
  const toBool = (v: any): boolean | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    const s = String(v).trim().toLowerCase();
    if (["true", "t", "1", "yes", "y"].includes(s)) return true;
    if (["false", "f", "0", "no", "n"].includes(s)) return false;
    return null;
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(
        "/api/opportunities/categories",
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const json = await res.json();
      setCategories(json.categories ?? []);
    } catch (e) {
      // ignore
    }
  };

  const load = async (
    p = 1,
    currentSearch = search,
    currentCategory = category
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("pageSize", String(pageSize));
      if (currentSearch.trim()) params.set("search", currentSearch.trim());
      if (currentCategory) params.set("category", currentCategory);

      const res = await fetch(
        `/api/opportunities/student-explore?${params.toString()}`,
        {
          cache: "no-store",
        }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message ?? `Request failed: ${res.status}`);
      }
      const json = await res.json();
      setItems(json.data ?? []);
      setPage(json.page ?? p);
      setHasMore((json.data?.length ?? 0) >= pageSize);
    } catch (err: any) {
      console.error("Error loading explore:", err);
      setError(err.message || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce search + auto reload
  useEffect(() => {
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      load(1, search, category);
    }, 350);
    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const goto = (p: number) => {
    if (p < 1) return;
    load(p);
  };

  // open modal immediately with existing data, then fetch details and merge
  const openModal = async (o: Opportunity) => {
    // cancel any previous detail fetch
    if (detailAbortRef.current) {
      detailAbortRef.current.abort();
      detailAbortRef.current = null;
    }

    setSelected(o);
    setDetailLoading(true);

    const ac = new AbortController();
    detailAbortRef.current = ac;

    try {
      const res = await fetch(`/api/opportunities/opportunity-card?id=${encodeURIComponent(o.id)}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      if (!res.ok) {
        setDetailLoading(false);
        return;
      }
      const json = await res.json();
      const details = json.data ?? null;
      if (details) {
        setSelected((prev) => {
          const stipend = toBool(details.has_stipend ?? (prev as any)?.has_stipend ?? o.has_stipend);
          return {
            ...(prev ?? o),
            ...details,
            has_stipend: stipend,
          };
        });
      }
    } catch (e) {
      if ((e as any)?.name !== "AbortError") console.error("Failed to load opportunity details", e);
    } finally {
      detailAbortRef.current = null;
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    // cancel pending fetch
    if (detailAbortRef.current) {
      detailAbortRef.current.abort();
      detailAbortRef.current = null;
    }
    setSelected(null);
  };

  // handle Escape and body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (selected) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Explore Opportunities
          </h2>
          <div className="text-sm text-gray-500">
            {loading ? "Loading..." : `${items.length} shown`}
          </div>
        </div>

        {/* Search + Category filters */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <input
            type="search"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:flex-1 px-3 py-2 border rounded-md bg-white"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-3 sm:mt-0 w-full sm:w-64 px-3 py-2 border rounded-md bg-white"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {formatCategory(c)}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearch("");
              setCategory("");
              load(1, "", "");
            }}
            className="mt-3 sm:mt-0 ml-auto inline-flex items-center px-3 py-2 bg-gray-100 rounded-md"
          >
            Reset
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading && !items.length ? (
          <div className="py-8 text-center">Loading opportunities…</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-gray-600 bg-white/50 p-6 rounded">
            No opportunities found.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((o) => (
              <article
                key={o.id}
                className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-gray-900">
                      {o.opportunity_name}
                    </h3>
                    {o.org_name && (
                      <div className="text-sm text-gray-600 mt-1">
                        {o.org_name}
                      </div>
                    )}
                    {o.brief_description && (
                      <p className="mt-3 text-sm text-gray-700">
                        {o.brief_description}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-50 rounded">
                        {o.category ? formatCategory(o.category) : "—"}
                      </span>
                      <span className="px-2 py-1 bg-gray-50 rounded">
                        {o.opportunity_type ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full lg:w-48 flex-shrink-0 flex flex-col items-start lg:items-end">
                    {o.application_deadline && (
                      <div className="text-xs text-gray-400">Deadline</div>
                    )}
                    {o.application_deadline && (
                      <div className="mt-1 text-sm font-medium text-gray-700">
                        {new Date(o.application_deadline).toLocaleDateString()}
                      </div>
                    )}
                    <button
                      onClick={() => openModal(o)}
                      className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center space-x-3 mt-6">
          <button
            onClick={() => goto(page - 1)}
            disabled={loading || page === 1}
            className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => goto(page + 1)}
            disabled={loading || !hasMore}
            className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{selected.opportunity_name}</h3>
                {selected.org_name && <div className="text-sm text-gray-600 mt-1">{selected.org_name}</div>}
              </div>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              {selected.brief_description ?? "No description provided."}
            </div>

            {detailLoading && <div className="mt-3 text-sm text-gray-500">Loading additional details…</div>}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
              { (selected.min_age || selected.max_age) && (
                <div>Age: {selected.min_age ?? '—'} — {selected.max_age ?? '—'}</div>
              )}
              { selected.grade_levels && Array.isArray(selected.grade_levels) && (
                <div>Grades: {selected.grade_levels.join(", ")}</div>
              )}
              { selected.location_type && <div>Location: {selected.location_type}</div> }
              { selected.contact_info && (
                <div>Contact: {typeof selected.contact_info === "string" ? selected.contact_info : JSON.stringify(selected.contact_info)}</div>
              )}
              { selected.min_gpa != null && (
                <div>Min GPA: {Number(selected.min_gpa).toFixed(2).replace(/\.00$/, "")}</div>
              )}
               { (selected.start_date || selected.end_date) && (
                <div>
                  {selected.start_date && <div>Starts: {new Date(selected.start_date).toLocaleDateString()}</div>}
                  {selected.end_date && <div>Ends: {new Date(selected.end_date).toLocaleDateString()}</div>}
                </div>
                )}
                { selected.has_stipend != null && (
                <div>Stipend: {selected.has_stipend ? "Yes" : "No"}</div>
                )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <a
                href={selected.application_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
              >
                Apply
              </a>
              <button
                onClick={closeModal}
                className="inline-block bg-white border border-gray-200 px-4 py-2 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}