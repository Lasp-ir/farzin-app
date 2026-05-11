import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronRight, Flame, Target, Zap, Swords, BrainCircuit, 
  Calendar, ArrowRight, Star, Crosshair, Shield, Activity, Crown
} from 'lucide-react';

const thematicCategories = [
  { id: 'mateIn1', title: 'مات در یک حرکت', icon: <Target size={14} /> },
  { id: 'mateIn2', title: 'مات در دو حرکت', icon: <Crosshair size={14} /> },
  { id: 'fork', title: 'چنگال (Fork)', icon: <ArrowRight size={14} /> },
  { id: 'pin', title: 'آچمز (Pin)', icon: <Shield size={14} /> },
  { id: 'endgame', title: 'آخر بازی', icon: <Activity size={14} /> },
];

export default function Puzzles() {
  const navigate = useNavigate();
  const [activeTheme, setActiveTheme] = useState('mateIn2');
  const [isLoaded, setIsLoaded] = useState(false);

  // دیتای کاربری فرضی برای پازل‌ها
  const puzzleStats = {
    rating: 1850,
    streak: 12,
    personalMistakes: 5 // تعداد پازل‌های استخراج شده از بازی‌های کاربر
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // تنظیمات انیمیشن برای ورود المان‌ها به ترتیب
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
      {/* هدر صفحه و آمار کاربر */}
      <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between z-20 sticky top-0 bg-[#161512]/90 backdrop-blur-xl border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90 bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]">
          <ChevronRight size={24} />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="text-lg font-black tracking-tight text-white uppercase drop-shadow-md">بخش پازل‌ها</h1>
            <span className="text-[10px] text-farzin-accent font-bold tracking-widest uppercase mt-0.5">Tactics Training</span>
        </div>
        
        <div className="flex items-center gap-3">
            {/* نشانگر ریتینگ پازل */}
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ریتینگ</span>
                <span className="font-mono text-sm font-black text-amber-400">{puzzleStats.rating}</span>
            </div>
            {/* نشانگر روزهای متوالی (Streak) */}
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
        
        {/* 🔥 کارت قهرمان: یادگیری از اشتباهات (Personal Puzzles) */}
        <motion.div variants={item}>
            <div className="relative w-full rounded-[28px] overflow-hidden border border-farzin-accent/30 shadow-[0_10px_30px_rgba(119,149,86,0.15)] group cursor-pointer active:scale-[0.98] transition-all duration-300 bg-gradient-to-br from-[#1e1c19] to-[#20281b]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-farzin-accent/10 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="relative z-10 p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-farzin-accent/10 flex items-center justify-center border border-farzin-accent/20">
                                <BrainCircuit size={20} className="text-farzin-accent" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black tracking-widest text-farzin-accent uppercase">هوش مصنوعی فرزین</span>
                                <h2 className="text-lg font-black text-white">یادگیری از اشتباهات</h2>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-red-400">{puzzleStats.personalMistakes} اشتباه اخیر</span>
                        </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed max-w-[90%]">
                        ما حرکات ضعیف شما در بازی‌های اخیر را شناسایی کرده‌ایم. آن‌ها را به صورت پازل حل کنید تا دیگر تکرار نشوند.
                    </p>

                    <button className="mt-2 w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-farzin-accent text-white shadow-[0_4px_15px_rgba(119,149,86,0.4)] hover:bg-[#86a566] transition-colors">
                        <ArrowRight size={16} />
                        شروع مرور اشتباهات
                    </button>
                </div>
            </div>
        </motion.div>

        {/* گرید حالت‌های بازی مسابقه‌ای */}
        <motion.div variants={item} className="grid grid-cols-2 gap-4">
            
            {/* رگبار پازل (Puzzle Rush) - تم الکتریک زرد */}
            <div className="col-span-2 sm:col-span-1 relative bg-gradient-to-br from-[#1e1c19] to-[#2a2415] rounded-[24px] border border-yellow-500/30 shadow-[0_5px_20px_rgba(234,179,8,0.1)] p-5 cursor-pointer hover:border-yellow-500/50 transition-all group active:scale-95 overflow-hidden">
                <div className="absolute -bottom-6 -left-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
                    <Zap size={100} className="text-yellow-500" fill="currentColor" />
                </div>
                <div className="relative z-10 flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 mb-2">
                        <Zap size={20} className="text-yellow-500" fill="currentColor" />
                    </div>
                    <h3 className="font-black text-white text-lg">رگبار پازل</h3>
                    <p className="text-[11px] text-zinc-400">حل بیشترین تعداد پازل در ۳ دقیقه! رکورد بزنید.</p>
                </div>
            </div>

            {/* نبرد پازل (Puzzle Battle) - تم قرمز خشن */}
            <div className="col-span-2 sm:col-span-1 relative bg-[#1e1c19] rounded-[24px] border border-[#35332e] shadow-lg p-5 overflow-hidden group cursor-not-allowed opacity-80">
                <div className="absolute top-4 left-4 px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-black rounded-lg border border-rose-500/20 uppercase tracking-wider">به‌زودی</div>
                <div className="absolute -bottom-4 -left-4 opacity-5 rotate-12">
                    <Swords size={90} className="text-rose-500" />
                </div>
                <div className="relative z-10 flex flex-col gap-2 grayscale">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30 mb-2">
                        <Swords size={20} className="text-rose-500" />
                    </div>
                    <h3 className="font-black text-zinc-300 text-lg">نبرد پازل</h3>
                    <p className="text-[11px] text-zinc-500">رقابت همزمان با یک بازیکن دیگر آنلاین.</p>
                </div>
            </div>

            {/* پازل روزانه (Daily) */}
            <div className="col-span-1 bg-[#1e1c19] rounded-[24px] border border-[#35332e] shadow-lg p-5 cursor-pointer hover:bg-[#22201d] transition-all group active:scale-95 flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-1 group-hover:scale-110 transition-transform">
                    <Calendar size={22} className="text-blue-400" />
                </div>
                <h3 className="font-black text-white text-sm">پازل روزانه</h3>
                <span className="text-[10px] text-zinc-500 font-bold">پازل منتخب امروز</span>
            </div>

            {/* تمرین امتیازی (Rated) */}
            <div className="col-span-1 bg-[#1e1c19] rounded-[24px] border border-[#35332e] shadow-lg p-5 cursor-pointer hover:bg-[#22201d] transition-all group active:scale-95 flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-1 group-hover:scale-110 transition-transform">
                    <Target size={22} className="text-emerald-500" />
                </div>
                <h3 className="font-black text-white text-sm">تمرین امتیازی</h3>
                <span className="text-[10px] text-zinc-500 font-bold">افزایش ریتینگ پازل</span>
            </div>

        </motion.div>

        {/* بخش تمرینات موضوعی */}
        <motion.div variants={item} className="mt-2 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1 text-farzin-accent">
                <Star size={18} />
                <h2 className="font-black text-sm uppercase tracking-widest">تمرینات موضوعی</h2>
            </div>
            
            <div className="relative flex overflow-x-auto gap-2 pb-2 pt-1 no-scrollbar px-1">
                {thematicCategories.map(cat => {
                    const isActive = activeTheme === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTheme(cat.id)}
                            className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13px] whitespace-nowrap transition-colors duration-300 outline-none ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {isActive && (
                                <motion.div 
                                    layoutId="themeCategoryPill"
                                    className="absolute inset-0 bg-[#262421] border border-[#403e3a] rounded-2xl shadow-lg"
                                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <span className={isActive ? "text-farzin-accent" : ""}>{cat.icon}</span>
                                {cat.title}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* پیش‌نمایش تم انتخاب شده */}
            <div className="bg-[#1e1c19] rounded-[24px] border border-[#35332e] p-5 flex items-center justify-between shadow-inner">
                <div className="flex flex-col gap-1">
                    <span className="text-white font-black text-sm">مجموعه پازل‌های {thematicCategories.find(t => t.id === activeTheme)?.title}</span>
                    <span className="text-[11px] text-zinc-500">شامل بیش از ۱۰۰۰ پازل طبقه‌بندی شده</span>
                </div>
                <button className="w-10 h-10 rounded-xl bg-[#262421] border border-[#403e3a] flex items-center justify-center text-white hover:bg-farzin-accent hover:border-farzin-accent transition-colors">
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                </button>
            </div>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}