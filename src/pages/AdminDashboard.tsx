import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Users, Settings, Plus, 
  Edit, Trash2, Video, ChevronRight, Crown, ShieldAlert,
  Search, PlayCircle, X, CheckCircle2, Loader2, Play
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('courses');
  const [search, setSearch] = useState('');
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🔥 اضافه شدن description و requirements
  const [formData, setFormData] = useState({
      title: '', instructor: 'تیم فرزین', category: 'openings', 
      level: 'متوسط', duration: '۲ ساعت', image: '', 
      description: '', requirements: '', 
      isPremium: true, price: 100
  });

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
      title: '', videoUrl: '', duration: '', order: 1, isFreePreview: false
  });

  const fetchCourses = async () => {
      setIsLoading(true);
      try {
          const res = await fetch('http://localhost:5000/api/courses');
          if (res.ok) {
              const data = await res.json();
              setCourses(data);
          }
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
              // 🔥 ریست کردن فرم
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

  // 🪄 جادوی دریافت اتوماتیک مشخصات ویدیو
  const handleVideoUrlChange = (url: string) => {
      setLessonFormData(prev => ({ ...prev, videoUrl: url }));
      
      if (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('mp4')) {
          const video = document.createElement('video');
          video.src = url;
          video.onloadedmetadata = () => {
              const mins = Math.floor(video.duration / 60);
              const secs = Math.floor(video.duration % 60);
              const formattedDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
              
              setLessonFormData(prev => ({
                  ...prev, 
                  duration: formattedDuration,
                  title: prev.title || 'ویدیوی جدید'
              }));
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

  const handleDeleteLesson = async (lessonId: string) => {
      if(!window.confirm('حذف جلسه؟')) return;
      try {
          const res = await fetch(`http://localhost:5000/api/courses/lessons/${lessonId}`, { method: 'DELETE' });
          if(res.ok) {
              setCourseLessons(courseLessons.filter(l => l.id !== lessonId));
              fetchCourses();
          }
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
            <button onClick={() => setActiveMenu('users')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'users' ? 'bg-farzin-accent text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><Users size={18} /> کاربران</button>
        </div>

        <div className="p-4 mt-auto border-t border-white/5">
            <button onClick={() => navigate('/education')} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors w-full justify-center py-2"><ChevronRight size={14} /> مشاهده آکادمی فرزین</button>
        </div>
      </div>

      {/* بخش اصلی */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#0c0b0a]/80 backdrop-blur-md shrink-0">
            <h1 className="text-xl font-black text-white">مدیریت دوره‌های آموزشی</h1>
            <div className="flex items-center gap-4">
                <button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-farzin-accent to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-[0_4px_15px_rgba(119,149,86,0.4)]">
                    <Plus size={18} /> دوره جدید
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {isLoading ? (
                <div className="flex justify-center items-center mt-20 text-zinc-500 gap-3"><Loader2 className="animate-spin" /> در حال دریافت اطلاعات...</div>
            ) : courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20 text-zinc-500">
                    <ShieldAlert size={48} className="mb-4 opacity-50" />
                    <h3 className="text-white font-bold mb-2">هنوز هیچ دوره‌ای نساختی!</h3>
                    <p className="text-sm">روی دکمه «دوره جدید» کلیک کن تا اولین آموزشت رو به دیتابیس اضافه کنی.</p>
                </div>
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
                                <button onClick={() => openLessonModal(course)} className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all" title="مدیریت جلسات"><Video size={18} /></button>
                                <button className="p-2.5 bg-[#262421] hover:bg-amber-500 hover:text-white text-zinc-400 rounded-xl transition-all" title="ویرایش دوره"><Edit size={18} /></button>
                                <button onClick={() => handleDeleteCourse(course.id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all" title="حذف"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* 🌟 مودال مدیریت جلسات (Lessons) */}
      <AnimatePresence>
          {isLessonModalOpen && selectedCourse && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" dir="rtl">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#1e1c19] border border-[#35332e] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                      
                      <div className="flex items-center justify-between p-5 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <div className="flex flex-col">
                              <h2 className="font-black text-white text-lg flex items-center gap-2"><Video size={18} className="text-blue-400"/> جلسات دوره</h2>
                              <span className="text-xs text-zinc-400">{selectedCourse.title}</span>
                          </div>
                          <button onClick={() => setIsLessonModalOpen(false)} className="text-zinc-500 hover:text-white bg-[#262421] p-2 rounded-xl"><X size={20}/></button>
                      </div>

                      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                          <div className="flex flex-col gap-2">
                              <h3 className="text-sm font-bold text-zinc-400 mb-2 border-b border-[#35332e] pb-2">سرفصل‌های موجود</h3>
                              {isLessonLoading ? (
                                  <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-400"/></div>
                              ) : courseLessons.length === 0 ? (
                                  <div className="text-center text-xs text-zinc-500 p-4 border border-dashed border-[#35332e] rounded-xl">هنوز هیچ ویدئویی برای این دوره ثبت نشده است.</div>
                              ) : (
                                  courseLessons.map(lesson => (
                                      <div key={lesson.id} className="flex items-center justify-between bg-[#161512] p-3 rounded-xl border border-[#35332e] group hover:border-zinc-500 transition-colors">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-lg bg-[#262421] flex items-center justify-center text-xs font-black text-zinc-400">{lesson.order}</div>
                                              <div className="flex flex-col">
                                                  <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{lesson.title}</span>
                                                  <span className="text-[10px] text-zinc-500 flex items-center gap-2">
                                                      {lesson.duration} 
                                                      {lesson.isFreePreview && <span className="bg-emerald-500/10 text-emerald-400 px-1.5 rounded border border-emerald-500/20">پیش‌نمایش رایگان</span>}
                                                  </span>
                                              </div>
                                          </div>
                                          <button onClick={() => handleDeleteLesson(lesson.id)} className="text-zinc-600 hover:text-rose-500 p-2"><Trash2 size={16}/></button>
                                      </div>
                                  ))
                              )}
                          </div>

                          <form onSubmit={handleAddLesson} className="flex flex-col gap-4 bg-[#121110] p-5 rounded-2xl border border-[#35332e]">
                              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus size={16} className="text-emerald-500"/> افزودن جلسه جدید</h3>
                              
                              <div className="grid grid-cols-3 gap-3">
                                  <div className="col-span-2 flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">عنوان جلسه</label><input required value={lessonFormData.title} onChange={e=>setLessonFormData({...lessonFormData, title: e.target.value})} placeholder="مثال: مفاهیم پایه..." className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-2.5 text-sm text-white outline-none focus:border-blue-400" /></div>
                                  <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">مدت زمان</label><input required value={lessonFormData.duration} onChange={e=>setLessonFormData({...lessonFormData, duration: e.target.value})} placeholder="12:45" className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-2.5 text-sm text-white outline-none focus:border-blue-400" /></div>
                              </div>

                              <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">لینک ویدیو (آپارات، یوتیوب یا سرور)</label><input required type="url" dir="ltr" value={lessonFormData.videoUrl} onChange={e=>handleVideoUrlChange(e.target.value)} placeholder="https://..." className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-2.5 text-sm text-white outline-none focus:border-blue-400" /></div>

                              <div className="flex items-center justify-between mt-2">
                                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                                      <input type="checkbox" checked={lessonFormData.isFreePreview} onChange={e=>setLessonFormData({...lessonFormData, isFreePreview: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                                      پیش‌نمایش رایگان (باز برای همه)
                                  </label>
                                  
                                  <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-zinc-400">شماره جلسه:</span>
                                      <input type="number" min="1" value={lessonFormData.order} onChange={e=>setLessonFormData({...lessonFormData, order: Number(e.target.value)})} className="w-16 bg-[#1e1c19] border border-[#35332e] rounded-lg p-1.5 text-center text-sm font-black outline-none" />
                                  </div>
                              </div>

                              <button type="submit" disabled={isSubmitting} className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl flex justify-center items-center gap-2 transition-all">
                                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={16} /> ثبت جلسه در دیتابیس</>}
                              </button>
                          </form>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* 🌟 مودال ساخت دوره جدید */}
      <AnimatePresence>
          {isAddModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" dir="rtl">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#1e1c19] border border-[#35332e] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                      <div className="flex items-center justify-between p-5 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <h2 className="font-black text-white text-lg">ایجاد دوره جدید</h2>
                          <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                          <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">عنوان دوره</label><input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-farzin-accent" /></div>
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">نام مدرس</label><input required value={formData.instructor} onChange={e=>setFormData({...formData, instructor: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-farzin-accent" /></div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4">
                                  <div className="flex flex-col gap-1.5">
                                      <label className="text-xs font-bold text-zinc-400">دسته‌بندی</label>
                                      <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-zinc-300 outline-none focus:border-farzin-accent">
                                          <option value="openings">شروع بازی</option><option value="middlegame">وسط بازی</option><option value="tactics">تاکتیک‌ها</option><option value="endgame">آخر بازی</option>
                                      </select>
                                  </div>
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">سطح دوره</label><input value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-farzin-accent" /></div>
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">مدت زمان کل</label><input value={formData.duration} onChange={e=>setFormData({...formData, duration: e.target.value})} className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-farzin-accent" /></div>
                              </div>

                              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">لینک کاور دوره (Image URL)</label><input type="url" dir="ltr" value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} placeholder="https://..." className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-farzin-accent" /></div>

                              {/* 🔥 فیلدهای جدید: توضیحات و پیش‌نیازها */}
                              <div className="flex flex-col gap-1.5 mt-2">
                                  <label className="text-xs font-bold text-zinc-400">توضیحات کامل دوره</label>
                                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="در این دوره چه چیزهایی آموزش داده می‌شود؟" className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-farzin-accent min-h-[100px] resize-y" />
                              </div>

                              <div className="flex flex-col gap-1.5 mt-2">
                                  <label className="text-xs font-bold text-zinc-400">پیش‌نیازهای دوره</label>
                                  <textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} placeholder="دانشجو قبل از این دوره چه چیزهایی باید بداند؟ (با خط تیره جدا کنید)" className="bg-[#121110] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-farzin-accent min-h-[80px] resize-y" />
                              </div>

                              <div className="flex items-center gap-6 mt-2 bg-[#121110] border border-[#35332e] p-4 rounded-xl">
                                  <label className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer">
                                      <input type="checkbox" checked={formData.isPremium} onChange={e=>setFormData({...formData, isPremium: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                                      <Crown size={16} className="text-amber-500"/> دوره پولی (VIP)
                                  </label>
                                  {formData.isPremium && (
                                      <div className="flex items-center gap-2">
                                          <span className="text-xs text-zinc-400">قیمت (الماس):</span>
                                          <input type="number" value={formData.price} onChange={e=>setFormData({...formData, price: Number(e.target.value)})} className="w-20 bg-[#1e1c19] border border-[#35332e] rounded-lg p-1.5 text-center text-sm text-amber-400 outline-none" />
                                      </div>
                                  )}
                              </div>

                              <button type="submit" disabled={isSubmitting} className="mt-4 w-full bg-farzin-accent hover:bg-[#68824b] text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-all shrink-0">
                                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> ثبت و انتشار دوره در آکادمی</>}
                              </button>
                          </form>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}