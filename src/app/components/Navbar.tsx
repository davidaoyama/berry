'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              Berry
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            
            <Link
              href="/login"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/login')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Login
            </Link>
            
            <Link
              href="/org/apply"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/org/apply')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Org Apply
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile menu - simplified for now */}
      <div className="sm:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
            }`}
          >
            Home
          </Link>
          
          <Link
            href="/login"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/login')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
            }`}
          >
            Login
          </Link>
          
          <Link
            href="/org/apply"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/org/apply')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
            }`}
          >
            Org Apply
          </Link>
        </div>
      </div>
    </nav>
  );
}