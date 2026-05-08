import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

// وارد کردن صفحات اصلی از پوشه pages
import Splash from './pages/Splash';
import Auth from './pages/Auth';
import Home from './pages/Home';

export default function App() {
  const { i18n } = useTranslation();

  /**
   * مدیریت پویا جهت صفحه (RTL برای فارسی و LTR برای انگلیسی)
   * این قطعه کد باعث می‌شود کل اپلیکیشن با تغییر زبان، آینه شود.
   */
  useEffect(() => {
    const currentLang = i18n.language;
    document.documentElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    
    // تنظیم فونت بر اساس زبان (اختیاری - اگر فونت فارسی متفاوتی دارید اینجا اعمال کنید)
    if (currentLang === 'fa') {
      document.body.style.fontFamily = 'Tahoma, Arial, sans-serif'; // یا فونت دلخواه فارسی
    } else {
      document.body.style.fontFamily = 'Inter, system-ui, sans-serif';
    }
  }, [i18n.language]);

  return (
    <BrowserRouter>
      {/* Container اصلی برنامه با رنگ پس‌زمینه ثابت 
        تا در زمان جابجایی بین صفحات، پرش رنگی نداشته باشیم
      */}
      <div className="min-h-screen bg-gray-900 text-white selection:bg-blue-500/30">
        <Routes>
          {/* صفحه شروع و بررسی وضعیت لاگین */}
          <Route path="/" element={<Splash />} />
          
          {/* صفحه احراز هویت (ورود/ثبت‌نام) */}
          <Route path="/auth" element={<Auth />} />
          
          {/* داشبورد اصلی اپلیکیشن */}
          <Route path="/home" element={<Home />} />
          
          {/* در اینجا می‌توانید صفحات دیگر مثل /play یا /analysis را 
            در آینده اضافه کنید
          */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}