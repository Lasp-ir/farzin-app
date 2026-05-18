import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// 👇 این بخش رو جایگزین کن:
import { 
  LayoutDashboard, BookOpen, Plus, Users, Trash2, Video, ChevronRight, Crown,
  X, Loader2, Award, RotateCcw, MessageSquare, HelpCircle as HintIcon, Save, MousePointer2, 
  Circle, ArrowUpRight, Eraser, Clock, ShieldCheck, Edit3, Lightbulb, Settings2, Check, CheckCircle2, UserCircle, Image as ImageIcon, Tag, Percent
} from 'lucide-react';

import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState('courses');
  const [search, setSearch] = useState('');
  
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 📚 دوره‌ها (پشتیبانی از ویرایش و تخفیف)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
      title: '', instructor: '', category: 'openings', level: 'متوسط', duration: '۲ ساعت', 
      image: '', description: '', requirements: '', isPremium: true, price: 100, discount: 0
  });

  const [profileData, setProfileData] = useState({ name: '', title: '', bio: '', avatar: '' });

  // 🎥 جلسات
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [showAddLessonForm, setShowAddLessonForm] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({ title: '', videoUrl: '', duration: '', order: 1, isFreePreview: false });

  // ♟️ پازل‌ها و کارگاه
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [lessonExercises, setLessonExercises] = useState<any[]>([]);
  
  const [game, setGame] = useState(new Chess());
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

  const drawingColors = [ { id: '#10b981', name: 'سبز' }, { id: '#ef4444', name: 'قرمز' }, { id: '#3b82f6', name: 'آبی' }, { id: '#f59e0b', name: 'زرد' } ];

  // بررسی لاگین
  useEffect(() => {
      const storedAuth = localStorage.getItem('farzin_auth');
      if (!storedAuth) { navigate('/admin'); return; }
      const parsedAuth = JSON.parse(storedAuth);
      setAuth(parsedAuth);
      
      if (parsedAuth.role === 'instructor') {
          setFormData(prev => ({ ...prev, instructor: parsedAuth.name }));
          setProfileData({ name: parsedAuth.name, title: parsedAuth.title || '', bio: parsedAuth.bio || '', avatar: parsedAuth.avatar || '' });
      }
      fetchCourses(parsedAuth);
  }, []);

  const fetchCourses = async (currentAuth: any) => {
      setIsLoading(true);
      try { 
          const res = await fetch('http://localhost:5000/api/courses'); 
          if (res.ok) {
              const allCourses = await res.json();
              if (currentAuth.role === 'instructor') setCourses(allCourses.filter((c: any) => c.instructor === currentAuth.name));
              else setCourses(allCourses);
          } 
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault(); setIsSubmitting(true);
      try {
          const res = await fetch(`http://localhost:5000/api/courses/instructors/${auth.instructorId}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileData)
          });
          if (res.ok) {
              const updated = await res.json();
              const newAuth = { ...auth, name: updated.name, avatar: updated.avatar };
              localStorage.setItem('farzin_auth', JSON.stringify(newAuth));
              setAuth(newAuth); alert('✅ پروفایل با موفقیت بروزرسانی شد.');
          }
      } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  // 🔥 مدیریت دوره‌ها
  const openAddCourseModal = () => {
      setEditingCourseId(null);
      setFormData({ title: '', instructor: auth?.role === 'instructor' ? auth.name : '', category: 'openings', level: 'متوسط', duration: '۲ ساعت', image: '', description: '', requirements: '', isPremium: true, price: 100, discount: 0 });
      setIsCourseModalOpen(true);
  };

  const openEditCourseModal = (course: any) => {
      setEditingCourseId(course.id);
      setFormData({
          title: course.title, instructor: course.instructor, category: course.category, level: course.level, duration: course.duration, 
          image: course.image, description: course.description || '', requirements: course.requirements || '', 
          isPremium: course.isPremium, price: course.price, discount: course.discount || 0
      });
      setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
      e.preventDefault(); setIsSubmitting(true);
      const url = editingCourseId ? `http://localhost:5000/api/courses/${editingCourseId}` : 'http://localhost:5000/api/courses';
      const method = editingCourseId ? 'PUT' : 'POST';
      
      try {
          const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
          if (res.ok) { setIsCourseModalOpen(false); fetchCourses(auth); }
      } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteCourse = async (id: string) => {
      if(!window.confirm('حذف دوره؟')) return;
      try { const res = await fetch(`http://localhost:5000/api/courses/${id}`, { method: 'DELETE' }); if(res.ok) fetchCourses(auth); } catch (err) { console.error(err); }
  };

  // --- مدیریت جلسات ---
  const openLessonModal = async (course: any) => {
      setSelectedCourse(course); setIsLessonModalOpen(true); setIsLessonLoading(true); setEditingLessonId(null);
      try {
          const res = await fetch(`http://localhost:5000/api/courses/${course.id}/lessons`);
          if (res.ok) { const data = await res.json(); setCourseLessons(data); setLessonFormData({ title: '', videoUrl: '', duration: '', order: data.length + 1, isFreePreview: false }); }
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
      setEditingLessonId(lesson.id); setLessonFormData({ title: lesson.title, videoUrl: lesson.videoUrl, duration: lesson.duration, order: lesson.order, isFreePreview: lesson.isFreePreview }); setShowAddLessonForm(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
      if(!window.confirm('حذف جلسه؟')) return;
      try { const res = await fetch(`http://localhost:5000/api/courses/lessons/${lessonId}`, { method: 'DELETE' }); if(res.ok) openLessonModal(selectedCourse); } catch (err) { console.error(err); }
  };

  // 🔥 --- سیستم پیشرفته تب‌ها و کارگاه پازل --- 🔥
  const openExerciseModal = async (lesson: any) => {
      setSelectedLesson(lesson); setIsExerciseModalOpen(true);
      try {
          const res = await fetch(`http://localhost:5000/api/courses/lessons/${lesson.id}/exercises`);
          if (res.ok) {
              const data = await res.json(); 
              setLessonExercises(data); 
              resetExerciseBuilder(data.length); 
          }
      } catch (err) { console.error(err); }
  };

  const resetExerciseBuilder = (currentLength = lessonExercises.length) => {
      setEditingExerciseId(null);
      const newGame = new Chess(); 
      setGame(newGame); setStartFen(newGame.fen()); setExFen(newGame.fen()); 
      setRecordedMoves([]); setOverallDesc(''); setBaseAnnotations({ arrows: [], circles: {} }); 
      setCurrentArrows([]); setCurrentCircles({}); setDrawMode(false); setDragStartSq(null);
      setExOrder(currentLength + 1);
  };

  const handleSelectPuzzle = (ex: any) => {
      setEditingExerciseId(ex.id);
      setStartFen(ex.fen); setOverallDesc(ex.description); setExOrder(ex.order);
      try {
          const parsed = JSON.parse(ex.moves);
          setRecordedMoves(parsed.moves || []); setBaseAnnotations(parsed.baseAnnotations || { arrows: [], circles: {} });
          const newGame = new Chess(ex.fen);
          if (parsed.moves && parsed.moves.length > 0) {
              parsed.moves.forEach((m: any) => { newGame.move({ from: m.uci.substring(0,2), to: m.uci.substring(2,4), promotion: m.uci.length > 4 ? m.uci[4] : 'q' }); });
          }
          setGame(newGame); setExFen(newGame.fen());
          if (parsed.moves && parsed.moves.length > 0) {
              const lastMove = parsed.moves[parsed.moves.length - 1];
              setCurrentArrows(lastMove.arrows || []); setCurrentCircles(lastMove.circles || {});
          } else {
              setCurrentArrows(parsed.baseAnnotations?.arrows || []); setCurrentCircles(parsed.baseAnnotations?.circles || {});
          }
          setDrawMode(false); setDragStartSq(null);
      } catch (err) { console.error(err); }
  };

  const handleFenLoad = (newFen: string) => {
      try {
          const newGame = new Chess(newFen); setGame(newGame); setStartFen(newFen); setExFen(newFen); 
          setRecordedMoves([]); setBaseAnnotations({ arrows: [], circles: {} }); setCurrentArrows([]); setCurrentCircles({});
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
      let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 1)); let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 1));
      const fileIdx = Math.floor((x / rect.width) * 8); const rankIdx = 7 - Math.floor((y / rect.height) * 8); 
      return `${['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][fileIdx]}${rankIdx + 1}`;
  };

  const handlePointerDown = (e: React.PointerEvent) => { if (!drawMode) return; const sq = getSquareFromEvent(e); if (sq) setDragStartSq(sq); };
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
      const updated = [...recordedMoves]; updated[index][field] = value; setRecordedMoves(updated);
  };

  const handleSaveExercise = async () => {
      setIsSubmitting(true);
      const payload = {
          fen: startFen, moves: JSON.stringify({ baseAnnotations, moves: recordedMoves }), description: overallDesc, order: exOrder
      };
      const url = editingExerciseId ? `http://localhost:5000/api/courses/exercises/${editingExerciseId}` : `http://localhost:5000/api/courses/lessons/${selectedLesson.id}/exercises`;
      const method = editingExerciseId ? 'PUT' : 'POST';

      try {
          const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (res.ok) {
              const savedEx = await res.json(); 
              if (editingExerciseId) {
                  setLessonExercises(prev => prev.map(ex => ex.id === editingExerciseId ? savedEx : ex));
                  alert('ویرایش با موفقیت ذخیره شد.');
              } else {
                  setLessonExercises([...lessonExercises, savedEx]); 
                  resetExerciseBuilder([...lessonExercises, savedEx].length);
              }
          } 
      } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDeleteExercise = async (exId: string) => {
      if(!window.confirm('تمرین حذف شود؟')) return;
      try {
          const res = await fetch(`http://localhost:5000/api/courses/exercises/${exId}`, { method: 'DELETE' });
          if(res.ok) {
              setLessonExercises(prev => prev.filter(e => e.id !== exId));
              if (editingExerciseId === exId) resetExerciseBuilder(lessonExercises.length - 1);
          }
      } catch (err) { console.error(err); }
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  Object.entries(currentCircles).forEach(([sq, color]) => { customSquareStyles[sq] = { boxShadow: `inset 0 0 0 4px ${color}`, borderRadius: '4px' }; });
  if (dragStartSq && drawTool === 'arrow') customSquareStyles[dragStartSq] = { ...customSquareStyles[dragStartSq], backgroundColor: 'rgba(255, 255, 255, 0.4)' };

  const displayArrows = activeDragArrow ? [...currentArrows, activeDragArrow] : currentArrows;

  const logout = () => { localStorage.removeItem('farzin_auth'); navigate('/admin'); };

  if (!auth) return null;

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex" dir="rtl">
      
      {/* 🌟 سایدبار هوشمند */}
      <div className="w-64 bg-[#121110] border-l border-white/5 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
            {auth.role === 'instructor' && auth.avatar ? <img src={auth.avatar} alt={auth.name} className="w-10 h-10 rounded-xl object-cover border border-[#35332e]" /> : <div className="w-10 h-10 rounded-xl bg-farzin-accent/20 flex items-center justify-center text-farzin-accent"><Crown size={20} /></div>}
            <div className="flex flex-col"><span className="font-black text-white text-sm truncate w-36">{auth.role === 'admin' ? 'مدیر کل فرزین' : auth.name}</span><span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{auth.role === 'admin' ? 'Admin Panel' : 'Instructor'}</span></div>
        </div>
        <div className="flex flex-col p-4 gap-2 flex-1">
            <button onClick={() => setActiveMenu('courses')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'courses' ? 'bg-farzin-accent text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><BookOpen size={18} /> {auth.role === 'admin' ? 'مدیریت کل دوره‌ها' : 'دوره‌های من'}</button>
            {auth.role === 'instructor' && <button onClick={() => setActiveMenu('profile')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'profile' ? 'bg-farzin-accent text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><UserCircle size={18} /> تنظیمات پروفایل</button>}
        </div>
        <div className="p-4 mt-auto border-t border-white/5 flex flex-col gap-2">
            <button onClick={() => navigate('/education')} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white w-full justify-center py-2 transition-colors"><ChevronRight size={14} /> مشاهده آکادمی</button>
            <button onClick={logout} className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-400 bg-rose-500/10 rounded-lg w-full justify-center py-2 transition-colors">خروج از حساب</button>
        </div>
      </div>

      {/* 🌟 بخش اصلی */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-20 flex items-center justify-between px-6 md:px-8 border-b border-white/5 bg-[#0c0b0a]/80 backdrop-blur-md shrink-0">
            <h1 className="text-lg md:text-xl font-black text-white">{activeMenu === 'courses' ? (auth.role === 'admin' ? 'مدیریت کل دوره‌ها' : 'دوره‌های آموزشی من') : 'تنظیمات پروفایل استاد'}</h1>
            {activeMenu === 'courses' && <button onClick={openAddCourseModal} className="bg-gradient-to-r from-farzin-accent to-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95"><Plus size={18} /> <span className="hidden md:inline">دوره جدید</span></button>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {activeMenu === 'courses' && (
                isLoading ? <div className="flex justify-center mt-20 text-zinc-500"><Loader2 className="animate-spin" /></div> : (
                    <div className="grid grid-cols-1 gap-4">
                        {courses.length === 0 ? <div className="text-center text-zinc-500 py-20 font-bold border border-dashed border-[#35332e] rounded-2xl">شما هنوز هیچ دوره‌ای ثبت نکرده‌اید.</div> : (
                            courses.map(course => (
                                <div key={course.id} className="bg-[#161512] border border-[#35332e] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                    <div className="flex items-center gap-4">
                                        <img src={course.image} className="w-16 h-16 rounded-xl object-cover border border-[#35332e]" alt="" />
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-black text-base md:text-lg text-white">{course.title}</h3>
                                                {course.isPremium ? (
                                                    <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1"><Crown size={12}/> VIP</span>
                                                ) : (
                                                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black">رایگان</span>
                                                )}
                                                {course.discount > 0 && <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-[10px] font-black">% تخفیف دار</span>}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-500"><span className="flex items-center gap-1.5"><Users size={14}/> {course.instructor}</span><span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded"><Video size={14}/> {course._count?.lessons || 0} جلسه</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openLessonModal(course)} className="flex-1 md:flex-none p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-colors text-xs font-bold flex items-center justify-center gap-2"><Settings2 size={16}/> مدیریت جلسات</button>
                                        <button onClick={() => openEditCourseModal(course)} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"><Edit3 size={16} /></button>
                                        <button onClick={() => handleDeleteCourse(course.id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )
            )}

            {/* 🔹 تب پروفایل من (ویژه اساتید) */}
            {activeMenu === 'profile' && auth.role === 'instructor' && (
                <div className="max-w-2xl mx-auto bg-[#161512] border border-[#35332e] rounded-3xl p-6 md:p-8 shadow-xl">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#35332e]">
                        <div className="relative group">
                            <img src={profileData.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop'} className="w-24 h-24 rounded-2xl object-cover border-2 border-[#35332e] shadow-lg" alt="" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                <ImageIcon className="text-white" size={24} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-white">{profileData.name}</h2>
                            <span className="text-amber-500 font-bold text-sm mt-1">{profileData.title || 'مدرس آکادمی فرزین'}</span>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">نام نمایشی شما</label><input required value={profileData.name} onChange={e=>setProfileData({...profileData, name: e.target.value})} className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3.5 text-sm text-white outline-none focus:border-farzin-accent transition-colors" /></div>
                        <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">تایتل یا عنوان (مثال: استاد بزرگ شطرنج)</label><input value={profileData.title} onChange={e=>setProfileData({...profileData, title: e.target.value})} className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3.5 text-sm text-white outline-none focus:border-farzin-accent transition-colors" /></div>
                        <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">لینک عکس پروفایل (URL)</label><input type="url" dir="ltr" value={profileData.avatar} onChange={e=>setProfileData({...profileData, avatar: e.target.value})} placeholder="https://..." className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3.5 text-sm text-white outline-none focus:border-farzin-accent transition-colors" /></div>
                        <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">رزومه و معرفی کوتاه (Bio)</label><textarea value={profileData.bio} onChange={e=>setProfileData({...profileData, bio: e.target.value})} placeholder="درباره خودتان، دستاوردها و سبک تدریس‌تان بنویسید..." className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-4 text-sm text-white outline-none min-h-[120px] resize-y focus:border-farzin-accent transition-colors leading-relaxed" /></div>
                        <button type="submit" disabled={isSubmitting} className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-[#161512] font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">{isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> ذخیره تغییرات پروفایل</>}</button>
                    </form>
                </div>
            )}
        </div>
      </div>

      {/* 🎥 مودال مدیریت جلسات */}
      <AnimatePresence>
          {isLessonModalOpen && selectedCourse && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-4">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#121110] border border-[#35332e] rounded-3xl w-full max-w-5xl flex flex-col h-[90vh] overflow-hidden shadow-2xl">
                      <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <div className="flex flex-col"><h2 className="font-black text-white text-lg flex items-center gap-2"><Video size={18} className="text-blue-400"/> جلسات: {selectedCourse.title}</h2></div>
                          <button onClick={() => setIsLessonModalOpen(false)} className="text-zinc-500 hover:text-white bg-[#262421] p-2 rounded-xl"><X size={20}/></button>
                      </div>
                      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
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

      {/* ♟️ 🔥 استودیوی تعاملی پازل با تب‌بندی حرفه‌ای */}
      <AnimatePresence>
          {isExerciseModalOpen && selectedLesson && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 md:p-4">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#121110] border border-[#35332e] rounded-3xl w-full max-w-6xl flex flex-col h-[95vh] md:h-[90vh] overflow-hidden shadow-2xl">
                      
                      <div className="flex items-center justify-between p-4 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <div className="flex flex-col"><h2 className="font-black text-white text-base md:text-lg flex items-center gap-2 text-emerald-400"><Award size={20}/> استودیوی تعاملی طراحی پازل</h2><span className="text-[10px] md:text-xs text-zinc-400 mt-1">جلسه: {selectedLesson.title}</span></div>
                          <button onClick={() => { setIsExerciseModalOpen(false); setIsLessonModalOpen(true); }} className="text-zinc-400 hover:text-white bg-[#262421] px-3 md:px-4 py-2 rounded-xl flex items-center gap-1 text-xs font-bold"><ChevronRight size={14}/> بازگشت</button>
                      </div>

                      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                          <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 border-l border-[#35332e] bg-[#161512] flex flex-col relative z-10">
                              <div className="p-4 md:p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                                  
                                  <div className="flex flex-col pb-3 border-b border-[#35332e]">
                                      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
                                          <button onClick={() => resetExerciseBuilder()} className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${!editingExerciseId ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-[#1e1c19] text-zinc-400 border-[#35332e] hover:bg-[#262421]'}`}><Plus size={14} /> پازل جدید</button>
                                          {lessonExercises.map(ex => (
                                              <div key={ex.id} onClick={() => handleSelectPuzzle(ex)} className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${editingExerciseId === ex.id ? 'bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-[#1e1c19] text-zinc-400 border-[#35332e] hover:bg-[#262421]'}`}>
                                                  <span>ت. {ex.order}</span>
                                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteExercise(ex.id); }} className="text-zinc-500 hover:text-rose-500 transition-colors p-0.5 rounded"><X size={14}/></button>
                                              </div>
                                          ))}
                                      </div>
                                  </div>

                                  <div className="w-full relative select-none touch-none shrink-0" dir="ltr" onContextMenu={(e) => e.preventDefault()}>
                                      <div ref={boardRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className={`w-full aspect-square rounded-xl overflow-hidden border-4 shadow-xl relative transition-colors ${drawMode ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-crosshair' : 'border-[#262421]'}`}>
                                          {drawMode && <div className="absolute inset-0 z-10"></div>}
                                          <Chessboard position={exFen} onPieceDrop={onDrop} customArrows={displayArrows} customSquareStyles={customSquareStyles} animationDuration={200} customDarkSquareStyle={{ backgroundColor: '#779556' }} customLightSquareStyle={{ backgroundColor: '#ebecd0' }} />
                                      </div>
                                      
                                      <div className="flex justify-between items-center bg-[#1e1c19] border border-[#35332e] p-2 rounded-xl mt-3 shadow-sm" dir="rtl">
                                          <div className="flex items-center gap-1.5">
                                              <button onClick={() => setDrawMode(!drawMode)} className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${drawMode ? 'bg-amber-500 text-white' : 'bg-[#262421] text-zinc-400 hover:text-white'}`} title="حالت نقاشی"><MousePointer2 size={14}/></button>
                                              {drawMode && (
                                                  <>
                                                    <div className="w-px h-5 bg-[#35332e] mx-1"></div>
                                                    <button onClick={() => setDrawTool('circle')} className={`p-1.5 rounded-md transition-colors ${drawTool === 'circle' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-white'}`} title="رسم دایره"><Circle size={16} /></button>
                                                    <button onClick={() => setDrawTool('arrow')} className={`p-1.5 rounded-md transition-colors ${drawTool === 'arrow' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-white'}`} title="رسم فلش"><ArrowUpRight size={16} /></button>
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
                                  <button onClick={handleSaveExercise} disabled={isSubmitting || (recordedMoves.length === 0 && !editingExerciseId)} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-3.5 md:py-4 rounded-xl flex items-center justify-center gap-2 text-sm active:scale-95 transition-all">
                                      {isSubmitting ? <Loader2 className="animate-spin"/> : (editingExerciseId ? <><Check size={18}/> ذخیره تغییرات پازل</> : <><Save size={18}/> ذخیره به عنوان پازل جدید</>)}
                                  </button>
                              </div>
                          </div>

                          <div className="flex-1 flex flex-col bg-[#0c0b0a] overflow-hidden">
                              <div className="p-4 border-b border-[#35332e] bg-[#121110] shrink-0">
                                  <h3 className="font-black text-sm text-white flex items-center gap-2"><BookOpen size={16} className="text-sky-400"/> تنظیمات سناریو و توضیحات حرکات</h3>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col gap-6">
                                  <div className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 flex flex-col gap-4 shrink-0 shadow-sm">
                                      <div className="flex flex-col gap-2">
                                          <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between"><span>چیدمان اولیه (FEN)</span><button type="button" onClick={() => resetExerciseBuilder()} className="text-emerald-400 hover:text-emerald-300">پاکسازی کل تخته</button></label>
                                          <input value={startFen} onChange={(e) => handleFenLoad(e.target.value)} className="w-full bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-xs text-zinc-300 font-mono outline-none" dir="ltr" />
                                      </div>
                                      <div className="grid grid-cols-4 gap-3">
                                          <div className="col-span-3 flex flex-col gap-2"><label className="text-[11px] font-bold text-zinc-400">صورت مسئله (توضیح کلی تمرین قبل از شروع)</label><textarea value={overallDesc} onChange={e=>setOverallDesc(e.target.value)} className="w-full bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none min-h-[50px] resize-y" /></div>
                                          <div className="col-span-1 flex flex-col gap-2"><label className="text-[11px] font-bold text-zinc-400 text-center">ترتیب</label><input type="number" min="1" value={exOrder} onChange={e=>setExOrder(Number(e.target.value))} className="w-full bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-lg font-black text-white text-center outline-none h-full" /></div>
                                      </div>
                                  </div>

                                  <div className="flex flex-col gap-4 pb-10">
                                      {recordedMoves.length === 0 ? <div className="p-10 text-center text-zinc-600 bg-[#161512] border border-dashed border-[#35332e] rounded-2xl"><span className="font-bold text-sm">ابتدا روی تخته حرکتی انجام دهید.</span></div> : (
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

      {/* 🌟 فرم جامع ساخت و ویرایش دوره */}
      <AnimatePresence>
          {isCourseModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#1e1c19] border border-[#35332e] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                      <div className="flex items-center justify-between p-5 border-b border-[#35332e] bg-[#161512] shrink-0">
                          <h2 className="font-black text-white text-lg flex items-center gap-2">{editingCourseId ? <Edit3 size={18} className="text-amber-500"/> : <Plus size={18} className="text-emerald-500"/>} {editingCourseId ? 'ویرایش دوره' : 'ساخت دوره جدید'}</h2>
                          <button onClick={() => setIsCourseModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                          <form onSubmit={handleSaveCourse} className="flex flex-col gap-6">
                              
                              <div className="flex flex-col gap-4 bg-[#161512] p-4 rounded-2xl border border-[#35332e]">
                                  <h3 className="text-sm font-black text-sky-400">۱. اطلاعات پایه</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">عنوان دوره</label><input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-sky-500" /></div>
                                      <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">نام مدرس</label><input required value={formData.instructor} onChange={e=>setFormData({...formData, instructor: e.target.value})} disabled={auth?.role === 'instructor'} className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none disabled:opacity-50 focus:border-sky-500" /></div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                      <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">دسته‌بندی</label><select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-sky-500"><option value="openings">شروع بازی</option><option value="middlegame">وسط بازی</option><option value="tactics">تاکتیک‌ها</option><option value="endgame">آخر بازی</option></select></div>
                                      <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">سطح دوره</label><input value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})} className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-sky-500" /></div>
                                      <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">مدت زمان کل</label><input value={formData.duration} onChange={e=>setFormData({...formData, duration: e.target.value})} placeholder="مثلاً ۵ ساعت" className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-sky-500" /></div>
                                  </div>
                                  <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-zinc-400">لینک کاور دوره (URL)</label><input type="url" dir="ltr" value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} placeholder="https://..." className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-sky-500" /></div>
                              </div>

                              <div className="flex flex-col gap-4 bg-[#161512] p-4 rounded-2xl border border-[#35332e]">
                                  <h3 className="text-sm font-black text-amber-500">۲. تنظیمات مالی و فروش</h3>
                                  <div className="flex items-center gap-4 bg-[#1e1c19] border border-[#35332e] p-3 rounded-xl">
                                      <label className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer w-full">
                                          <input type="checkbox" checked={!formData.isPremium} onChange={e=> {
                                              const isFree = e.target.checked;
                                              setFormData({...formData, isPremium: !isFree, price: isFree ? 0 : 100, discount: 0});
                                          }} className="w-5 h-5 accent-emerald-500" />
                                          <ShieldCheck size={18} className="text-emerald-500"/> این دوره کاملاً رایگان است
                                      </label>
                                  </div>

                                  <AnimatePresence>
                                      {formData.isPremium && (
                                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid grid-cols-2 gap-4 overflow-hidden">
                                              <div className="flex flex-col gap-1.5">
                                                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-1"><Crown size={14} className="text-amber-500"/> قیمت اصلی (الماس)</label>
                                                  <input type="number" min="1" value={formData.price} onChange={e=>setFormData({...formData, price: Number(e.target.value)})} className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-lg font-black text-amber-400 outline-none focus:border-amber-500 text-left" dir="ltr" />
                                              </div>
                                              <div className="flex flex-col gap-1.5">
                                                  <label className="text-xs font-bold text-zinc-400 flex items-center gap-1"><Percent size={14} className="text-rose-500"/> درصد تخفیف (اختیاری)</label>
                                                  <input type="number" min="0" max="100" value={formData.discount} onChange={e=>setFormData({...formData, discount: Number(e.target.value)})} className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-lg font-black text-rose-400 outline-none focus:border-rose-500 text-left" dir="ltr" placeholder="0" />
                                              </div>
                                          </motion.div>
                                      )}
                                  </AnimatePresence>
                              </div>

                              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-all shrink-0 shadow-lg">
                                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> {editingCourseId ? 'ذخیره تغییرات دوره' : 'انتشار دوره در آکادمی'}</>}
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