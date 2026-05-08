import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Globe, Puzzle, LineChart, 
  History, UserPlus, LogOut, Lock, Bell, Settings
} from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();
  const { logout, userTier } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // کامپوننت داخلی ویجت
  const Widget = ({ title, desc, icon: Icon, isPremium, colorClass, onClick }: any) => {
    const isLocked = isPremium && userTier === 'FREE';

    return (
      <div 
        onClick={isLocked ? () => alert('نمایش پاپ‌آپ خرید اشتراک ویژه!') : onClick}
        className={`relative flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-200 shadow-lg border border-gray-700/50 hover:border-gray-500 overflow-hidden ${isLocked ? 'bg-gray-800/50 opacity-80' : 'bg-gray-800'}`}
      >
        <div className={`p-3 rounded-xl mr-4 ml-4 ${colorClass}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${isLocked ? 'text-gray-400' : 'text-gray-100'}`}>{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{desc}</p>
        </div>
        
        {/* نشانگر پریمیوم */}
        {isPremium && (
          <div className="absolute top-0 ltr:right-0 rtl:left-0 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-bl-xl rounded-br-none rtl:rounded-br-xl rtl:rounded-bl-none shadow-md flex items-center gap-1">
            {isLocked ? <Lock size={12} className="text-white" /> : null}
            <span className="text-[10px] font-bold text-white tracking-wider">{t('home.premium')}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-20">
      {/* هدر بالایی */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl border-2 border-blue-400 shadow-lg shadow-blue-500/20">
            A
          </div>
          <div>
            <p className="text-gray-400 text-sm">{t('home.greeting')}</p>
            <p className="font-bold text-lg">{userTier} TIER</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"><Bell size={20} /></button>
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"><Settings size={20} /></button>
        </div>
      </div>

      {/* بنر اطلاع رسانی */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-3xl p-6 mb-8 relative overflow-hidden shadow-xl shadow-blue-900/20">
        <div className="relative z-10">
          <span className="bg-blue-500 text-xs font-bold px-2 py-1 rounded text-white mb-2 inline-block">اطلاعیه</span>
          <h2 className="text-2xl font-bold mb-1">{t('home.banner_title')}</h2>
          <p className="text-blue-200 text-sm">{t('home.banner_desc')}</p>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* گرید ویجت‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* بخش‌های رایگان */}
        <Widget 
          title={t('home.play_ai')} 
          desc={t('home.play_ai_desc')} 
          icon={Bot} 
          colorClass="bg-green-500" 
          onClick={() => navigate('/play-ai')} 
        />
        <Widget 
          title={t('home.play_online')} 
          desc={t('home.play_online_desc')} 
          icon={Globe} 
          colorClass="bg-blue-500" 
        />
        <Widget 
          title={t('home.latest_game')} 
          desc={t('home.latest_game_desc')} 
          icon={History} 
          colorClass="bg-purple-500" 
        />

        {/* بخش‌های ویژه (Premium) */}
        <Widget 
          title={t('home.puzzles')} 
          desc={t('home.puzzles_desc')} 
          icon={Puzzle} 
          colorClass="bg-amber-500" 
          isPremium={true} 
        />
        <Widget 
          title={t('home.analysis')} 
          desc={t('home.analysis_desc')} 
          icon={LineChart} 
          colorClass="bg-rose-500" 
          isPremium={true} 
        />
        <Widget 
          title={t('home.request_profile')} 
          desc={t('home.request_profile_desc')} 
          icon={UserPlus} 
          colorClass="bg-teal-500" 
          isPremium={true} 
        />
      </div>

      {/* دکمه خروج برای تست */}
      <div className="mt-12 flex justify-center">
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors">
          <LogOut size={18} />
          <span>{t('home.logout')}</span>
        </button>
      </div>
    </div>
  );
}