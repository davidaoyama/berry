"use client";

import { useEffect, useState, useRef } from "react";
import { FaStar, FaBars, FaFilter, FaSearch } from "react-icons/fa";
import useFavorites from "../../../../../lib/useFavorites";
import Image from "next/image";


type Opportunity = {
  id: string;
  opportunity_name: string | null;
  brief_description: string | null;
  category: string | null;
  opportunity_type: string | null;
  application_deadline: string | null;
  org_name: string | null;
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

const BERRY_CATEGORIES = [
  "STEM & Innovation",
  "Arts & Design",
  "Civic Engagement & Leadership",
  "Trades & Technical Careers",
  "Business & Entrepreneurship",
  "Health, Wellness & Environment",
  "Humanities & Social Sciences",
];

export default function StudentExplorePage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const searchTimeout = useRef<number | null>(null);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailAbortRef = useRef<AbortController | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favoritesFirst, setFavoritesFirst] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Get current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });

  const formatCategory = (raw: string | null | undefined) => {
    if (!raw) return "";
    const parts = String(raw).replace(/[_-]+/g, " ").trim().split(/\s+/);
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
  };

  const toBool = (v: any): boolean | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    const s = String(v).trim().toLowerCase();
    if (["true", "t", "1", "yes", "y"].includes(s)) return true;
    if (["false", "f", "0", "no", "n"].includes(s)) return false;
    return null;
  };

  const load = async (p = 1, currentSearch = search, currentCategory = selectedCategory) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("pageSize", String(pageSize));
      if (currentSearch.trim()) params.set("search", currentSearch.trim());
      if (currentCategory) params.set("category", currentCategory);

      const res = await fetch(`/api/opportunities/student-explore?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message ?? `Request failed: ${res.status}`);
      }
      const json = await res.json();
      setItems(json.data ?? []);
      setPage(json.page ?? p);
      setHasMore((json.data?.length ?? 0) >= pageSize);
    } catch (err: any) {
      setError(err.message || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      load(1, search, selectedCategory);
    }, 350);
    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  }, [search, selectedCategory]);

  const goto = (p: number) => {
    if (p < 1) return;
    load(p);
  };

  const openModal = async (o: Opportunity) => {
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
    } finally {
      detailAbortRef.current = null;
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    if (detailAbortRef.current) {
      detailAbortRef.current.abort();
      detailAbortRef.current = null;
    }
    setSelected(null);
  };

  // compute displayed items (only-favorites overrides favorites-first)
  let displayedItems = items;
  if (onlyFavorites) {
    displayedItems = items.filter((it) => isFavorite(it.id));
  } else if (favoritesFirst) {
    displayedItems = [...items].sort((a, b) => (isFavorite(b.id) ? 1 : 0) - (isFavorite(a.id) ? 1 : 0));
  }

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
    <div className="min-h-screen bg-berryBlue">
      {/* Custom Navigation Bar */}
      <nav className="bg-berryBlue shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-24 py-6">
            {/* Center: Search Bar */}
            <div className="w-full max-w-4xl">
              <div className="relative">
                <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="search"
                  placeholder="Search by categories, interests, or company name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 text-lg rounded-full bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-berryPink shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content: Two-Column Layout */}
      <div className="py-8 px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Half: Categories */}
          <aside className="bg-berryBlue/30 p-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-10 text-center">Search by Category</h2>
              <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                {BERRY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                    className={`text-center px-8 py-6 rounded-2xl font-bold text-base transition-all text-xl ${
                      selectedCategory === cat
                        ? "bg-berryTeal text-white shadow-lg scale-105"
                        : "bg-berryTeal text-white hover:bg-berryBlue/80 hover:shadow-lg hover:scale-105"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory("")}
                    className="col-span-2 text-center px-8 py-6 rounded-2xl font-bold text-base bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all hover:scale-105"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Right Half: Visuals/Cards */}
          <main className="p-8 bg-berryBlue">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-white">Visuals</h2>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-semibold">
                    ⭐ {favorites.size}
                  </div>
                  <label className="inline-flex items-center text-sm text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={favoritesFirst}
                      onChange={(e) => setFavoritesFirst(e.target.checked)}
                      className="mr-2"
                    />
                    Favorites first
                  </label>
                  <label className="inline-flex items-center text-sm text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyFavorites}
                      onChange={(e) => setOnlyFavorites(e.target.checked)}
                      className="mr-2"
                    />
                    Only favorites
                  </label>
                </div>
              </div>
              <p className="text-sm text-white/80 text-center">
                {loading ? "Loading..." : `${displayedItems.length} opportunities shown`}
              </p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}

            {loading && !items.length ? (
              <div className="py-12 text-center text-white/70 text-lg">Loading opportunities…</div>
            ) : onlyFavorites && displayedItems.length === 0 ? (
              <div className="py-12 text-center text-white bg-berryTeal/50 p-8 rounded-2xl border-2 border-white/20">
                No favorites yet — star an opportunity to save it.
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-white bg-berryTeal/50 p-8 rounded-2xl border-2 border-white/20">
                No opportunities found. Try adjusting your search or category filter.
              </div>
            ) : (
              <>
                {/* Grid of Opportunity Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayedItems.map((o) => (
                    <article
                      key={o.id}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
                      onClick={() => openModal(o)}
                    >
                      {/* Image Placeholder */}
                      <div className="h-56 bg-gradient-to-br from-berryBlue/30 via-berryTeal/20 to-berryPink/30 flex items-center justify-center p-6">
                        <div className="text-center">
                          <h3 className="font-bold text-xl text-gray-800 line-clamp-3">
                            {o.opportunity_name}
                          </h3>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-2">{o.org_name}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{o.brief_description}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs px-3 py-1.5 bg-berryBlue text-white rounded-full font-semibold">
                            {o.category ? formatCategory(o.category) : "General"}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(o.id);
                            }}
                            aria-label="Toggle Favorite"
                            className="hover:scale-125 transition-transform"
                          >
                            <FaStar
                              className={`text-xl ${
                                isFavorite(o.id) ? "fill-current text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          </button>
                        </div>

                        {o.application_deadline && (
                          <div className="mt-4 text-xs text-gray-600 font-medium">
                            Deadline: {new Date(o.application_deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center space-x-4 mt-8">
                  <button
                    onClick={() => goto(page - 1)}
                    disabled={loading || page === 1}
                    className="px-4 py-2 bg-berryBlue text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-700 font-medium">Page {page}</span>
                  <button
                    onClick={() => goto(page + 1)}
                    disabled={loading || !hasMore}
                    className="px-4 py-2 bg-berryBlue text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modal for Opportunity Details */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selected.opportunity_name}</h3>
                {selected.org_name && <div className="text-sm text-gray-600 mt-1">{selected.org_name}</div>}
              </div>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700 leading-relaxed">
              {selected.brief_description ?? "No description provided."}
            </div>

            {detailLoading && <div className="mt-3 text-sm text-gray-500">Loading additional details…</div>}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              {(selected.min_age || selected.max_age) && (
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Age Range:</strong> {selected.min_age ?? "—"} — {selected.max_age ?? "—"}
                </div>
              )}
              {selected.grade_levels && Array.isArray(selected.grade_levels) && (
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Grades:</strong> {selected.grade_levels.join(", ")}
                </div>
              )}
              {selected.location_type && (
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Location:</strong> {selected.location_type}
                </div>
              )}
              {selected.min_gpa != null && (
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Min GPA:</strong> {Number(selected.min_gpa).toFixed(2).replace(/\.00$/, "")}
                </div>
              )}
              {(selected.start_date || selected.end_date) && (
                <div className="bg-white-50 p-3 rounded-lg">
                  {selected.start_date && <div><strong>Starts:</strong> {new Date(selected.start_date).toLocaleDateString()}</div>}
                  {selected.end_date && <div><strong>Ends:</strong> {new Date(selected.end_date).toLocaleDateString()}</div>}
                </div>
              )}
              {selected.has_stipend != null && (
                <div className="bg-white-50 p-3 rounded-lg">
                  <strong className="text-gray-800">Stipend:</strong> {selected.has_stipend ? "Yes" : "No"}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-white-200 text-gray-700 rounded-lg hover:bg-white-300 transition-colors"
              >
                Close
              </button>
              <a
                href={selected.application_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2 bg-berryPink text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
              >
                Apply Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
