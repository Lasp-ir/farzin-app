import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userTier: 'FREE' | 'GOLD' | 'DIAMOND';
  isAuthenticated: boolean;
  isPaywallOpen: boolean; // وضعیت باز یا بسته بودن پاپ‌آپ
  setAuth: (token: string, tier: 'FREE' | 'GOLD' | 'DIAMOND') => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  openPaywall: () => void; // تابع باز کردن پاپ‌آپ
  closePaywall: () => void; // تابع بستن پاپ‌آپ
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  userTier: (localStorage.getItem('tier') as any) || 'FREE',
  isAuthenticated: !!localStorage.getItem('token'),
  isPaywallOpen: false,

  setAuth: (token, tier) => {
    localStorage.setItem('token', token);
    localStorage.setItem('tier', tier);
    set({ token, userTier: tier, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tier');
    set({ token: null, userTier: 'FREE', isAuthenticated: false });
  },

  checkAuth: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const hasToken = !!localStorage.getItem('token');
        resolve(hasToken);
      }, 1000);
    });
  },

  openPaywall: () => set({ isPaywallOpen: true }),
  closePaywall: () => set({ isPaywallOpen: false }),
}));