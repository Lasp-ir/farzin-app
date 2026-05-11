import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Flame, Target, Zap, Swords, BrainCircuit, 
  Calendar, ArrowRight, Star, Crosshair, Shield, Activity, 
  Crown, Play, Lock, Sparkles, X, Info, TrendingUp, Search
} from 'lucide-react';

// 🔥 افزایش تنوع تم‌های تمرینی برای جذابیت بیشتر
const thematicCategories = [
  { id: 'mateIn1', title: 'مات در ۱ حرکت', icon: <Target size={18} /> },
  { id: 'mateIn2', title: 'مات در ۲ حرکت', icon: <Crosshair size={18} /> },
  { id: 'fork', title: 'چنگال (Fork)', icon: <ArrowRight size={18} /> },
  { id: 'pin', title: 'آچمز (Pin)', icon: <Shield size={18} /> },
  { id: 'skewer', title: 'سیخ‌کباب (Skewer)', icon: <Swords size={18} /> },
  { id: 'discovered', title: 'حمله برخاسته', icon: <Search size={18} /> },
  { id: 'sacrifice', title: 'قربانی دادن', icon: <Flame size={18} /> },
  { id: 'passedPawn', title: 'پیاده رونده', icon: <TrendingUp size={18} /> },
  { id: 'endgame', title: 'آخر بازی', icon: <Activity size={18} /> },
];

export default function Puzzles() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  const [selectedProMode, setSelectedProMode] = useState<any>(null);
  const isUserPremium = false; // کاربر رایگان

  // 🔥 سهمیه رگبار پازل به ۱ کاهش یافت تا ارزشش بیشتر بشه
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
    if (mode.isFree || isUserPremium) {
      console.log('Direct entry to:', mode.id);
      // navigate(`/puzzle/${mode.id}`);
    } else {
      setSelectedProMode(mode);
    }
  };

  const handleUseQuota = () => {
    if (selectedProMode && consumeQuota(selectedProMode.type)) {
      console.log('Started mode with quota:', selectedProMode.id);
      setSelectedProMode(null);
      // navigate(`/puzzle/${selectedProMode.id}`);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const QuotaBadge = ({ current, max }: { current: number, max: number }) => (
    <div className={`absolute top-4 left-4 px-2 py-0.5 text-[9px] font-black tracking-widest flex items-center gap-1 rounded-lg border shadow-sm z-20 ${current > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
        {current > 0 ? <Play size={8} fill="currentColor" /> : <Lock size={8} />}
        {current}/{max}
    </div>
  );

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
        <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between z-20 sticky top-0 bg-[#161512]/90 backdrop-blur-xl border-b border-white/5">
          <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90 bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]">
            <ChevronRight size={24} />
          </button>
          
          <div className="flex flex-col items-center ml-4">
              <h1 className="text-lg font-black tracking-tight text-white uppercase drop-shadow-md">پازل‌های فرزین</h1>
              <span className="text-[10px] text-farzin-accent font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1">
                <Target size={10} /> Daily Tactics
              </span>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ریتینگ</span>
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
          className="w-full max-w-2xl px-4 mt-6 flex flex-col gap-6"
        >
          
          {/* 1. پازل روزانه */}
          <motion.div variants={item}>
              <div 
                onClick={() => handleModeClick({ id: 'daily', isFree: true })}
                className="relative w-full rounded-[28px] overflow-hidden border border-blue-500/30 shadow-[0_10px_30px_rgba(59,130,246,0.15)] group cursor-pointer active:scale-[0.98] transition-all duration-300 bg-gradient-to-br from-[#1c2438] to-[#161512]"
              >
                  <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[50px] -ml-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="absolute top-4 left-4 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase rounded-lg border border-blue-500/30 flex items-center gap-1 shadow-sm">
                      رایگان
                  </div>

                  <div className="relative z-10 p-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-[16px] bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                              <Calendar size={24} className="text-blue-400" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">منتخب امروز</span>
                              <h2 className="text-xl font-black text-white">پازل روزانه</h2>
                          </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                          با حل پازل روزانه، استریک (🔥) خود را حفظ کنید. یک چالش زیبا و رایگان برای شروع روز!
                      </p>

                      <button className="mt-2 w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white shadow-lg transition-all">
                          <Play size={16} fill="currentColor" />
                          حل پازل امروز
                      </button>
                  </div>
              </div>
          </motion.div>

          {/* 2. یادگیری از اشتباهات */}
          <motion.div variants={item}>
              <div 
                onClick={() => handleModeClick({ id: 'mistakes', type: 'mistakes', title: 'یادگیری از اشتباهات', icon: <BrainCircuit size={24} className="text-farzin-accent" />, color: 'text-farzin-accent', max: 3 })}
                className="relative w-full rounded-[24px] overflow-hidden border border-[#35332e] hover:border-farzin-accent/40 shadow-lg group cursor-pointer active:scale-[0.98] transition-all duration-300 bg-[#1e1c19]"
              >
                  {!isUserPremium && <QuotaBadge current={quotas.mistakes} max={3} />}

                  <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[16px] bg-farzin-accent/10 flex items-center justify-center border border-farzin-accent/20 group-hover:scale-110 transition-transform">
                              <BrainCircuit size={22} className="text-farzin-accent" />
                          </div>
                          <div className="flex flex-col">
                              <h3 className="font-black text-white text-md">یادگیری از اشتباهات</h3>
                              <div className="flex items-center gap-2 mt-1">
                                  <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                  </span>
                                  <span className="text-[11px] font-bold text-zinc-400">{puzzleStats.personalMistakes} اشتباه از بازی‌های اخیر</span>
                              </div>
                          </div>
                      </div>
                      <ChevronRight size={20} className="text-zinc-600 group-hover:text-farzin-accent transition-colors" />
                  </div>
              </div>
          </motion.div>

          {/* 3. گرید حالت‌های بازی */}
          <motion.div variants={item} className="grid grid-cols-2 gap-4">
              
              <div 
                onClick={() => handleModeClick({ id: 'rated', type: 'rated', title: 'تمرین امتیازی', icon: <Target size={24} className="text-emerald-500" />, color: 'text-emerald-500', max: 5 })}
                className="col-span-1 relative bg-[#1e1c19] rounded-[24px] border border-[#35332e] hover:border-emerald-500/40 shadow-lg p-5 cursor-pointer transition-all group active:scale-95 flex flex-col gap-3 overflow-hidden"
              >
                  {!isUserPremium && <QuotaBadge current={quotas.rated} max={5} />}
                  <div className="w-10 h-10 rounded-[14px] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Target size={20} className="text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                      <h3 className="font-black text-white text-sm">تمرین امتیازی</h3>
                      <span className="text-[10px] text-zinc-400 font-bold mt-0.5">افزایش ریتینگ پازل</span>
                  </div>
              </div>

              {/* رگبار پازل با سهمیه 1 */}
              <div 
                onClick={() => handleModeClick({ id: 'rush', type: 'rush', title: 'رگبار پازل', icon: <Zap size={24} className="text-yellow-500" fill="currentColor" />, color: 'text-yellow-500', max: 1 })}
                className="col-span-1 relative bg-gradient-to-br from-[#1e1c19] to-[#2a2415] rounded-[24px] border border-yellow-500/20 hover:border-yellow-500/50 shadow-lg p-5 cursor-pointer transition-all group active:scale-95 flex flex-col gap-3 overflow-hidden"
              >
                  {!isUserPremium && <QuotaBadge current={quotas.rush} max={1} />}
                  <div className="w-10 h-10 rounded-[14px] bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 group-hover:scale-110 transition-transform z-10">
                      <Zap size={20} className="text-yellow-500" fill="currentColor" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-500">
                      <Zap size={80} className="text-yellow-500" fill="currentColor" />
                  </div>
                  <div className="flex flex-col z-10">
                      <h3 className="font-black text-white text-sm">رگبار پازل</h3>
                      <span className="text-[10px] text-zinc-400 font-bold mt-0.5">سریع‌ترین در ۳ دقیقه</span>
                  </div>
              </div>
          </motion.div>

          {/* 4. بخش تمرینات موضوعی */}
          <motion.div variants={item} className="mt-2 flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-farzin-accent">
                      <Star size={18} />
                      <h2 className="font-black text-sm uppercase tracking-widest">تمرینات موضوعی</h2>
                  </div>
                  {!isUserPremium && (
                      <div className={`px-2 py-1 text-[10px] font-black tracking-widest flex items-center gap-1 rounded-lg border ${quotas.themes > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                          {quotas.themes > 0 ? <Play size={10} fill="currentColor" /> : <Lock size={10} />}
                          سهمیه روزانه: {quotas.themes}/5
                      </div>
                  )}
              </div>
              
              <div className="flex overflow-x-auto gap-3 pb-4 pt-1 no-scrollbar px-1 snap-x">
                  {thematicCategories.map((cat, idx) => (
                      <button
                          key={cat.id}
                          onClick={() => handleModeClick({ id: `theme_${cat.id}`, type: 'themes', title: cat.title, icon: cat.icon, color: 'text-blue-400', max: 5 })}
                          className="flex-shrink-0 relative flex flex-col gap-3 p-4 w-[130px] bg-[#1e1c19] rounded-[24px] border border-[#35332e] hover:border-[#52525b] hover:bg-[#262421] transition-all duration-300 snap-center group active:scale-95"
                      >
                          <div className={`w-10 h-10 rounded-full bg-[#161512] flex items-center justify-center border border-[#35332e] group-hover:scale-110 transition-transform ${idx % 2 === 0 ? 'text-farzin-accent' : 'text-blue-400'}`}>
                              {cat.icon}
                          </div>
                          <span className="font-bold text-[11px] text-white text-right leading-tight">{cat.title}</span>
                      </button>
                  ))}
              </div>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* پاپ‌آپ استراتژیک Freemium */}
      <AnimatePresence>
        {selectedProMode && (
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
                    <button 
                        onClick={() => setSelectedProMode(null)}
                        className="absolute top-4 right-4 p-2 bg-[#161512] rounded-full text-zinc-400 hover:text-white transition-colors z-10"
                    >
                        <X size={18} />
                    </button>
                    
                    <div className={`w-16 h-16 rounded-[20px] bg-[#161512] border border-[#35332e] flex items-center justify-center shadow-2xl relative z-10 group-hover:scale-110`}>
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
                                <button 
                                    onClick={handleUseQuota}
                                    className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-amber-500 text-[#161512] shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:bg-amber-400 active:scale-95 transition-all"
                                >
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
                                <button 
                                    onClick={() => setSelectedProMode(null)}
                                    className="w-full py-3 rounded-xl font-bold text-xs text-zinc-500 hover:text-white transition-all"
                                >
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