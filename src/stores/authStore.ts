import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user, mustChangePassword } = res.data;
        set({ token, user });
        localStorage.setItem('token', token);
        if (mustChangePassword) localStorage.setItem('mustChangePassword', 'true');
      },

      logout: async () => {
        // Fire logout audit log BEFORE clearing the token so the
        // authenticated request still has credentials attached.
        // If the server call fails (e.g. network down), we still
        // clear the session so the user is never stuck.
        try {
          if (get().token) {
            await api.post('/auth/logout');
          }
        } catch {
          // Non-blocking — always clear local session regardless
        } finally {
          set({ token: null, user: null });
          localStorage.removeItem('token');
          localStorage.removeItem('currentAttempt');
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('mustChangePassword');
        }
      },
    }),
    { name: 'auth-storage' }
  )
);