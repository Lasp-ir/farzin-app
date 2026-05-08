import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

// موقتا کامپوننت‌های خام رو با ترجمه پر می‌کنیم تا تست کنیم
const Splash = () => {
  const { t, i18n } = useTranslation();
  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white text-2xl gap-4">
      <div>{t('splash.welcome')}</div>
      <div className="text-gray-400 text-sm">{t('splash.loading')}</div>
      {/* دکمه موقت برای تست تغییر زبان */}
      <button 
        onClick={() => i18n.changeLanguage(i18n.language === 'fa' ? 'en' : 'fa')}
        className="mt-8 px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-500"
      >
        تغییر زبان (EN/FA)
      </button>
    </div>
  );
};
const Auth = () => { const { t } = useTranslation(); return <div className="flex h-screen items-center justify-center bg-gray-900 text-white text-2xl">{t('auth.login_title')}</div>; };
const Home = () => { const { t } = useTranslation(); return <div className="flex h-screen items-center justify-center bg-gray-900 text-white text-2xl">{t('home.title')}</div>; };

export default function App() {
  const { i18n } = useTranslation();

  // هر بار زبان عوض شد، دایرکشن (rtl/ltr) بدنه رو تنظیم کن
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}