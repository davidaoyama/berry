"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

export default function StudentProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [school, setSchool] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [gpa, setGpa] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/auth?mode=signin");
          return;
        }

        setUserId(session.user.id);
        setEmail(session.user.email ?? "");

        // fetch profile from your API (falls back to auth metadata)
        const res = await fetch(
          `/api/student-profile?userId=${encodeURIComponent(session.user.id)}`,
          { cache: "no-store" }
        );

        if (res.ok) {
          const json = await res.json();
          const profile = json.profile ?? {};

          setFirstName(profile.first_name ?? session.user.user_metadata?.first_name ?? "");
          setLastName(profile.last_name ?? session.user.user_metadata?.last_name ?? "");
          setDateOfBirth(profile.date_of_birth ?? "");
          setSchool(profile.school ?? "");
          setGradeLevel(profile.grade_level ?? "");
          setGpa(profile.gpa != null ? String(profile.gpa) : "");
        } else {
          // no profile or error -> prefill from auth metadata
          setFirstName(session.user.user_metadata?.first_name ?? "");
          setLastName(session.user.user_metadata?.last_name ?? "");
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase();

  const validGrades = ["K","1","2","3","4","5","6","7","8","9","10","11","12"];

  const handleSave = async () => {
    setError(null);
    setMsg(null);
    if (!userId) {
      setError("User not available");
      return;
    }
    // basic validation same as server
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      setError("Date of birth format should be YYYY-MM-DD");
      return;
    }
    if (!validGrades.includes(gradeLevel)) {
      setError("Select a valid grade level");
      return;
    }
    if (gpa !== "") {
      const g = parseFloat(gpa);
      if (isNaN(g) || g < 0 || g > 5.0) {
        setError("GPA must be a number between 0 and 5.0");
        return;
      }
    }

    setSaving(true);
    try {
      const body: any = {
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        school: school.trim(),
        gradeLevel,
        gpa: gpa === "" ? null : gpa,
      };

      const res = await fetch("/api/student-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message ?? "Failed to save profile");
      } else {
        setMsg("Profile saved");
        // update local fields from returned profile if provided
        if (json.profile) {
          const p = json.profile;
          setFirstName(p.first_name ?? firstName);
          setLastName(p.last_name ?? lastName);
          setDateOfBirth(p.date_of_birth ?? dateOfBirth);
          setSchool(p.school ?? school);
          setGradeLevel(p.grade_level ?? gradeLevel);
          setGpa(p.gpa != null ? String(p.gpa) : "");
        }
      }
    } catch (e) {
      console.error("Failed to save profile", e);
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
        {msg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">{msg}</div>}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Review and update your information</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-3 py-2 bg-white border rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-6 border-b">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xl">
                {initials.trim() || (email.charAt(0) || "").toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-medium text-gray-900">
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : email}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">{email}</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: form */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Personal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">First name</label>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Last name</label>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Date of birth</label>
                        <input
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          placeholder="YYYY-MM-DD"
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">School</label>
                        <input
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Academic</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Grade level</label>
                        <input
                          value={gradeLevel}
                          onChange={(e) => setGradeLevel(e.target.value)}
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">GPA (optional)</label>
                        <input
                          value={gpa}
                          onChange={(e) => setGpa(e.target.value)}
                          placeholder="e.g. 3.5"
                          className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Right column: summary */}
              <aside className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Profile summary</h4>
                <dl className="text-sm text-gray-600 space-y-2">
                  <div>
                    <dt className="font-medium text-gray-700">Name</dt>
                    <dd>{(firstName || lastName) ? `${firstName} ${lastName}`.trim() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Email</dt>
                    <dd>{email || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">DOB</dt>
                    <dd>{dateOfBirth || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">School</dt>
                    <dd>{school || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Grade</dt>
                    <dd>{gradeLevel || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">GPA</dt>
                    <dd>{gpa || "—"}</dd>
                  </div>
                </dl>
              </aside>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-white border rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 text-white rounded text-sm ${saving ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}