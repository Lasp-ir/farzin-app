import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, PlayCircle, Lock, BookOpen, Clock, 
  Award, Star, TrendingUp, Crown, CheckCircle2, Play, Target,
  Sparkles, X, Info, ShieldCheck, ListVideo, Users, Loader2, UserCircle, Tag
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
  const lastWatchedCourseId = localStorage.getItem('farzin_last_course');
  const inProgressCourse = courses.find(c => c.id === lastWatchedCourseId) || courses[0];

  const handleCourseClick = (course: any) => {
    setSelectedCourseModal(course);
    setModalTab('about'); 
  };

  const handleStartOrContinue = (course: any) => {
    const savedProgress = JSON.parse(localStorage.getItem(`farzin_progress_${course.id}`) || 'null');
    if (savedProgress?.lessonId) navigate(`/course/${course.id}/play?lesson=${savedProgress.lessonId}`);
    else navigate(`/course/${course.id}/play`);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-24 overflow-x-hidden" dir="rtl">
        {/* هدر */}
        <div className="w-full max-w-2xl px-5 py-6 flex items-center justify-between z-20 sticky top-0 bg-[#161512]/90 backdrop-blur-xl border-b border-white/5">
          <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-white bg-[#1e1c19] p-2 rounded-xl border border-[#35332e]"><ChevronRight size={24} /></button>
          <div className="flex flex-col items-center"><h1 className="text-lg font-black text-white uppercase">آکادمی فرزین</h1><span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase flex items-center gap-1"><Crown size={10} /> Masterclass</span></div>
          <div className="w-10"></div>
        </div>

        {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center mt-20"><Loader2 size={40} className="text-farzin-accent animate-spin mb-4" /><span className="text-sm font-bold text-zinc-400">در حال دریافت محتوای آموزشی...</span></div>
        ) : (
            <div className={`w-full max-w-2xl px-4 mt-4 flex flex-col gap-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              
              {/* 🌟 کارت پیشنهاد ویژه (بالای صفحه) */}
              {inProgressCourse && (
                  <div onClick={() => handleStartOrContinue(inProgressCourse)} className="relative w-full rounded-[28px] overflow-hidden border border-[#35332e] shadow-2xl group cursor-pointer">
                      <div className="absolute inset-0">
                          <img src={inProgressCourse.image} alt="" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#161512] via-[#161512]/60 to-transparent"></div>
                      </div>
                      <div className="relative z-10 p-6 pt-24 flex flex-col h-full">
                          <span className="px-3 py-1 bg-farzin-accent text-white rounded-lg text-[9px] font-black tracking-widest w-max mb-3 uppercase shadow-lg flex items-center gap-1">
                             <Award size={12}/> {lastWatchedCourseId === inProgressCourse.id ? 'ادامه یادگیری' : 'دوره پیشنهادی'}
                          </span>
                          <h2 className="text-2xl font-black text-white mb-2">{inProgressCourse.title}</h2>
                          <div className="flex items-center gap-3 text-zinc-300 text-xs font-bold">
                              <div className="flex items-center gap-1.5 hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/instructor/${inProgressCourse.instructor}`); }}>
                                  <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center text-[8px]"><Users size={10}/></div>
                                  <span className="text-farzin-accent underline underline-offset-4">{inProgressCourse.instructor}</span>
                              </div>
                              <span className="flex items-center gap-1"><Clock size={12}/> {inProgressCourse.duration}</span>
                          </div>
                      </div>
                  </div>
              )}

              {/* دسته‌بندی‌ها */}
              <div className="relative flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[13px] whitespace-nowrap transition-all ${activeCategory === cat.id ? 'text-white bg-[#262421] border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        {cat.icon} {cat.title}
                    </button>
                ))}
              </div>

              {/* لیست دوره‌ها */}
              <div className="flex flex-col gap-5">
                  <AnimatePresence mode="popLayout">
                      {filteredCourses.map((course, index) => {
                          const hasDiscount = course.discount > 0;
                          return (
                              <motion.div
                                  layout key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                  onClick={() => handleCourseClick(course)}
                                  className="relative bg-[#1e1c19] rounded-[24px] border border-[#35332e] hover:border-farzin-accent transition-all overflow-hidden flex h-36 cursor-pointer group shadow-lg"
                              >
                                  <div className="w-1/3 shrink-0 overflow-hidden relative border-l border-[#35332e]">
                                      <img src={course.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                      {hasDiscount && <div className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-lg border border-white/10 animate-pulse">OFF</div>}
                                  </div>

                                  <div className="flex-1 p-4 flex flex-col justify-between">
                                      <div>
                                          <div className="flex items-center justify-between mb-1">
                                              <h3 className="font-black text-sm text-white line-clamp-1">{course.title}</h3>
                                              {course.isPremium && <Crown size={12} className="text-amber-500" />}
                                          </div>
                                          {/* مدرس (برجسته در لیست) */}
                                          <div 
                                            className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold hover:text-amber-400 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/instructor/${course.instructor}`); }}
                                          >
                                              <UserCircle size={12} className="text-farzin-accent" />
                                              <span>استاد {course.instructor}</span>
                                          </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-black px-2 py-1 bg-[#161512] rounded-lg border border-[#35332e] text-zinc-400">{course.level}</span>
                                          <span className="text-[10px] font-black px-2 py-1 bg-[#161512] rounded-lg border border-[#35332e] text-zinc-400">{course.duration}</span>
                                      </div>
                                  </div>
                              </motion.div>
                          )
                      })}
                  </AnimatePresence>
              </div>
            </div>
        )}
      </motion.div>

      {/* 🌟 پاپ‌آپ جزییات دوره (با بخش ویژه استاد) */}
      <AnimatePresence>
        {selectedCourseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setSelectedCourseModal(null)}>
            <motion.div 
              initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#161512] border border-[#35332e] rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[85vh]"
            >
                {/* هدر پاپ‌آپ */}
                <div className="relative h-56 shrink-0">
                    <img src={selectedCourseModal.image} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161512] via-[#161512]/40 to-transparent"></div>
                    <button onClick={() => setSelectedCourseModal(null)} className="absolute top-5 right-5 p-2 bg-black/50 backdrop-blur-xl rounded-full text-white border border-white/10 transition-transform active:scale-90"><X size={20} /></button>
                    <div className="absolute bottom-6 right-6 left-6">
                        <h2 className="text-2xl font-black text-white mb-2">{selectedCourseModal.title}</h2>
                        <div className="flex items-center gap-4 text-xs font-bold text-zinc-300">
                            <span className="bg-farzin-accent px-2 py-1 rounded text-white text-[10px]">{selectedCourseModal.category}</span>
                            <span className="flex items-center gap-1.5"><Clock size={14}/> {selectedCourseModal.duration}</span>
                        </div>
                    </div>
                </div>

                {/* تب‌ها */}
                <div className="flex px-6 bg-[#1a1916] border-b border-[#35332e] gap-8">
                    <button onClick={() => setModalTab('about')} className={`py-4 text-sm font-black transition-all relative ${modalTab === 'about' ? 'text-white' : 'text-zinc-500'}`}>جزییات دوره {modalTab === 'about' && <motion.div layoutId="mLine" className="absolute bottom-0 left-0 right-0 h-1 bg-farzin-accent rounded-t-full" />}</button>
                    <button onClick={() => setModalTab('lessons')} className={`py-4 text-sm font-black transition-all relative ${modalTab === 'lessons' ? 'text-white' : 'text-zinc-500'}`}>سرفصل‌ها ({selectedCourseModal.lessons?.length || 0}) {modalTab === 'lessons' && <motion.div layoutId="mLine" className="absolute bottom-0 left-0 right-0 h-1 bg-farzin-accent rounded-t-full" />}</button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {modalTab === 'about' && (
                        <div className="flex flex-col gap-6">
                            {/* 👤 بخش ویژه معرفی استاد (اعتبار برنامه) */}
                            <div 
                                onClick={() => navigate(`/instructor/${selectedCourseModal.instructor}`)}
                                className="bg-[#1e1c19] border border-[#35332e] rounded-3xl p-5 flex items-center gap-4 hover:border-amber-500/50 transition-all cursor-pointer group shadow-xl"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-farzin-accent overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                                    <img src={selectedCourseModal.instructorProfile?.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop'} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1">مدرس رسمی <ShieldCheck size={10}/></span>
                                    <h4 className="text-white font-black text-lg group-hover:text-amber-400 transition-colors">{selectedCourseModal.instructor}</h4>
                                    <span className="text-zinc-500 text-xs font-bold">مشاهده رزومه و دوره‌های استاد <ChevronRight size={12} className="inline ml-1"/></span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <h3 className="text-sm font-black text-white flex items-center gap-2"><Info size={16} className="text-farzin-accent"/> توضیحات دوره</h3>
                                <p className="text-xs text-zinc-400 leading-loose whitespace-pre-wrap">{selectedCourseModal.description || 'توضیحاتی ثبت نشده.'}</p>
                            </div>
                        </div>
                    )}

                    {modalTab === 'lessons' && (
                        <div className="flex flex-col gap-2">
                            {selectedCourseModal.lessons?.map((lesson: any) => (
                                <div key={lesson.id} className="flex items-center justify-between p-4 bg-[#1e1c19] border border-[#35332e] rounded-2xl opacity-80">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#262421] flex items-center justify-center text-[10px] font-black text-zinc-500">{lesson.order}</div>
                                        <div className="flex flex-col"><span className="text-xs font-bold text-white">{lesson.title}</span><span className="text-[10px] text-zinc-500 font-bold">{lesson.duration}</span></div>
                                    </div>
                                    <Lock size={14} className="text-zinc-600" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* فوتر پاپ‌آپ (خرید) */}
                <div className="p-6 border-t border-[#35332e] bg-[#121110] flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 font-bold mb-1">هزینه دوره:</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xl font-black text-white">{selectedCourseModal.price}</span>
                           <Crown size={18} className="text-amber-500"/>
                        </div>
                    </div>
                    <button onClick={() => handleStartOrContinue(selectedCourseModal)} className="px-8 py-3.5 bg-farzin-accent hover:bg-[#68824b] text-white font-black rounded-2xl flex items-center gap-2 transition-all shadow-xl active:scale-95">
                        <Sparkles size={18} /> شروع یادگیری
                    </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}