import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, PlayCircle, Lock, BookOpen, Clock, 
  Award, Star, TrendingUp, Crown, CheckCircle2, Play, Target,
  Sparkles, X, Info, ShieldCheck, ListVideo, Users, Loader2
} from 'lucide-react';

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
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [selectedCourseModal, setSelectedCourseModal] = useState<any>(null);
  const [modalTab, setModalTab] = useState<'about' | 'lessons'>('about');

  const isUserPremium = false; 

  const [dailyQuota, setDailyQuota] = useState(() => {
    const savedQuota = localStorage.getItem('farzin_daily_quota');
    return savedQuota !== null ? parseInt(savedQuota) : 1;
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/courses');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setCourses(data);
      } catch (error) { console.error("خطا در دریافت دوره‌ها", error); } 
      finally {
        setIsLoading(false);
        setTimeout(() => setIsLoaded(true), 100);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = activeCategory === 'all' ? courses : courses.filter(c => c.category === activeCategory);

  // 🔥 پیدا کردن آخرین دوره تماشا شده برای کارت بالای صفحه
  const lastWatchedCourseId = localStorage.getItem('farzin_last_course');
  const inProgressCourse = courses.find(c => c.id === lastWatchedCourseId) || courses[0]; // اگه هیچی ندیده بود، اولی رو پیشنهاد بده

  const handleCourseClick = (course: any) => {
    setSelectedCourseModal(course);
    setModalTab('about'); 
  };

  // 🔥 تابع هوشمند برای دکمه "شروع / ادامه"
  const handleStartOrContinue = (course: any) => {
    const savedProgress = JSON.parse(localStorage.getItem(`farzin_progress_${course.id}`) || 'null');
    
    if (savedProgress && savedProgress.lessonId) {
        // ادامه آموزش از همون جلسه
        navigate(`/course/${course.id}/play?lesson=${savedProgress.lessonId}`);
    } else {
        // شروع از اول
        navigate(`/course/${course.id}/play`);
    }
  };

  // 🔥 تابع کلیک روی یک جلسه خاص تو پاپ‌آپ
  const handlePlaySpecificLesson = (courseId: string, lessonId: string) => {
      navigate(`/course/${courseId}/play?lesson=${lessonId}`);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: "easeOut" }} className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-24 overflow-x-hidden" dir="rtl">
        <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between z-20 sticky top-0 bg-[#161512]/90 backdrop-blur-xl border-b border-white/5">
          <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white transition-transform active:scale-90 bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]"><ChevronRight size={24} /></button>
          <div className="flex flex-col items-center"><h1 className="text-lg font-black tracking-tight text-white uppercase drop-shadow-md">آکادمی فرزین</h1><span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1"><Crown size={10} /> Masterclass</span></div>
          <div className="w-10 flex justify-end">
            {!isUserPremium && (
                <div className={`px-2 py-1 rounded-lg border text-[10px] font-black flex items-center gap-1 shadow-inner ${dailyQuota > 0 ? 'bg-farzin-accent/10 text-farzin-accent border-farzin-accent/30' : 'bg-zinc-800 text-zinc-500 border-[#35332e]'}`}><Play size={10} fill="currentColor" /><span>{dailyQuota}/1</span></div>
            )}
          </div>
        </div>

        {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center mt-20"><Loader2 size={40} className="text-farzin-accent animate-spin mb-4" /><span className="text-sm font-bold text-zinc-400">در حال اتصال به آکادمی...</span></div>
        ) : (
            <div className={`w-full max-w-2xl px-4 mt-4 flex flex-col gap-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              
              {/* 🌟 کارت آخرین دوره (ادامه یادگیری) */}
              {inProgressCourse && (
                  <div onClick={() => handleStartOrContinue(inProgressCourse)} className="relative w-full rounded-[28px] overflow-hidden border border-[#35332e] shadow-2xl group cursor-pointer active:scale-[0.98] transition-all duration-300">
                      <div className="absolute inset-0">
                          <img src={inProgressCourse.image} alt={inProgressCourse.title} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#161512] via-[#161512]/80 to-transparent"></div>
                      </div>
                      
                      <div className="relative z-10 p-6 pt-24 flex flex-col justify-end h-full">
                          <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-black tracking-widest text-white w-max mb-3 uppercase flex items-center gap-1"><PlayCircle size={14}/> {lastWatchedCourseId === inProgressCourse.id ? 'ادامه یادگیری' : 'پیشنهاد فرزین'}</span>
                          <h2 className="text-2xl font-black text-white drop-shadow-lg mb-2">{inProgressCourse.title}</h2>
                          <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold mb-2">
                              <span className="text-farzin-accent">{inProgressCourse.instructor}</span>
                              <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                              <span className="flex items-center gap-1"><Clock size={12}/> {inProgressCourse.duration}</span>
                          </div>
                      </div>
                  </div>
              )}

              <div className="relative flex overflow-x-auto gap-2 pb-4 pt-1 no-scrollbar px-1">
                {categories.map(cat => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13px] whitespace-nowrap transition-colors duration-300 outline-none ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      {isActive && <motion.div layoutId="eduCategoryPill" className="absolute inset-0 bg-[#262421] border border-[#403e3a] rounded-2xl shadow-lg" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                      <span className="relative z-10 flex items-center gap-2"><span className={isActive ? "text-farzin-accent" : ""}>{cat.icon}</span>{cat.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-5">
                  <AnimatePresence mode="popLayout">
                      {filteredCourses.length > 0 ? filteredCourses.map((course, index) => {
                          return (
                              <motion.div
                                  layout key={course.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.25, delay: index * 0.05 }}
                                  onClick={() => handleCourseClick(course)}
                                  className={`relative bg-[#1e1c19] rounded-[24px] border border-[#35332e] hover:border-[#52525b] shadow-xl overflow-hidden flex flex-row cursor-pointer transition-all duration-300 group active:scale-[0.98] h-36`}
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
                                      {course.isPremium && <div className={`absolute top-3 left-4 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase flex items-center gap-1 border bg-amber-500/10 text-amber-500 border-amber-500/30`}><Crown size={10} />VIP</div>}
                                      <h3 className="font-black text-[14px] leading-tight mb-1.5 pr-1 text-white">{course.title}</h3>
                                      <p className="text-[11px] font-bold text-zinc-400 mb-3 pr-1">{course.instructor}</p>

                                      <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 mt-auto pr-1">
                                          <div className="flex items-center gap-1.5 bg-[#161512] px-2 py-1 rounded-lg border border-[#35332e]"><TrendingUp size={12} className={course.isPremium && !isUserPremium ? 'text-amber-500' : 'text-blue-400'} /><span>{course.level}</span></div>
                                          <div className="flex items-center gap-1.5 bg-[#161512] px-2 py-1 rounded-lg border border-[#35332e]"><Clock size={12} className="text-zinc-500" /><span>{course.duration}</span></div>
                                      </div>
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

      {/* 🌟 پاپ‌آپ حرفه‌ای (ثابت و اسکرول‌دار) */}
      <AnimatePresence>
        {selectedCourseModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6" dir="rtl"
            onClick={() => setSelectedCourseModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              // 🔥 سایز فیکس شد: h-[85vh]
              className="w-full max-w-3xl bg-[#161512] border border-[#35332e] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[85vh]"
            >
                <div className="relative h-48 sm:h-56 w-full shrink-0">
                    <img src={selectedCourseModal.image} className="w-full h-full object-cover opacity-80" alt={selectedCourseModal.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161512] via-[#161512]/40 to-transparent"></div>
                    <button onClick={() => setSelectedCourseModal(null)} className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:text-white transition-colors border border-white/10 z-10"><X size={20} /></button>
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start z-10">
                        {selectedCourseModal.isPremium && <span className="px-2 py-1 mb-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-md text-[10px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg"><Crown size={12}/> ویژه VIP</span>}
                        <h2 className="font-black text-2xl sm:text-3xl text-white drop-shadow-xl">{selectedCourseModal.title}</h2>
                        <div className="flex items-center gap-4 mt-2 text-xs font-bold text-zinc-300 drop-shadow-md">
                            <span className="flex items-center gap-1.5"><Users size={14} className="text-farzin-accent"/> {selectedCourseModal.instructor}</span>
                            <span className="flex items-center gap-1.5"><Clock size={14} className="text-sky-400"/> {selectedCourseModal.duration}</span>
                        </div>
                    </div>
                </div>

                <div className="flex px-6 border-b border-[#35332e] bg-[#1a1916] shrink-0 gap-6">
                    <button onClick={() => setModalTab('about')} className={`py-4 text-sm font-bold transition-all relative ${modalTab === 'about' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        معرفی دوره
                        {modalTab === 'about' && <motion.div layoutId="modalTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-farzin-accent rounded-t-full" />}
                    </button>
                    <button onClick={() => setModalTab('lessons')} className={`py-4 text-sm font-bold transition-all relative ${modalTab === 'lessons' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        سرفصل‌ها ({selectedCourseModal.lessons?.length || 0})
                        {modalTab === 'lessons' && <motion.div layoutId="modalTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-farzin-accent rounded-t-full" />}
                    </button>
                </div>

                {/* 🔥 اسکرول نرم جلسات */}
                <div className="p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#161512]">
                    {modalTab === 'about' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-base font-black text-white flex items-center gap-2"><Info size={18} className="text-farzin-accent"/> درباره دوره</h3>
                                <p className="text-sm text-zinc-400 leading-loose whitespace-pre-wrap">{selectedCourseModal.description || 'توضیحات تکمیلی برای این دوره ثبت نشده است.'}</p>
                            </div>
                            
                            {selectedCourseModal.requirements && (
                                <div className="flex flex-col gap-2 bg-[#1a1916] p-4 rounded-2xl border border-[#35332e]">
                                    <h3 className="text-sm font-black text-white flex items-center gap-2"><ShieldCheck size={18} className="text-sky-400"/> پیش‌نیازها</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{selectedCourseModal.requirements}</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {modalTab === 'lessons' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
                            {selectedCourseModal.lessons && selectedCourseModal.lessons.length > 0 ? (
                                selectedCourseModal.lessons.map((lesson: any) => {
                                    const isLocked = selectedCourseModal.isPremium && !isUserPremium && !lesson.isFreePreview;
                                    
                                    return (
                                        <div key={lesson.id} onClick={() => !isLocked && handlePlaySpecificLesson(selectedCourseModal.id, lesson.id)} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isLocked ? 'bg-[#1a1916] border-[#35332e] opacity-70' : 'bg-[#1e1c19] border-[#35332e] hover:border-farzin-accent cursor-pointer group'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-sm font-black shadow-inner ${isLocked ? 'bg-[#262421] text-zinc-500' : 'bg-farzin-accent/20 text-farzin-accent'}`}>
                                                    {isLocked ? <Lock size={16} /> : <Play size={16} fill="currentColor" className="ml-0.5 group-hover:scale-110 transition-transform" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${isLocked ? 'text-zinc-400' : 'text-white group-hover:text-farzin-accent transition-colors'}`}>{lesson.order}. {lesson.title}</span>
                                                    <span className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                                                        <Clock size={12}/> {lesson.duration}
                                                        {lesson.isFreePreview && <span className="bg-emerald-500/10 text-emerald-500 px-1.5 rounded text-[9px] font-black border border-emerald-500/20">رایگان</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center text-zinc-500 p-6 border border-dashed border-[#35332e] rounded-xl text-sm">هنوز جلسه‌ای برای این دوره آپلود نشده است.</div>
                            )}
                        </motion.div>
                    )}
                </div>

                <div className="p-5 border-t border-[#35332e] bg-[#121110] shrink-0 flex items-center justify-between">
                    <div className="flex flex-col hidden sm:flex">
                        <span className="text-xs text-zinc-500 font-bold">هزینه دوره:</span>
                        <span className="text-lg font-black text-white">{selectedCourseModal.isPremium ? `${selectedCourseModal.price} الماس` : 'رایگان'}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button onClick={() => handleStartOrContinue(selectedCourseModal)} className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-farzin-accent hover:bg-[#68824b] text-white font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_5px_15px_rgba(119,149,86,0.3)]">
                            <Sparkles size={18} /> شروع / ادامه یادگیری
                        </button>
                    </div>
                </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}