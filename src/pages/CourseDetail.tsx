import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronRight, Play, Lock, CheckCircle2, 
  ListVideo, Crown, Loader2, Clock, Users,
  Info, ShieldCheck, Sparkles, Gem, ArrowLeft
} from 'lucide-react';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'lessons'>('about');

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/player`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    setIsBuying(true);
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/purchase`, { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        fetchCourseData(); // رفرش کردن دیتا برای باز شدن قفل‌ها
      } else {
        alert(result.error || 'خطا در خرید');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#0c0b0a] flex items-center justify-center"><Loader2 className="text-farzin-accent animate-spin" size={40} /></div>;
  if (!data || !data.course) return <div className="min-h-screen bg-[#0c0b0a] text-white flex items-center justify-center">دوره یافت نشد!</div>;

  const { course, isEnrolled, progress } = data;

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex flex-col pb-24" dir="rtl">
      
      {/* 🌟 بخش هدر و تصویر کاور (Hero Section) */}
      <div className="relative w-full h-[40vh] md:h-[50vh] shrink-0">
          <img src={course.image} className="w-full h-full object-cover opacity-60" alt={course.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-[#0c0b0a]/80 to-transparent"></div>
          
          <button onClick={() => navigate('/education')} className="absolute top-6 right-6 z-20 p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all border border-white/10">
              <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col items-center text-center max-w-4xl mx-auto z-10">
              {course.isPremium && <span className="px-3 py-1 mb-4 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-black tracking-widest uppercase flex items-center gap-1.5"><Crown size={14}/> دوره ویژه VIP</span>}
              <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-xl mb-4 leading-tight">{course.title}</h1>
              
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10"><Users size={16} className="text-farzin-accent"/> مدرس: {course.instructor}</span>
                  <span className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10"><Clock size={16} className="text-sky-400"/> {course.duration}</span>
                  <span className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10"><ListVideo size={16} className="text-purple-400"/> {course.lessons.length} جلسه</span>
              </div>
          </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 mt-6 flex flex-col md:flex-row gap-8">
          
          {/* 🌟 بخش اطلاعات دوره (سمت راست) */}
          <div className="flex-1 flex flex-col gap-6">
              <div className="flex bg-[#161512] p-1.5 rounded-2xl border border-[#35332e]">
                  <button onClick={() => setActiveTab('about')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'about' ? 'bg-[#262421] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>معرفی دوره</button>
                  <button onClick={() => setActiveTab('lessons')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'lessons' ? 'bg-[#262421] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>سرفصل‌ها ({course.lessons.length})</button>
              </div>

              {activeTab === 'about' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
                      <div className="flex flex-col gap-3">
                          <h2 className="text-xl font-black text-white flex items-center gap-2"><Info size={20} className="text-farzin-accent"/> درباره این دوره</h2>
                          <p className="text-sm text-zinc-300 leading-loose whitespace-pre-wrap">{course.description || 'توضیحاتی برای این دوره ثبت نشده است.'}</p>
                      </div>

                      {course.requirements && (
                          <div className="flex flex-col gap-3 bg-[#161512] p-6 rounded-2xl border border-[#35332e]">
                              <h2 className="text-lg font-black text-white flex items-center gap-2"><ShieldCheck size={20} className="text-sky-400"/> پیش‌نیازها</h2>
                              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{course.requirements}</p>
                          </div>
                      )}
                  </motion.div>
              )}

              {activeTab === 'lessons' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                      {course.lessons.map((lesson: any) => {
                          const isLocked = !isEnrolled && !lesson.isFreePreview && course.isPremium;
                          return (
                              <div key={lesson.id} className="flex items-center justify-between bg-[#161512] p-4 rounded-2xl border border-[#35332e] group">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-black ${isLocked ? 'bg-[#262421] text-zinc-500' : 'bg-farzin-accent/20 text-farzin-accent'}`}>
                                          {isLocked ? <Lock size={16} /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="text-sm font-bold text-white group-hover:text-farzin-accent transition-colors">{lesson.order}. {lesson.title}</span>
                                          <span className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                                              <Clock size={12}/> {lesson.duration}
                                              {lesson.isFreePreview && <span className="bg-emerald-500/10 text-emerald-500 px-1.5 rounded text-[9px] font-black border border-emerald-500/20">رایگان</span>}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                      {course.lessons.length === 0 && <div className="text-center text-zinc-500 p-8">هنوز جلسه‌ای برای این دوره ثبت نشده است.</div>}
                  </motion.div>
              )}
          </div>

          {/* 🌟 باکس خرید و شروع (سمت چپ) */}
          <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
              <div className="bg-[#161512] border border-[#35332e] rounded-[28px] p-6 shadow-2xl sticky top-24">
                  {isEnrolled ? (
                      <div className="flex flex-col gap-4 items-center text-center">
                          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                              <CheckCircle2 size={32} className="text-emerald-400" />
                          </div>
                          <h3 className="font-black text-white text-lg">شما دانشجوی این دوره هستید</h3>
                          <div className="w-full flex items-center justify-between text-xs font-bold text-zinc-400 mt-2 mb-1">
                              <span>پیشرفت شما</span>
                              <span className="text-emerald-400">{progress}٪</span>
                          </div>
                          <div className="w-full h-2 bg-[#262421] rounded-full overflow-hidden mb-4"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}></div></div>
                          
                          <button onClick={() => navigate(`/course/${course.id}/play`)} className="w-full py-4 rounded-2xl bg-farzin-accent hover:bg-[#68824b] text-white font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_5px_15px_rgba(119,149,86,0.3)]">
                              <Play size={18} fill="currentColor" /> {progress === 0 ? 'شروع یادگیری' : 'ادامه یادگیری'}
                          </button>
                      </div>
                  ) : (
                      <div className="flex flex-col gap-5">
                          <div className="flex justify-between items-end border-b border-[#35332e] pb-5">
                              <div className="flex flex-col gap-1">
                                  <span className="text-xs font-bold text-zinc-400">هزینه سرمایه‌گذاری</span>
                                  <span className="text-2xl font-black text-amber-500 flex items-center gap-2">{course.isPremium ? course.price : 'رایگان'} {course.isPremium && <Gem size={20} className="mt-1" />}</span>
                              </div>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                              <button onClick={() => navigate(`/course/${course.id}/play`)} className="w-full py-3.5 rounded-2xl bg-[#262421] hover:bg-[#35332e] text-white font-bold flex items-center justify-center gap-2 transition-all border border-[#35332e]">
                                  <Play size={18} fill="currentColor" /> پخش پیش‌نمایش (رایگان)
                              </button>
                              
                              <button onClick={handlePurchase} disabled={isBuying} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-black flex items-center justify-center gap-2 transition-all shadow-[0_5px_20px_rgba(245,158,11,0.3)] active:scale-95">
                                  {isBuying ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> خرید و باز کردن دوره</>}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
}