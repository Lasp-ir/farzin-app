import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Users, Plus, 
  Trash2, Video, ChevronRight, Crown,
  X, CheckCircle2, Loader2, Play, Award, RotateCcw, 
  MessageSquare, HelpCircle as HintIcon, Save, MousePointer2
} from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('courses');
  const [search, setSearch] = useState('');
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 📚 استیت‌های مدیریت دوره‌ها
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      title: '', instructor: 'تیم فرزین', category: 'openings', 
      level: 'متوسط', duration: '۲ ساعت', image: '', 
      description: '', requirements: '', isPremium: true, price: 100
  });

  // 🎥 استیت‌های مدیریت جلسات
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
      title: '', videoUrl: '', duration: '', order: 1, isFreePreview: false
  });

  // ♟️ استیت‌های کارگاه تعاملی ساخت پازل
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [lessonExercises, setLessonExercises] = useState<any[]>([]);
  
  // لاجیک شطرنج و ترسیمات (Annotations)
  const [game, setGame] = useState(new Chess());
  const [exFen, setExFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [recordedMoves, setRecordedMoves] = useState<any[]>([]);
  const [overallDesc, setOverallDesc] = useState('');
  const [exOrder, setExOrder] = useState(1);

  // ابزارهای رسم فلش و دایره
  const [drawingColor, setDrawingColor] = useState('#10b981'); // رنگ پیش‌فرض: سبز
  const [rightClickStart, setRightClickStart] = useState<string | null>(null);
  const [baseAnnotations, setBaseAnnotations] = useState({ arrows: [] as any[], circles: {} as Record<string, string> });
  const [currentArrows, setCurrentArrows] = useState<any[]>([]);
  const [currentCircles, setCurrentCircles] = useState<Record<string, string>>({});

  const drawingColors = [
      { id: '#10b981', name: 'سبز' },
      { id: '#ef4444', name: 'قرمز' },
      { id: '#3b82f6', name: 'آبی' },
      { id: '#f59e0b', name: 'زرد' }
  ];

  const fetchCourses = async () => {
      setIsLoading(true);
      try {
          const res = await fetch('http://localhost:5000/api/courses');
          if (res.ok) setCourses(await res.json());
      } catch (err) { console.error(err); } 
      finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  // --- توابع دوره‌ها و جلسات ---
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
      if(!window.confirm('حذف دوره؟')) return;
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

  // 🔥 --- توابع کارگاه تعاملی شطرنج و ترسیمات --- 🔥
  const openExerciseModal = async (lesson: any) => {
      setSelectedLesson(lesson);
      setIsExerciseModalOpen(true);
      resetExerciseBuilder();
      try {
          const res = await fetch(`http://localhost:5000/api/courses/lessons/${lesson.id}/exercises`);
          if (res.ok) {
              const data = await res.json();
              setLessonExercises(data);
              setExOrder(data.length + 1);
          }
      } catch (err) { console.error(err); }
  };

  const resetExerciseBuilder = () => {
      const newGame = new Chess();
      setGame(newGame);
      setExFen(newGame.fen());
      setRecordedMoves([]);
      setOverallDesc('');
      setBaseAnnotations({ arrows: [], circles: {} });
      setCurrentArrows([]);
      setCurrentCircles({});
      setRightClickStart(null);
  };

  const handleFenLoad = (newFen: string) => {
      try {
          const newGame = new Chess(newFen);
          setGame(newGame);
          setExFen(newFen);
          setRecordedMoves([]); 
          setBaseAnnotations({ arrows: [], circles: {} });
          setCurrentArrows([]);
          setCurrentCircles({});
      } catch (e) { alert('کد FEN وارد شده نامعتبر است!'); }
  };

  // ذخیره نقاشی‌ها تو استیت حرکت فعلی
  const saveAnnotationsToState = (arrows: any[], circles: Record<string, string>) => {
      if (recordedMoves.length > 0) {
          const updated = [...recordedMoves];
          const lastIdx = updated.length - 1;
          updated[lastIdx].arrows = arrows;
          updated[lastIdx].circles = circles;
          setRecordedMoves(updated);
      } else {
          setBaseAnnotations({ arrows, circles });
      }
  };

  const handleSquareRightClick = (square: string) => {
      if (!rightClickStart) {
          setRightClickStart(square);
      } else {
          if (rightClickStart === square) {
              // کشیدن یا پاک کردن دایره (Highlight)
              const newCircles = { ...currentCircles };
              if (newCircles[square] === drawingColor) delete newCircles[square];
              else newCircles[square] = drawingColor;
              setCurrentCircles(newCircles);
              saveAnnotationsToState(currentArrows, newCircles);
          } else {
              // رسم یا پاک کردن فلش
              const newArrow = [rightClickStart, square, drawingColor];
              let newArrows = [...currentArrows];
              const existsIndex = newArrows.findIndex(a => a[0] === rightClickStart && a[1] === square);
              
              if (existsIndex >= 0 && newArrows[existsIndex][2] === drawingColor) {
                  newArrows.splice(existsIndex, 1); // پاکش کن اگه بود
              } else {
                  newArrows.push(newArrow);
              }
              setCurrentArrows(newArrows);
              saveAnnotationsToState(newArrows, currentCircles);
          }
          setRightClickStart(null);
      }
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
      try {
          const move = game.move({ from: sourceSquare, to: targetSquare, promotion: piece[1].toLowerCase() ?? 'q' });
          if (move) {
              setExFen(game.fen());
              setRecordedMoves([...recordedMoves, {
                  uci: move.from + move.to,
                  san: move.san,
                  color: move.color,
                  comment: '',
                  hint: '',
                  arrows: [],
                  circles: {}
              }]);
              // با هر حرکت جدید، تخته برای نقاشی پاک میشه
              setCurrentArrows([]);
              setCurrentCircles({});
              setRightClickStart(null);
              return true;
          }
      } catch (e) { return false; }
      return false;
  };

  const undoMove = () => {
      if (recordedMoves.length === 0) return;
      game.undo();
      setExFen(game.fen());
      const prevMoves = recordedMoves.slice(0, -1);
      setRecordedMoves(prevMoves);
      
      // برگردوندن نقاشی‌های حرکت قبلی به روی تخته
      if (prevMoves.length > 0) {
          const last = prevMoves[prevMoves.length - 1];
          setCurrentArrows(last.arrows || []);
          setCurrentCircles(last.circles || {});
      } else {
          setCurrentArrows(baseAnnotations.arrows || []);
          setCurrentCircles(baseAnnotations.circles || {});
      }
      setRightClickStart(null);
  };

  const updateMoveData = (index: number, field: 'comment' | 'hint', value: string) => {
      const updated = [...recordedMoves];
      updated[index][field] = value;
      setRecordedMoves(updated);
  };

  const handleSaveExercise = async () => {
      setIsSubmitting(true);
      
      // 🧠 ذخیره کل اطلاعات (حرکات، کامنت‌ها و نقاشی‌ها) به صورت یک JSON یکپارچه
      const payload = {
          fen: recordedMoves.length > 0 ? new Chess(exFen).history().length === 0 ? exFen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : exFen,
          moves: JSON.stringify({ baseAnnotations, moves: recordedMoves }), 
          description: overallDesc,
          order: exOrder
      };
      
      // محاسبه دقیق FEN اولیه
      let tempGame = new Chess();
      try { 
          tempGame.load(exFen); 
          recordedMoves.forEach(() => tempGame.undo()); 
          payload.fen = tempGame.fen(); 
      } catch(e) { payload.fen = exFen; } 

      try {
          const res = await fetch(`http://localhost:5000/api/courses/lessons/${selectedLesson.id}/exercises`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          if (res.ok) {
              const newEx = await res.json();
              setLessonExercises([...lessonExercises, newEx]);
              resetExerciseBuilder();
              setExOrder(prev => prev + 1);
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

  // استایل دادن به دایره‌ها (Highlights)
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  Object.entries(currentCircles).forEach(([sq, color]) => {
      customSquareStyles[sq] = { boxShadow: `inset 0 0 0 4px ${color}`, borderRadius: '4px' };
  });
  if (rightClickStart) {
      customSquareStyles[rightClickStart] = { ...customSquareStyles[rightClickStart], backgroundColor: 'rgba(255, 255, 255, 0.4)' };
  }

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex" dir="rtl">
      
      {/* سایدبار */}
      <div className="w-64 bg-[#121110] border-l border-white/5 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
            <div className="w-10 h-10 rounded-xl bg-farzin-accent/20 flex items-center justify-center text-farzin-accent"><Crown size={20} /></div>
            <div className="flex flex-col"><span className="font-black text-white text-lg tracking-tight">فرزین <span className="text-farzin-accent">ادمین</span></span></div>
        </div>
        <div className="flex flex-col p-4 gap-2 flex-1">
            <button onClick={() => setActiveMenu('dashboard')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'dashboard' ? 'bg-farzin-accent text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><LayoutDashboard size={18} /> داشبورد</button>
            <button onClick={() => setActiveMenu('courses')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'courses' ? 'bg-farzin-accent text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><BookOpen size={18} /> مدیریت دوره‌ها</button>
        </div>
        <div className="p-4 mt-auto border-t border-white/5"><button onClick={() => navigate('/education')} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors w-full justify-center py-2"><ChevronRight size={14} /> مشاهده آکادمی فرزین</button></div>
      </div>

      {/* بخش اصلی (لیست دوره‌ها) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#0c0b0a]/80 backdrop-blur-md shrink-0">
            <h1 className="text-xl font-black text-white">مدیریت دوره‌های آموزشی</h1>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-farzin-accent to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95"><Plus size={18} /> دوره جدید</button>
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
                                    <div className="flex items-center gap-2 mb-1"><h3 className="font-black text-lg text-white">{course.title}</h3>{course.isPremium && <span className="bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[10px] font-black"><Crown size={10} className="inline mr-1"/>VIP</span>}</div>
                                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-500"><span className="flex items-center gap-1.5"><Users size={14}/> {course.instructor}</span><span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"><Video size={14}/> {course._count?.lessons || 0} جلسه</span></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openLessonModal(course)} className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all" title="مدیریت جلسات و تمرینات"><Video size={18} /></button>
                                <button onClick={() => handleDeleteCourse(course.id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all" title="حذف"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* 🎥 مودال ویدیوها (بدون تغییر) */}
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
                                      <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#262421] flex items-center justify-center text-xs font-black text-zinc-400">{lesson.order}</div><span className="text-sm font-bold text-white">{lesson.title}</span></div>
                                      <div className="flex items-center gap-2">
                                          <button onClick={() => { setIsLessonModalOpen(false); openExerciseModal(lesson); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-black transition-all"><Award size={14}/> طراحی تمرینات</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          <form onSubmit={handleAddLesson} className="flex flex-col gap-4 bg-[#121110] p-5 rounded-2xl border border-[#35332e]">
                              <h3 className="text-sm font-bold text-white">افزودن جلسه جدید</h3>
                              <div className="grid grid-cols-3 gap-3">
                                  <div className="col-span-2 flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">عنوان جلسه</label><input required value={lessonFormData.title} onChange={e=>setLessonFormData({...lessonFormData, title: e.target.value})} className="bg-[#1e1c19] border border-[#35332e] text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                                  <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">مدت زمان</label><input required value={lessonFormData.duration} onChange={e=>setLessonFormData({...lessonFormData, duration: e.target.value})} className="bg-[#1e1c19] border border-[#35332e] text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                              </div>
                              <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">لینک ویدیو (MP4)</label><input required type="url" dir="ltr" value={lessonFormData.videoUrl} onChange={e=>handleVideoUrlChange(e.target.value)} className="bg-[#1e1c19] border border-[#35332e] text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                              <button type="submit" className="w-full bg-blue-600 text-white font-black py-3 rounded-xl text-sm">ثبت جلسه</button>
                          </form>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* ♟️ 🔥 کارگاه فوق‌پیشرفته ساخت تمرین تعاملی */}
      <AnimatePresence>
          {isExerciseModalOpen && selectedLesson && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#121110] border border-[#35332e] rounded-3xl w-full max-w-6xl flex flex-col h-[95vh] overflow-hidden shadow-2xl">
                      
                      <div className="flex items-center justify-between p-4 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <div className="flex flex-col"><h2 className="font-black text-white text-lg flex items-center gap-2 text-emerald-400"><Award size={20}/> استودیوی تعاملی طراحی پازل</h2><span className="text-xs text-zinc-400 mt-1">طراحی تمرین برای: {selectedLesson.title}</span></div>
                          <button onClick={() => { setIsExerciseModalOpen(false); setIsLessonModalOpen(true); }} className="text-zinc-400 hover:text-white bg-[#262421] px-4 py-2 rounded-xl flex items-center gap-1 text-xs font-bold transition-colors"><ChevronRight size={14}/> بازگشت به جلسات</button>
                      </div>

                      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                          
                          {/* ◀️ سمت راست: تخته شطرنج و تنظیمات */}
                          <div className="w-full lg:w-[450px] shrink-0 border-l border-[#35332e] p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-[#161512]">
                              
                              {/* تخته تعاملی (رفع مشکل LTR) */}
                              <div className="w-full relative select-none" dir="ltr" onContextMenu={(e) => e.preventDefault()}>
                                  <div className="w-full aspect-square rounded-xl overflow-hidden border-4 border-[#262421] shadow-xl relative">
                                      <Chessboard 
                                          position={exFen} 
                                          onPieceDrop={onDrop} 
                                          onSquareClick={() => setRightClickStart(null)}
                                          onSquareRightClick={handleSquareRightClick}
                                          customArrows={currentArrows}
                                          customSquareStyles={customSquareStyles}
                                          animationDuration={200} 
                                          customDarkSquareStyle={{ backgroundColor: '#779556' }} 
                                          customLightSquareStyle={{ backgroundColor: '#ebecd0' }} 
                                      />
                                  </div>
                                  
                                  {/* نوار ابزار رسم و Undo */}
                                  <div className="absolute -top-12 right-0 left-0 flex justify-between items-center bg-[#1e1c19] border border-[#35332e] p-2 rounded-xl shadow-lg" dir="rtl">
                                      <div className="flex items-center gap-2">
                                          <MousePointer2 size={14} className="text-zinc-500 ml-1" />
                                          {drawingColors.map(c => (
                                              <button key={c.id} onClick={() => setDrawingColor(c.id)} className={`w-6 h-6 rounded-full border-2 transition-transform ${drawingColor === c.id ? 'scale-125 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: c.id }} title={c.name} />
                                          ))}
                                      </div>
                                      <button onClick={undoMove} disabled={recordedMoves.length === 0} className="p-1.5 bg-[#262421] hover:bg-[#35332e] text-white rounded-lg disabled:opacity-50 transition-all border border-[#35332e]"><RotateCcw size={16}/></button>
                                  </div>
                              </div>

                              <div className="flex flex-col gap-2 mt-4">
                                  <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                                      <span>چیدمان اولیه (FEN)</span>
                                      <button type="button" onClick={resetExerciseBuilder} className="text-emerald-400 hover:text-emerald-300">ریست تخته</button>
                                  </label>
                                  <input value={exFen} onChange={(e) => handleFenLoad(e.target.value)} placeholder="شروع از چیدمان اولیه..." className="w-full bg-[#1e1c19] border border-[#35332e] rounded-xl p-2.5 text-xs text-zinc-300 font-mono outline-none focus:border-emerald-500" dir="ltr" />
                              </div>

                              <div className="flex flex-col gap-2">
                                  <label className="text-[11px] font-bold text-zinc-400">صورت مسئله (قبل از شروع تمرین نمایش داده می‌شود)</label>
                                  <textarea value={overallDesc} onChange={e=>setOverallDesc(e.target.value)} placeholder="مثال: سفید در ۳ حرکت مات می‌کند..." className="w-full bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-xs text-white outline-none min-h-[60px] resize-y focus:border-emerald-500" />
                              </div>

                              <div className="mt-auto">
                                  <button onClick={handleSaveExercise} disabled={isSubmitting || (recordedMoves.length === 0 && !overallDesc)} className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-600 disabled:opacity-50 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-[0_5px_15px_rgba(16,185,129,0.2)] active:scale-95 transition-all">
                                      {isSubmitting ? <Loader2 className="animate-spin"/> : <><Save size={18}/> ذخیره در دیتابیس (با {recordedMoves.length} حرکت)</>}
                                  </button>
                              </div>
                          </div>

                          {/* ▶️ سمت چپ: لیست حرکات و لاگ‌ها */}
                          <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0b0a]">
                              <div className="p-4 border-b border-[#35332e] bg-[#121110]">
                                  <h3 className="font-black text-sm text-white flex items-center gap-2"><BookOpen size={16} className="text-sky-400"/> سناریوی حرکات و آموزش‌ها</h3>
                                  <p className="text-[11px] text-zinc-500 mt-1">برای نوشتن توضیحاتِ هر حرکت، ابتدا روی تخته مهره جابجا کنید تا کادر آن در اینجا ظاهر شود.</p>
                              </div>

                              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-4">
                                  {recordedMoves.length === 0 ? (
                                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                                          <Play size={48} className="mb-4" />
                                          <span className="font-bold">برای شروع، روی تخته مهره جابجا کنید.</span>
                                      </div>
                                  ) : (
                                      recordedMoves.map((move, index) => (
                                          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={index} className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 flex flex-col gap-4 group relative overflow-hidden shadow-md">
                                              <div className={`absolute top-0 right-0 w-1.5 h-full ${move.color === 'w' ? 'bg-zinc-200' : 'bg-zinc-700'}`}></div>
                                              
                                              <div className="flex items-center gap-3 border-b border-[#35332e] pb-3">
                                                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${move.color === 'w' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-white'}`}>{move.san}</span>
                                                  <div className="flex flex-col">
                                                      <span className="text-xs font-bold text-zinc-400 tracking-wider">حرکت {Math.floor(index/2) + 1}</span>
                                                      <span className={`text-sm font-black ${move.color === 'w' ? 'text-zinc-200' : 'text-zinc-500'}`}>{move.color === 'w' ? 'سفید بازی کرد' : 'سیاه بازی کرد'}</span>
                                                  </div>
                                              </div>

                                              <div className="grid grid-cols-1 gap-4">
                                                  <div className="flex flex-col gap-2">
                                                      <label className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5"><MessageSquare size={14}/> توضیح دلیل این حرکت (بعد از اجرا نمایش داده می‌شود)</label>
                                                      <textarea value={move.comment} onChange={(e) => updateMoveData(index, 'comment', e.target.value)} placeholder="مثال: این حرکت مرکز را کنترل می‌کند..." className="bg-[#1e1c19] border border-[#35332e] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-sky-500 transition-colors resize-y min-h-[60px]" />
                                                  </div>
                                                  
                                                  <div className="flex flex-col gap-2">
                                                      <label className="text-[11px] font-bold text-amber-500 flex items-center gap-1.5"><HintIcon size={14}/> راهنمایی (در صورت اشتباه زدنِ کاربر نمایش داده می‌شود)</label>
                                                      <textarea value={move.hint} onChange={(e) => updateMoveData(index, 'hint', e.target.value)} placeholder="مثال: به فیل خونه c4 دقت کن..." className="bg-[#1e1c19] border border-[#35332e] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors resize-y min-h-[60px]" />
                                                  </div>
                                              </div>
                                          </motion.div>
                                      ))
                                  )}
                              </div>
                          </div>

                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* 🌟 مودال ساخت دوره جدید */}
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
                              <button type="submit" disabled={isSubmitting} className="mt-4 w-full bg-farzin-accent text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 text-sm shadow-md">ثبت دوره</button>
                          </form>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}