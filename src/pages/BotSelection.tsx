import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, Lock, Play, Zap } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function BotSelection() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { userTier, openPaywall } = useAuthStore();

  // لیست آزمایشی شبیه‌سازها (بعداً این لیست از دیتابیس/API خوانده می‌شود)
  const bots = [
    { id: 1, name: 'بازیکن مبتدی', rating: 1200, type: 'FREE', accuracy: 'پایه' },
    { id: 2, name: 'بازیکن متوسط', rating: 1600, type: 'FREE', accuracy: 'پایه' },
    { id: 3, name: 'شبیه‌ساز Lichess (Amir)', rating: 2100, type: 'PREMIUM', accuracy: 'دقت ۴۵٪ - رفتار طبیعی' },
    { id: 4, name: 'شبیه‌ساز Lichess (Master)', rating: 2500, type: 'PREMIUM', accuracy: 'دقت ۶۰٪ تا ۸۰٪ - فوق‌انسانی' },
  ];

  const handlePlay = (bot: any) => {
    if (bot.type === 'PREMIUM' && userTier === 'FREE') {
      openPaywall();
      return;
    }
    // اگر مجاز بود، او را به صفحه بازی (با اطلاعات ربات) بفرست
    navigate('/play-ai', { state: { selectedBot: bot } });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4">
      {/* هدر */}
      <div className="flex items-center mb-8 pt-2">
        <button 
          onClick={() => navigate('/home')} 
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
        >
          {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        </button>
        <h1 className="text-2xl font-bold mx-4">انتخاب حریف</h1>
      </div>

      {/* لیست ربات‌ها */}
      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full pb-10">
        {bots.map((bot) => {
          const isLocked = bot.type === 'PREMIUM' && userTier === 'FREE';

          return (
            <div 
              key={bot.id} 
              className={`relative flex items-center p-5 rounded-2xl border transition-all duration-200 
                ${isLocked ? 'bg-gray-800/60 border-gray-700/50' : 'bg-gray-800 border-gray-600 hover:border-blue-500 shadow-lg'}
              `}
            >
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold text-lg border-2 border-gray-500 shrink-0">
                {bot.name.charAt(0)}
              </div>
              
              <div className="flex-1 mx-4">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-lg ${isLocked ? 'text-gray-400' : 'text-gray-100'}`}>
                    {bot.name}
                  </h3>
                  {bot.type === 'PREMIUM' && (
                    <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-500/30">
                      PRO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-400">ریتیگ: {bot.rating}</span>
                  <span className="text-xs text-blue-400 flex items-center gap-1">
                    <Zap size={12} /> {bot.accuracy}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => handlePlay(bot)}
                className={`p-3 rounded-xl flex items-center justify-center transition-colors
                  ${isLocked ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'}
                `}
              >
                {isLocked ? <Lock size={20} /> : <Play size={20} className="ml-1" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}