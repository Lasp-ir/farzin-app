import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, PlayCircle, Lock, BookOpen, Clock, 
  Award, Star, TrendingUp, Crown, CheckCircle2, Play, Target,
  Sparkles, X, Info, Loader2
} from 'lucide-react';

// دیتای پشتیبان (Fallback) در صورت در دسترس نبودن بک‌اند
const fallbackCourses = [
  { id: 'c1', title: 'تسلط بر دفاع سیسیلی', instructor: 'استادبزرگ گری کاسپاروف', category: 'openings', level: 'پیشرفته', duration: '۴ ساعت و ۳۰ دقیقه', progress: 45, isPremium: true, image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=400&auto=format&fit=crop' },
  { id: 'c2', title: 'مبانی آخر بازی (Endgame)', instructor: 'مگنوس کارلسن', category: 'endgame', level: 'مبتدی تا متوسط', duration: '۲ ساعت و ۱۵ دقیقه', progress: 100, isPremium: false, image: 'https://images.unsplash.com/photo-1580541832626-2a71562b5356?q=80&w=400&auto=format&fit=crop' },
];

const categories = [
  { id: 'all', title: 'همه دوره‌ها', icon: <BookOpen size={16} /> },
  { id: 'openings', title: 'شروع بازی', icon: <TrendingUp size={16} /> },
  { id: 'middlegame', title: 'وسط بازی', icon: <Target size={16} /> },
  { id: 'endgame', title: 'آخر بازی', icon: <Award size={16} /> },
  { id: 'tactics', title: 'تاکتیک‌ها', icon: <Star size={16} /> },
];

export default function Education() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  
  // 🌟 استیت‌های مدیریت دیتا از سرور
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [selectedPreviewCourse, setSelectedPreviewCourse] = useState<any>(null);

  // فرض می‌کنیم کاربر حساب رایگان دارد
  const isUserPremium = false; 

  const [dailyQuota, setDailyQuota] = useState(() => {
    const savedQuota = localStorage.getItem('farzin_daily_quota');
    return savedQuota !== null ? parseInt(savedQuota) : 1;
  });

  // 🔥 دریافت دوره‌ها از بک‌اند
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // آدرس API بک‌اند شما (بعداً باید به آدرس واقعی تغییر کند)
        const response = await fetch('http://localhost:5000/api/courses');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setCourses(data.courses || data);
      } catch (error) {
        console.error("خطا در دریافت دوره‌ها از سرور:", error);
        // در صورت خطا، نمایش دیتای پیش‌فرض برای خالی نماندن صفحه
        setCourses(fallbackCourses);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsLoaded(true), 100);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = activeCategory === 'all' 
    ? courses 
    : courses.filter(c => c.category === activeCategory);

  const inProgressCourse = courses.find(c => c.progress > 0 && c.progress < 100);

  const handleCourseClick = (course: any) => {
    if (course.isPremium && !isUserPremium) {
      setSelectedPreviewCourse(course);
    } else {
      navigate(`/course/${course.id}`);
    }
  };

  const handleUseQuota = () => {
    setDailyQuota(0);
    localStorage.setItem('farzin_daily_quota', '0');
    const courseId = selectedPreviewCourse.id;
    setSelectedPreviewCourse(null);
    navigate(`/course/${courseId}`);
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
          <div className="w-10 flex justify-end">
            {!isUserPremium && (
                <div className={`px-2 py-1 rounded-lg border text-[10px] font-black flex items-center gap-1 shadow-inner ${dailyQuota > 0 ? 'bg-farzin-accent/10 text-farzin-accent border-farzin-accent/30' : 'bg-zinc-800 text-zinc-500 border-[#35332e]'}`}>
                    <Play size={10} fill="currentColor" />
                    <span>{dailyQuota}/1</span>
                </div>
            )}
          </div>
        </div>

        {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center mt-20">
                <Loader2 size={40} className="text-farzin-accent animate-spin mb-4" />
                <span className="text-sm font-bold text-zinc-400">در حال دریافت دوره‌ها از سرور...</span>
            </div>
        ) : (
            <div className={`w-full max-w-2xl px-4 mt-4 flex flex-col gap-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              
              {inProgressCourse && (
                  <div 
                    onClick={() => handleCourseClick(inProgressCourse)}
                    className="relative w-full rounded-[28px] overflow-hidden border border-[#35332e] shadow-2xl group cursor-pointer active:scale-[0.98] transition-all duration-300"
                  >
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

              <div className="flex flex-col gap-5">
                  <AnimatePresence mode="popLayout">
                      {filteredCourses.length > 0 ? filteredCourses.map((course, index) => {
                          return (
                              <motion.div
                                  layout
                                  key={course.id}
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.25, delay: index * 0.05 }}
                                  onClick={() => handleCourseClick(course)}
                                  className={`relative bg-[#1e1c19] rounded-[24px] border ${course.isPremium && !isUserPremium ? 'border-[#35332e] hover:border-amber-500/30' : 'border-[#35332e] hover:border-[#52525b]'} shadow-xl overflow-hidden flex flex-row cursor-pointer transition-all duration-300 group active:scale-[0.98] h-36`}
                              >
                                  <div className="w-1/3 relative shrink-0 overflow-hidden border-l border-[#35332e]">
                                      <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                      <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#1e1c19]/90"></div>
                                      
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <div className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-white shadow-lg ${course.isPremium && !isUserPremium ? 'bg-amber-500/90' : 'bg-farzin-accent/90'}`}>
                                              {course.isPremium && !isUserPremium ? <Lock size={16} /> : <Play size={18} fill="currentColor" className="ml-1" />}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex-1 p-4 pl-5 flex flex-col justify-center relative">
                                      
                                      {course.isPremium && (
                                          <div className={`absolute top-3 left-4 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase flex items-center gap-1 border bg-amber-500/10 text-amber-500 border-amber-500/30`}>
                                              <Crown size={10} />
                                              VIP
                                          </div>
                                      )}

                                      <h3 className="font-black text-[14px] leading-tight mb-1.5 pr-1 text-white">{course.title}</h3>
                                      <p className="text-[11px] font-bold text-zinc-400 mb-3 pr-1">{course.instructor}</p>

                                      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 mt-auto pr-1">
                                          <div className="flex items-center gap-1.5 bg-[#161512] px-2 py-1 rounded-lg border border-[#35332e]">
                                              <TrendingUp size={12} className={course.isPremium && !isUserPremium ? 'text-amber-500' : 'text-blue-400'} />
                                              <span>{course.level}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 bg-[#161512] px-2 py-1 rounded-lg border border-[#35332e]">
                                              <Clock size={12} className="text-zinc-500" />
                                              <span>{course.duration}</span>
                                          </div>
                                      </div>

                                      {!course.isPremium && course.progress === 100 && (
                                          <div className="absolute bottom-3 left-4">
                                              <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-md" />
                                          </div>
                                      )}
                                  </div>
                              </motion.div>
                          )
                      }) : (
                        <div className="text-center text-zinc-500 text-sm py-10 font-bold">دوره‌ای در این دسته‌بندی یافت نشد.</div>
                      )}
                  </AnimatePresence>
              </div>
            </div>
        )}
      </motion.div>

      {/* پاپ‌آپ دوره‌های پولی */}
      <AnimatePresence>
        {selectedPreviewCourse && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:px-4"
            dir="rtl"
            onClick={() => setSelectedPreviewCourse(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-sm bg-[#1e1c19] border-t sm:border border-[#35332e] rounded-t-[32px] sm:rounded-[28px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pb-safe"
            >
                <div className="h-40 w-full relative">
                    <img src={selectedPreviewCourse.image} className="w-full h-full object-cover" alt="Course" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1c19] via-[#1e1c19]/60 to-transparent"></div>
                    <button 
                        onClick={() => setSelectedPreviewCourse(null)}
                        className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-5 pb-2 text-center">
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            <Lock size={20} className="text-amber-400" />
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-2 flex flex-col items-center text-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="font-black text-white text-lg">{selectedPreviewCourse.title}</h3>
                        <p className="text-xs text-zinc-400">محتوای <span className="text-amber-400 font-bold">Premium</span></p>
                    </div>

                    <div className={`p-4 rounded-2xl border w-full flex items-start gap-3 text-right ${dailyQuota > 0 ? 'bg-farzin-accent/10 border-farzin-accent/30 text-zinc-200' : 'bg-[#161512] border-[#35332e] text-zinc-400'}`}>
                        <Info size={20} className={`shrink-0 mt-0.5 ${dailyQuota > 0 ? 'text-farzin-accent' : 'text-zinc-500'}`} />
                        <p className="text-[12px] leading-relaxed">
                            {dailyQuota > 0 
                                ? <>شما روزانه می‌توانید <b>۱ ویدیوی ویژه</b> را رایگان تماشا کنید. مایلید از سهمیه امروز خود استفاده کنید؟</>
                                : <>سهمیه تماشای رایگان امروز شما تمام شده است. برای دسترسی نامحدود به تمامی آموزش‌ها، حساب خود را ارتقا دهید.</>
                            }
                        </p>
                    </div>

                    <div className="w-full flex flex-col gap-3 mt-2">
                        {dailyQuota > 0 ? (
                            <>
                                <button 
                                    onClick={handleUseQuota}
                                    className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-farzin-accent text-white shadow-[0_4px_15px_rgba(119,149,86,0.3)] active:scale-95 transition-all"
                                >
                                    <Play size={16} fill="currentColor" />
                                    پخش با سهمیه امروز
                                </button>
                                <button className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#161512] text-amber-500 border border-[#35332e] hover:bg-[#262421] active:scale-95 transition-all">
                                    <Sparkles size={16} />
                                    ارتقا به VIP (بدون محدودیت)
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_5px_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all">
                                    <Sparkles size={18} />
                                    خرید حساب ویژه (VIP)
                                </button>
                                <button 
                                    onClick={() => setSelectedPreviewCourse(null)}
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