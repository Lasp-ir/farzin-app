import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronRight, Play, Lock, CheckCircle2, 
  ListVideo, Crown, Loader2, AlertTriangle, Gem
} from 'lucide-react';

export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsSubmitting] = useState(false);
  const [activeLesson, setActiveLesson] = useState<any>(null);

  // 🌟 استخراج پارامترهای URL (برای اینکه بدونیم کدوم جلسه و چه ثانیه‌ای رو پلی کنیم)
  const queryParams = new URLSearchParams(location.search);
  const urlLessonId = queryParams.get('lesson');

  useEffect(() => { fetchCourseData(); }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/player`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        
        if (result.course.lessons.length > 0) {
            let targetLesson = result.course.lessons[0];
            
            // اگر از تو سرفصل‌ها مستقیماً روی یه جلسه کلیک کرده بود
            if (urlLessonId) {
                targetLesson = result.course.lessons.find((l: any) => l.id === urlLessonId) || targetLesson;
            } else {
                // اگر دکمه "ادامه آموزش" رو زده بود، بگرد ببین قبلاً کجا بوده
                const savedProgress = JSON.parse(localStorage.getItem(`farzin_progress_${courseId}`) || 'null');
                if (savedProgress && savedProgress.lessonId) {
                    targetLesson = result.course.lessons.find((l: any) => l.id === savedProgress.lessonId) || targetLesson;
                }
            }
            setActiveLesson(targetLesson);
        }
      }
    } catch (err) { console.error("Fetch error:", err); } 
    finally { setIsLoading(false); }
  };

  const handlePurchase = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/purchase`, { method: 'POST' });
      if (res.ok) { fetchCourseData(); } 
      else { const result = await res.json(); alert(result.error || 'خطا در خرید'); }
    } catch (err) { console.error(err); } 
    finally { setIsSubmitting(false); }
  };

  // 🔥 پرش به تایم ذخیره شده به محض لود شدن ویدیو
  const handleVideoLoaded = () => {
      if (videoRef.current && activeLesson) {
          const savedProgress = JSON.parse(localStorage.getItem(`farzin_progress_${courseId}`) || 'null');
          if (savedProgress && savedProgress.lessonId === activeLesson.id && savedProgress.time) {
              videoRef.current.currentTime = savedProgress.time;
          }
      }
  };

  // 🔥 ذخیره ثانیه به ثانیه ویدیو در حافظه
  const handleTimeUpdate = () => {
      if (videoRef.current && activeLesson) {
          localStorage.setItem(`farzin_progress_${courseId}`, JSON.stringify({
              lessonId: activeLesson.id,
              time: videoRef.current.currentTime,
              lastWatched: Date.now()
          }));
          // ثبت این دوره به عنوان آخرین دوره تماشا شده (برای کارت بالای صفحه آکادمی)
          localStorage.setItem('farzin_last_course', courseId || '');
      }
  };

  if (isLoading) return <div className="min-h-screen bg-[#0c0b0a] flex items-center justify-center"><Loader2 className="text-farzin-accent animate-spin" size={40} /></div>;
  if (!data) return <div className="min-h-screen bg-[#0c0b0a] text-white flex items-center justify-center">دوره یافت نشد!</div>;

  const { course, isEnrolled } = data;
  const isVideoLocked = !isEnrolled && !activeLesson?.isFreePreview && course.isPremium;

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex flex-col md:flex-row" dir="rtl">
      
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="h-16 flex items-center px-4 border-b border-white/5 bg-[#121110] shrink-0 gap-4">
            <button onClick={() => navigate('/education')} className="p-2 bg-[#1a1916] rounded-lg text-zinc-400 hover:text-white transition-colors"><ChevronRight size={20} /></button>
            <h1 className="font-black text-white">{course.title}</h1>
        </div>

        <div className="flex-1 bg-black relative flex items-center justify-center w-full aspect-video md:aspect-auto">
            {activeLesson ? (
                isVideoLocked ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121110] bg-opacity-90 backdrop-blur-md z-10 p-4 text-center">
                        <Lock size={64} className="text-amber-500 mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                        <h2 className="text-2xl font-black text-white mb-2">این ویدیو ویژه (VIP) است</h2>
                        <p className="text-sm text-zinc-400 mb-8 max-w-md">برای تماشای این جلسه و دسترسی کامل به تمامی قسمت‌های این دوره، باید آن را تهیه کنید.</p>
                        
                        <button onClick={handlePurchase} disabled={isBuying} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.3)] active:scale-95 text-lg">
                            {isBuying ? <Loader2 className="animate-spin" /> : <><Gem size={24} fill="currentColor" /> خرید کل دوره با {course.price} الماس</>}
                        </button>
                    </div>
                ) : (
                    <video 
                        ref={videoRef}
                        key={activeLesson.id}
                        controls autoPlay crossOrigin="anonymous"
                        onLoadedMetadata={handleVideoLoaded}
                        onTimeUpdate={handleTimeUpdate}
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
            <div className="p-4 md:p-6 bg-[#121110] shrink-0 border-t border-[#35332e] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h2 className="text-xl font-black text-white mb-2">{activeLesson.order}. {activeLesson.title}</h2>
                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                        <span className="bg-[#1a1916] px-3 py-1.5 rounded-lg border border-[#35332e]">{activeLesson.duration}</span>
                        <span className="flex items-center gap-1.5"><Crown size={14} className="text-amber-500"/> مدرس: {course.instructor}</span>
                    </div>
                </div>
                
                {/* 🌟 دکمه حل تمرینات */}
                {!isVideoLocked && (
                    <button 
                        onClick={() => navigate(`/course/${courseId}/lesson/${activeLesson.id}/exercises`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_5px_15px_rgba(16,185,129,0.3)] shrink-0"
                    >
                        <Target size={18} /> شروع تمرینات تعاملی
                    </button>
                )}
            </div>
        )}
      </div>

      <div className="w-full md:w-80 lg:w-96 bg-[#121110] border-l border-white/5 flex flex-col shrink-0 h-[50vh] md:h-screen">
          <div className="p-5 border-b border-white/5 bg-[#161512] shrink-0">
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
                          onClick={() => {
                              setActiveLesson(lesson);
                              navigate(`/course/${courseId}/play?lesson=${lesson.id}`, { replace: true });
                          }}
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