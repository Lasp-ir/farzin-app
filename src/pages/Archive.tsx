import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Search, Filter, Target, Clock, Calendar, 
  Trophy, XCircle, MinusCircle, User, Bot, Swords
} from 'lucide-react';

// دیتای تستی برای نمایش آرشیو بازی‌ها
const mockGames = [
  { id: '1', opponent: 'فرزین (کابوس)', rating: 2800, type: 'ai', result: 'loss', playerColor: 'black', accuracy: 72.4, moves: 45, timeControl: '10 دقیقه', date: 'امروز' },
  { id: '2', opponent: 'استاک‌فیش ۸', rating: 1400, type: 'ai', result: 'win', playerColor: 'white', accuracy: 88.1, moves: 32, timeControl: '3 | 2', date: 'دیروز' },
  { id: '3', opponent: 'MagnusC', rating: 2150, type: 'online', result: 'draw', playerColor: 'black', accuracy: 91.5, moves: 68, timeControl: '15 | 10', date: '۲ روز پیش' },
  { id: '4', opponent: 'سارا', rating: 400, type: 'ai', result: 'win', playerColor: 'white', accuracy: 95.2, moves: 18, timeControl: 'نامحدود', date: '۳ روز پیش' },
  { id: '5', opponent: 'Ali_Chess99', rating: 1100, type: 'online', result: 'win', playerColor: 'black', accuracy: 82.0, moves: 41, timeControl: '5 دقیقه', date: 'هفته پیش' },
  { id: '6', opponent: 'کومودو', rating: 1800, type: 'ai', result: 'loss', playerColor: 'white', accuracy: 65.8, moves: 27, timeControl: '1 | 1', date: 'هفته پیش' },
];

export default function Archive() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // اعمال فیلتر و جستجو
  const filteredGames = mockGames.filter(game => {
    const matchesFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'win' ? game.result === 'win' :
      activeFilter === 'loss' ? game.result === 'loss' :
      activeFilter === 'draw' ? game.result === 'draw' :
      activeFilter === 'ai' ? game.type === 'ai' :
      activeFilter === 'online' ? game.type === 'online' : true;
    
    const matchesSearch = game.opponent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // محاسبه آمار کلی
  const totalGames = mockGames.length;
  const totalWins = mockGames.filter(g => g.result === 'win').length;
  const totalLosses = mockGames.filter(g => g.result === 'loss').length;
  const totalDraws = mockGames.filter(g => g.result === 'draw').length;
  const avgAccuracy = (mockGames.reduce((acc, g) => acc + g.accuracy, 0) / totalGames).toFixed(1);

  const filters = [
    { id: 'all', label: 'همه بازی‌ها' },
    { id: 'win', label: 'بردها' },
    { id: 'loss', label: 'باخت‌ها' },
    { id: 'draw', label: 'مساوی' },
    { id: 'ai', label: 'هوش مصنوعی' },
    { id: 'online', label: 'آنلاین' },
  ];

  const getResultInfo = (result: string) => {
    switch(result) {
      case 'win': return { text: 'پیروزی', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500', icon: <Trophy size={14} className="text-emerald-500" /> };
      case 'loss': return { text: 'شکست', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500', icon: <XCircle size={14} className="text-rose-500" /> };
      case 'draw': return { text: 'تساوی', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500', icon: <MinusCircle size={14} className="text-zinc-400" /> };
      default: return { text: '', color: '', bg: '', border: '', icon: null };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-24 overflow-x-hidden" 
      dir="rtl"
    >
      {/* هدر */}
      <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between z-10 sticky top-0 bg-[#161512]/90 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90 bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]">
          <ChevronRight size={24} />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="text-lg font-black tracking-tight text-white uppercase drop-shadow-md">آرشیو بازی‌ها</h1>
            <span className="text-[10px] text-farzin-accent font-bold tracking-widest uppercase mt-0.5">Game History</span>
        </div>
        <button className="p-2 text-zinc-500 hover:text-white transition-colors">
            <Filter size={20} />
        </button>
      </div>

      <div className={`w-full max-w-2xl px-4 flex flex-col gap-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* 🔥 داشبورد آماری */}
        <div className="bg-[#1e1c19] rounded-[28px] border border-[#35332e] shadow-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-farzin-accent/5 rounded-full blur-[40px] -mr-10 -mt-10"></div>
            
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-zinc-300">
                    <Swords size={18} className="text-farzin-accent" />
                    <span className="font-black text-sm">آمار کلی شما</span>
                </div>
                <div className="px-3 py-1 rounded-lg bg-[#161512] border border-[#35332e] flex items-center gap-1.5">
                    <Target size={14} className="text-amber-400" />
                    <span className="font-mono text-xs font-bold text-white">{avgAccuracy}٪</span>
                </div>
            </div>

            {/* نوار گرافیکی وضعیت */}
            <div className="flex w-full h-3 rounded-full overflow-hidden mb-4 bg-[#161512]">
                <div style={{ width: `${(totalWins/totalGames)*100}%` }} className="bg-emerald-500 h-full"></div>
                <div style={{ width: `${(totalDraws/totalGames)*100}%` }} className="bg-zinc-500 h-full"></div>
                <div style={{ width: `${(totalLosses/totalGames)*100}%` }} className="bg-rose-500 h-full"></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-x-reverse divide-[#35332e]">
                <div className="flex flex-col">
                    <span className="text-xl font-black text-emerald-500">{totalWins}</span>
                    <span className="text-[10px] font-bold text-zinc-500">پیروزی</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black text-zinc-400">{totalDraws}</span>
                    <span className="text-[10px] font-bold text-zinc-500">تساوی</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black text-rose-500">{totalLosses}</span>
                    <span className="text-[10px] font-bold text-zinc-500">شکست</span>
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
                className="w-full bg-[#1e1c19] border border-[#35332e] text-white text-sm rounded-2xl py-3.5 pr-12 pl-4 focus:outline-none focus:border-farzin-accent transition-colors shadow-inner placeholder-zinc-600"
            />
        </div>

        {/* فیلترهای اسکرول شونده */}
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar px-1">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-[14px] font-black text-[11px] whitespace-nowrap transition-all duration-300 active:scale-95 ${
                activeFilter === filter.id 
                ? 'bg-farzin-accent text-white shadow-[0_4px_12px_rgba(119,149,86,0.3)] border border-[#86a566]' 
                : 'bg-[#1e1c19] text-zinc-400 border border-[#35332e] hover:bg-[#262421]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 🔥 لیست کارت‌های بازی */}
        <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
                {filteredGames.length > 0 ? filteredGames.map((game, index) => {
                    const info = getResultInfo(game.result);
                    return (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            onClick={() => navigate('/analysis')} // لینک فرضی به صفحه تحلیل
                            className="bg-[#1e1c19] rounded-[20px] border border-[#35332e] shadow-lg overflow-hidden flex cursor-pointer hover:border-[#52525b] hover:bg-[#22201d] transition-all group active:scale-[0.98]"
                        >
                            {/* نوار رنگی کنار کارت */}
                            <div className={`w-1.5 shrink-0 ${info.bg} border-r-2 ${info.border}`}></div>
                            
                            <div className="flex-1 p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-xl bg-[#161512] flex items-center justify-center border border-[#35332e] shadow-inner">
                                                {game.type === 'ai' ? <Bot size={20} className="text-farzin-accent" /> : <User size={20} className="text-blue-400" />}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#262421] rounded-full border-2 border-[#1e1c19] flex items-center justify-center">
                                                <div className={`w-2 h-2 rounded-sm ${game.playerColor === 'white' ? 'bg-white' : 'bg-black border border-zinc-600'}`}></div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-white">{game.opponent}</span>
                                            <span className="text-[10px] font-mono text-zinc-500 mt-0.5 tracking-wider">{game.rating}</span>
                                        </div>
                                    </div>
                                    
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${info.bg} ${info.border}`}>
                                        {info.icon}
                                        <span className={`text-[10px] font-black ${info.color}`}>{info.text}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-[#35332e]/50">
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-zinc-500" />
                                            <span>{game.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-zinc-500" />
                                            <span dir="ltr">{game.timeControl}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-zinc-500 font-bold">دقت:</span>
                                        <span className="text-xs font-mono font-black text-amber-400">{game.accuracy}٪</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                }) : (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                    >
                        <Swords size={48} className="text-zinc-700 mb-4" />
                        <span className="text-zinc-400 font-bold">هیچ بازی‌ای پیدا نشد!</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}