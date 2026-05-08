import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLoginSimulate = () => {
    // شبیهسازی لاگین و ذخیره توکن
    setAuth('mock_token_123', 'FREE');
    navigate('/home');
  };

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-900 p-6">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('auth.login_title')}</h2>
        <button 
          onClick={handleLoginSimulate}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all"
        >
          {t('auth.google_login')} (تست)
        </button>
        <p className="mt-6 text-center text-gray-400 text-sm">
          {t('auth.register_prompt')}
        </p>
      </div>
    </div>
  );
}
