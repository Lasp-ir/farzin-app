import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userTier: 'FREE' | 'GOLD' | 'DIAMOND';
  isAuthenticated: boolean;
  setAuth: (token: string, tier: 'FREE' | 'GOLD' | 'DIAMOND') => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  userTier: (localStorage.getItem('tier') as any) || 'FREE',
  isAuthenticated: !!localStorage.getItem('token'),

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
    // در اینجا بعدا به سرور درخواست میزنیم تا اعتبار توکن را بسنجد
    // فعلا یک تاخیر مصنوعی ایجاد میکنیم
    return new Promise((resolve) => {
      setTimeout(() => {
        const hasToken = !!localStorage.getItem('token');
        resolve(hasToken);
      }, 2000);
    });
  }
}));
