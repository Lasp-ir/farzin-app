import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Play, Lock, CheckCircle2, 
  ListVideo, Crown, Loader2, AlertTriangle, Gem
} from 'lucide-react';

export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsSubmitting] = useState(false);
  const [activeLesson, setActiveLesson] = useState<any>(null);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/player`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        if (result.course.lessons.length > 0) {
            setActiveLesson(result.course.lessons[0]);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/purchase`, { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        alert('خرید با موفقیت انجام شد! دوره برای شما باز شد.');
        fetchCourseData(); // رفرش کردن دیتا برای باز شدن قفل‌ها
      } else {
        alert(result.error || 'خطا در خرید');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#0c0b0a] flex items-center justify-center"><Loader2 className="text-farzin-accent animate-spin" size={40} /></div>;
  if (!data) return <div className="min-h-screen bg-[#0c0b0a] text-white flex items-center justify-center">دوره یافت نشد!</div>;

  const { course, isEnrolled } = data;
  const isVideoLocked = !isEnrolled && !activeLesson?.isFreePreview && course.isPremium;

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex flex-col md:flex-row" dir="rtl">
      
      {/* 🌟 بخش پلیر ویدیو (سمت راست) */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="h-16 flex items-center px-4 border-b border-white/5 bg-[#121110] shrink-0 gap-4">
            <button onClick={() => navigate(`/course/${courseId}`)} className="p-2 bg-[#1a1916] rounded-lg text-zinc-400 hover:text-white transition-colors"><ChevronRight size={20} /></button>
            <h1 className="font-black text-white">{course.title}</h1>
        </div>

        <div className="flex-1 bg-black relative flex items-center justify-center w-full aspect-video md:aspect-auto">
            {activeLesson ? (
                isVideoLocked ? (
                    // 🛑 نمای قفل (Paywall)
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121110] bg-opacity-90 backdrop-blur-md z-10 p-4 text-center">
                        <Lock size={64} className="text-amber-500 mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                        <h2 className="text-2xl font-black text-white mb-2">این ویدیو ویژه (VIP) است</h2>
                        <p className="text-sm text-zinc-400 mb-8 max-w-md">برای تماشای این جلسه و دسترسی کامل به تمامی قسمت‌های این دوره، باید آن را تهیه کنید.</p>
                        
                        <button 
                            onClick={handlePurchase} disabled={isBuying}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.3)] active:scale-95 text-lg"
                        >
                            {isBuying ? <Loader2 className="animate-spin" /> : <><Gem size={24} fill="currentColor" /> خرید کل دوره با {course.price} الماس</>}
                        </button>
                    </div>
                ) : (
                    // 🎬 پلیر واقعی ویدیو
                    <video 
                        key={activeLesson.id} // کلید مهم برای ری‌رندر شدن ویدیو جدید
                        controls 
                        autoPlay 
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain outline-none"
                        poster={course.image}
                    >
                        <source src={activeLesson.videoUrl} type="video/mp4" />
                        مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                    </video>
                )
            ) : (
                <div className="text-zinc-500 flex flex-col items-center gap-3"><AlertTriangle size={32} /> ویدیویی برای این دوره ثبت نشده است</div>
            )}
        </div>
        
        {/* اطلاعات ویدیوی در حال پخش */}
        {activeLesson && (
            <div className="p-6 bg-[#121110] shrink-0 border-t border-white/5">
                <h2 className="text-xl font-black text-white mb-2">{activeLesson.title}</h2>
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <span className="bg-[#1a1916] px-3 py-1.5 rounded-lg border border-[#35332e]">{activeLesson.duration}</span>
                    <span className="flex items-center gap-1.5"><Crown size={14} className="text-amber-500"/> مدرس: {course.instructor}</span>
                </div>
            </div>
        )}
      </div>

      {/* 🌟 بخش لیست جلسات (سایدبار سمت چپ) */}
      <div className="w-full md:w-80 lg:w-96 bg-[#121110] border-r border-white/5 flex flex-col shrink-0 h-[50vh] md:h-screen">
          <div className="p-5 border-b border-white/5 bg-[#161512]">
              <h3 className="font-black text-white flex items-center gap-2 mb-1"><ListVideo size={18} className="text-farzin-accent"/> سرفصل‌های دوره</h3>
              <p className="text-xs text-zinc-500 font-bold">{course.lessons.length} جلسه آموزشی</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
              {course.lessons.map((lesson: any) => {
                  const isActive = activeLesson?.id === lesson.id;
                  const isLocked = !isEnrolled && !lesson.isFreePreview && course.isPremium;

                  return (
                      <button 
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition-all border ${isActive ? 'bg-farzin-accent/10 border-farzin-accent/30 shadow-inner' : 'bg-[#1a1916] border-[#35332e] hover:border-zinc-500 hover:bg-[#262421]'}`}
                      >
                          <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center shadow-sm ${isActive ? 'bg-farzin-accent text-white' : 'bg-[#262421] text-zinc-400'}`}>
                              {isLocked ? <Lock size={16} /> : (isActive ? <Play size={16} fill="currentColor" /> : <span className="font-black text-xs">{lesson.order}</span>)}
                          </div>
                          
                          <div className="flex flex-col flex-1 min-w-0">
                              <span className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-zinc-300'}`}>{lesson.title}</span>
                              <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-zinc-500 font-mono">{lesson.duration}</span>
                                  {lesson.isFreePreview && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 rounded border border-emerald-500/20">رایگان</span>}
                              </div>
                          </div>
                      </button>
                  );
              })}
          </div>
      </div>

    </div>
  );
}