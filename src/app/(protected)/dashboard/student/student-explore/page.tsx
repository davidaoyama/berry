"use client";

import { useEffect, useState } from "react";

type Opportunity = {
  id: string;
  opportunity_name: string;
  brief_description: string | null;
  category: string | null;
  opportunity_type: string | null;
  application_deadline: string | null;
  org_name: string | null;
};

export default function StudentExplorePage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [hasMore, setHasMore] = useState(true);

  const load = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/opportunities/student-explore?page=${p}&pageSize=${pageSize}`,
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
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goto = (p: number) => {
    if (p < 1) return;
    load(p);
  };

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
                        {o.category ?? "—"}
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
                    <a
                      href={`/opportunities/${o.id}`}
                      className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                    >
                      View
                    </a>
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
    </div>
  );
}