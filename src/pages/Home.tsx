import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Play, Home as HomeIcon, Puzzle, BarChart2, User, 
  Trophy, History, Settings, Globe, LineChart, 
  UserPlus, BookOpen, Lock, Bell, LogOut 
} from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();
  const { logout, userTier, openPaywall } = useAuthStore();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const ActionCard = ({ title, desc, icon: Icon, color, onClick, isPremium }: any) => {
    const isLocked = isPremium && userTier === 'FREE';

    return (
      <div 
        onClick={isLocked ? openPaywall : onClick}
        className={`flex flex-col gap-3 p-5 rounded-[22px] bg-[#1e1c19] border shadow-lg transition-all duration-300 group relative overflow-hidden ${isLocked ? 'border-[#2a2825] opacity-80 cursor-not-allowed' : 'border-[#35332e] hover:border-[#52525b] hover:bg-[#262421] cursor-pointer active:scale-[0.98]'}`}
      >
        {isPremium && (
          <div className="absolute top-4 left-4 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-black rounded-lg border border-amber-500/20 flex items-center gap-1">
            {isLocked && <Lock size={10} />}
            {t('home.premium')}
          </div>
        )}
        <div className={`w-12 h-12 rounded-2xl bg-[#161512] flex items-center justify-center border border-[#35332e] shadow-inner ${!isLocked && 'group-hover:scale-105'} transition-transform duration-300`}>
          <Icon size={22} className={color} />
        </div>
        <div className="flex flex-col mt-1">
          <span className={`font-bold text-lg ${isLocked ? 'text-zinc-500' : 'text-white'}`}>{title}</span>
          <span className="text-xs text-zinc-500 mt-1">{desc}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-28 overflow-x-hidden">
      
      <div className={`w-full max-w-2xl px-5 py-6 flex items-center justify-between transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#35332e] bg-[#1e1c19] p-0.5 shadow-md flex items-center justify-center font-bold text-xl text-blue-400">
               A 
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#161512]"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-400 text-xs">{t('home.greeting')}</span>
            <div className="flex items-center gap-1.5 font-mono text-farzin-accent mt-0.5">
              <Trophy size={12} className="fill-farzin-accent/20" />
              <span className="font-bold text-sm tracking-widest">{userTier}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="p-2.5 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] transition-colors"><Bell size={18} className="text-zinc-400" /></button>
          <button onClick={() => navigate('/settings')} className="p-2.5 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] transition-colors"><Settings size={18} className="text-zinc-400" /></button>
        </div>
      </div>

      <div className="w-full max-w-2xl px-4 flex flex-col gap-6 relative">
        
        <div className={`bg-gradient-to-r from-[#202820] to-[#1e1c19] rounded-[24px] p-5 relative overflow-hidden shadow-lg border border-farzin-accent/20 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative z-10 flex flex-col">
                <span className="bg-farzin-accent/20 text-farzin-accent border border-farzin-accent/30 text-[10px] font-black px-2 py-1 rounded-md mb-3 w-max uppercase tracking-widest">اطلاعیه</span>
                <h2 className="text-lg font-bold text-white mb-1.5">{t('home.banner_title')}</h2>
                <p className="text-zinc-400 text-xs leading-relaxed">{t('home.banner_desc')}</p>
            </div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-farzin-accent/10 rounded-full blur-[40px]"></div>
        </div>

        {/* 🔥 اصلاح آدرس به /select-bot */}
        <div 
          onClick={() => navigate('/select-bot')}
          className={`relative group cursor-pointer p-[1px] transition-all duration-1000 ease-out delay-200 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ perspective: '1500px' }}
        >
            <div 
                className="flex items-center justify-between p-6 rounded-[24px] bg-[#1e1c19] relative overflow-hidden transition-all duration-500 ease-out shadow-xl border border-[#35332e] group-hover:border-[#52525b] group-hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)]
                    group-hover:[transform:rotateX(2deg)_rotateY(-2deg)]"
                style={{
                   backgroundImage: `
                     radial-gradient(circle at right, rgba(119,149,86,0.08) 0%, #1a1916 100%),
                     repeating-conic-gradient(rgba(38, 36, 33, 0.5) 0% 25%, transparent 25% 50%)
                   `,
                   backgroundSize: '100% 100%, 24px 24px'
                }}
            >
                <div className="flex flex-col z-10">
                    <span className="text-farzin-accent text-[10px] font-black uppercase tracking-widest mb-1 drop-shadow-sm">موتور اختصاصی</span>
                    <h2 className="text-3xl font-black text-white drop-shadow-md mb-2">{t('home.play_ai')}</h2>
                    <p className="text-zinc-400 text-xs max-w-[200px] leading-relaxed">{t('home.play_ai_desc')}</p>
                </div>
                
                <div className="relative z-10 w-16 h-16 rounded-[20px] bg-farzin-accent flex items-center justify-center shadow-[0_10px_20px_rgba(119,149,86,0.3)] group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 rounded-[20px] border-2 border-white/20 animate-ping opacity-20"></div>
                    <Play fill="currentColor" size={28} className="text-white ml-1" />
                </div>
            </div>
        </div>

        <div className={`grid grid-cols-2 gap-4 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <ActionCard title={t('home.play_online')} desc={t('home.play_online_desc')} icon={Globe} color="text-blue-400" />
            <ActionCard title={t('home.latest_game')} desc={t('home.latest_game_desc')} icon={History} color="text-purple-400" onClick={() => navigate('/archive')} />
            
            <ActionCard title={t('home.puzzles')} desc={t('home.puzzles_desc')} icon={Puzzle} color="text-amber-400" isPremium={true} onClick={() => navigate('/puzzles')} />
            <ActionCard title={t('home.analysis')} desc={t('home.analysis_desc')} icon={LineChart} color="text-rose-400" isPremium={true} />
            
            <ActionCard title={t('home.request_profile')} desc={t('home.request_profile_desc')} icon={UserPlus} color="text-teal-400" isPremium={true} />
            <ActionCard title="آکادمی آموزش" desc="ویدیوها و دوره‌ها" icon={BookOpen} color="text-indigo-400" onClick={() => navigate('/education')} />
        </div>

        <div className="mt-4 mb-8 flex justify-center">
          <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20">
            <LogOut size={16} />
            <span className="font-bold text-sm">{t('home.logout')}</span>
          </button>
        </div>
      </div>

      <div className={`fixed bottom-0 left-0 right-0 bg-[#161512] border-t border-[#35332e] z-50 flex justify-center transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0' : 'translate-y-full'} shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-safe`}>
        <div className="w-full max-w-2xl px-2 py-3 flex items-center justify-between">
          
          <button className="flex flex-col items-center gap-1.5 flex-1 group">
            <div className="relative">
              <HomeIcon size={24} className="text-farzin-accent transition-transform group-hover:scale-110" />
              <div className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-farzin-accent shadow-[0_0_8px_rgba(119,149,86,0.8)]"></div>
            </div>
            <span className="text-[11px] font-bold text-farzin-accent mt-1">خانه</span>
          </button>

          {/* 🔥 اصلاح آدرس به /select-bot */}
          <button onClick={() => navigate('/select-bot')} className="flex flex-col items-center gap-1.5 flex-1 group opacity-40 hover:opacity-100 transition-opacity">
            <Play size={24} className="text-zinc-300 transition-transform group-hover:scale-110" />
            <span className="text-[11px] font-bold text-zinc-300 mt-1">بازی</span>
          </button>

          <button onClick={() => userTier === 'FREE' ? openPaywall() : navigate('/puzzles')} className="flex flex-col items-center gap-1.5 flex-1 group opacity-40 hover:opacity-100 transition-opacity">
            <Puzzle size={24} className="text-zinc-300 transition-transform group-hover:scale-110" />
            <span className="text-[11px] font-bold text-zinc-300 mt-1">پازل</span>
          </button>

          <button className="flex flex-col items-center gap-1.5 flex-1 group opacity-40 hover:opacity-100 transition-opacity">
            <BarChart2 size={24} className="text-zinc-300 transition-transform group-hover:scale-110" />
            <span className="text-[11px] font-bold text-zinc-300 mt-1">تحلیل</span>
          </button>

          <button className="flex flex-col items-center gap-1.5 flex-1 group opacity-40 hover:opacity-100 transition-opacity">
            <User size={24} className="text-zinc-300 transition-transform group-hover:scale-110" />
            <span className="text-[11px] font-bold text-zinc-300 mt-1">پروفایل</span>
          </button>

        </div>
      </div>

    </div>
  );
}