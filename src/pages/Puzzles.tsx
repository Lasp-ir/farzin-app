import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowRight, ArrowLeft, Play, Lock, Star, Target, Flame } from 'lucide-react';

export default function Puzzles() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { userTier, openPaywall } = useAuthStore();

  const themes = [
    { id: 1, name: 'مات در ۲ حرکت', count: 120, premium: false },
    { id: 2, name: 'حمله دوگانه (Fork)', count: 85, premium: false },
    { id: 3, name: 'پازل‌های استخراجی از بازی شما', count: 42, premium: true },
    { id: 4, name: 'آخر بازی (Endgame)', count: 300, premium: true },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4 pb-10">
      {/* هدر */}
      <div className="flex items-center mb-6 pt-2">
        <button 
          onClick={() => navigate('/home')} 
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
        >
          {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        </button>
        <h1 className="text-2xl font-bold mx-4">پازل‌های شطرنج</h1>
      </div>

      <div className="max-w-lg mx-auto w-full">
        {/* پازل روزانه (رایگان برای همه) */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-3xl p-6 mb-8 relative overflow-hidden shadow-xl shadow-orange-900/20 cursor-pointer hover:scale-[1.02] transition-transform">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="text-yellow-300" size={20} />
                <span className="text-orange-100 font-bold text-sm">چالش روزانه</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">پازل امروز</h2>
              <p className="text-orange-200 text-sm">سفید حرکت می‌کند و می‌برد</p>
            </div>
            <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-600 shadow-lg">
              <Play fill="currentColor" size={24} className="ml-1" />
            </button>
          </div>
          <Target className="absolute -bottom-8 -right-8 text-white/10 w-40 h-40" />
        </div>

        {/* دسته‌بندی پازل‌ها */}
        <h3 className="text-gray-400 font-bold mb-4 px-2">تم‌های تمرینی</h3>
        <div className="grid grid-cols-1 gap-3">
          {themes.map((theme) => {
            const isLocked = theme.premium && userTier === 'FREE';

            return (
              <div 
                key={theme.id}
                onClick={isLocked ? openPaywall : () => alert('ورود به پازل')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer
                  ${isLocked ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-800 border-gray-600 hover:border-amber-500 shadow-md'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isLocked ? 'bg-gray-700' : 'bg-amber-500/20 text-amber-500'}`}>
                    <Star size={20} className={isLocked ? 'text-gray-500' : ''} />
                  </div>
                  <div>
                    <h4 className={`font-bold ${isLocked ? 'text-gray-400' : 'text-gray-100'}`}>{theme.name}</h4>
                    <span className="text-xs text-gray-500">{theme.count} پازل</span>
                  </div>
                </div>
                {isLocked ? <Lock size={18} className="text-gray-500" /> : <Play size={18} className="text-blue-400" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}