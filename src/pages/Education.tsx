import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, PlayCircle, Lock, BookOpen, Clock, 
  Award, Star, TrendingUp, Crown, CheckCircle2, Play, Target
} from 'lucide-react';

// دیتای تستی دوره‌های آموزشی
const mockCourses = [
  { 
    id: 'c1', title: 'تسلط بر دفاع سیسیلی', instructor: 'استادبزرگ گری کاسپاروف', category: 'openings',
    level: 'پیشرفته', duration: '۴ ساعت و ۳۰ دقیقه', progress: 45, isPremium: true,
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'c2', title: 'مبانی آخر بازی (Endgame)', instructor: 'مگنوس کارلسن', category: 'endgame',
    level: 'مبتدی تا متوسط', duration: '۲ ساعت و ۱۵ دقیقه', progress: 100, isPremium: false,
    image: 'https://images.unsplash.com/photo-1580541832626-2a71562b5356?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'c3', title: 'تاکتیک‌های میخائیل تال', instructor: 'تیم فرزین', category: 'tactics',
    level: 'متوسط', duration: '۳ ساعت', progress: 0, isPremium: true,
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'c4', title: 'استراتژی‌های وسط بازی', instructor: 'استادبزرگ فیروزجا', category: 'middlegame',
    level: 'پیشرفته', duration: '۵ ساعت و ۲۰ دقیقه', progress: 0, isPremium: true,
    image: 'https://images.unsplash.com/photo-1610633389735-a131bfa599cc?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'c5', title: 'دام‌های شروع بازی', instructor: 'تیم فرزین', category: 'openings',
    level: 'مبتدی', duration: '۱ ساعت و ۴۵ دقیقه', progress: 15, isPremium: false,
    image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?q=80&w=400&auto=format&fit=crop'
  },
];

// لیست دسته‌بندی‌ها
const categories = [
  { id: 'all', title: 'همه دوره‌ها', icon: <BookOpen size={16} /> },
  { id: 'openings', title: 'شروع بازی', icon: <TrendingUp size={16} /> },
  { id: 'middlegame', title: 'وسط بازی', icon: <Target size={16} /> }, // مشکل اینجا بود که حل شد
  { id: 'endgame', title: 'آخر بازی', icon: <Award size={16} /> },
  { id: 'tactics', title: 'تاکتیک‌ها', icon: <Star size={16} /> },
];

export default function Education() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoaded, setIsLoaded] = useState(false);

  // فرض می‌کنیم کاربر هنوز اکانت VIP نخریده تا قفل‌ها نمایش داده بشن
  const isUserPremium = false; 

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const filteredCourses = activeCategory === 'all' 
    ? mockCourses 
    : mockCourses.filter(c => c.category === activeCategory);

  // دوره‌ای که کاربر در حال دیدن آن است (Featured)
  const inProgressCourse = mockCourses.find(c => c.progress > 0 && c.progress < 100);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-24 overflow-x-hidden" 
      dir="rtl"
    >
      {/* هدر صفحه */}
      <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between z-20 sticky top-0 bg-[#161512]/90 backdrop-blur-xl border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90 bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]">
          <ChevronRight size={24} />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="text-lg font-black tracking-tight text-white uppercase drop-shadow-md">آکادمی فرزین</h1>
            <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1">
                <Crown size={10} /> Masterclass
            </span>
        </div>
        <div className="w-10"></div>
      </div>

      <div className={`w-full max-w-2xl px-4 mt-4 flex flex-col gap-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* 🔥 بنر قهرمان (ادامه یادگیری یا دوره ویژه) */}
        {inProgressCourse && (
            <div className="relative w-full rounded-[28px] overflow-hidden border border-[#35332e] shadow-2xl group cursor-pointer active:scale-[0.98] transition-all duration-300">
                <div className="absolute inset-0">
                    <img src={inProgressCourse.image} alt={inProgressCourse.title} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161512] via-[#161512]/80 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent"></div>
                </div>
                
                <div className="relative z-10 p-6 pt-24 flex flex-col justify-end h-full">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-black tracking-widest text-white w-max mb-3 uppercase">ادامه یادگیری</span>
                    <h2 className="text-2xl font-black text-white drop-shadow-lg mb-2">{inProgressCourse.title}</h2>
                    <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold mb-5">
                        <span className="text-farzin-accent">{inProgressCourse.instructor}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                        <span className="flex items-center gap-1"><Clock size={12}/> {inProgressCourse.duration}</span>
                    </div>

                    {/* نوار پیشرفت روی بنر */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-white">{inProgressCourse.progress}٪ تکمیل شده</span>
                            <span className="text-farzin-accent flex items-center gap-1"><PlayCircle size={12} fill="currentColor" /> ادامه پخش</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                            <div className="h-full bg-farzin-accent rounded-full shadow-[0_0_10px_rgba(119,149,86,0.8)]" style={{ width: `${inProgressCourse.progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* منوی تب‌های دسته‌بندی */}
        <div className="relative flex overflow-x-auto gap-2 pb-4 pt-1 no-scrollbar px-1">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13px] whitespace-nowrap transition-colors duration-300 outline-none ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="eduCategoryPill"
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

        {/* 🔥 لیست دوره‌ها (کارت‌های سینمایی) */}
        <div className="flex flex-col gap-5">
            <AnimatePresence mode="popLayout">
                {filteredCourses.map((course, index) => {
                    const isLocked = course.isPremium && !isUserPremium;
                    
                    return (
                        <motion.div
                            layout
                            key={course.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.25, delay: index * 0.05 }}
                            className={`relative bg-[#1e1c19] rounded-[24px] border ${isLocked ? 'border-[#35332e]/50' : 'border-[#35332e] hover:border-[#52525b]'} shadow-xl overflow-hidden flex flex-row cursor-pointer transition-all duration-300 group active:scale-[0.98] h-36`}
                        >
                            {/* تصویر کاور دوره (سمت راست در RTL) */}
                            <div className="w-1/3 relative shrink-0 overflow-hidden border-l border-[#35332e]">
                                <img src={course.image} alt={course.title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isLocked ? 'grayscale opacity-50' : ''}`} />
                                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#1e1c19]/90"></div>
                                
                                {/* آیکون پلی روی عکس */}
                                {!isLocked && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-10 h-10 rounded-full bg-farzin-accent/90 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
                                            <Play size={18} fill="currentColor" className="ml-1" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* اطلاعات دوره */}
                            <div className="flex-1 p-4 pl-5 flex flex-col justify-center relative">
                                
                                {/* نشانگر پریمیوم / قفل */}
                                {course.isPremium && (
                                    <div className={`absolute top-3 left-4 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase flex items-center gap-1 border ${isLocked ? 'bg-zinc-800/80 text-zinc-400 border-zinc-700' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                        {isLocked ? <Lock size={10} /> : <Crown size={10} />}
                                        VIP
                                    </div>
                                )}

                                <h3 className={`font-black text-[14px] leading-tight mb-1.5 pr-1 ${isLocked ? 'text-zinc-400' : 'text-white'}`}>{course.title}</h3>
                                <p className="text-[11px] font-bold text-zinc-500 mb-3 pr-1">{course.instructor}</p>

                                <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 mt-auto pr-1">
                                    <div className="flex items-center gap-1.5 bg-[#161512] px-2 py-1 rounded-lg border border-[#35332e]">
                                        <TrendingUp size={12} className={isLocked ? 'text-zinc-600' : 'text-blue-400'} />
                                        <span>{course.level}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-[#161512] px-2 py-1 rounded-lg border border-[#35332e]">
                                        <Clock size={12} className={isLocked ? 'text-zinc-600' : 'text-farzin-accent'} />
                                        <span>{course.duration}</span>
                                    </div>
                                </div>

                                {/* نمایش پیشرفت یا تیک تکمیل */}
                                {!isLocked && course.progress === 100 && (
                                    <div className="absolute bottom-3 left-4">
                                        <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}