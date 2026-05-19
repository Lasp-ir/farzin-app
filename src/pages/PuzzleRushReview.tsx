import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Check, X, Copy, Share2, Trophy, Zap,
  CheckCircle2, XCircle, ChevronDown, MessageCircle, Send, RefreshCw
} from 'lucide-react';
import { useChessTheme } from '../hooks/useChessTheme';

interface PuzzleLogEntry {
  index: number;
  initialFen: string;
  boardFen: string;
  correctMoves: string[];
  userMoves: string[];
  result: 'correct' | 'wrong';
}

const toPersianDigits = (n: number | string) => {
  const p = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return n.toString().replace(/\d/g, x => p[+x]);
};

function uciToSan(fen: string, uciMoves: string[]): string[] {
  const sans: string[] = [];
  try {
    const g = new Chess(fen);
    for (const uci of uciMoves) {
      if (!uci || uci.length < 4) break;
      const m = g.move({ from: uci.slice(0,2), to: uci.slice(2,4), promotion: uci[4] || 'q' });
      if (m) sans.push(m.san); else break;
    }
  } catch {}
  return sans;
}

function buildPgn(sans: string[], turn: 'w' | 'b'): string {
  if (!sans.length) return '—';
  const parts: string[] = [];
  let n = 1;
  sans.forEach((san, i) => {
    const isWhiteTurn = (turn === 'w' && i % 2 === 0) || (turn === 'b' && i % 2 !== 0);
    if (i === 0 && turn === 'b') { parts.push(`${n}... ${san}`); }
    else if (isWhiteTurn) { parts.push(`${n}. ${san}`); }
    else { parts.push(san); n++; }
  });
  return parts.join(' ');
}

export default function PuzzleRushReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightSquareStyle, darkSquareStyle, customPieces } = useChessTheme();

  const state = location.state || {};
  const puzzleLog: PuzzleLogEntry[] = state.puzzleLog || [];
  const score: number = state.score || 0;
  const rushMode: string = state.rushMode || 'competitive';
  const timeMode: number = state.timeMode || 180;

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const correctCount = puzzleLog.filter(p => p.result === 'correct').length;
  const accuracy = puzzleLog.length > 0 ? Math.round((correctCount / puzzleLog.length) * 100) : 0;

  const exportText = useMemo(() => puzzleLog.map((e, i) => {
    const turn = new Chess(e.boardFen).turn() as 'w' | 'b';
    const userSan = uciToSan(e.boardFen, e.userMoves);
    const correctSan = uciToSan(e.boardFen, e.correctMoves.slice(1));
    const lines = [`Puzzle ${i+1}`, e.boardFen];
    if (e.result === 'correct') {
      lines.push(buildPgn(correctSan, turn));
    } else {
      lines.push(`User: ${buildPgn(userSan, turn) || '(wrong first move)'}`);
      lines.push(`Correct: ${buildPgn(correctSan, turn)}`);
    }
    return lines.join('\n');
  }).join('\n\n---\n\n'), [puzzleLog]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  return (
    <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-20" dir="rtl">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}}
            className="fixed top-5 inset-x-0 z-[300] flex justify-center pointer-events-none">
            <div className="bg-[#1e1c19] border border-farzin-accent/50 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
              <Check size={14} className="text-farzin-accent" />{toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share sheet */}
      <AnimatePresence>
        {shareOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShareOpen(false)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
              transition={{type:'spring',damping:28,stiffness:300}}
              onClick={e=>e.stopPropagation()}
              className="w-full max-w-md bg-[#1a1916] border-t border-white/10 rounded-t-[28px] p-6 pb-10">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4"/>
              <h3 className="font-black text-white text-lg text-center mb-1">ارسال به مربی</h3>
              <p className="text-zinc-500 text-xs text-center mb-5">نتایج پازل‌ها را برای مربیت بفرست</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'کپی در کلیپ‌بورد', sub: 'برای هر پیام‌رسان', Icon: Copy, color: 'zinc', action: () => { navigator.clipboard.writeText(exportText); showToast('کپی شد ✓'); setShareOpen(false); } },
                  { label: 'تلگرام', sub: 'اشتراک‌گذاری مستقیم', Icon: Send, color: 'blue', action: () => { window.open(`https://t.me/share/url?url=${encodeURIComponent(exportText)}`,'_blank'); setShareOpen(false); } },
                  { label: 'واتساپ', sub: 'اشتراک‌گذاری مستقیم', Icon: MessageCircle, color: 'green', action: () => { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(exportText)}`,'_blank'); setShareOpen(false); } },
                ].map(({ label, sub, Icon, color, action }) => (
                  <button key={label} onClick={action}
                    className={`w-full flex items-center gap-3 bg-[#262421] border border-white/5 rounded-2xl p-4 hover:border-${color}-500/30 transition-colors`}>
                    <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
                      <Icon size={18} className={`text-${color}-400`} />
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-white">{label}</div>
                      <div className="text-[10px] text-zinc-500">{sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0c0b0a]/90 backdrop-blur-xl border-b border-white/5">
        <motion.button whileTap={{scale:0.95}} onClick={() => navigate('/puzzle/rush')}
          className="p-2.5 bg-[#1e1c19] rounded-xl text-zinc-400 border border-white/5">
          <ChevronRight size={22}/>
        </motion.button>
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400"/>
          <h1 className="font-black text-base text-white">مرور پازل‌ها</h1>
        </div>
        <button onClick={() => setShareOpen(true)}
          className="flex items-center gap-1.5 bg-farzin-accent/20 border border-farzin-accent/40 text-farzin-accent px-3 py-1.5 rounded-xl text-xs font-black hover:bg-farzin-accent hover:text-white transition-colors">
          <Share2 size={13}/> ارسال به مربی
        </button>
      </div>

      <div className="w-full max-w-2xl px-4 mt-5 flex flex-col gap-4">

        {/* Summary */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
          className="bg-[#141312] border border-white/5 rounded-[28px] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
              <Zap size={20} className="text-yellow-400" fill="currentColor"/>
            </div>
            <div>
              <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                {rushMode === 'practice' ? '🎯 تمرینی' : '⚡ رقابتی'} · {timeMode >= 60 ? `${toPersianDigits(timeMode/60)} دقیقه` : `${toPersianDigits(timeMode)} ثانیه`}
              </div>
              <div className="font-black text-white">خلاصه عملکرد</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: toPersianDigits(score), label: 'پازل حل شده', color: 'text-white' },
              { val: `${toPersianDigits(accuracy)}٪`, label: 'دقت', color: 'text-emerald-400' },
              { val: toPersianDigits(puzzleLog.length), label: 'کل پازل', color: 'text-blue-400' },
            ].map(({ val, label, color }) => (
              <div key={label} className="bg-[#0c0b0a] rounded-2xl p-3.5 flex flex-col items-center gap-1 border border-white/5">
                <span className={`text-2xl font-black ${color}`}>{val}</span>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest text-center">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Puzzle cards */}
        {puzzleLog.map((entry, i) => {
          const turn = new Chess(entry.boardFen).turn() as 'w' | 'b';
          const userSan = uciToSan(entry.boardFen, entry.userMoves);
          const correctSan = uciToSan(entry.boardFen, entry.correctMoves.slice(1));
          const isExp = expandedIdx === i;
          const ok = entry.result === 'correct';

          return (
            <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
              className={`bg-[#141312] rounded-[22px] border overflow-hidden ${ok ? 'border-emerald-500/25' : 'border-red-500/25'}`}>

              <button onClick={() => setExpandedIdx(isExp ? null : i)}
                className="w-full p-4 flex items-center gap-3 text-right">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {ok ? <Check size={15} strokeWidth={3}/> : <X size={15} strokeWidth={3}/>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-sm">پازل {toPersianDigits(i+1)}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {ok ? '✓ درست' : '✗ نادرست'}
                    </span>
                  </div>
                  {!isExp && <div className="text-[10px] text-zinc-600 font-mono mt-0.5 truncate" dir="ltr">{correctSan.join(' ')}</div>}
                </div>
                <ChevronDown size={15} className={`text-zinc-600 transition-transform shrink-0 ${isExp?'rotate-180':''}`}/>
              </button>

              <AnimatePresence>
                {isExp && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22}} className="overflow-hidden">
                    <div className="px-4 pb-5 flex flex-col gap-4 border-t border-white/5">

                      {/* Board */}
                      <div className="w-[200px] mx-auto mt-4 rounded-xl overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.5)]" dir="ltr">
                        <Chessboard
                          position={entry.boardFen}
                          boardOrientation={turn === 'w' ? 'white' : 'black'}
                          customDarkSquareStyle={darkSquareStyle}
                          customLightSquareStyle={lightSquareStyle}
                          customPieces={customPieces}
                          arePiecesDraggable={false}
                          animationDuration={0}
                        />
                      </div>

                      {/* Moves */}
                      {!ok && (
                        <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                          <XCircle size={14} className="text-red-400 mt-0.5 shrink-0"/>
                          <div>
                            <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">حرکت کاربر</div>
                            <div className="font-mono text-xs text-zinc-300" dir="ltr">
                              {userSan.length > 0 ? buildPgn(userSan, turn) : '(حرکت اشتباه فوری)'}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={`flex items-start gap-3 rounded-xl p-3 ${ok ? 'bg-emerald-500/5 border border-emerald-500/15' : 'bg-[#1e1c19] border border-white/5'}`}>
                        <CheckCircle2 size={14} className={`${ok ? 'text-emerald-400' : 'text-zinc-500'} mt-0.5 shrink-0`}/>
                        <div>
                          <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${ok ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {ok ? 'حل شده ✓' : 'جواب صحیح'}
                          </div>
                          <div className="font-mono text-xs text-zinc-200" dir="ltr">{buildPgn(correctSan, turn)}</div>
                        </div>
                      </div>

                      <div className="bg-[#0c0b0a] rounded-xl p-3 border border-white/5">
                        <div className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-1">FEN</div>
                        <div className="font-mono text-[9px] text-zinc-600 break-all" dir="ltr">{entry.boardFen}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {puzzleLog.length === 0 && (
          <div className="flex flex-col items-center py-20 text-zinc-600">
            <Trophy size={40} className="mb-3 opacity-20"/>
            <span className="text-sm font-bold">هیچ پازلی در این جلسه ثبت نشد</span>
          </div>
        )}

        <motion.button whileTap={{scale:0.97}} onClick={() => navigate('/puzzle/rush')}
          className="w-full py-4 mt-2 bg-white text-[#0c0b0a] font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_5px_20px_rgba(255,255,255,0.1)]">
          <RefreshCw size={15} strokeWidth={3}/> دوباره بازی کن
        </motion.button>
      </div>
    </div>
  );
}
