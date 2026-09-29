'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  login: (param1: string, param2?: string | User) => Promise<void> | void;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage and session
    const savedToken = localStorage.getItem('shlokveda_token');
    const savedUser = localStorage.getItem('shlokveda_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('shlokveda_token');
        localStorage.removeItem('shlokveda_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (param1: string, param2?: string | User) => {
    if (typeof param2 === 'object' && param2 !== null) {
      // Direct (token, user) call
      setToken(param1);
      setUser(param2 as User);
      localStorage.setItem('shlokveda_token', param1);
      localStorage.setItem('shlokveda_user', JSON.stringify(param2));
      return;
    }

    if (typeof param2 === 'string') {
      // (email, password) credentials call
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: param1, password: param2 }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Invalid email or password');
      }

      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('shlokveda_token', data.data.token);
      localStorage.setItem('shlokveda_user', JSON.stringify(data.data.user));
      return;
    }
  };

  const register = async (data: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Failed to create account');
    }

    setToken(resData.data.token);
    setUser(resData.data.user);
    localStorage.setItem('shlokveda_token', resData.data.token);
    localStorage.setItem('shlokveda_user', JSON.stringify(resData.data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shlokveda_token');
    localStorage.removeItem('shlokveda_user');
    // Clear cookie
    document.cookie = 'shlokveda_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated as User);
    localStorage.setItem('shlokveda_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loading: isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
