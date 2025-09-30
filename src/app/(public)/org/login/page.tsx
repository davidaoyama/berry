"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";

export default function OrgLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const role = session.user.user_metadata?.role;
        if (role === "org") {
          router.push("/dashboard/org");
        } else {
          // If they're logged in but not as an org, sign them out
          await supabase.auth.signOut();
        }
      }
    };
    checkSession();
  }, [router]);

  const handleOrgSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!email) {
        throw new Error("Please enter your email address");
      }

      // Only allow organization emails (optional validation)
      if (!email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          shouldCreateUser: false, // Don't create new users here - orgs must register first
        },
      });

      if (signInError) throw signInError;

      // Show confirmation
      setEmailSent(true);
    } catch (err: any) {
      console.error("Organization sign-in error:", err);
      setError(err.message || "Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Organization Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your organization dashboard
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            Only registered organizations can access this portal
          </p>
        </div>

        {emailSent ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Check your email
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                We've sent a login link to <strong>{email}</strong>
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-sm text-green-600 hover:text-green-500"
                >
                  Use a different email
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleOrgSignIn} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Organization Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="your@organization.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending link...
                    </span>
                  ) : (
                    "Send Magic Link"
                  )}
                </button>
              </div>
            </form>

            <div className="text-center space-y-2">
              <div className="text-sm text-gray-600">
                Don't have an organization account?{" "}
                <Link
                  href="/org"
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  Register your organization
                </Link>
              </div>
              <div className="text-sm text-gray-600">
                Are you a student?{" "}
                <Link
                  href="/auth"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Student sign in
                </Link>
              </div>
              <div className="text-sm text-gray-600">
                <Link
                  href="/"
                  className="font-medium text-gray-600 hover:text-gray-500"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-green-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Organization Access
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  This portal is for registered organizations only. If your
                  organization isn't registered yet, please complete the
                  registration process first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
