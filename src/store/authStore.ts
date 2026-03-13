import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  classGroupId?: string;
  edag?: number | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  setEdag: (edag: number | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
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
