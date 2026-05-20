import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// 👇 این بخش رو جایگزین کن:
import {
  LayoutDashboard, BookOpen, Plus, Users, Trash2, Video, ChevronRight, Crown,
  X, Loader2, Award, RotateCcw, MessageSquare, HelpCircle as HintIcon, Save, MousePointer2,
  Circle, ArrowUpRight, Eraser, Clock, ShieldCheck, Edit3, Lightbulb, Settings2,Settings,LogOut, Check, CheckCircle2, UserCircle, Image as ImageIcon, Tag, Percent,
  Brain, Bot, Play, RefreshCw, Cpu, FileText, Upload, Zap, AlertTriangle, Eye
} from 'lucide-react';

import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [auth, setAuth] = useState<any>(() => JSON.parse(localStorage.getItem('farzin_auth') || '{}'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', title: '', bio: '', avatar: '' });

  // ─── پازل‌های شخصی ───────────────────────────────────────────────────────────
  const [personalRequests, setPersonalRequests] = useState<any[]>([]);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [requestNote, setRequestNote] = useState('');

  // ─── ربات مایا ───────────────────────────────────────────────────────────────
  const [maiaModels, setMaiaModels] = useState<any[]>([]);
  const [maiaTraining, setMaiaTraining] = useState<any>(null); // { status, jobId, playerName }
  const [maiaPlayerName, setMaiaPlayerName] = useState('');
  const [maiaPgn, setMaiaPgn] = useState('');
  const [maiaTestGame, setMaiaTestGame] = useState(() => new Chess());
  const [maiaTestFen, setMaiaTestFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [maiaTestStatus, setMaiaTestStatus] = useState<'idle' | 'thinking' | 'done'>('idle');
  const [maiaTestLog, setMaiaTestLog] = useState<string[]>([]);
  const [selectedTestModel, setSelectedTestModel] = useState('');
  const [maiaTestPlayerColor, setMaiaTestPlayerColor] = useState<'white' | 'black'>('white');

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
      const auth = JSON.parse(localStorage.getItem('farzin_auth') || '{}');
      if (auth.role !== 'admin') navigate('/admin');
  }, []);

  useEffect(() => {
    if (activeMenu === 'personal-puzzles') fetchPersonalRequests();
    if (activeMenu === 'maia-bots') fetchMaiaModels();
  }, [activeMenu]);

  const fetchPersonalRequests = async () => {
    setPersonalLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/personal-puzzles/admin/list');
      if (res.ok) setPersonalRequests(await res.json());
    } catch { console.error('personal puzzles API unavailable'); } finally { setPersonalLoading(false); }
  };

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      await fetch(`http://localhost:5000/api/personal-puzzles/admin/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote: requestNote }),
      });
      fetchPersonalRequests();
      setSelectedRequest(null);
      setRequestNote('');
    } catch { console.error('update failed'); }
  };

  const fetchMaiaModels = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/maia/models');
      if (res.ok) { const d = await res.json(); setMaiaModels(d.models || []); }
    } catch { setMaiaModels([]); }
  };

  const startMaiaTraining = async () => {
    if (!maiaPlayerName.trim() || !maiaPgn.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/maia/train', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: maiaPlayerName.trim(), pgn: maiaPgn }),
      });
      if (res.ok) {
        const data = await res.json();
        setMaiaTraining({ status: 'pending', jobId: data.job_id, playerName: maiaPlayerName.trim() });
      }
    } catch { alert('سرور مایا در دسترس نیست. مطمئن شوید که سرور Python در پورت ۵۰۰۱ فعال است.'); }
  };

  const requestMaiaMove = async (fen: string) => {
    if (!selectedTestModel) return null;
    setMaiaTestStatus('thinking');
    try {
      const res = await fetch('http://localhost:5000/api/maia/move', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, model_name: selectedTestModel }),
      });
      if (res.ok) { const d = await res.json(); return d.move || null; }
    } catch { /* Maia not running */ }
    setMaiaTestStatus('done');
    return null;
  };

  const handleMaiaTestDrop = async (from: string, to: string) => {
    if (maiaTestStatus === 'thinking') return false;
    const g = new Chess(maiaTestFen);
    const result = g.move({ from, to, promotion: 'q' });
    if (!result) return false;
    setMaiaTestGame(g);
    setMaiaTestFen(g.fen());
    setMaiaTestLog(prev => [...prev, `▶ ${result.color === 'w' ? 'سفید' : 'سیاه'}: ${result.san}`]);
    if (g.isGameOver()) { setMaiaTestStatus('done'); return true; }
    // Let Maia respond
    const botMove = await requestMaiaMove(g.fen());
    if (botMove) {
      const bg = new Chess(g.fen());
      const bFrom = botMove.substring(0, 2); const bTo = botMove.substring(2, 4);
      const br = bg.move({ from: bFrom, to: bTo, promotion: 'q' });
      if (br) { setMaiaTestGame(bg); setMaiaTestFen(bg.fen()); setMaiaTestLog(prev => [...prev, `🤖 مایا: ${br.san}`]); }
    }
    setMaiaTestStatus('done');
    return true;
  };

  const resetMaiaTest = () => {
    const g = new Chess();
    setMaiaTestGame(g); setMaiaTestFen(g.fen());
    setMaiaTestLog([]); setMaiaTestStatus('idle');
  };

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

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex" dir="rtl">
      
      {/* سایدبار */}
      <div className="w-64 bg-[#121110] border-l border-white/5 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
            <div className="w-10 h-10 rounded-xl bg-farzin-accent/20 flex items-center justify-center text-farzin-accent"><Settings size={20} /></div>
            <div className="flex flex-col"><span className="font-black text-white text-sm truncate">اتاق فرمان فرزین</span><span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Admin Panel</span></div>
        </div>
        <div className="flex flex-col p-4 gap-2 flex-1">
            <button onClick={() => setActiveMenu('courses')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'courses' ? 'bg-farzin-accent text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><BookOpen size={18} /> {auth.role === 'admin' ? 'مدیریت کل دوره‌ها' : 'دوره‌های من'}</button>
            {auth.role === 'instructor' && <button onClick={() => setActiveMenu('profile')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'profile' ? 'bg-farzin-accent text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><UserCircle size={18} /> تنظیمات پروفایل</button>}
            {auth.role === 'admin' && <>
              <button onClick={() => setActiveMenu('personal-puzzles')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'personal-puzzles' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><Brain size={18} /> درخواست‌های پازل شخصی</button>
              <button onClick={() => setActiveMenu('maia-bots')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'maia-bots' ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}><Bot size={18} /> ساخت ربات مایا</button>
            </>}
        </div>
        <div className="p-4 mt-auto border-t border-white/5">
            <button onClick={logout} className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-400 bg-rose-500/10 rounded-lg w-full justify-center py-2 transition-colors"><LogOut size={14}/> خروج از سیستم</button>
        </div>
      </div>

      {/* بخش اصلی */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-20 flex items-center justify-between px-6 md:px-8 border-b border-white/5 bg-[#0c0b0a]/80 backdrop-blur-md shrink-0">
            <h1 className="text-lg md:text-xl font-black text-white">
              {activeMenu === 'courses' ? (auth.role === 'admin' ? 'مدیریت کل دوره‌ها' : 'دوره‌های آموزشی من') : activeMenu === 'personal-puzzles' ? 'درخواست‌های پازل شخصی' : activeMenu === 'maia-bots' ? 'ساخت ربات مایا' : 'تنظیمات پروفایل استاد'}
            </h1>
            {activeMenu === 'courses' && <button onClick={openAddCourseModal} className="bg-gradient-to-r from-farzin-accent to-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95"><Plus size={18} /> <span className="hidden md:inline">دوره جدید</span></button>}
            {activeMenu === 'maia-bots' && <button onClick={fetchMaiaModels} className="bg-sky-600/20 border border-sky-500/30 text-sky-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95"><RefreshCw size={16} /> بروزرسانی</button>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {activeMenu === 'dashboard' && (
                <div className="text-center text-zinc-500 py-20 font-bold border border-dashed border-[#35332e] rounded-2xl">
                    به پنل مدیریت مرکزی خوش آمدید.<br/>از منوی سمت راست برای مدیریت بخش‌های مختلف استفاده کنید.
                </div>
            )}

            {/* 🧩 درخواست‌های پازل شخصی */}
            {activeMenu === 'personal-puzzles' && auth.role === 'admin' && (
              <div className="flex flex-col gap-4">
                {personalLoading ? (
                  <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-zinc-400" /></div>
                ) : personalRequests.length === 0 ? (
                  <div className="text-center text-zinc-500 py-20 border border-dashed border-[#35332e] rounded-2xl font-bold">هنوز هیچ درخواستی ثبت نشده.</div>
                ) : personalRequests.map((req: any) => (
                  <div key={req.id} className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-white text-sm">{req.id.substring(0, 8)}...</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {JSON.parse(req.lichessIds || '[]').length > 0 && <span className="text-[11px] bg-[#262421] text-zinc-300 px-2 py-0.5 rounded border border-[#35332e]">لیچس: {JSON.parse(req.lichessIds).join(', ')}</span>}
                          {JSON.parse(req.chesscomIds || '[]').length > 0 && <span className="text-[11px] bg-[#262421] text-zinc-300 px-2 py-0.5 rounded border border-[#35332e]">Chess.com: {JSON.parse(req.chesscomIds).join(', ')}</span>}
                          <span className="text-[11px] bg-[#262421] text-zinc-400 px-2 py-0.5 rounded border border-[#35332e]">{req.gameCount} بازی</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1">{new Date(req.createdAt).toLocaleDateString('fa-IR')}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[11px] font-black shrink-0 ${req.status === 'done' ? 'bg-emerald-500/15 text-emerald-400' : req.status === 'processing' ? 'bg-blue-500/15 text-blue-400' : req.status === 'error' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                        {req.status === 'done' ? 'تکمیل شد' : req.status === 'processing' ? 'در حال پردازش' : req.status === 'error' ? 'خطا' : 'در انتظار'}
                      </span>
                    </div>
                    {req.contactInfo && <div className="text-[11px] text-zinc-400 bg-[#1e1c19] px-3 py-2 rounded-xl border border-[#35332e]">تماس: {req.contactInfo}</div>}
                    {req.adminNote && <div className="text-[11px] text-zinc-400 bg-[#1e1c19] px-3 py-2 rounded-xl border border-[#35332e]">یادداشت: {req.adminNote}</div>}
                    <div className="flex gap-2 flex-wrap pt-2 border-t border-[#35332e]">
                      <button onClick={() => updateRequestStatus(req.id, 'processing')} className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"><Cpu size={14} /> شروع پردازش</button>
                      <button onClick={() => { setSelectedRequest(req); setRequestNote(req.adminNote || ''); }} className="flex-1 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"><Brain size={14} /> ساخت با مایا</button>
                      <button onClick={() => updateRequestStatus(req.id, 'done')} className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"><Check size={14} /> تکمیل شد</button>
                    </div>
                  </div>
                ))}

                {/* مودال یادداشت ادمین + پیوند مایا */}
                {selectedRequest && (
                  <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-[#1e1c19] border border-[#35332e] rounded-3xl w-full max-w-lg p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between"><h3 className="font-black text-white flex items-center gap-2"><Brain size={18} className="text-purple-400" /> ساخت پازل با مایا</h3><button onClick={() => setSelectedRequest(null)}><X size={20} className="text-zinc-400" /></button></div>
                      <div className="bg-[#161512] border border-[#35332e] rounded-xl p-4 text-sm text-zinc-300 leading-relaxed">
                        برای ساخت پازل شخصی با مایا:<br />
                        ۱. از لیچس یا Chess.com بازی‌های کاربر را به صورت PGN دانلود کنید<br />
                        ۲. در تب «ساخت ربات مایا» مدل را آموزش دهید<br />
                        ۳. پس از آموزش، پازل‌ها را از خروجی مدل استخراج کنید
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-zinc-400">یادداشت برای کاربر</label>
                        <textarea value={requestNote} onChange={e => setRequestNote(e.target.value)} className="bg-[#161512] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none min-h-[80px] resize-y" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => updateRequestStatus(selectedRequest.id, 'done')} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"><CheckCircle2 size={16} /> تکمیل و اطلاع‌رسانی</button>
                        <button onClick={() => updateRequestStatus(selectedRequest.id, 'error')} className="py-3 px-4 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl font-bold text-sm transition-colors"><AlertTriangle size={16} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🤖 ساخت ربات مایا */}
            {activeMenu === 'maia-bots' && auth.role === 'admin' && (
              <div className="flex flex-col gap-6">

                {/* ─ آموزش مدل جدید ─ */}
                <div className="bg-[#161512] border border-[#35332e] rounded-2xl p-6 flex flex-col gap-4">
                  <h3 className="font-black text-white flex items-center gap-2"><Cpu size={18} className="text-sky-400" /> آموزش مدل جدید</h3>
                  <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 text-xs text-sky-200/80 leading-relaxed">
                    <b>نکته مهم:</b> آموزش مدل مایا نیازمند Python + TensorFlow + LC0 در سرور است. مطمئن شوید که سرور Python (فایل serve.py) در پورت ۵۰۰۱ فعال است.
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-400">نام بازیکن (Player Name)</label>
                      <input dir="ltr" value={maiaPlayerName} onChange={e => setMaiaPlayerName(e.target.value)} placeholder="moxuji" className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-sky-500" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-400 flex items-center justify-between">
                        <span>محتوای PGN بازی‌ها</span>
                        <span className="text-zinc-600">{maiaPgn.length > 0 ? `${maiaPgn.split('[Event').length - 1} بازی` : ''}</span>
                      </label>
                      <textarea dir="ltr" value={maiaPgn} onChange={e => setMaiaPgn(e.target.value)} placeholder="[Event...] پیست کنید محتوای فایل PGN را اینجا" className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-xs text-zinc-300 outline-none min-h-[120px] resize-y font-mono" />
                    </div>
                  </div>
                  {maiaTraining ? (
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${maiaTraining.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                      {maiaTraining.status !== 'done' ? <Loader2 className="animate-spin text-blue-400" size={20} /> : <CheckCircle2 className="text-emerald-400" size={20} />}
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white">{maiaTraining.status === 'done' ? 'آموزش تکمیل شد' : 'در حال آموزش...'}</span>
                        <span className="text-[11px] text-zinc-400">بازیکن: {maiaTraining.playerName} · Job: {maiaTraining.jobId?.substring(0, 12)}</span>
                      </div>
                      {maiaTraining.status === 'done' && <button onClick={() => setMaiaTraining(null)} className="mr-auto text-zinc-500 hover:text-white"><X size={18} /></button>}
                    </div>
                  ) : (
                    <button onClick={startMaiaTraining} disabled={!maiaPlayerName.trim() || !maiaPgn.trim()} className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <Zap size={18} fill="currentColor" /> شروع آموزش مدل مایا
                    </button>
                  )}
                </div>

                {/* ─ مدل‌های موجود ─ */}
                <div className="bg-[#161512] border border-[#35332e] rounded-2xl p-6 flex flex-col gap-3">
                  <h3 className="font-black text-white flex items-center gap-2"><Bot size={18} className="text-emerald-400" /> مدل‌های آموزش‌دیده</h3>
                  {maiaModels.length === 0 ? (
                    <div className="text-center text-zinc-500 py-8 text-sm font-bold border border-dashed border-[#35332e] rounded-xl">هنوز مدلی آموزش نداده‌اید یا سرور مایا در دسترس نیست.</div>
                  ) : maiaModels.map((m: any) => (
                    <div key={m.name} className={`flex items-center justify-between bg-[#1e1c19] border rounded-xl p-3.5 ${selectedTestModel === m.name ? 'border-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'border-[#35332e]'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center"><Bot size={18} className="text-sky-400" /></div>
                        <div className="flex flex-col"><span className="font-bold text-white text-sm">{m.name}</span><span className="text-[10px] text-zinc-500">مدل مایا</span></div>
                      </div>
                      <button onClick={() => { setSelectedTestModel(m.name); resetMaiaTest(); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedTestModel === m.name ? 'bg-sky-500 text-white' : 'bg-[#262421] text-zinc-400 hover:text-white'}`}>
                        {selectedTestModel === m.name ? 'انتخاب شد' : 'انتخاب برای تست'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* ─ محیط تست ربات ─ */}
                {selectedTestModel && (
                  <div className="bg-[#161512] border border-[#35332e] rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-white flex items-center gap-2"><Eye size={18} className="text-amber-400" /> محیط تست: {selectedTestModel}</h3>
                      <button onClick={resetMaiaTest} className="text-xs text-zinc-400 hover:text-white bg-[#262421] px-3 py-1.5 rounded-lg flex items-center gap-1.5"><RefreshCw size={14} /> بازی جدید</button>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="w-full lg:w-[340px] shrink-0" dir="ltr">
                        <div className={`rounded-xl overflow-hidden border-4 shadow-xl transition-colors ${maiaTestStatus === 'thinking' ? 'border-sky-500' : 'border-[#35332e]'}`}>
                          <Chessboard
                            position={maiaTestFen}
                            onPieceDrop={handleMaiaTestDrop}
                            boardOrientation={maiaTestPlayerColor}
                            animationDuration={250}
                            customDarkSquareStyle={{ backgroundColor: '#779556' }}
                            customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                          />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setMaiaTestPlayerColor(c => c === 'white' ? 'black' : 'white')} className="flex-1 py-2 bg-[#262421] hover:bg-[#35332e] text-zinc-300 rounded-xl text-xs font-bold transition-colors">چرخش تخته</button>
                          <button onClick={resetMaiaTest} className="flex-1 py-2 bg-[#262421] hover:bg-[#35332e] text-zinc-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"><RotateCcw size={14} /> ریست</button>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-1">
                          {maiaTestStatus === 'thinking' && <><Loader2 size={14} className="animate-spin text-sky-400" /> مایا در حال فکر کردن...</>}
                          {maiaTestStatus === 'idle' && <><Play size={14} className="text-farzin-accent" /> حرکت کنید — مایا پاسخ می‌دهد</>}
                          {maiaTestStatus === 'done' && maiaTestGame.isGameOver() && <><CheckCircle2 size={14} className="text-emerald-400" /> بازی تمام شد</>}
                        </div>
                        <div className="bg-[#0c0b0a] border border-[#35332e] rounded-xl p-3 flex flex-col gap-1.5 h-[200px] overflow-y-auto">
                          {maiaTestLog.length === 0 ? (
                            <span className="text-zinc-600 text-xs">گزارش حرکات اینجا نمایش داده می‌شود...</span>
                          ) : maiaTestLog.map((log, i) => (
                            <span key={i} className={`text-xs font-mono ${log.startsWith('🤖') ? 'text-sky-400' : 'text-zinc-300'}`}>{log}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
    </div>
  );
}

function MenuButton({ icon, title, id, active, setActive }: any) {
    return (
        <button onClick={() => setActive(id)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${active === id ? 'bg-farzin-accent text-white shadow-lg' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}>
            {icon} {title}
        </button>
    );
}