import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-indigo-600">Berry</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A secure platform for students and organizations. Sign in with your authorized email to get started.
          </p>
          
          <div className="flex gap-6 justify-center items-center flex-col sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-indigo-600 text-white gap-2 hover:bg-indigo-700 font-medium text-sm sm:text-base h-12 px-8 sm:w-auto"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center bg-white text-gray-900 gap-2 hover:bg-gray-50 font-medium text-sm sm:text-base h-12 px-8 sm:w-auto"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Students</h3>
              <p className="text-gray-600 text-sm">Access student resources, join organizations, and manage your academic life.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-green-600 mb-4">
                <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Organizations</h3>
              <p className="text-gray-600 text-sm">Manage your organization, track members, and coordinate activities.</p>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            🔒 Secure access with authorized email authentication (@usc.edu, @lausd.net)
          </div>
        </div>
      </div>
    </div>
  );
}