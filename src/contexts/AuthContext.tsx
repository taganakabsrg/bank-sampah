import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firestoreService } from '../lib/firestoreService';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'nasabah';
  balance: number;
  isActive: boolean;
  address?: string;
  phone?: string;
  joinDate: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: FirebaseUser) => {
    let profile = await firestoreService.getDocument<UserProfile>('users', user.uid);
    const isAdminEmail = user.email === 'taganakabsrg@gmail.com';

    if (!profile) {
      // If profile doesn't exist, create one
      const newProfile: Omit<UserProfile, 'id'> = {
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: '',
        address: '',
        role: isAdminEmail ? 'admin' : 'nasabah', // Grant admin to specific email
        balance: 0,
        isActive: true,
        joinDate: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
      
      await firestoreService.createDocument('users', user.uid, newProfile);
      profile = await firestoreService.getDocument<UserProfile>('users', user.uid);
    } else if (isAdminEmail && profile.role !== 'admin') {
      // Auto-upgrade to admin if email matches but role is still nasabah
      await firestoreService.updateDocument('users', user.uid, { 
        role: 'admin',
        updatedAt: new Date()
      });
      profile.role = 'admin';
    }

    if (profile) {
      setUserProfile({ ...profile, id: user.uid });
    } else {
      setUserProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  const logout = async () => {
    await auth.signOut();
  };

  const loginWithGoogle = async () => {
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // Profile creation is now handled by the fetchProfile logic inside useEffect (onAuthStateChanged)
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, refreshProfile, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
