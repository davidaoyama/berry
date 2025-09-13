// Login page with email/password and Google authentication
// Restricted to @lausd.net email addresses with email verification

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);
  
  const { user, signIn, signUp, signInWithGoogle, sendVerificationEmail, error, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/resources');
    }
  }, [user, router]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!formData.email.endsWith('@lausd.net')) {
      errors.email = 'Only @lausd.net email addresses are allowed';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!formData.displayName) {
        errors.displayName = 'Name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    clearError();

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, formData.displayName);
        setShowEmailSent(true);
      } else {
        await signIn(formData.email, formData.password);
      }
    } catch {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    clearError();
    
    try {
      await signInWithGoogle();
    } catch {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    try {
      await sendVerificationEmail();
      setShowEmailSent(true);
    } catch {
      // Error is handled by the auth context
    }
  };

  if (showEmailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="bg-blue-600 text-white p-3 rounded-lg">
              <BookOpen className="h-8 w-8" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Check your email
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Verification email sent!
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                We sent a verification link to <strong>{formData.email}</strong>. 
                Please click the link in your email to verify your account.
              </p>
              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => setShowEmailSent(false)}
                  variant="outline"
                  className="w-full"
                >
                  Back to login
                </Button>
                <Button
                  onClick={handleSendVerificationEmail}
                  variant="outline"
                  className="w-full"
                >
                  Resend verification email
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 text-white p-3 rounded-lg">
            <BookOpen className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to BERRY'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          LAUSD Resource Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {isSignUp && (
              <Input
                label="Full Name"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                error={formErrors.displayName}
                placeholder="Enter your full name"
                required
              />
            )}

            <Input
              label="Email address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              placeholder="your.name@lausd.net"
              helperText="Only @lausd.net email addresses are allowed"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              placeholder="Enter your password"
              helperText={isSignUp ? "Minimum 6 characters" : undefined}
              required
            />

            {isSignUp && (
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={formErrors.confirmPassword}
                placeholder="Confirm your password"
                required
              />
            )}

            <Button
              type="submit"
              className="w-full"
              loading={isSubmitting}
              icon={isSignUp ? undefined : Lock}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              loading={isSubmitting}
              icon={Mail}
            >
              Google
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setFormErrors({});
                  clearError();
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </form>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            This system is restricted to LAUSD staff and educators.
            <br />
            By signing in, you agree to the terms of use and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}