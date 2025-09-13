// Navigation component with user authentication state
// Provides consistent navigation across all pages

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui';
import { LogOut, User, BookOpen, PlusCircle, Shield } from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const navItems = [
    { href: '/resources', label: 'Resources', icon: BookOpen },
    { href: '/apply', label: 'Apply', icon: PlusCircle },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/resources" className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">BERRY</span>
            </Link>
            
            {user && (
              <div className="hidden sm:flex space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Email verification status */}
                {!user.emailVerified && (
                  <div className="hidden sm:block bg-yellow-50 border border-yellow-200 rounded-md px-3 py-1">
                    <p className="text-sm text-yellow-700">
                      Please verify your email
                    </p>
                  </div>
                )}
                
                {/* User info */}
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </p>
                  </div>
                  
                  <div className="bg-gray-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                
                {/* Logout button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  icon={LogOut}
                  className="hidden sm:inline-flex"
                >
                  Logout
                </Button>
                
                {/* Mobile logout */}
                <button
                  onClick={handleLogout}
                  className="sm:hidden p-2 text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        {user && (
          <div className="sm:hidden border-t py-2">
            <div className="flex space-x-4 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Extension points for future navigation features:
// - Breadcrumb navigation
// - Search functionality in the nav bar
// - Notifications dropdown
// - Quick actions menu
// - Theme switcher
// - Language selector
// - Help/support links