import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Users, Settings, Plus, 
  Edit, Trash2, Video, ChevronRight, Crown, ShieldAlert,
  Search, PlayCircle, X, CheckCircle2, Loader2, Play, 
  HelpCircle, Layers, Award, HelpCircle as HintIcon, PlusCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('courses');
  const [search, setSearch] = useState('');
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
      title: '', instructor: 'تیم فرزین', category: 'openings', 
      level: 'متوسط', duration: '۲ ساعت', image: '', 
      description: '', requirements: '', isPremium: true, price: 100
  });

  // استیت‌های مدیریت جلسات
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
      title: '', videoUrl: '', duration: '', order: 1, isFreePreview: false
  });

  // ♟️ استیت‌های کارگاه ساخت تمرین و پازل (Lichess Style)
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [lessonExercises, setLessonExercises] = useState<any[]>([]);
  const [isExerciseLoading, setIsExerciseLoading] = useState(false);
  
  const [exerciseFormData, setExerciseFormData] = useState({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: '',
      description: '',
      order: 1
  });
  const [exerciseHints, setExerciseHints] = useState<string[]>(['']); // آرایه داینامیک راهنمایی‌ها

  const fetchCourses = async () => {
      setIsLoading(true);
      try {
          const res = await fetch('http://localhost:5000/api/courses');
          if (res.ok) setCourses(await res.json());
      } catch (err) { console.error(err); } 
      finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const res = await fetch('http://localhost:5000/api/courses', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
          });
          if (res.ok) {
              setIsAddModalOpen(false); fetchCourses();
              setFormData({ title: '', instructor: 'تیم فرزین', category: 'openings', level: 'متوسط', duration: '۲ ساعت', image: '', description: '', requirements: '', isPremium: true, price: 100 });
          }
      } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteCourse = async (id: string) => {
      if(!window.confirm('مطمئنی می‌خوای این دوره رو حذف کنی؟')) return;
      try { const res = await fetch(`http://localhost:5000/api/courses/${id}`, { method: 'DELETE' }); if(res.ok) fetchCourses(); } 
      catch (err) { console.error(err); }
  };

  const openLessonModal = async (course: any) => {
      setSelectedCourse(course);
      setIsLessonModalOpen(true);
      setIsLessonLoading(true);
      try {
          const res = await fetch(`http://localhost:5000/api/courses/${course.id}/lessons`);
          if (res.ok) {
              const data = await res.json();
              setCourseLessons(data);
              setLessonFormData(prev => ({ ...prev, order: data.length + 1 })); 
          }
      } catch (err) { console.error(err); } 
      finally { setIsLessonLoading(false); }
  };

  const handleVideoUrlChange = (url: string) => {
      setLessonFormData(prev => ({ ...prev, videoUrl: url }));
      if (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('mp4')) {
          const video = document.createElement('video');
          video.src = url;
          video.onloadedmetadata = () => {
              const mins = Math.floor(video.duration / 60);
              const secs = Math.floor(video.duration % 60);
              setLessonFormData(prev => ({ ...prev, duration: `${mins}:${secs < 10 ? '0' : ''}${secs}`, title: prev.title || 'ویدیوی جدید' }));
          };
      }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const res = await fetch(`http://localhost:5000/api/courses/${selectedCourse.id}/lessons`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lessonFormData)
          });
          if (res.ok) {
              const newLesson = await res.json();
              setCourseLessons([...courseLessons, newLesson]);
              setLessonFormData({ title: '', videoUrl: '', duration: '', order: courseLessons.length + 2, isFreePreview: false });
              fetchCourses(); 
          }
      } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  // 🔥 توابع پیشرفته مدیریت تمرینات و پازل‌ها
  const openExerciseModal = async (lesson: any) => {
      setSelectedLesson(lesson);
      setIsExerciseModalOpen(true);
      setIsExerciseLoading(true);
      setExerciseHints(['']); // ریست آرایه هینت‌ها
      try {
          const res = await fetch(`http://localhost:5000/api/courses/lessons/${lesson.id}/exercises`);
          if (res.ok) {
              const data = await res.json();
              setLessonExercises(data);
              setExerciseFormData(prev => ({ ...prev, order: data.length + 1, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves: '', description: '' }));
          }
      } catch (err) { console.error(err); }
      finally { setIsExerciseLoading(false); }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      // پاک کردن هینت‌های خالی فیلتر شده
      const filteredHints = exerciseHints.map(h => h.trim()).filter(Boolean);

      try {
          const res = await fetch(`http://localhost:5000/api/courses/lessons/${selectedLesson.id}/exercises`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...exerciseFormData, hints: filteredHints })
          });
          if (res.ok) {
              const newEx = await res.json();
              setLessonExercises([...lessonExercises, newEx]);
              setExerciseFormData(prev => ({ ...prev, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves: '', description: '', order: prev.order + 1 }));
              setExerciseHints(['']);
          }
      } catch (err) { console.error(err); }
      finally { setIsSubmitting(false); }
  };

  const handleDeleteExercise = async (exId: string) => {
      if(!window.confirm('تمرین حذف شود؟')) return;
      try {
          const res = await fetch(`http://localhost:5000/api/courses/exercises/${exId}`, { method: 'DELETE' });
          if(res.ok) setLessonExercises(lessonExercises.filter(e => e.id !== exId));
      } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex" dir="rtl">
      
      {/* سایدبار */}
      <div className="w-64 bg-[#121110] border-l border-white/5 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
            <div className="w-10 h-10 rounded-xl bg-farzin-accent/20 flex items-center justify-center text-farzin-accent"><Crown size={20} /></div>
            <div className="flex flex-col"><span className="font-black text-white text-lg tracking-tight">فرزین <span className="text-farzin-accent">ادمین</span></span><span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Control Panel</span></div>
        </div>
        <div className="flex flex-col p-4 gap-2 flex-1">
            <button onClick={() => setActiveMenu('dashboard')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'dashboard' ? 'bg-farzin-accent text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><LayoutDashboard size={18} /> داشبورد</button>
            <button onClick={() => setActiveMenu('courses')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'courses' ? 'bg-farzin-accent text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><BookOpen size={18} /> مدیریت دوره‌ها</button>
        </div>
        <div className="p-4 mt-auto border-t border-white/5">
            <button onClick={() => navigate('/education')} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors w-full justify-center py-2"><ChevronRight size={14} /> مشاهده آکادمی فرزین</button>
        </div>
      </div>

      {/* بخش اصلی */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#0c0b0a]/80 backdrop-blur-md shrink-0">
            <h1 className="text-xl font-black text-white">مدیریت دوره‌های آموزشی</h1>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-farzin-accent to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-[0_4px_15px_rgba(119,149,86,0.4)]"><Plus size={18} /> دوره جدید</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {isLoading ? (
                <div className="flex justify-center items-center mt-20 text-zinc-500 gap-3"><Loader2 className="animate-spin" /> در حال دریافت اطلاعات...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {courses.filter(c => c.title.includes(search)).map(course => (
                        <div key={course.id} className="bg-[#161512] border border-[#35332e] hover:border-zinc-600 p-5 rounded-2xl flex items-center justify-between transition-all group shadow-sm">
                            <div className="flex items-center gap-5">
                                <img src={course.image} className="w-16 h-16 rounded-xl object-cover border border-[#35332e]" alt="" />
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black text-lg text-white group-hover:text-farzin-accent transition-colors">{course.title}</h3>
                                        {course.isPremium && <span className="bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[10px] font-black"><Crown size={10} className="inline mr-1"/>VIP</span>}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                                        <span className="flex items-center gap-1.5"><Users size={14}/> {course.instructor}</span>
                                        <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"><Video size={14}/> {course._count?.lessons || 0} جلسه</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openLessonModal(course)} className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all" title="مدیریت ویدیوها و تمرینات"><Video size={18} /></button>
                                <button onClick={() => handleDeleteCourse(course.id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all" title="حذف"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* 🎥 مودال ویدیوها و مدیریت جلسات */}
      <AnimatePresence>
          {isLessonModalOpen && selectedCourse && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1e1c19] border border-[#35332e] rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                      <div className="flex items-center justify-between p-5 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <div className="flex flex-col"><h2 className="font-black text-white text-lg flex items-center gap-2"><Video size={18} className="text-blue-400"/> جلسات دوره</h2><span className="text-xs text-zinc-400">{selectedCourse.title}</span></div>
                          <button onClick={() => setIsLessonModalOpen(false)} className="text-zinc-500 hover:text-white bg-[#262421] p-2 rounded-xl"><X size={20}/></button>
                      </div>
                      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                          <div className="flex flex-col gap-2">
                              {courseLessons.map(lesson => (
                                  <div key={lesson.id} className="flex items-center justify-between bg-[#161512] p-3 rounded-xl border border-[#35332e] group">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-[#262421] flex items-center justify-center text-xs font-black text-zinc-400">{lesson.order}</div>
                                          <span className="text-sm font-bold text-white">{lesson.title}</span>
                                      </div>
                                      {/* 🔥 کلید طلایی: دکمه کارگاه تمرینات برای هر جلسه */}
                                      <div className="flex items-center gap-2">
                                          <button onClick={() => { setIsLessonModalOpen(false); openExerciseModal(lesson); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-bold transition-all"><Layers size={14}/> تمرینات تعاملی</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <form onSubmit={handleAddLesson} className="flex flex-col gap-4 bg-[#121110] p-5 rounded-2xl border border-[#35332e]">
                              <h3 className="text-sm font-bold text-white">افزودن جلسه جدید</h3>
                              <div className="grid grid-cols-3 gap-3">
                                  <div className="col-span-2 flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">عنوان جلسه</label><input required value={lessonFormData.title} onChange={e=>setLessonFormData({...lessonFormData, title: e.target.value})} className="bg-[#1e1c19] text-white rounded-xl p-2.5 text-sm outline-none" /></div>
                                  <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">مدت زمان</label><input required value={lessonFormData.duration} onChange={e=>setLessonFormData({...lessonFormData, duration: e.target.value})} className="bg-[#1e1c19] text-white rounded-xl p-2.5 text-sm outline-none" /></div>
                              </div>
                              <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">لینک ویدیو (MP4)</label><input required type="url" dir="ltr" value={lessonFormData.videoUrl} onChange={e=>handleVideoUrlChange(e.target.value)} className="bg-[#1e1c19] text-white rounded-xl p-2.5 text-sm outline-none" /></div>
                              <button type="submit" className="w-full bg-blue-600 text-white font-black py-2.5 rounded-xl text-sm">ثبت جلسه</button>
                          </form>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* ♟️ 🚨 کارگاه نهایی ساخت تمرین و پازل چندمرحله‌ای (Lichess Style Exercise Builder) */}
      <AnimatePresence>
          {isExerciseModalOpen && selectedLesson && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#1e1c19] border border-[#35332e] rounded-3xl w-full max-w-3xl flex flex-col h-[90vh] overflow-hidden shadow-2xl">
                      
                      <div className="flex items-center justify-between p-5 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <div className="flex flex-col">
                              <h2 className="font-black text-white text-lg flex items-center gap-2 text-emerald-400"><Award size={18}/> کارگاه طراحی پازل و تمرینات</h2>
                              <span className="text-xs text-zinc-400">جلسه: {selectedLesson.title}</span>
                          </div>
                          <button onClick={() => { setIsExerciseModalOpen(false); setIsLessonModalOpen(true); }} className="text-zinc-500 hover:text-white bg-[#262421] p-2 rounded-xl flex items-center gap-1 text-xs font-bold"><ChevronRight size={14}/> بازگشت</button>
                      </div>

                      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-[#161512]">
                          
                          {/* لیست پازل‌های موجود در این جلسه */}
                          <div className="flex flex-col gap-2">
                              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-1">پازل‌های چیده شده</h3>
                              {isExerciseLoading ? <div className="flex justify-center p-2"><Loader2 className="animate-spin text-emerald-400"/></div> : lessonExercises.length === 0 ? <div className="text-center text-xs text-zinc-600 p-4 border border-dashed border-[#35332e] rounded-xl">هنوز هیچ تمرینی برای این جلسه ایجاد نشده است.</div> : (
                                  <div className="grid grid-cols-1 gap-2">
                                      {lessonExercises.map(ex => (
                                          <div key={ex.id} className="flex items-center justify-between bg-[#1e1c19] p-3 rounded-xl border border-[#35332e]">
                                              <div className="flex flex-col">
                                                  <span className="text-sm font-bold text-white">تمرین {ex.order}: <span className="font-mono text-zinc-500 text-xs">{ex.moves}</span></span>
                                                  <span className="text-[11px] text-zinc-500 truncate max-w-md mt-1">{ex.description}</span>
                                              </div>
                                              <button onClick={() => handleDeleteExercise(ex.id)} className="text-zinc-600 hover:text-rose-500 p-2"><Trash2 size={16}/></button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>

                          {/* فرم هوشمند ساخت پازل جدید */}
                          <form onSubmit={handleAddExercise} className="flex flex-col gap-4 bg-[#121110] p-5 rounded-2xl border border-[#35332e]">
                              <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2"><Plus size={16}/> طراح هوشمند پازل</h3>
                              
                              <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-bold text-zinc-400">موقعیت اولیه تخته (FEN)</label>
                                  <div className="flex gap-2">
                                      <input required value={exerciseFormData.fen} onChange={e=>setExerciseFormData({...exerciseFormData, fen: e.target.value})} placeholder="rnbqkbnr/..." className="flex-1 bg-[#1e1c19] border border-[#35332e] rounded-xl p-2.5 text-xs text-zinc-300 font-mono outline-none focus:border-emerald-500" />
                                      <button type="button" onClick={() => setExerciseFormData({...exerciseFormData, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'})} className="px-3 bg-[#262421] rounded-xl border border-[#35332e] text-xs font-bold text-zinc-400 hover:text-white">بورد اولیه</button>
                                  </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                  <div className="col-span-2 flex flex-col gap-1.5">
                                      <label className="text-[11px] font-bold text-zinc-400">توالی حرکات درست (Solution Moves - UCI)</label>
                                      <input required value={exerciseFormData.moves} onChange={e=>setExerciseFormData({...exerciseFormData, moves: e.target.value})} placeholder="مثال: e2e4 e7e5 g1f3" className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-2.5 text-sm text-white font-mono outline-none focus:border-emerald-500" />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                      <label className="text-[11px] font-bold text-zinc-400">ترتیب تمرین</label>
                                      <input type="number" min="1" value={exerciseFormData.order} onChange={e=>setExerciseFormData({...exerciseFormData, order: Number(e.target.value)})} className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-2.5 text-sm text-white text-center outline-none" />
                                  </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                  <label className="text-[11px] font-bold text-zinc-400">توضیحات یا صورت مسئله تمرین</label>
                                  <textarea value={exerciseFormData.description} onChange={e=>setExerciseFormData({...exerciseFormData, description: e.target.value})} placeholder="مثال: سفید حرکت می‌کند و در ۲ حرکت مات می‌کند..." className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-xs text-white outline-none min-h-[60px] resize-y" />
                              </div>

                              {/* 🌟 بخش راهنمایی‌های مرحله به مرحله (Dynamic Hints) */}
                              <div className="flex flex-col gap-2 border-t border-[#262421] pt-3 mt-1">
                                  <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-zinc-400 flex items-center gap-1.5"><HintIcon size={14} className="text-amber-500"/> استیج‌های راهنمایی (مرحله به مرحله)</span>
                                      <button type="button" onClick={() => setExerciseHints([...exerciseHints, ''])} className="text-[11px] font-bold text-amber-500 flex items-center gap-1 hover:text-amber-400"><PlusCircle size={12}/> افزودن استیج جدید</button>
                                  </div>
                                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                      {exerciseHints.map((hint, idx) => (
                                          <div key={idx} className="flex gap-2 items-center">
                                              <div className="text-[10px] font-mono font-black text-zinc-600 bg-[#161512] w-6 h-6 rounded-md flex items-center justify-center shrink-0">{idx+1}</div>
                                              <input value={hint} onChange={e => { const updated = [...exerciseHints]; updated[idx] = e.target.value; setExerciseHints(updated); }} placeholder={`متن راهنمایی مرحله ${idx+1}...`} className="flex-1 bg-[#1e1c19] border border-[#35332e] rounded-xl p-2 text-xs text-white outline-none focus:border-amber-500" />
                                              {exerciseHints.length > 1 && <button type="button" onClick={() => setExerciseHints(exerciseHints.filter((_, i) => i !== idx))} className="text-zinc-600 hover:text-rose-500 p-1.5"><X size={14}/></button>}
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">{isSubmitting ? <Loader2 className="animate-spin"/> : <><CheckCircle2 size={16}/> تزریق تمرین تعاملی به دیتابیس</>}</button>
                          </form>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* 🌟 مودال ساخت دوره جدید (بدون تغییر) */}
      <AnimatePresence>
          {isAddModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#1e1c19] border border-[#35332e] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                      <div className="flex items-center justify-between p-5 border-b border-[#35332e] bg-[#161512] shrink-0"><h2 className="font-black text-white text-lg">ایجاد دوره جدید</h2><button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button></div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                          <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">عنوان دوره</label><input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none" /></div>
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">نام مدرس</label><input required value={formData.instructor} onChange={e=>setFormData({...formData, instructor: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none" /></div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">دسته‌بندی</label><select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-zinc-300 outline-none"><option value="openings">شروع بازی</option><option value="middlegame">وسط بازی</option><option value="tactics">تاکتیک‌ها</option><option value="endgame">آخر بازی</option></select></div>
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">سطح دوره</label><input value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none" /></div>
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">مدت زمان کل</label><input value={formData.duration} onChange={e=>setFormData({...formData, duration: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none" /></div>
                              </div>
                              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">لینک کاور دوره</label><input type="url" dir="ltr" value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none" /></div>
                              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">توضیحات کامل دوره</label><textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none min-h-[100px]" /></div>
                              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">پیش‌نیازهای دوره</label><textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none min-h-[80px]" /></div>
                              <div className="flex items-center gap-6 mt-2 bg-[#121110] border border-[#35332e] p-4 rounded-xl">
                                  <label className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer"><input type="checkbox" checked={formData.isPremium} onChange={e=>setFormData({...formData, isPremium: e.target.checked})} className="w-4 h-4 accent-amber-500" /><Crown size={16} className="text-amber-500"/> دوره پولی (VIP)</label>
                                  {formData.isPremium && <div className="flex items-center gap-2"><span className="text-xs text-zinc-400">قیمت (الماس):</span><input type="number" value={formData.price} onChange={e=>setFormData({...formData, price: Number(e.target.value)})} className="w-20 bg-[#1e1c19] border border-[#35332e] rounded-lg p-1.5 text-center text-sm text-amber-400" /></div>}
                              </div>
                              <button type="submit" disabled={isSubmitting} className="mt-4 w-full bg-farzin-accent text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 text-sm shadow-md">ثبت و انتشار دوره در آکادمی</button>
                          </form>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}