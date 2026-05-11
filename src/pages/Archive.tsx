import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Search, Filter, Target, Clock, Calendar, 
  Trophy, XCircle, MinusCircle, User, Bot, Swords, X, Check
} from 'lucide-react';

// دیتای تستی با اضافه شدن پلتفرم‌ها
const mockGames = [
  { id: '1', opponent: 'فرزین (کابوس)', rating: 2800, type: 'ai', platform: 'farzin', result: 'loss', playerColor: 'black', accuracy: 72.4, moves: 45, timeControl: '10 دقیقه', date: 'امروز' },
  { id: '2', opponent: 'Hikaru', rating: 3100, type: 'online', platform: 'chessDotCom', result: 'draw', playerColor: 'white', accuracy: 94.1, moves: 82, timeControl: '3 | 2', date: 'دیروز' },
  { id: '3', opponent: 'DrNykterstein', rating: 2850, type: 'online', platform: 'lichess', result: 'win', playerColor: 'black', accuracy: 89.5, moves: 41, timeControl: '5 دقیقه', date: '۲ روز پیش' },
  { id: '4', opponent: 'سارا', rating: 400, type: 'ai', platform: 'farzin', result: 'win', playerColor: 'white', accuracy: 95.2, moves: 18, timeControl: 'نامحدود', date: '۳ روز پیش' },
  { id: '5', opponent: 'Daniel_N', rating: 3000, type: 'online', platform: 'chessDotCom', result: 'win', playerColor: 'black', accuracy: 88.0, moves: 56, timeControl: '1 | 1', date: 'هفته پیش' },
  { id: '6', opponent: 'PenguinGM', rating: 2900, type: 'online', platform: 'lichess', result: 'loss', playerColor: 'white', accuracy: 75.8, moves: 34, timeControl: '3 | 0', date: 'هفته پیش' },
  { id: '7', opponent: 'علی', rating: 700, type: 'ai', platform: 'farzin', result: 'win', playerColor: 'black', accuracy: 81.2, moves: 22, timeControl: '10 دقیقه', date: '۲ هفته پیش' },
];

export default function Archive() {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // استیت‌های مربوط به مودال فیلتر پیشرفته
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [resultFilter, setResultFilter] = useState('all'); // all, win, loss, draw

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // اعمال ترکیبیِ فیلترها (پلتفرم + نتیجه + جستجو)
  const filteredGames = mockGames.filter(game => {
    const matchesPlatform = activePlatform === 'all' || game.platform === activePlatform;
    const matchesResult = resultFilter === 'all' || game.result === resultFilter;
    const matchesSearch = game.opponent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesResult && matchesSearch;
  });

  // محاسبه آمار زنده بر اساس بازی‌های فیلتر شده
  const totalGames = filteredGames.length;
  const totalWins = filteredGames.filter(g => g.result === 'win').length;
  const totalLosses = filteredGames.filter(g => g.result === 'loss').length;
  const totalDraws = filteredGames.filter(g => g.result === 'draw').length;
  const avgAccuracy = totalGames > 0 ? (filteredGames.reduce((acc, g) => acc + g.accuracy, 0) / totalGames).toFixed(1) : '0.0';

  const platformTabs = [
    { id: 'all', title: 'همه پلتفرم‌ها', icon: <Swords size={16} /> },
    { id: 'farzin', title: 'فرزین', icon: <Bot size={16} /> },
    { id: 'chessDotCom', title: 'Chess.com', icon: <img src="https://lichess1.org/assets/images/logo/chess-com.favicon.png" className="w-4 h-4 rounded-sm" alt="chess.com" /> },
    { id: 'lichess', title: 'Lichess', icon: <img src="https://lichess1.org/assets/images/logo/lichess-favicon-256.png" className="w-4 h-4" alt="lichess" /> }
  ];

  // تشخیص استایل‌های پلتفرم و نتیجه برای رندر کارت
  const getPlatformStyle = (platform: string) => {
    switch(platform) {
      case 'chessDotCom': return { border: 'border-[#81b64c]/40', bgHover: 'hover:bg-[#81b64c]/5', glow: 'bg-[#81b64c]' };
      case 'lichess': return { border: 'border-zinc-300/30', bgHover: 'hover:bg-zinc-300/5', glow: 'bg-zinc-300' };
      case 'farzin': return { border: 'border-farzin-accent/40', bgHover: 'hover:bg-farzin-accent/5', glow: 'bg-farzin-accent' };
      default: return { border: 'border-[#35332e]', bgHover: 'hover:bg-[#22201d]', glow: 'bg-transparent' };
    }
  };

  const getResultInfo = (result: string) => {
    switch(result) {
      case 'win': return { text: 'پیروزی', color: 'text-emerald-500', bg: 'bg-emerald-500/10', line: 'bg-emerald-500', icon: <Trophy size={14} className="text-emerald-500" /> };
      case 'loss': return { text: 'شکست', color: 'text-rose-500', bg: 'bg-rose-500/10', line: 'bg-rose-500', icon: <XCircle size={14} className="text-rose-500" /> };
      case 'draw': return { text: 'تساوی', color: 'text-zinc-400', bg: 'bg-zinc-500/10', line: 'bg-zinc-500', icon: <MinusCircle size={14} className="text-zinc-400" /> };
      default: return { text: '', color: '', bg: '', line: '', icon: null };
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-24 overflow-x-hidden" 
        dir="rtl"
      >
        {/* هدر */}
        <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between z-10 sticky top-0 bg-[#161512]/90 backdrop-blur-md border-b border-white/5">
          <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90 bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]">
            <ChevronRight size={24} />
          </button>
          <div className="flex flex-col items-center">
              <h1 className="text-lg font-black tracking-tight text-white uppercase drop-shadow-md">آرشیو بازی‌ها</h1>
              <span className="text-[10px] text-farzin-accent font-bold tracking-widest uppercase mt-0.5">Game History</span>
          </div>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="relative p-2.5 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] text-zinc-400 hover:text-white transition-all active:scale-95"
          >
              <Filter size={20} />
              {/* نشانگر فعال بودن فیلتر نتیجه */}
              {resultFilter !== 'all' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-farzin-accent rounded-full border-2 border-[#161512]"></span>
              )}
          </button>
        </div>

        <div className={`w-full max-w-2xl px-4 mt-4 flex flex-col gap-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* 🔥 منوی تب‌های شناور پلتفرم‌ها (کپی شده از Setting) */}
          <div className="relative flex overflow-x-auto gap-2 pb-4 no-scrollbar px-1">
            {platformTabs.map(tab => {
              const isActive = activePlatform === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePlatform(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13px] whitespace-nowrap transition-colors duration-300 outline-none ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activePlatformPill"
                      className="absolute inset-0 bg-[#262421] border border-[#403e3a] rounded-2xl shadow-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span className={isActive && tab.id === 'farzin' ? "text-farzin-accent" : ""}>{tab.icon}</span>
                    {tab.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 🔥 داشبورد آماری زنده (Live Stats) */}
          <div className="bg-[#1e1c19] rounded-[28px] border border-[#35332e] shadow-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-farzin-accent/5 rounded-full blur-[40px] -mr-10 -mt-10"></div>
              
              <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-2 text-zinc-300">
                      <Swords size={18} className="text-farzin-accent" />
                      <span className="font-black text-sm">آمار بازی‌های فیلتر شده</span>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-[#161512] border border-[#35332e] flex items-center gap-1.5 shadow-inner">
                      <Target size={14} className="text-amber-400" />
                      <span className="font-mono text-xs font-bold text-white">{avgAccuracy}٪</span>
                  </div>
              </div>

              {/* نوار گرافیکی وضعیت (با انیمیشن عرض) */}
              <div className="flex w-full h-3 rounded-full overflow-hidden mb-5 bg-[#161512] shadow-inner relative z-10">
                  <motion.div animate={{ width: totalGames ? `${(totalWins/totalGames)*100}%` : '0%' }} transition={{ duration: 0.8, ease: "easeOut" }} className="bg-emerald-500 h-full"></motion.div>
                  <motion.div animate={{ width: totalGames ? `${(totalDraws/totalGames)*100}%` : '0%' }} transition={{ duration: 0.8, ease: "easeOut" }} className="bg-zinc-500 h-full"></motion.div>
                  <motion.div animate={{ width: totalGames ? `${(totalLosses/totalGames)*100}%` : '0%' }} transition={{ duration: 0.8, ease: "easeOut" }} className="bg-rose-500 h-full"></motion.div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center divide-x divide-x-reverse divide-[#35332e] relative z-10">
                  <div className="flex flex-col">
                      <span className="text-xl font-black text-emerald-500 drop-shadow-sm">{totalWins}</span>
                      <span className="text-[10px] font-bold text-zinc-500 mt-1">پیروزی</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xl font-black text-zinc-400 drop-shadow-sm">{totalDraws}</span>
                      <span className="text-[10px] font-bold text-zinc-500 mt-1">تساوی</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xl font-black text-rose-500 drop-shadow-sm">{totalLosses}</span>
                      <span className="text-[10px] font-bold text-zinc-500 mt-1">شکست</span>
                  </div>
              </div>
          </div>

          {/* نوار جستجو */}
          <div className="relative">
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-zinc-500" />
              </div>
              <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام حریف..." 
                  className="w-full bg-[#1e1c19] border border-[#35332e] text-white text-sm rounded-2xl py-4 pr-12 pl-4 focus:outline-none focus:border-farzin-accent transition-colors shadow-inner placeholder-zinc-600 font-bold"
              />
          </div>

          {/* 🔥 لیست کارت‌های بازی با تفکیک پلتفرم */}
          <div className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                  {filteredGames.length > 0 ? filteredGames.map((game, index) => {
                      const info = getResultInfo(game.result);
                      const platformStyle = getPlatformStyle(game.platform);
                      
                      return (
                          <motion.div
                              layout
                              key={game.id}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.25, delay: index * 0.05 }}
                              onClick={() => navigate('/analysis')} 
                              className={`relative bg-[#1e1c19] rounded-[24px] border ${platformStyle.border} shadow-lg overflow-hidden flex cursor-pointer ${platformStyle.bgHover} transition-all duration-300 group active:scale-[0.98]`}
                          >
                              {/* نوار وضعیت (برد/باخت) سمت راست */}
                              <div className={`w-2 shrink-0 ${info.line} shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 relative`}></div>
                              
                              {/* هاله رنگی پلتفرم در پس‌زمینه کارت */}
                              <div className={`absolute -top-10 -left-10 w-24 h-24 rounded-full blur-[40px] opacity-10 ${platformStyle.glow} pointer-events-none`}></div>

                              <div className="flex-1 p-5 relative z-10">
                                  <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                          {/* آواتار حریف */}
                                          <div className="relative">
                                              <div className="w-12 h-12 rounded-[14px] bg-[#161512] flex items-center justify-center border border-[#35332e] shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                  {game.type === 'ai' ? <Bot size={22} className="text-zinc-300" /> : <User size={22} className="text-zinc-300" />}
                                              </div>
                                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#262421] rounded-full border-2 border-[#1e1c19] flex items-center justify-center shadow-sm">
                                                  <div className={`w-2.5 h-2.5 rounded-[3px] ${game.playerColor === 'white' ? 'bg-zinc-200' : 'bg-zinc-800 border border-zinc-600'}`}></div>
                                              </div>
                                          </div>
                                          <div className="flex flex-col">
                                              <span className="font-black text-[15px] text-white tracking-wide">{game.opponent}</span>
                                              <div className="flex items-center gap-1.5 mt-0.5">
                                                  <span className="text-[10px] font-mono font-bold text-zinc-500 bg-[#161512] px-1.5 py-0.5 rounded border border-[#35332e]">{game.rating}</span>
                                                  {/* آیکون پلتفرم */}
                                                  {game.platform === 'chessDotCom' && <img src="https://lichess1.org/assets/images/logo/chess-com.favicon.png" className="w-3.5 h-3.5 rounded-[3px]" alt="chess.com" />}
                                                  {game.platform === 'lichess' && <img src="https://lichess1.org/assets/images/logo/lichess-favicon-256.png" className="w-3.5 h-3.5" alt="lichess" />}
                                                  {game.platform === 'farzin' && <Bot size={13} className="text-farzin-accent" />}
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${info.bg} ${info.border} shadow-sm`}>
                                          {info.icon}
                                          <span className={`text-[10px] font-black tracking-widest uppercase ${info.color}`}>{info.text}</span>
                                      </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-3 border-t border-[#35332e]/50">
                                      <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400">
                                          <div className="flex items-center gap-1.5 bg-[#161512] px-2 py-1 rounded-lg border border-[#35332e]">
                                              <Calendar size={13} className="text-zinc-500" />
                                              <span>{game.date}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 bg-[#161512] px-2 py-1 rounded-lg border border-[#35332e]">
                                              <Clock size={13} className="text-zinc-500" />
                                              <span dir="ltr" className="font-mono">{game.timeControl}</span>
                                          </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] text-zinc-500 font-bold uppercase">دقت:</span>
                                          <span className="text-sm font-mono font-black text-white">{game.accuracy}٪</span>
                                      </div>
                                  </div>
                              </div>
                          </motion.div>
                      )
                  }) : (
                      <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center py-20 text-center bg-[#1e1c19] rounded-[28px] border border-[#35332e]"
                      >
                          <div className="w-20 h-20 bg-[#161512] rounded-full flex items-center justify-center border border-[#35332e] mb-4 shadow-inner">
                            <Swords size={32} className="text-zinc-600" />
                          </div>
                          <span className="text-white font-black text-lg mb-1">بازی‌ای پیدا نشد!</span>
                          <span className="text-zinc-500 text-xs">فیلترها رو تغییر بده یا یه بازی جدید شروع کن.</span>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* 🔥 پاپ‌آپ فیلتر پیشرفته (Modal) */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:px-4"
            dir="rtl"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full sm:max-w-md bg-[#1e1c19] border-t sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pb-safe"
            >
              {/* خط تزیینی بالای مودال در موبایل */}
              <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
                  <div className="w-12 h-1.5 bg-[#35332e] rounded-full"></div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-b border-[#35332e]">
                <h3 className="font-black text-white flex items-center gap-2 text-lg">
                  <Filter size={18} className="text-farzin-accent" />
                  فیلتر پیشرفته
                </h3>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 bg-[#161512] rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                
                {/* فیلتر نتیجه بازی */}
                <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">نتیجه بازی</span>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'all', label: 'همه' },
                            { id: 'win', label: 'برد' },
                            { id: 'draw', label: 'مساوی' },
                            { id: 'loss', label: 'باخت' }
                        ].map(res => (
                            <button
                                key={res.id}
                                onClick={() => setResultFilter(res.id)}
                                className={`py-3 rounded-xl text-xs font-black transition-all border ${resultFilter === res.id ? 'bg-farzin-accent text-white border-farzin-accent shadow-[0_4px_15px_rgba(119,149,86,0.3)]' : 'bg-[#161512] text-zinc-400 border-[#35332e] hover:bg-[#262421]'}`}
                            >
                                {res.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="mt-4 w-full py-4 rounded-[18px] font-black text-sm transition-all flex items-center justify-center gap-2 bg-white text-black active:scale-[0.98] shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
                >
                  <Check size={18} />
                  اعمال فیلتر و مشاهده نتایج
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}