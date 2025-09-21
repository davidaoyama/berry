'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Simple validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

// Mock functions for authentication
const mockCreateAccount = async (email: string, password: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Creating account for:', email);
};

const mockSignIn = async (email: string, password: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Signing in:', email);
};

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'student' | 'organization'>('student');
  
  // Student form states
  const [createAccountForm, setCreateAccountForm] = useState({
    email: '',
    password: '',
  });
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: '',
  });
  
  // Error and loading states
  const [createAccountErrors, setCreateAccountErrors] = useState<FormErrors>({});
  const [signInErrors, setSignInErrors] = useState<FormErrors>({});
  const [createAccountLoading, setCreateAccountLoading] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);

  const validateForm = (email: string, password: string): FormErrors => {
    const errors: FormErrors = {};
    
    if (!validateRequired(email)) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!validateRequired(password)) {
      errors.password = 'Password is required';
    }
    
    return errors;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(createAccountForm.email, createAccountForm.password);
    setCreateAccountErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setCreateAccountLoading(true);
      try {
        await mockCreateAccount(createAccountForm.email, createAccountForm.password);
        router.push('/dashboard/student');
      } catch (error) {
        console.error('Create account error:', error);
      } finally {
        setCreateAccountLoading(false);
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(signInForm.email, signInForm.password);
    setSignInErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setSignInLoading(true);
      try {
        await mockSignIn(signInForm.email, signInForm.password);
        router.push('/dashboard/student');
      } catch (error) {
        console.error('Sign in error:', error);
      } finally {
        setSignInLoading(false);
      }
    }
  };

  const handleOrgApply = () => {
    router.push('/org/apply');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Berry
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect with verified organizations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('student')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'student'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setActiveTab('organization')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'organization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Organization
            </button>
          </nav>
        </div>

        {/* Student Tab Content */}
        {activeTab === 'student' && (
          <div className="space-y-6">
            {/* Create Account Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Account</h3>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label htmlFor="create-email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="create-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      createAccountErrors.email ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Enter your email"
                    value={createAccountForm.email}
                    onChange={(e) => setCreateAccountForm({ ...createAccountForm, email: e.target.value })}
                  />
                  {createAccountErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{createAccountErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="create-password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="create-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      createAccountErrors.password ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Enter your password"
                    value={createAccountForm.password}
                    onChange={(e) => setCreateAccountForm({ ...createAccountForm, password: e.target.value })}
                  />
                  {createAccountErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{createAccountErrors.password}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={createAccountLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createAccountLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </div>

            {/* Sign In Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sign In</h3>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="signin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      signInErrors.email ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Enter your email"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                  />
                  {signInErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{signInErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="signin-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      signInErrors.password ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Enter your password"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                  />
                  {signInErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{signInErrors.password}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={signInLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signInLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Organization Tab Content */}
        {activeTab === 'organization' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Access</h3>
            <p className="text-gray-600 mb-6">
              We verify organizations first to ensure authenticity and protect our student community. 
              To get access to the platform, please apply for verification.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleOrgApply}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply as an Organization
              </button>
              
              <a
                href="#"
                className="block text-center text-sm text-blue-600 hover:text-blue-500"
              >
                Learn about verification
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}