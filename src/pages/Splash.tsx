import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';

export default function Splash() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const initApp = async () => {
      const isLoggedIn = await checkAuth();
      if (isLoggedIn) {
        navigate('/home');
      } else {
        navigate('/auth');
      }
    };
    initApp();
  }, [checkAuth, navigate]);

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-32 h-32 bg-blue-600 rounded-3xl flex items-center justify-center mb-8 animate-pulse shadow-2xl">
        <span className="text-5xl font-bold">F</span>
      </div>
      <h1 className="text-3xl font-bold tracking-widest">{t('app_name')}</h1>
      <div className="mt-10 flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>
      <p className="mt-4 text-gray-500 text-sm">{t('splash.loading')}</p>
    </div>
  );
}
