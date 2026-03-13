'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'STUDENT' | 'BANNED' | string;
  classGroupId?: string | null;
  edag?: number | null;
  plan: 'FREE' | 'PREMIUM';
  premiumUntil: string | null;   // ISO string or null (null = no expiry)
  institutionId: string | null;
  points: number;
  hasReceivedLeaderBonus: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  setEdag: (edag: number | null) => void;
  logout: () => void;
  isPremium: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      isPremium: () => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        if (user.plan !== 'PREMIUM') return false;
        if (user.premiumUntil === null) return true;
        return new Date(user.premiumUntil) > new Date();
      },

      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        set({ token, user, isAuthenticated: true });
      },

      setEdag: async (edag) => {
        const token = get().token;
        if (!token) return;
        try {
          const { fetchApi } = await import('@/lib/api');
          const updated = await fetchApi('/auth/edag', {
            method: 'PUT',
            body: JSON.stringify({ edag }),
          });
          set(state => ({ user: state.user ? { ...state.user, edag: updated.edag } : null }));
        } catch (err) {
          console.error('Failed to save EDAG', err);
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
