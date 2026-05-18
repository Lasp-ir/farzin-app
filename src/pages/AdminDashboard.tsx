import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Users, Plus, 
  Trash2, Video, ChevronRight, Crown,
  X, CheckCircle2, Loader2, Play, Award, RotateCcw, 
  MessageSquare, HelpCircle as HintIcon, Save, MousePointer2, 
  Circle, ArrowUpRight, Eraser, Clock, ShieldCheck, Edit3, Lightbulb, Settings2
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
  
  // 📚 دوره‌ها
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      title: '', instructor: 'تیم فرزین', category: 'openings', 
      level: 'متوسط', duration: '۲ ساعت', image: '', 
      description: '', requirements: '', isPremium: true, price: 100
  });

  // 🎥 جلسات
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [showAddLessonForm, setShowAddLessonForm] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
      title: '', videoUrl: '', duration: '', order: 1, isFreePreview: false
  });

  // ♟️ پازل‌ها و کارگاه
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [lessonExercises, setLessonExercises] = useState<any[]>([]);
  
  const [game, setGame] = useState(new Chess());
  // 🔥 استیت کلیدی برای حل مشکل: نگهداری نقطه صفر (مبدا) پازل
  const [startFen, setStartFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [exFen, setExFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  
  const [recordedMoves, setRecordedMoves] = useState<any[]>([]);
  const [overallDesc, setOverallDesc] = useState('');
  const [exOrder, setExOrder] = useState(1);

  // ترسیمات
  const boardRef = useRef<HTMLDivElement>(null);
  const [drawMode, setDrawMode] = useState(false); 
  const [drawTool, setDrawTool] = useState<'circle' | 'arrow'>('circle'); 
  const [dragStartSq, setDragStartSq] = useState<string | null>(null); 
  const [activeDragArrow, setActiveDragArrow] = useState<any[] | null>(null);
  const [drawingColor, setDrawingColor] = useState('#10b981'); 
  const [baseAnnotations, setBaseAnnotations] = useState({ arrows: [] as any[], circles: {} as Record<string, string> });
  const [currentArrows, setCurrentArrows] = useState<any[]>([]);
  const [currentCircles, setCurrentCircles] = useState<Record<string, string>>({});

  const drawingColors = [
      { id: '#10b981', name: 'سبز' }, { id: '#ef4444', name: 'قرمز' },
      { id: '#3b82f6', name: 'آبی' }, { id: '#f59e0b', name: 'زرد' }
  ];

  useEffect(() => { fetchCourses(); }, []);
  const fetchCourses = async () => {
      setIsLoading(true);
      try {
          const res = await fetch('http://localhost:5000/api/courses');
          if (res.ok) setCourses(await res.json());
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
      e.preventDefault(); setIsSubmitting(true);
      try {
          const res = await fetch('http://localhost:5000/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
          if (res.ok) { setIsAddModalOpen(false); fetchCourses(); setFormData({ title: '', instructor: 'تیم فرزین', category: 'openings', level: 'متوسط', duration: '۲ ساعت', image: '', description: '', requirements: '', isPremium: true, price: 100 }); }
      } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteCourse = async (id: string) => {
      if(!window.confirm('حذف دوره؟')) return;
      try { const res = await fetch(`http://localhost:5000/api/courses/${id}`, { method: 'DELETE' }); if(res.ok) fetchCourses(); } catch (err) { console.error(err); }
  };

  // --- جلسات ---
  const openLessonModal = async (course: any) => {
      setSelectedCourse(course); setIsLessonModalOpen(true); setIsLessonLoading(true); setEditingLessonId(null);
      try {
          const res = await fetch(`http://localhost:5000/api/courses/${course.id}/lessons`);
          if (res.ok) {
              const data = await res.json(); setCourseLessons(data);
              setLessonFormData({ title: '', videoUrl: '', duration: '', order: data.length + 1, isFreePreview: false }); 
          }
      } catch (err) { console.error(err); } finally { setIsLessonLoading(false); }
  };

  const handleVideoUrlChange = (url: string) => {
      setLessonFormData(prev => ({ ...prev, videoUrl: url }));
      if (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('mp4')) {
          const video = document.createElement('video'); video.src = url;
          video.onloadedmetadata = () => {
              const mins = Math.floor(video.duration / 60); const secs = Math.floor(video.duration % 60);
              setLessonFormData(prev => ({ ...prev, duration: `${mins}:${secs < 10 ? '0' : ''}${secs}`, title: prev.title || 'ویدیوی جدید' }));
          };
      }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
      e.preventDefault(); setIsSubmitting(true);
      const url = editingLessonId ? `http://localhost:5000/api/courses/lessons/${editingLessonId}` : `http://localhost:5000/api/courses/${selectedCourse.id}/lessons`;
      const method = editingLessonId ? 'PUT' : 'POST';
      try {
          const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lessonFormData) });
          if (res.ok) { openLessonModal(selectedCourse); setShowAddLessonForm(false); }
      } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleEditLessonClick = (lesson: any) => {
      setEditingLessonId(lesson.id);
      setLessonFormData({ title: lesson.title, videoUrl: lesson.videoUrl, duration: lesson.duration, order: lesson.order, isFreePreview: lesson.isFreePreview });
      setShowAddLessonForm(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
      if(!window.confirm('حذف جلسه؟')) return;
      try {
          const res = await fetch(`http://localhost:5000/api/courses/lessons/${lessonId}`, { method: 'DELETE' });
          if(res.ok) openLessonModal(selectedCourse);
      } catch (err) { console.error(err); }
  };

  // --- کارگاه شطرنج ---
  const openExerciseModal = async (lesson: any) => {
      setSelectedLesson(lesson); setIsExerciseModalOpen(true); resetExerciseBuilder();
      try {
          const res = await fetch(`http://localhost:5000/api/courses/lessons/${lesson.id}/exercises`);
          if (res.ok) {
              const data = await res.json(); setLessonExercises(data); setExOrder(data.length + 1);
          }
      } catch (err) { console.error(err); }
  };

  const resetExerciseBuilder = () => {
      const newGame = new Chess(); 
      setGame(newGame); 
      setStartFen(newGame.fen()); // 🔥 قفل کردن نقطه صفر
      setExFen(newGame.fen()); 
      setRecordedMoves([]); 
      setOverallDesc('');
      setBaseAnnotations({ arrows: [], circles: {} }); 
      setCurrentArrows([]); 
      setCurrentCircles({}); 
      setDrawMode(false); 
      setDragStartSq(null);
  };

  const handleFenLoad = (newFen: string) => {
      try {
          const newGame = new Chess(newFen); 
          setGame(newGame); 
          setStartFen(newFen); // 🔥 قفل کردن نقطه صفر بر اساس FEN دستی
          setExFen(newFen); 
          setRecordedMoves([]); 
          setBaseAnnotations({ arrows: [], circles: {} }); 
          setCurrentArrows([]); 
          setCurrentCircles({});
      } catch (e) { alert('کد FEN وارد شده نامعتبر است!'); }
  };

  const saveAnnotationsToState = (arrows: any[], circles: Record<string, string>) => {
      if (recordedMoves.length > 0) {
          const updated = [...recordedMoves];
          updated[updated.length - 1].arrows = arrows; updated[updated.length - 1].circles = circles;
          setRecordedMoves(updated);
      } else { setBaseAnnotations({ arrows, circles }); }
  };

  const getSquareFromEvent = (e: React.PointerEvent) => {
      if (!boardRef.current) return null;
      const rect = boardRef.current.getBoundingClientRect();
      let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 1));
      let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 1));
      const fileIdx = Math.floor((x / rect.width) * 8); const rankIdx = 7 - Math.floor((y / rect.height) * 8); 
      return `${['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][fileIdx]}${rankIdx + 1}`;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      if (!drawMode) return; const sq = getSquareFromEvent(e); if (sq) setDragStartSq(sq);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
      if (!drawMode || !dragStartSq || drawTool !== 'arrow') return;
      const sq = getSquareFromEvent(e);
      if (sq && sq !== dragStartSq) setActiveDragArrow([dragStartSq, sq, drawingColor]); else setActiveDragArrow(null);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
      if (!drawMode || !dragStartSq) return;
      const sq = getSquareFromEvent(e); setActiveDragArrow(null);
      if (sq) {
          if (drawTool === 'circle' && sq === dragStartSq) {
              const newCircles = { ...currentCircles };
              if (newCircles[sq] === drawingColor) delete newCircles[sq]; else newCircles[sq] = drawingColor;
              setCurrentCircles(newCircles); saveAnnotationsToState(currentArrows, newCircles);
          } else if (drawTool === 'arrow' && sq !== dragStartSq) {
              const newArrow = [dragStartSq, sq, drawingColor]; let newArrows = [...currentArrows];
              const existsIndex = newArrows.findIndex(a => a[0] === dragStartSq && a[1] === sq);
              if (existsIndex >= 0 && newArrows[existsIndex][2] === drawingColor) newArrows.splice(existsIndex, 1); else newArrows.push(newArrow);
              setCurrentArrows(newArrows); saveAnnotationsToState(newArrows, currentCircles);
          }
      }
      setDragStartSq(null);
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
      if (drawMode) return false;
      try {
          const move = game.move({ from: sourceSquare, to: targetSquare, promotion: piece[1].toLowerCase() ?? 'q' });
          if (move) {
              setExFen(game.fen());
              setRecordedMoves([...recordedMoves, { uci: move.from + move.to, san: move.san, color: move.color, comment: '', hint: '', arrows: [], circles: {} }]);
              setCurrentArrows([]); setCurrentCircles({}); setDragStartSq(null); return true;
          }
      } catch (e) { return false; } return false;
  };

  const undoMove = () => {
      if (recordedMoves.length === 0) return;
      game.undo(); setExFen(game.fen());
      const prevMoves = recordedMoves.slice(0, -1); setRecordedMoves(prevMoves);
      if (prevMoves.length > 0) {
          const last = prevMoves[prevMoves.length - 1]; setCurrentArrows(last.arrows || []); setCurrentCircles(last.circles || {});
      } else { setCurrentArrows(baseAnnotations.arrows || []); setCurrentCircles(baseAnnotations.circles || {}); }
  };

  const updateMoveData = (index: number, field: 'comment' | 'hint', value: string) => {
      const updated = [...recordedMoves];
      updated[index][field] = value;
      setRecordedMoves(updated);
  };

  const handleSaveExercise = async () => {
      setIsSubmitting(true);
      const payload = {
          fen: startFen, // 🔥 اینجا فقط FEN شروع رو می‌فرستیم! مشکل پریدن به استیج آخر اینجا حل شد.
          moves: JSON.stringify({ baseAnnotations, moves: recordedMoves }), 
          description: overallDesc, 
          order: exOrder
      };

      try {
          const res = await fetch(`http://localhost:5000/api/courses/lessons/${selectedLesson.id}/exercises`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          if (res.ok) {
              const newEx = await res.json(); setLessonExercises([...lessonExercises, newEx]); resetExerciseBuilder(); setExOrder(prev => prev + 1);
          } 
      } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteExercise = async (exId: string) => {
      if(!window.confirm('تمرین حذف شود؟')) return;
      try {
          const res = await fetch(`http://localhost:5000/api/courses/exercises/${exId}`, { method: 'DELETE' });
          if(res.ok) setLessonExercises(lessonExercises.filter(e => e.id !== exId));
      } catch (err) { console.error(err); }
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  Object.entries(currentCircles).forEach(([sq, color]) => { customSquareStyles[sq] = { boxShadow: `inset 0 0 0 4px ${color}`, borderRadius: '4px' }; });
  if (dragStartSq && drawTool === 'arrow') customSquareStyles[dragStartSq] = { ...customSquareStyles[dragStartSq], backgroundColor: 'rgba(255, 255, 255, 0.4)' };

  const displayArrows = activeDragArrow ? [...currentArrows, activeDragArrow] : currentArrows;

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex" dir="rtl">
      
      {/* سایدبار دسکتاپ */}
      <div className="w-64 bg-[#121110] border-l border-white/5 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3"><div className="w-10 h-10 rounded-xl bg-farzin-accent/20 flex items-center justify-center text-farzin-accent"><Crown size={20} /></div><div className="flex flex-col"><span className="font-black text-white text-lg tracking-tight">فرزین <span className="text-farzin-accent">ادمین</span></span></div></div>
        <div className="flex flex-col p-4 gap-2 flex-1"><button className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all bg-farzin-accent text-white"><BookOpen size={18} /> مدیریت دوره‌ها</button></div>
        <div className="p-4 mt-auto border-t border-white/5"><button onClick={() => navigate('/education')} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white w-full justify-center py-2"><ChevronRight size={14} /> مشاهده آکادمی فرزین</button></div>
      </div>

      {/* بخش اصلی دوره‌ها */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-20 flex items-center justify-between px-6 md:px-8 border-b border-white/5 bg-[#0c0b0a]/80 backdrop-blur-md shrink-0"><h1 className="text-lg md:text-xl font-black text-white">دوره‌های آموزشی</h1><button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-farzin-accent to-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95"><Plus size={18} /> <span className="hidden md:inline">دوره جدید</span></button></div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {isLoading ? <div className="flex justify-center mt-20 text-zinc-500"><Loader2 className="animate-spin" /></div> : (
                <div className="grid grid-cols-1 gap-4">
                    {courses.map(course => (
                        <div key={course.id} className="bg-[#161512] border border-[#35332e] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                            <div className="flex items-center gap-4">
                                <img src={course.image} className="w-16 h-16 rounded-xl object-cover border border-[#35332e]" alt="" />
                                <div className="flex flex-col"><div className="flex items-center gap-2 mb-1"><h3 className="font-black text-base md:text-lg text-white">{course.title}</h3>{course.isPremium && <span className="bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[10px] font-black"><Crown size={10} className="inline mr-1"/>VIP</span>}</div><div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-500"><span className="flex items-center gap-1.5"><Users size={14}/> {course.instructor}</span><span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded"><Video size={14}/> {course._count?.lessons || 0} جلسه</span></div></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => openLessonModal(course)} className="flex-1 md:flex-none p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-colors text-xs font-bold flex items-center justify-center gap-2"><Settings2 size={16}/> مدیریت جلسات</button>
                                <button onClick={() => handleDeleteCourse(course.id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* 🎥 مودال مدیریت جلسات (Split View) */}
      <AnimatePresence>
          {isLessonModalOpen && selectedCourse && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-4">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#121110] border border-[#35332e] rounded-3xl w-full max-w-5xl flex flex-col h-[90vh] overflow-hidden shadow-2xl">
                      <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <div className="flex flex-col"><h2 className="font-black text-white text-lg flex items-center gap-2"><Video size={18} className="text-blue-400"/> جلسات: {selectedCourse.title}</h2></div>
                          <button onClick={() => setIsLessonModalOpen(false)} className="text-zinc-500 hover:text-white bg-[#262421] p-2 rounded-xl"><X size={20}/></button>
                      </div>
                      
                      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                          {/* پنل فرم اضافه/ویرایش */}
                          <div className="w-full lg:w-[350px] shrink-0 border-b lg:border-b-0 lg:border-l border-[#35332e] bg-[#161512] p-5 overflow-y-auto custom-scrollbar">
                              <form onSubmit={handleSaveLesson} className="flex flex-col gap-4">
                                  <div className="flex items-center justify-between mb-2">
                                      <h3 className="text-sm font-black text-blue-400 flex items-center gap-2">{editingLessonId ? <Edit3 size={16}/> : <Plus size={16}/>} {editingLessonId ? 'ویرایش جلسه' : 'افزودن جلسه جدید'}</h3>
                                      {editingLessonId && <button type="button" onClick={() => { setEditingLessonId(null); setLessonFormData({title:'', videoUrl:'', duration:'', order:courseLessons.length+1, isFreePreview:false})}} className="text-xs text-zinc-500 hover:text-white">انصراف</button>}
                                  </div>
                                  <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">عنوان جلسه</label><input required value={lessonFormData.title} onChange={e=>setLessonFormData({...lessonFormData, title: e.target.value})} className="bg-[#1e1c19] border border-[#35332e] text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                                  <div className="grid grid-cols-2 gap-3">
                                      <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">شماره</label><input type="number" min="1" required value={lessonFormData.order} onChange={e=>setLessonFormData({...lessonFormData, order: Number(e.target.value)})} className="bg-[#1e1c19] border border-[#35332e] text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 text-center font-mono" /></div>
                                      <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">مدت زمان</label><input required value={lessonFormData.duration} onChange={e=>setLessonFormData({...lessonFormData, duration: e.target.value})} className="bg-[#1e1c19] border border-[#35332e] text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                                  </div>
                                  <div className="flex flex-col gap-1.5"><label className="text-[11px] font-bold text-zinc-400">لینک ویدیو (MP4)</label><input required type="url" dir="ltr" value={lessonFormData.videoUrl} onChange={e=>handleVideoUrlChange(e.target.value)} className="bg-[#1e1c19] border border-[#35332e] text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-500" /></div>
                                  <div className="flex items-center gap-2 mt-2 bg-[#1e1c19] p-3 rounded-xl border border-[#35332e]">
                                      <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer w-full"><input type="checkbox" checked={lessonFormData.isFreePreview} onChange={e=>setLessonFormData({...lessonFormData, isFreePreview: e.target.checked})} className="w-4 h-4 accent-emerald-500" /> <ShieldCheck size={16} className="text-emerald-400"/> پیش‌نمایش رایگان</label>
                                  </div>
                                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl text-sm transition-colors mt-2">{isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : (editingLessonId ? 'ثبت تغییرات' : 'ثبت جلسه در دیتابیس')}</button>
                              </form>
                          </div>
                          
                          {/* لیست جلسات */}
                          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-3 bg-[#0c0b0a]">
                              {courseLessons.length === 0 ? <div className="text-center text-zinc-500 py-10">هیچ جلسه‌ای ثبت نشده است.</div> : courseLessons.map(lesson => (
                                  <div key={lesson.id} className={`flex flex-col md:flex-row md:items-center justify-between bg-[#161512] p-4 rounded-xl border transition-all gap-4 ${editingLessonId === lesson.id ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-[#35332e]'}`}>
                                      <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#262421] border border-[#35332e] flex items-center justify-center text-sm font-black text-white shadow-inner">{lesson.order}</div>
                                          <div className="flex flex-col"><span className="text-sm font-bold text-white mb-1">{lesson.title}</span><div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500"><span className="flex items-center gap-1"><Clock size={12}/> {lesson.duration}</span>{lesson.isFreePreview && <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">رایگان</span>}</div></div>
                                      </div>
                                      <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 border-[#35332e] pt-3 md:pt-0">
                                          <button onClick={() => { setIsLessonModalOpen(false); openExerciseModal(lesson); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-black transition-colors"><Award size={14}/> تمرینات</button>
                                          <button onClick={() => handleEditLessonClick(lesson)} className="p-1.5 text-zinc-400 hover:text-white bg-[#1e1c19] hover:bg-[#262421] rounded-lg border border-[#35332e]"><Edit3 size={16}/></button>
                                          <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 text-zinc-600 hover:text-rose-500 bg-[#1e1c19] hover:bg-rose-500/10 rounded-lg border border-[#35332e]"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* ♟️ 🔥 استودیوی تعاملی پازل */}
      <AnimatePresence>
          {isExerciseModalOpen && selectedLesson && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 md:p-4">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#121110] border border-[#35332e] rounded-3xl w-full max-w-6xl flex flex-col h-[95vh] md:h-[90vh] overflow-hidden shadow-2xl">
                      
                      <div className="flex items-center justify-between p-4 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <div className="flex flex-col"><h2 className="font-black text-white text-base md:text-lg flex items-center gap-2 text-emerald-400"><Award size={20}/> استودیوی تعاملی طراحی پازل</h2><span className="text-[10px] md:text-xs text-zinc-400 mt-1">جلسه: {selectedLesson.title}</span></div>
                          <button onClick={() => { setIsExerciseModalOpen(false); setIsLessonModalOpen(true); }} className="text-zinc-400 hover:text-white bg-[#262421] px-3 md:px-4 py-2 rounded-xl flex items-center gap-1 text-xs font-bold"><ChevronRight size={14}/> بازگشت</button>
                      </div>

                      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                          {/* ◀️ سمت راست: تخته شطرنج */}
                          <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 border-l border-[#35332e] bg-[#161512] flex flex-col relative z-10">
                              <div className="p-4 md:p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                                  
                                  <div className="flex flex-col gap-2 pb-2 border-b border-[#35332e]">
                                      <h3 className="text-[10px] font-black text-zinc-500 uppercase flex items-center justify-between"><span>پازل‌های ذخیره شده</span> <span className="bg-[#262421] px-2 py-0.5 rounded text-white">{lessonExercises.length}</span></h3>
                                      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                          {lessonExercises.map(ex => (
                                              <div key={ex.id} className="shrink-0 flex items-center gap-2 bg-[#1e1c19] border border-[#35332e] rounded-lg p-2 pr-3"><span className="text-xs font-bold text-white">ت. {ex.order}</span><button onClick={() => handleDeleteExercise(ex.id)} className="text-zinc-600 hover:text-rose-500 p-1 bg-[#121110] rounded-md"><Trash2 size={12}/></button></div>
                                          ))}
                                      </div>
                                  </div>

                                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-2">
                                      <Lightbulb size={16} className="text-blue-400 shrink-0 mt-0.5"/>
                                      <p className="text-[10px] md:text-xs text-zinc-300 font-bold leading-relaxed">
                                          در <b>حالت مهره</b>، حرکت کنید.<br/>در <b>حالت رسم</b>، برای دایره تک‌کلیک و برای فلش لمس کنید و بکشید (Drag).
                                      </p>
                                  </div>

                                  <div className="w-full relative select-none touch-none shrink-0" dir="ltr" onContextMenu={(e) => e.preventDefault()}>
                                      <div 
                                          ref={boardRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
                                          className={`w-full aspect-square rounded-xl overflow-hidden border-4 shadow-xl relative transition-colors ${drawMode ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-crosshair' : 'border-[#262421]'}`}
                                      >
                                          {drawMode && <div className="absolute inset-0 z-10"></div>}
                                          <Chessboard position={exFen} onPieceDrop={onDrop} customArrows={displayArrows} customSquareStyles={customSquareStyles} animationDuration={200} customDarkSquareStyle={{ backgroundColor: '#779556' }} customLightSquareStyle={{ backgroundColor: '#ebecd0' }} />
                                      </div>
                                      
                                      {/* نوار ابزار رسم */}
                                      <div className="flex justify-between items-center bg-[#1e1c19] border border-[#35332e] p-2 rounded-xl mt-3 shadow-sm" dir="rtl">
                                          <div className="flex items-center gap-1.5">
                                              <button onClick={() => setDrawMode(!drawMode)} className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${drawMode ? 'bg-amber-500 text-white' : 'bg-[#262421] text-zinc-400 hover:text-white'}`} title="حالت نقاشی">
                                                  <MousePointer2 size={14}/>
                                              </button>
                                              {drawMode && (
                                                  <>
                                                    <div className="w-px h-5 bg-[#35332e] mx-1"></div>
                                                    <button onClick={() => setDrawTool('circle')} className={`p-1.5 rounded-md transition-colors ${drawTool === 'circle' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-white'}`} title="رسم دایره (تک کلیک)"><Circle size={16} /></button>
                                                    <button onClick={() => setDrawTool('arrow')} className={`p-1.5 rounded-md transition-colors ${drawTool === 'arrow' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-white'}`} title="رسم فلش (کشیدن دست)"><ArrowUpRight size={16} /></button>
                                                    <div className="w-px h-5 bg-[#35332e] mx-1"></div>
                                                    {drawingColors.map(c => <button key={c.id} onClick={() => setDrawingColor(c.id)} className={`w-5 h-5 rounded-full border-2 transition-transform ${drawingColor === c.id ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: c.id }} />)}
                                                  </>
                                              )}
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                              <button onClick={() => { setCurrentArrows([]); setCurrentCircles({}); saveAnnotationsToState([], {}); }} className="p-1.5 bg-[#262421] hover:bg-rose-500 hover:text-white text-zinc-400 rounded-lg"><Eraser size={16}/></button>
                                              <button onClick={undoMove} disabled={recordedMoves.length === 0} className="p-1.5 bg-[#262421] hover:bg-[#35332e] text-white rounded-lg disabled:opacity-50"><RotateCcw size={16}/></button>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              <div className="p-4 md:p-5 border-t border-[#35332e] bg-[#121110] shrink-0">
                                  <button onClick={handleSaveExercise} disabled={isSubmitting || recordedMoves.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-3.5 md:py-4 rounded-xl flex items-center justify-center gap-2 text-sm active:scale-95 transition-all">
                                      {isSubmitting ? <Loader2 className="animate-spin"/> : <><Save size={18}/> ذخیره تمرین (آماده‌سازی بورد بعدی)</>}
                                  </button>
                              </div>
                          </div>

                          {/* ▶️ سمت چپ: تنظیمات پایه و حرکات */}
                          <div className="flex-1 flex flex-col bg-[#0c0b0a] overflow-hidden">
                              <div className="p-4 border-b border-[#35332e] bg-[#121110] shrink-0">
                                  <h3 className="font-black text-sm text-white flex items-center gap-2"><BookOpen size={16} className="text-sky-400"/> تنظیمات سناریو و توضیحات حرکات</h3>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col gap-6">
                                  
                                  <div className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 flex flex-col gap-4 shrink-0 shadow-sm">
                                      <div className="flex flex-col gap-2">
                                          <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between"><span>چیدمان اولیه (FEN)</span><button type="button" onClick={resetExerciseBuilder} className="text-emerald-400 hover:text-emerald-300">پاکسازی کل تخته</button></label>
                                          <input value={exFen} onChange={(e) => handleFenLoad(e.target.value)} className="w-full bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-xs text-zinc-300 font-mono outline-none" dir="ltr" />
                                      </div>
                                      <div className="flex flex-col gap-2">
                                          <label className="text-[11px] font-bold text-zinc-400">صورت مسئله (توضیح کلی تمرین قبل از شروع)</label>
                                          <textarea value={overallDesc} onChange={e=>setOverallDesc(e.target.value)} placeholder="مثال: سفید در ۳ حرکت مات می‌کند..." className="w-full bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none min-h-[80px] resize-y" />
                                      </div>
                                  </div>

                                  <div className="flex flex-col gap-4 pb-10">
                                      {recordedMoves.length === 0 ? <div className="p-10 text-center text-zinc-600 bg-[#161512] border border-dashed border-[#35332e] rounded-2xl"><span className="font-bold text-sm">ابتدا روی تخته حرکتی انجام دهید تا فیلد توضیحات آن ظاهر شود.</span></div> : (
                                          recordedMoves.map((move, index) => (
                                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={index} className="shrink-0 bg-[#161512] border border-[#35332e] rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden shadow-sm">
                                                  <div className={`absolute top-0 right-0 w-1.5 h-full ${move.color === 'w' ? 'bg-zinc-200' : 'bg-zinc-700'}`}></div>
                                                  <div className="flex items-center gap-3 border-b border-[#35332e] pb-3"><span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${move.color === 'w' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-white'}`}>{move.san}</span><div className="flex flex-col"><span className="text-[11px] font-bold text-zinc-400">حرکت {Math.floor(index/2) + 1}</span><span className={`text-sm font-black ${move.color === 'w' ? 'text-zinc-200' : 'text-zinc-500'}`}>{move.color === 'w' ? 'سفید' : 'سیاه'}</span></div></div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                      <div className="flex flex-col gap-2"><label className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5"><MessageSquare size={14}/> توضیح حرکت (نمایش پس از اجرا)</label><textarea value={move.comment} onChange={(e) => updateMoveData(index, 'comment', e.target.value)} className="bg-[#1e1c19] border border-[#35332e] rounded-xl px-4 py-3 text-sm text-white outline-none min-h-[80px] resize-y" /></div>
                                                      <div className="flex flex-col gap-2"><label className="text-[11px] font-bold text-amber-500 flex items-center gap-1.5"><HintIcon size={14}/> راهنمایی (هنگام اشتباه کاربر)</label><textarea value={move.hint} onChange={(e) => updateMoveData(index, 'hint', e.target.value)} className="bg-[#1e1c19] border border-[#35332e] rounded-xl px-4 py-3 text-sm text-white outline-none min-h-[80px] resize-y" /></div>
                                                  </div>
                                              </motion.div>
                                          ))
                                      )}
                                  </div>
                              </div>
                          </div>

                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
      
    </div>
  );
}