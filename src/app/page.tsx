// Home page - redirects to appropriate page based on auth status
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui';
import { BookOpen } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/resources');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-600 text-white p-4 rounded-lg inline-block mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">BERRY</h1>
          <p className="text-gray-600 mb-6">LAUSD Resource Management System</p>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return null;
}
