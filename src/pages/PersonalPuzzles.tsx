import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Sparkles, Brain, Send, CheckCircle2, Clock,
  Play, Lock, RefreshCw, Loader2, ChevronLeft, X, Check
} from 'lucide-react';
import { useChessTheme } from '../hooks/useChessTheme';

const API = 'http://localhost:5000/api';
const toPD = (n: number | string) => n.toString().replace(/\d/g, x => ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'][+x]);

interface PersonalRequest {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'rejected';
  lichessIds: string[];
  chesscomIds: string[];
  gameCount: number;
  createdAt: string;
  puzzles?: any[];
}

export default function PersonalPuzzles() {
  const navigate = useNavigate();
  const { lightSquareStyle, darkSquareStyle, customPieces } = useChessTheme();

  const [view, setView] = useState<'home' | 'request' | 'solving'>('home');
  const [request, setRequest] = useState<PersonalRequest | null>(null);
  const [lichessIds, setLichessIds] = useState('');
  const [chesscomIds, setChesscomIds] = useState('');
  const [gameCount, setGameCount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Puzzle solving state
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [game, setGame] = useState(new Chess());
  const [puzzleMoves, setPuzzleMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [solveStatus, setSolveStatus] = useState<'playing' | 'solved' | 'wrong'>('playing');
  const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, any>>({});
  const [wrongSquare, setWrongSquare] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const saved = localStorage.getItem('farzin_personal_request');
    if (saved) {
      const req: PersonalRequest = JSON.parse(saved);
      setRequest(req);
      // Check for updates from server
      if (req.status === 'pending' || req.status === 'processing') {
        fetch(`${API}/personal-puzzles/status/${req.id}`)
          .then(r => r.json())
          .then(data => {
            if (data.status && data.status !== req.status) {
              const updated = { ...req, ...data };
              setRequest(updated);
              localStorage.setItem('farzin_personal_request', JSON.stringify(updated));
              if (data.status === 'done') {
                // Add notification
                const notifs = JSON.parse(localStorage.getItem('farzin_notifications') || '[]');
                notifs.unshift({
                  id: `notif_${Date.now()}`,
                  title: '🎯 پازل‌های شخصی آماده شدن!',
                  body: 'پازل‌های اختصاصی تو توسط تیم فرزین آماده شدن. بزن بریم!',
                  type: 'personal_puzzles_ready',
                  isRead: false,
                  actionUrl: '/puzzle/personal',
                  createdAt: new Date().toISOString()
                });
                localStorage.setItem('farzin_notifications', JSON.stringify(notifs));
              }
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const submitRequest = async () => {
    const lIds = lichessIds.split(',').map(s => s.trim()).filter(Boolean);
    const cIds = chesscomIds.split(',').map(s => s.trim()).filter(Boolean);
    if (lIds.length === 0 && cIds.length === 0) {
      showToast('حداقل یک آیدی وارد کن');
      return;
    }
    setSubmitting(true);

    const reqData = {
      lichessIds: lIds,
      chesscomIds: cIds,
      gameCount,
      contactInfo: ''
    };

    try {
      const resp = await fetch(`${API}/personal-puzzles/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqData)
      });
      const data = await resp.json();
      const newReq: PersonalRequest = {
        id: data.id || `local_${Date.now()}`,
        status: 'pending',
        lichessIds: lIds,
        chesscomIds: cIds,
        gameCount,
        createdAt: new Date().toISOString()
      };
      setRequest(newReq);
      localStorage.setItem('farzin_personal_request', JSON.stringify(newReq));
      setSubmitDone(true);
    } catch {
      // Save locally even if API fails
      const newReq: PersonalRequest = {
        id: `local_${Date.now()}`,
        status: 'pending',
        lichessIds: lIds,
        chesscomIds: cIds,
        gameCount,
        createdAt: new Date().toISOString()
      };
      setRequest(newReq);
      localStorage.setItem('farzin_personal_request', JSON.stringify(newReq));
      setSubmitDone(true);
    }
    setSubmitting(false);
  };

  const startSolvingPersonal = () => {
    if (!request?.puzzles?.length) return;
    setPuzzleIndex(0);
    loadPuzzle(request.puzzles[0]);
    setView('solving');
    setScore(0);
  };

  const loadPuzzle = (puzzleData: any) => {
    setSolveStatus('playing');
    setWrongSquare(null);
    const newGame = new Chess(puzzleData.fen);
    const moves = puzzleData.moves.split(' ');
    setPuzzleMoves(moves);
    const pColor = newGame.turn() === 'w' ? 'black' : 'white';
    setPlayerColor(pColor);

    // Play opponent's first move
    setTimeout(() => {
      const firstMove = moves[0];
      newGame.move({ from: firstMove.slice(0,2), to: firstMove.slice(2,4), promotion: 'q' });
      setGame(new Chess(newGame.fen()));
      setLastMoveSquares({
        [firstMove.slice(0,2)]: { backgroundColor: 'rgba(255,255,0,0.25)' },
        [firstMove.slice(2,4)]: { backgroundColor: 'rgba(255,255,0,0.25)' }
      });
      setCurrentMoveIndex(1);
    }, 400);
  };

  const handleDrop = (src: string, tgt: string) => {
    if (solveStatus !== 'playing') return false;
    const expectedMove = puzzleMoves[currentMoveIndex];
    const userMove = src + tgt;

    if (userMove === expectedMove || `${src}${tgt}q` === expectedMove) {
      const newGame = new Chess(game.fen());
      newGame.move({ from: src, to: tgt, promotion: 'q' });
      setGame(newGame);
      setLastMoveSquares({});

      if (currentMoveIndex === puzzleMoves.length - 1) {
        setSolveStatus('solved');
        setScore(s => s + 1);
        setTimeout(() => {
          const puzzles = request!.puzzles!;
          if (puzzleIndex + 1 < puzzles.length) {
            setPuzzleIndex(i => i + 1);
            loadPuzzle(puzzles[puzzleIndex + 1]);
          } else {
            showToast('همه پازل‌های شخصی رو حل کردی! 🎉');
            setTimeout(() => setView('home'), 1500);
          }
        }, 800);
      } else {
        // Computer response
        setTimeout(() => {
          const comp = puzzleMoves[currentMoveIndex + 1];
          const ng = new Chess(newGame.fen());
          ng.move({ from: comp.slice(0,2), to: comp.slice(2,4), promotion: 'q' });
          setGame(ng);
          setLastMoveSquares({
            [comp.slice(0,2)]: { backgroundColor: 'rgba(255,255,0,0.25)' },
            [comp.slice(2,4)]: { backgroundColor: 'rgba(255,255,0,0.25)' }
          });
          setCurrentMoveIndex(i => i + 2);
        }, 300);
      }
      return true;
    } else {
      setWrongSquare(tgt);
      setSolveStatus('wrong');
      setTimeout(() => { setWrongSquare(null); setSolveStatus('playing'); }, 700);
      return false;
    }
  };

  const hasDonePuzzles = request?.status === 'done' && request?.puzzles?.length;
  const statusText: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'در انتظار بررسی', color: 'text-amber-400', icon: <Clock size={14}/> },
    processing: { label: 'در حال پردازش', color: 'text-blue-400', icon: <Loader2 size={14} className="animate-spin"/> },
    done: { label: 'آماده!', color: 'text-emerald-400', icon: <CheckCircle2 size={14}/> },
    rejected: { label: 'لغو شد', color: 'text-red-400', icon: <X size={14}/> },
  };

  // ===== Solving View =====
  if (view === 'solving') {
    const puzzles = request?.puzzles || [];
    const currentPuzzle = puzzles[puzzleIndex];
    const customSquares = { ...lastMoveSquares };
    if (wrongSquare) customSquares[wrongSquare] = { backgroundColor: 'rgba(239,68,68,0.7)' };
    if (solveStatus === 'solved') {
      const lastMove = puzzleMoves[puzzleMoves.length - 1];
      if (lastMove) customSquares[lastMove.slice(2,4)] = { backgroundColor: 'rgba(34,197,94,0.6)' };
    }

    return (
      <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-10" dir="rtl">
        <div className="w-full max-w-md px-5 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0c0b0a]/90 backdrop-blur-xl border-b border-white/5">
          <button onClick={() => setView('home')} className="p-2.5 bg-[#1e1c19] rounded-xl text-zinc-400 border border-white/5">
            <ChevronRight size={20}/>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400"/>
            <span className="font-black text-sm text-white">پازل‌های شخصی</span>
          </div>
          <div className="text-xs font-black text-zinc-500">{toPD(puzzleIndex+1)}/{toPD(puzzles.length)}</div>
        </div>

        <div className="w-full max-w-md px-4 mt-5">
          <div className="text-center mb-3">
            <span className="text-xs text-purple-400 font-black">{currentPuzzle?.source || 'پازل شخصی'}</span>
          </div>
          <div dir="ltr" className={`rounded-xl border-[3px] transition-all ${solveStatus==='wrong' ? 'border-red-500 scale-[0.99]' : solveStatus==='solved' ? 'border-emerald-500' : 'border-purple-500/30'}`}>
            <Chessboard
              position={game.fen()}
              onPieceDrop={handleDrop}
              boardOrientation={playerColor}
              customDarkSquareStyle={darkSquareStyle}
              customLightSquareStyle={lightSquareStyle}
              customPieces={customPieces}
              customSquareStyles={customSquares}
              animationDuration={140}
              autoPromoteToQueen
            />
          </div>
          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-xs text-zinc-600 font-bold">
              {puzzleIndex < puzzles.length ? `پازل ${toPD(puzzleIndex+1)} از ${toPD(puzzles.length)}` : ''}
            </span>
            <span className="text-xs font-black text-emerald-400">{toPD(score)} حل شده ✓</span>
          </div>
        </div>
      </div>
    );
  }

  // ===== Request Form =====
  if (view === 'request') {
    return (
      <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-16" dir="rtl">
        <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0c0b0a]/90 backdrop-blur-xl border-b border-white/5">
          <button onClick={() => setView('home')} className="p-2.5 bg-[#1e1c19] rounded-xl text-zinc-400 border border-white/5">
            <ChevronRight size={20}/>
          </button>
          <h1 className="font-black text-sm text-white">درخواست پازل شخصی</h1>
          <div className="w-10"/>
        </div>

        <div className="w-full max-w-md px-4 mt-5 flex flex-col gap-4">
          {!submitDone ? (
            <>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-[24px] p-5 text-sm text-zinc-400 leading-relaxed">
                <div className="flex items-center gap-2 mb-2 text-purple-400 font-black"><Brain size={16}/> چطور کار می‌کنه؟</div>
                بعد از ثبت درخواست، تیم فرزین با کمک هوش مصنوعی Maia بازی‌های تو رو تحلیل می‌کنه و پازل‌های اختصاصی مناسب سبک بازیت رو می‌سازه. وقتی آماده شد بهت اطلاع می‌ده.
              </div>

              {[
                { label: 'آیدی لیچس', val: lichessIds, set: setLichessIds, placeholder: 'مثال: magnus, hikaru' },
                { label: 'آیدی Chess.com', val: chesscomIds, set: setChesscomIds, placeholder: 'مثال: magnuscarlsen' },
              ].map(({ label, val, set, placeholder }) => (
                <div key={label} className="bg-[#141312] border border-white/5 rounded-[22px] p-4">
                  <div className="font-black text-sm text-white mb-2">{label}</div>
                  <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                    className="w-full bg-[#0c0b0a] border border-white/5 rounded-xl px-4 py-3 text-sm font-mono text-zinc-300 placeholder-zinc-700 outline-none focus:border-purple-500/50 transition-colors"
                    dir="ltr"/>
                </div>
              ))}

              <div className="bg-[#141312] border border-white/5 rounded-[22px] p-4">
                <div className="font-black text-sm text-white mb-3">تعداد بازی برای آنالیز</div>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map(n => (
                    <button key={n} onClick={() => setGameCount(n)}
                      className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${gameCount === n ? 'bg-purple-600 text-white' : 'bg-[#262421] text-zinc-500 border border-white/5'}`}>
                      {toPD(n)}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={submitRequest} disabled={submitting}
                className="w-full py-4 bg-gradient-to-l from-purple-600 to-purple-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 text-base shadow-[0_8px_25px_rgba(168,85,247,0.3)] disabled:opacity-60">
                {submitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
                {submitting ? 'در حال ارسال...' : 'ثبت درخواست'}
              </motion.button>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-emerald-400"/>
              </div>
              <div>
                <h3 className="font-black text-white text-xl mb-1">درخواست ثبت شد! ✅</h3>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-[280px]">
                  تیم فرزین درخواستت رو دریافت کرد و به زودی پازل‌های شخصیت آماده می‌شه. وقتی آماده شد بهت اطلاع می‌ده.
                </p>
              </div>
              <button onClick={() => setView('home')}
                className="px-8 py-3 bg-white text-[#0c0b0a] font-black rounded-2xl text-sm">
                برگشت به خانه
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ===== Home View =====
  return (
    <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-16" dir="rtl">

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="fixed top-5 inset-x-0 z-[300] flex justify-center pointer-events-none">
            <div className="bg-[#1e1c19] border border-purple-500/30 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
              <Check size={14} className="text-purple-400"/> {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0c0b0a]/90 backdrop-blur-xl border-b border-white/5">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/puzzles')}
          className="p-2.5 bg-[#1e1c19] rounded-xl text-zinc-400 border border-white/5">
          <ChevronRight size={22}/>
        </motion.button>
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400"/>
          <h1 className="font-black text-base text-white">پازل‌های شخصی</h1>
        </div>
        <div className="w-10"/>
      </div>

      <div className="w-full max-w-md px-4 mt-6 flex flex-col gap-5">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500/15 to-[#141312] border border-purple-500/25 rounded-[28px] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Brain size={28} className="text-purple-400"/>
            </div>
            <div>
              <h2 className="font-black text-white text-xl">پازل‌های فقط برای تو</h2>
              <p className="text-[10px] text-purple-400 font-black mt-0.5">ساخته شده توسط هوش مصنوعی Maia</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ما بازی‌های تو رو آنالیز می‌کنیم و با هوش مصنوعی Maia، پازل‌هایی می‌سازیم که دقیقاً برای نقاط ضعف بازی تو طراحی شدن.
          </p>
        </motion.div>

        {/* Request Status */}
        {request ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#141312] border border-white/5 rounded-[24px] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-sm text-white">وضعیت درخواست</span>
              {statusText[request.status] && (
                <div className={`flex items-center gap-1.5 text-xs font-black ${statusText[request.status].color}`}>
                  {statusText[request.status].icon}
                  {statusText[request.status].label}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-zinc-500 mb-4">
              {request.lichessIds.length > 0 && (
                <div dir="ltr">🟣 Lichess: <span className="text-zinc-300">{request.lichessIds.join(', ')}</span></div>
              )}
              {request.chesscomIds.length > 0 && (
                <div dir="ltr">⚪ Chess.com: <span className="text-zinc-300">{request.chesscomIds.join(', ')}</span></div>
              )}
              <div>📊 تعداد بازی: <span className="text-zinc-300">{toPD(request.gameCount)}</span></div>
            </div>

            {hasDonePuzzles ? (
              <motion.button whileTap={{ scale: 0.97 }} onClick={startSolvingPersonal}
                className="w-full py-3.5 bg-gradient-to-l from-purple-600 to-purple-500 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-[0_5px_20px_rgba(168,85,247,0.3)]">
                <Play size={16} fill="currentColor"/> شروع پازل‌ها ({toPD(request.puzzles!.length)} پازل)
              </motion.button>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs font-bold text-amber-400">
                <Loader2 size={12} className={request.status === 'processing' ? 'animate-spin' : ''}/>
                {request.status === 'processing' ? 'در حال پردازش توسط تیم فرزین...' : 'درخواست در صف پردازش است. به زودی آماده می‌شود.'}
              </div>
            )}

            <button onClick={() => {
              localStorage.removeItem('farzin_personal_request');
              setRequest(null);
            }} className="w-full text-center text-[10px] text-zinc-700 hover:text-red-400 mt-3 transition-colors font-bold">
              لغو و درخواست مجدد
            </button>
          </motion.div>
        ) : (
          <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }}
            onClick={() => setView('request')}
            className="w-full py-5 bg-gradient-to-l from-purple-600 to-purple-500 text-white font-black rounded-[24px] flex items-center justify-center gap-3 text-base shadow-[0_10px_30px_rgba(168,85,247,0.3)]">
            <Sparkles size={20}/> درخواست پازل شخصی
          </motion.button>
        )}

        {/* How it works */}
        <div className="bg-[#141312] border border-white/5 rounded-[24px] p-5">
          <h3 className="font-black text-white text-sm mb-4">چطور کار می‌کنه؟</h3>
          <div className="flex flex-col gap-3">
            {[
              { num: '۱', text: 'آیدی‌های لیچس یا Chess.com رو وارد کن' },
              { num: '۲', text: 'تیم فرزین بازی‌هات رو با Maia تحلیل می‌کنه' },
              { num: '۳', text: 'پازل‌های اختصاصی سبک بازیت آماده می‌شه' },
              { num: '۴', text: 'وقتی آماده شد بهت نوتیف می‌ره' },
            ].map(({ num, text }) => (
              <div key={num} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-[11px] font-black text-purple-400 shrink-0 mt-0.5">{num}</div>
                <p className="text-xs text-zinc-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lock notice */}
        <div className="flex items-center gap-3 bg-[#141312] border border-white/5 rounded-2xl p-4">
          <Lock size={16} className="text-zinc-600 shrink-0"/>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            هر کاربر می‌تونه یک درخواست فعال داشته باشه. پردازش معمولاً ۲۴ تا ۴۸ ساعت زمان می‌بره.
          </p>
        </div>
      </div>
    </div>
  );
}
