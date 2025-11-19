import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="h-screen bg-[#707070] from-blue-50 to-indigo-100 overflow-hidden">
      <div className="flex items-center justify-center h-full px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Animated logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* soft glowing blob behind logo */}
              <div className="absolute -inset-4 rounded-full bg-pink-300/60 blur-2xl opacity-70 animate-pulse" />
              
              <Image
                src="/logos/berry-letter.png"
                alt="Berry logo"
                width={130}
                height={90}
                className="
                  relative z-10 berry-float 
                  drop-shadow-xl 
                  transition-transform duration-300
                  hover:scale-110 hover:-rotate-3
                "
              />
            </div>
          </div>

          <h1 className="text-6xl font-[Marble] text-black mb-6">
            Welcome to <span className="text-[#52b2bf]">Berry</span>
          </h1>
          <p className="text-xl font-[Marble] text-black mb-8 max-w-2xl mx-auto">
            A secure platform for students and organizations. Sign in with your authorized email to get started.
          </p>
          
          <div className="flex gap-4 justify-center items-center flex-col sm:flex-row">
            <Link
              href="/auth?mode=signup"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#52b2bf] text-white gap-2 hover:bg-[#3f8e98] font-[Marble] text-sm sm:text-base h-12 px-8 sm:w-auto"
            >
              Student Sign Up
            </Link>
            <Link
              href="/auth?mode=signin"
              className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center bg-white text-gray-900 gap-2 hover:bg-gray-50 font-[Marble] text-sm sm:text-base h-12 px-8 sm:w-auto"
            >
              Student Sign In
            </Link>
            <Link
              href="/org/login"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#f77fbe] text-white gap-2 hover:bg-[#d16ba1] font-[Marble] text-sm sm:text-base h-12 px-8 sm:w-auto"
            >
              Organization Sign In
            </Link>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-[#52b2bf] p-6 rounded-lg shadow-md">
              <div className="text-white mb-4">
                <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-[Marble] text-white mb-2">For Students</h3>
              <p className="text-white text-sm">Access student resources, join organizations, and manage your academic life.</p>
            </div>

            <div className="bg-[#f77fbe] p-6 rounded-lg shadow-md">
              <div className="text-white mb-4">
                <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-[Marble] text-white mb-2">For Organizations</h3>
              <p className="text-white text-sm mb-4">Manage your organization, track members, and coordinate activities.</p>
              <div className="space-y-2">
                <Link
                  href="/org/login"
                  className="inline-flex items-center text-sm font-[Marble] text-white hover:text-black"
                >
                  Organization Sign In
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <br />
                <Link
                  href="/org"
                  className="inline-flex items-center text-sm font-medium text-white hover:text-black"
                >
                  Register Your Organization
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 text-sm font-[Marble] text-black">
            🔒 Secure access with authorized email authentication (@usc.edu, @lausd.net)
          </div>
        </div>
      </div>
    </div>
  );
}