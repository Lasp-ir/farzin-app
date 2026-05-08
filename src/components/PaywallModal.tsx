import { useAuthStore } from '../store/useAuthStore';
import { Check, X, Star, Crown, Zap } from 'lucide-react';

export default function PaywallModal() {
  const { isPaywallOpen, closePaywall, setAuth } = useAuthStore();

  if (!isPaywallOpen) return null;

  const handleSimulatePurchase = (tier: 'GOLD' | 'DIAMOND') => {
    // در واقعیت اینجا به درگاه پرداخت وصل می‌شود
    // برای دمو، توکن فعلی را نگه می‌داریم و سطح را ارتقا می‌دهیم
    const currentToken = localStorage.getItem('token') || 'mock_token';
    setAuth(currentToken, tier);
    closePaywall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* پس‌زمینه تار (Backdrop) */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closePaywall}
      ></div>

      {/* بدنه اصلی مدال */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* دکمه بستن */}
        <button 
          onClick={closePaywall}
          className="absolute top-4 left-4 p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* هدر */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Crown size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">ارتقا به حساب ویژه</h2>
          <p className="text-orange-100 text-sm">قدرت واقعی فرزین را آزاد کنید و به تمام امکانات دسترسی داشته باشید.</p>
        </div>

        {/* پلن‌ها */}
        <div className="p-6 grid gap-4">
          
          {/* پلن طلایی */}
          <div className="bg-gray-800 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Star className="text-amber-500" size={24} />
                <h3 className="text-xl font-bold text-white">پلن طلایی (Gold)</h3>
              </div>
              <span className="text-lg font-bold text-amber-500">۹۹,۰۰۰ <span className="text-xs text-gray-400">تومان/ماه</span></span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> آنالیز نامحدود بازی‌ها</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> دسترسی به پازل‌های اختصاصی</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> دسترسی به شبیه‌سازهای حرفه‌ای</li>
            </ul>
            <button 
              onClick={() => handleSimulatePurchase('GOLD')}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
            >
              خرید اشتراک طلایی
            </button>
          </div>

          {/* پلن الماسی */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500/50 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-indigo-900/50">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl"></div>
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">پیشنهاد ویژه</div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <Zap className="text-indigo-400" size={24} />
                <h3 className="text-xl font-bold text-white">الماسی (Diamond)</h3>
              </div>
              <span className="text-lg font-bold text-indigo-400">۲۴۹,۰۰۰ <span className="text-xs text-gray-400">تومان/ماه</span></span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-indigo-100 relative z-10">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-400" /> تمام امکانات پلن طلایی</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-400" /> ساخت پروفایل شبیه‌ساز اختصاصی</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-400" /> دوره‌های آموزشی ویدیویی VIP</li>
            </ul>
            <button 
              onClick={() => handleSimulatePurchase('DIAMOND')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/30 relative z-10"
            >
              خرید اشتراک الماسی
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}