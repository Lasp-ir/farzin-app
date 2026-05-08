import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-900 p-6">
      <h1 className="text-3xl font-bold mb-8">{t('home.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 cursor-pointer">
          {t('home.play_ai')}
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 cursor-pointer text-gray-500">
          {t('home.play_online')} (قفل پولی)
        </div>
      </div>
      <button 
        onClick={() => { logout(); navigate('/'); }}
        className="mt-12 text-red-500 underline"
      >
        خروج از حساب
      </button>
    </div>
  );
}