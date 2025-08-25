'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  email: string;
  role: string;
  name: string;
  userId?: string;
  profileCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Client-side utility functions
function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.startsWith('token=')) {
        return trimmedCookie.substring(6); // Remove 'token=' prefix
      }
    }
  } catch (error) {
    console.error('Error parsing cookies:', error);
  }
  
  return null;
}

function clearTokenCookie(): void {
  if (typeof document === 'undefined') return;
  
  // Clear cookie with all possible attributes to ensure it's removed
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; max-age=0;';
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + '; max-age=0;';
}

async function logoutFromServer(): Promise<void> {
  try {
    await fetch('/api/auth/clear-token', { method: 'POST' });
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        setLoading(true);
        const token = getTokenFromCookie();
        console.log('Auth check - Token found:', !!token);
        
        if (token) {
          // Verify token with backend
          const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('Auth check - Token valid, user:', userData.user.email);
            setUser(userData.user);
            // Store user data in localStorage as backup
            localStorage.setItem('user', JSON.stringify(userData.user));
          } else {
            // Token is invalid, clear it
            console.log('Token verification failed, clearing invalid token');
            clearTokenCookie();
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          // No token in cookie, check localStorage as backup
          const storedUser = localStorage.getItem('user');
          console.log('Auth check - No token, stored user:', !!storedUser);
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              // Verify the stored user data is still valid
              const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${getTokenFromCookie() || ''}`
                }
              });
              
              if (response.ok) {
                setUser(userData);
              } else {
                // Stored user is invalid, clear it
                localStorage.removeItem('user');
                setUser(null);
              }
            } catch (error) {
              console.error('Error parsing stored user:', error);
              localStorage.removeItem('user');
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        clearTokenCookie();
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    // Store user data in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    await logoutFromServer();
    clearTokenCookie();
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
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
