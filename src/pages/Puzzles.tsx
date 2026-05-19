import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Flame, Target, Zap, Swords, BrainCircuit,
  Calendar, ArrowRight, Star, Crosshair, Shield, Activity,
  Crown, Play, Lock, Sparkles, X, Info, TrendingUp, Search,
  GitBranch, ShieldAlert, Skull, MousePointerClick, Anchor,
  Eye, Zap as Flash, History, Compass, Map, Brain, Dumbbell
} from 'lucide-react';

const ALL_THEMES = [
  { id: 'mateIn1', title: 'مات در ۱', icon: <Target size={16} /> },
  { id: 'mateIn2', title: 'مات در ۲', icon: <Crosshair size={16} /> },
  { id: 'mateIn3', title: 'مات در ۳', icon: <Skull size={16} /> },
  { id: 'fork', title: 'چنگال (Fork)', icon: <GitBranch size={16} /> },
  { id: 'pin', title: 'آچمز (Pin)', icon: <Anchor size={16} /> },
  { id: 'skewer', title: 'سیخ‌کباب (Skewer)', icon: <Swords size={16} /> },
  { id: 'sacrifice', title: 'قربانی مهره', icon: <Flame size={16} /> },
  { id: 'discoveredAttack', title: 'حمله برخاسته', icon: <Eye size={16} /> },
  { id: 'doubleCheck', title: 'کیش دوگانه', icon: <Flash size={16} /> },
  { id: 'passedPawn', title: 'پیاده رونده', icon: <TrendingUp size={16} /> },
  { id: 'endgame', title: 'آخر بازی', icon: <History size={16} /> },
  { id: 'middlegame', title: 'وسط بازی', icon: <Activity size={16} /> },
  { id: 'opening', title: 'گشایش', icon: <Map size={16} /> },
  { id: 'defensiveMove', title: 'دفاع به موقع', icon: <Shield size={16} /> },
  { id: 'hangingPiece', title: 'مهره بی‌دفاع', icon: <ShieldAlert size={16} /> },
  { id: 'attraction', title: 'کیشش (جذب)', icon: <MousePointerClick size={16} /> },
  { id: 'deflection', title: 'انحراف مدافع', icon: <Compass size={16} /> },
  { id: 'smotheredMate', title: 'مات خفه', icon: <Lock size={16} /> },
  { id: 'crushing', title: 'برتری قاطع', icon: <Crown size={16} /> },
];

export default function Puzzles() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProMode, setSelectedProMode] = useState<any>(null);
  
  // 🔥 GOD MODE ACTIVE: برای تست تمام محدودیت‌ها برداشته شد
  // هر وقت خواستی برگرده به حالت عادی، این رو بکن false
  const isUserPremium = true; 

  const defaultQuotas = { mistakes: 3, rated: 5, themes: 5, rush: 1 };
  const [quotas, setQuotas] = useState(() => {
    const saved = localStorage.getItem('farzin_puzzle_quotas');
    return saved ? JSON.parse(saved) : defaultQuotas;
  });

  const puzzleStats = {
    rating: 1850,
    streak: 12,
    personalMistakes: 5
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const consumeQuota = (type: keyof typeof defaultQuotas) => {
    if (quotas[type] > 0) {
      const newQuotas = { ...quotas, [type]: quotas[type] - 1 };
      setQuotas(newQuotas);
      localStorage.setItem('farzin_puzzle_quotas', JSON.stringify(newQuotas));
      return true;
    }
    return false;
  };

  const handleModeClick = (mode: any) => {
    // در حالت God Mode این شرط همیشه برقراره
    if (mode.isFree || isUserPremium) {
      navigate(`/puzzle/${mode.id}`); 
    } else {
      setSelectedProMode(mode);
    }
  };

  const handleUseQuota = () => {
    if (selectedProMode && consumeQuota(selectedProMode.type)) {
      const targetId = selectedProMode.id; 
      setSelectedProMode(null);
      navigate(`/puzzle/${targetId}`); 
    }
  };

  const filteredThemes = useMemo(() => {
    if (!searchQuery.trim()) return ALL_THEMES;
    return ALL_THEMES.filter(t => t.title.includes(searchQuery));
  }, [searchQuery]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const item = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
  };

  const QuotaBadge = ({ current, max }: { current: number, max: number }) => (
    <div className={`absolute top-4 left-4 px-2.5 py-1 text-[10px] font-black tracking-widest flex items-center gap-1.5 rounded-lg border shadow-sm z-20 ${current > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
        {current > 0 ? <Play size={10} fill="currentColor" /> : <Lock size={10} />}
        {current}/{max}
    </div>
  );

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-24 overflow-x-hidden relative" 
        dir="rtl"
      >
        {/* 🔥 نشانگر God Mode برای برنامه‌نویس */}
        {isUserPremium && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600/90 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse pointer-events-none">
            GOD MODE ACTIVE 🚀
          </div>
        )}

        {/* --- Header --- */}
        <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between z-30 sticky top-0 bg-[#161512]/80 backdrop-blur-xl border-b border-[#35332e]">
          <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors active:scale-90 bg-[#262421] p-2.5 rounded-xl border border-[#35332e]">
            <ChevronRight size={22} />
          </button>
          
          <div className="flex flex-col items-center ml-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <Target size={18} className="text-farzin-accent" />
                  باشگاه پازل‌ها
              </h1>
          </div>
          
          <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-end">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">ریتینگ</span>
                  <span className="font-mono text-sm font-black text-amber-400">{puzzleStats.rating}</span>
              </div>
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-1.5 rounded-lg shadow-inner">
                  <Flame size={16} className="text-orange-500" fill="currentColor" />
                  <span className="font-black text-xs text-orange-500">{puzzleStats.streak}</span>
              </div>
          </div>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate={isLoaded ? "show" : "hidden"}
          className="w-full max-w-2xl px-4 mt-6 flex flex-col gap-5"
        >
          
          {/* --- Daily Puzzle --- */}
          <motion.div variants={item}>
              <div 
                onClick={() => handleModeClick({ id: 'daily', isFree: true })}
                className="relative w-full rounded-[24px] overflow-hidden border border-blue-500/30 shadow-[0_10px_40px_rgba(59,130,246,0.15)] group cursor-pointer active:scale-[0.98] transition-all duration-300 bg-gradient-to-br from-[#1c2438] to-[#161512]"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none"></div>
                  
                  <div className="absolute top-4 left-4 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase rounded-lg border border-blue-500/30 flex items-center gap-1 shadow-sm">
                      <Sparkles size={12} /> رایگان
                  </div>

                  <div className="relative z-10 p-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                              <Calendar size={26} className="text-blue-400" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">منتخب امروز</span>
                              <h2 className="text-2xl font-black text-white">پازل روزانه</h2>
                          </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed mt-1 opacity-90">
                          با حل پازل اختصاصی امروز، شعله استریک (🔥) خودت رو روشن نگه دار.
                      </p>
                  </div>
              </div>
          </motion.div>

          {/* --- Rush Card (full width) --- */}
          <motion.div variants={item}>
              <div
                onClick={() => handleModeClick({ id: 'rush', type: 'rush', title: 'رگبار پازل', icon: <Zap size={24} className="text-yellow-500" fill="currentColor" />, color: 'text-yellow-500', max: 1 })}
                className="relative bg-gradient-to-br from-[#1e1c19] to-[#2a2415] rounded-[24px] border border-yellow-500/20 hover:border-yellow-500/40 shadow-lg p-5 cursor-pointer transition-all group active:scale-95 overflow-hidden"
              >
                  {!isUserPremium && <QuotaBadge current={quotas.rush} max={1} />}
                  <div className="absolute -bottom-5 -left-5 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
                      <Zap size={100} className="text-yellow-500" fill="currentColor" />
                  </div>
                  <div className="flex items-center gap-4 z-10 relative">
                      <div className="w-12 h-12 rounded-[16px] bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0">
                          <Zap size={24} className="text-yellow-500" fill="currentColor" />
                      </div>
                      <div className="flex flex-col flex-1">
                          <h3 className="font-black text-white text-sm">رگبار پازل</h3>
                          <span className="text-[10px] text-zinc-500 font-bold mt-0.5">حل سرعتی رقابتی یا تمرینی</span>
                      </div>
                      <div className="flex gap-1.5 z-10">
                          <span className="bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[9px] font-black px-2 py-1 rounded-lg">رقابتی</span>
                          <span className="bg-farzin-accent/15 border border-farzin-accent/30 text-farzin-accent text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1"><Dumbbell size={9}/> تمرینی</span>
                      </div>
                  </div>
              </div>
          </motion.div>

          {/* --- Mistakes & Personal Puzzles Grid --- */}
          <motion.div variants={item} className="grid grid-cols-2 gap-4">

              <div
                onClick={() => navigate('/puzzle/mistake-analysis')}
                className="col-span-1 relative bg-[#1e1c19] rounded-[24px] border border-[#35332e] hover:border-farzin-accent/40 shadow-lg p-5 cursor-pointer transition-all group active:scale-95 flex flex-col justify-between overflow-hidden min-h-[150px]"
              >
                  <div className="w-12 h-12 rounded-[16px] bg-farzin-accent/10 flex items-center justify-center border border-farzin-accent/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                      <BrainCircuit size={24} className="text-farzin-accent" />
                  </div>
                  <div className="flex flex-col mt-4">
                      <h3 className="font-black text-white text-sm">مرور اشتباهات</h3>
                      <span className="text-[10px] text-zinc-400 font-bold mt-0.5">از بازی‌های واقعی خودت</span>
                  </div>
              </div>

              <div
                onClick={() => navigate('/puzzle/personal')}
                className="col-span-1 relative bg-gradient-to-br from-[#1e1c19] to-[#1a1528] rounded-[24px] border border-purple-500/25 hover:border-purple-500/50 shadow-lg p-5 cursor-pointer transition-all group active:scale-95 flex flex-col justify-between overflow-hidden min-h-[150px]"
              >
                  <div className="absolute -bottom-4 -left-4 opacity-8 rotate-12 group-hover:scale-110 transition-transform duration-500">
                      <Brain size={80} className="text-purple-500" />
                  </div>
                  <div className="w-12 h-12 rounded-[16px] bg-purple-500/15 flex items-center justify-center border border-purple-500/25 group-hover:scale-110 group-hover:rotate-3 transition-transform z-10">
                      <Sparkles size={22} className="text-purple-400" />
                  </div>
                  <div className="flex flex-col mt-4 z-10">
                      <h3 className="font-black text-white text-sm">پازل‌های شخصی</h3>
                      <span className="text-[10px] text-purple-400/80 font-bold mt-0.5">ساخته شده با Maia AI</span>
                  </div>
              </div>
          </motion.div>

          {/* --- Theme Library Section --- */}
          <motion.div variants={item} className="mt-4 flex flex-col gap-4 bg-[#1e1c19] border border-[#35332e] rounded-[28px] p-5 shadow-lg">
              
              <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                          <div className="w-8 h-8 rounded-lg bg-[#262421] border border-[#35332e] flex items-center justify-center">
                              <Star size={16} className="text-blue-400" fill="currentColor" />
                          </div>
                          <h2 className="font-black text-base">کتابخانه تاکتیک‌ها</h2>
                      </div>
                      {!isUserPremium && (
                          <div className={`px-2.5 py-1 text-[10px] font-black tracking-widest flex items-center gap-1.5 rounded-lg border ${quotas.themes > 0 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                              {quotas.themes > 0 ? <Play size={10} fill="currentColor" /> : <Lock size={10} />}
                              سهمیه: {quotas.themes}/5
                          </div>
                      )}
                  </div>

                  <div className="relative w-full">
                      <div className="absolute inset-y-0 right-0 pl-3 pr-4 flex items-center pointer-events-none">
                          <Search size={16} className="text-zinc-500" />
                      </div>
                      <input 
                          type="text" 
                          placeholder="جستجوی تاکتیک (مثلاً آچمز، مات...)" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#161512] border border-[#35332e] text-zinc-200 text-xs font-bold rounded-xl focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 block py-3.5 pr-10 pl-4 transition-all placeholder-zinc-600 outline-none"
                      />
                      {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 left-0 pl-4 pr-3 flex items-center text-zinc-500 hover:text-white transition-colors">
                              <X size={14} />
                          </button>
                      )}
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                  <AnimatePresence>
                      {filteredThemes.length === 0 ? (
                          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="col-span-2 py-8 flex flex-col items-center justify-center text-zinc-500">
                              <Search size={24} className="mb-2 opacity-50" />
                              <span className="text-xs font-bold">تاکتیکی پیدا نشد!</span>
                          </motion.div>
                      ) : (
                          filteredThemes.map((theme) => (
                              <motion.button
                                  layout
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.2 }}
                                  key={theme.id}
                                  onClick={() => handleModeClick({ id: `theme_${theme.id}`, type: 'themes', title: theme.title, icon: theme.icon, max: 5 })}
                                  className="col-span-1 flex items-center justify-between p-3 bg-[#262421] rounded-xl border border-[#35332e] hover:border-[#52525b] hover:bg-[#2c2a27] transition-all group active:scale-95"
                              >
                                  <span className="font-bold text-[11px] text-zinc-300 group-hover:text-white transition-colors">{theme.title}</span>
                                  <div className="w-7 h-7 rounded-md bg-[#161512] flex items-center justify-center border border-[#35332e] text-zinc-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                                      {theme.icon}
                                  </div>
                              </motion.button>
                          ))
                      )}
                  </AnimatePresence>
              </div>

          </motion.div>

        </motion.div>
      </motion.div>

      {/* --- پاپ‌آپ استراتژیک Freemium --- */}
      <AnimatePresence>
        {selectedProMode && !isUserPremium && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:px-4"
            dir="rtl"
            onClick={() => setSelectedProMode(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-sm bg-[#1e1c19] border-t sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pb-safe"
            >
                <div className="h-32 w-full relative bg-[#262421] flex items-center justify-center border-b border-[#35332e]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 to-transparent"></div>
                    <button onClick={() => setSelectedProMode(null)} className="absolute top-4 right-4 p-2 bg-[#161512] rounded-full text-zinc-400 hover:text-white transition-colors z-10">
                        <X size={18} />
                    </button>
                    <div className={`w-16 h-16 rounded-[20px] bg-[#161512] border border-[#35332e] flex items-center justify-center shadow-2xl relative z-10 text-white`}>
                        {selectedProMode.icon}
                    </div>
                </div>

                <div className="p-6 pt-5 flex flex-col items-center text-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="font-black text-white text-lg">{selectedProMode.title}</h3>
                        <p className="text-xs text-zinc-400 flex items-center justify-center gap-1">
                            محتوای <Crown size={12} className="text-amber-500" /> <span className="text-amber-500 font-bold tracking-widest">VIP</span>
                        </p>
                    </div>

                    <div className={`p-4 rounded-2xl border w-full flex items-start gap-3 text-right ${quotas[selectedProMode.type as keyof typeof defaultQuotas] > 0 ? 'bg-amber-500/10 border-amber-500/30 text-zinc-200' : 'bg-[#161512] border-[#35332e] text-zinc-400'}`}>
                        <Info size={20} className={`shrink-0 mt-0.5 ${quotas[selectedProMode.type as keyof typeof defaultQuotas] > 0 ? 'text-amber-500' : 'text-zinc-500'}`} />
                        <div className="flex flex-col gap-1">
                            <p className="text-[12px] leading-relaxed">
                                {quotas[selectedProMode.type as keyof typeof defaultQuotas] > 0 
                                    ? <>شما <b>{quotas[selectedProMode.type as keyof typeof defaultQuotas]} سهمیه رایگان</b> از {selectedProMode.max} سهمیه امروز را برای این بخش دارید. مایلید یکی را مصرف کنید؟</>
                                    : <>سهمیه رایگان روزانه شما برای این بخش تمام شده است. برای دسترسی نامحدود ارتقا دهید.</>
                                }
                            </p>
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-3 mt-2">
                        {quotas[selectedProMode.type as keyof typeof defaultQuotas] > 0 ? (
                            <>
                                <button onClick={handleUseQuota} className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-amber-500 text-[#161512] shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:bg-amber-400 active:scale-95 transition-all">
                                    <Play size={16} fill="currentColor" />
                                    شروع (کسر ۱ سهمیه)
                                </button>
                                <button className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#161512] text-zinc-300 border border-[#35332e] hover:bg-[#262421] active:scale-95 transition-all">
                                    <Sparkles size={16} className="text-amber-400" />
                                    ارتقا به حساب نامحدود
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_5px_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all">
                                    <Sparkles size={18} />
                                    خرید حساب ویژه (VIP)
                                </button>
                                <button onClick={() => setSelectedProMode(null)} className="w-full py-3 rounded-xl font-bold text-xs text-zinc-500 hover:text-white transition-all">
                                    شاید بعداً
                                </button>
                            </>
                        )}
                    </div>
                </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}