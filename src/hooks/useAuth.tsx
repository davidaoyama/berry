// Authentication hook and context for Firebase Auth
// Provides user authentication state and actions throughout the app
// Includes email verification and LAUSD domain restriction

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, isValidLausdEmail } from '@/lib/firebase';
import { db } from '@/lib/database';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      
      // Validate LAUSD email domain
      if (!isValidLausdEmail(email)) {
        throw new Error('Only @lausd.net email addresses are allowed');
      }
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      
      // Validate LAUSD email domain
      if (!isValidLausdEmail(email)) {
        throw new Error('Only @lausd.net email addresses are allowed');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Create user profile in database
      await db.createUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName,
        isVerified: false,
        role: 'teacher', // Default role, can be changed by admin
      });
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      
      // Force account selection and restrict to LAUSD domain
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'lausd.net' // Restrict to LAUSD domain
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // Verify the email domain after Google sign-in
      if (!isValidLausdEmail(result.user.email || '')) {
        await signOut(auth);
        throw new Error('Only @lausd.net email addresses are allowed');
      }
      
      // Create or update user profile in database
      const existingUser = await db.getUser(result.user.uid);
      if (!existingUser) {
        await db.createUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          isVerified: result.user.emailVerified,
          role: 'teacher',
        });
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw err;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      setError(null);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email';
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get additional user data from our database
          const userData = await db.getUser(firebaseUser.uid);
          
          if (userData) {
            setUser({
              ...firebaseUser,
              ...userData,
            } as User);
          } else {
            // Create user profile if it doesn't exist
            const newUser = await db.createUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              isVerified: firebaseUser.emailVerified,
              role: 'teacher',
            });
            setUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    sendVerificationEmail,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Extension points for future authentication features:
// - Role-based access control (RBAC)
// - Multi-factor authentication (MFA)
// - Social login with other providers (Microsoft, etc.)
// - Single Sign-On (SSO) integration
// - Password reset functionality
// - Account suspension/deactivation
// - Audit logging for authentication events