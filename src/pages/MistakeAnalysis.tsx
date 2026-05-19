import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, BrainCircuit, RefreshCw, CheckCircle2, AlertTriangle,
  Loader2, Play, ChevronDown, X, Swords, Target, Zap
} from 'lucide-react';

interface ExtractedPuzzle {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string;
  source: string;
}

const toPD = (n: number | string) => n.toString().replace(/\d/g, x => ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'][+x]);

function sanToUci(san: string, fen: string): string {
  try {
    const g = new Chess(fen);
    const m = g.move(san);
    return m ? `${m.from}${m.to}${m.promotion||''}` : '';
  } catch { return ''; }
}

async function fetchLichessGames(username: string, count: number, onProgress: (msg: string) => void): Promise<ExtractedPuzzle[]> {
  onProgress(`در حال دریافت بازی‌های ${username} از لیچس...`);
  const puzzles: ExtractedPuzzle[] = [];

  try {
    const resp = await fetch(
      `https://lichess.org/api/games/user/${username}?max=${count}&evals=true&pgnInJson=true&analysed=true`,
      { headers: { Accept: 'application/x-ndjson' } }
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const text = await resp.text();
    const lines = text.trim().split('\n').filter(l => l.trim());

    let gameIndex = 0;
    for (const line of lines) {
      gameIndex++;
      try {
        const game = JSON.parse(line);
        onProgress(`تحلیل بازی ${toPD(gameIndex)} از ${toPD(lines.length)}...`);

        if (!game.moves || !game.analysis) continue;

        const sanMoves = game.moves.split(' ');
        const analysis = game.analysis as any[];
        const isWhite = game.players?.white?.user?.name?.toLowerCase() === username.toLowerCase();

        const chess = new Chess();
        const positionFens: string[] = [chess.fen()];

        for (const san of sanMoves) {
          try { chess.move(san); positionFens.push(chess.fen()); } catch { break; }
        }

        for (let i = 0; i < analysis.length; i++) {
          const ev = analysis[i];
          if (!ev?.judgment) continue;
          const jName: string = ev.judgment?.name || '';
          if (!['Mistake', 'Blunder'].includes(jName)) continue;

          const moveColor = i % 2 === 0 ? 'w' : 'b';
          const playerColor = isWhite ? 'w' : 'b';
          if (moveColor !== playerColor) continue;

          // Puzzle: go back 1 half-move to get opponent's "setup" move
          if (i < 1) continue;
          const puzzleFenIdx = i - 1; // FEN before opponent's last move
          const setupFen = positionFens[puzzleFenIdx] || positionFens[0];
          if (!setupFen) continue;

          const setupMoveSan = sanMoves[i - 1];
          if (!setupMoveSan) continue;

          // Get correct move from analysis
          const correctMoveUci = ev.best?.replace(/\s+/g, '') || '';
          if (!correctMoveUci || correctMoveUci.length < 4) continue;

          const setupMoveUci = sanToUci(setupMoveSan, setupFen);
          if (!setupMoveUci) continue;

          // Build puzzle moves: opponentSetup + correctBest
          const puzzleMoves = [setupMoveUci, correctMoveUci].join(' ');
          const evalDrop = ev.judgment?.name === 'Blunder' ? 300 : 150;
          const rating = 900 + Math.min(evalDrop * 2, 600);

          puzzles.push({
            id: `lichess_${game.id}_move${i}`,
            fen: setupFen,
            moves: puzzleMoves,
            rating,
            themes: jName === 'Blunder' ? 'mistake blunder' : 'mistake',
            source: `بازی لیچس #${game.id} · حرکت ${toPD(Math.floor(i/2)+1)}`
          });

          if (puzzles.length >= 20) break;
        }
        if (puzzles.length >= 20) break;
      } catch {}
    }
  } catch (err: any) {
    onProgress(`خطا در دریافت از لیچس: ${err.message || 'ناشناخته'}`);
  }

  return puzzles;
}

async function fetchChesscomGames(username: string, count: number, onProgress: (msg: string) => void): Promise<ExtractedPuzzle[]> {
  onProgress(`در حال دریافت آرشیو بازی‌های ${username} از Chess.com...`);
  const puzzles: ExtractedPuzzle[] = [];

  try {
    const archivesResp = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
    if (!archivesResp.ok) throw new Error('کاربر Chess.com یافت نشد');
    const { archives } = await archivesResp.json();
    if (!archives?.length) return puzzles;

    const latestArchive = archives[archives.length - 1];
    onProgress('در حال بارگذاری بازی‌های اخیر از Chess.com...');
    const gamesResp = await fetch(latestArchive);
    if (!gamesResp.ok) return puzzles;
    const { games } = await gamesResp.json();
    if (!games?.length) return puzzles;

    const recentGames = games.slice(-Math.min(count, games.length));

    for (let gi = 0; gi < recentGames.length; gi++) {
      const game = recentGames[gi];
      onProgress(`پارس بازی ${toPD(gi+1)} از ${toPD(recentGames.length)} از Chess.com...`);

      try {
        const pgn = game.pgn || '';
        const isWhite = game.white?.username?.toLowerCase() === username.toLowerCase();
        const chess = new Chess();
        chess.loadPgn(pgn);
        const history = chess.history({ verbose: true });
        if (history.length < 6) continue;

        // Analyze: find positions with big material swings
        const rebuilder = new Chess();
        const positions: {fen: string; move: any; idx: number}[] = [];

        for (const move of history) {
          rebuilder.move(move);
          positions.push({ fen: rebuilder.fen(), move, idx: positions.length });
        }

        const playerColor = isWhite ? 'w' : 'b';

        for (let i = 2; i < positions.length - 1; i++) {
          const pos = positions[i];
          if (pos.move.color !== playerColor) continue;
          if (pos.move.flags.includes('c') || pos.move.flags.includes('e')) {
            // Player captured – was it a mistake (hung a piece)?
            // Simple heuristic: after capture, opponent can recapture for gain
            const afterFen = positions[i].fen;
            const testChess = new Chess(afterFen);
            const oppMoves = testChess.moves({ verbose: true });
            const recaptures = oppMoves.filter(m => m.to === pos.move.to && m.captured);
            if (recaptures.length > 0) {
              const capturedVal = { p:1, n:3, b:3, r:5, q:9 }[pos.move.captured || ''] || 0;
              const recaptureVal = recaptures.reduce((max, m) => {
                const v = { p:1, n:3, b:3, r:5, q:9 }[m.piece || ''] || 0;
                return v > max ? v : max;
              }, 0);
              if (recaptureVal - capturedVal >= 2 && i >= 1) {
                const setupFen = positions[i - 1].fen;
                const setupMove = positions[i].move;
                const setupUci = `${setupMove.from}${setupMove.to}${setupMove.promotion || ''}`;

                // Find opponent's best response as the puzzle
                const opponentMove = recaptures[0];
                const opponentUci = `${opponentMove.from}${opponentMove.to}${opponentMove.promotion || ''}`;

                puzzles.push({
                  id: `chesscom_game${gi}_move${i}`,
                  fen: setupFen,
                  moves: `${setupUci} ${opponentUci}`,
                  rating: 900,
                  themes: 'hangingPiece mistake',
                  source: `بازی Chess.com شماره ${toPD(gi+1)} · حرکت ${toPD(Math.floor(i/2)+1)}`
                });
                if (puzzles.length >= 15) break;
              }
            }
          }
        }
      } catch {}
      if (puzzles.length >= 15) break;
    }
  } catch (err: any) {
    onProgress(`خطا در Chess.com: ${err.message || 'ناشناخته'}`);
  }

  return puzzles;
}

export default function MistakeAnalysis() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'setup' | 'analyzing' | 'done' | 'error'>('setup');
  const [lichessIds, setLichessIds] = useState('');
  const [chesscomIds, setChesscomIds] = useState('');
  const [gameCount, setGameCount] = useState(5);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [foundPuzzles, setFoundPuzzles] = useState<ExtractedPuzzle[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const cancelRef = useRef(false);

  const updateProgress = useCallback((msg: string, pct?: number) => {
    setProgressMsg(msg);
    if (pct !== undefined) setProgress(pct);
  }, []);

  const startAnalysis = async () => {
    const lIds = lichessIds.split(',').map(s => s.trim()).filter(Boolean);
    const cIds = chesscomIds.split(',').map(s => s.trim()).filter(Boolean);
    if (lIds.length === 0 && cIds.length === 0) {
      setErrorMsg('حداقل یک آیدی وارد کن');
      return;
    }

    cancelRef.current = false;
    setStep('analyzing');
    setProgress(0);
    const all: ExtractedPuzzle[] = [];

    const totalIds = lIds.length + cIds.length;
    let done = 0;

    for (const id of lIds) {
      if (cancelRef.current) break;
      updateProgress(`آنالیز لیچس: ${id}`, Math.round((done / totalIds) * 80));
      const puzzles = await fetchLichessGames(id, gameCount, updateProgress);
      all.push(...puzzles);
      done++;
    }

    for (const id of cIds) {
      if (cancelRef.current) break;
      updateProgress(`آنالیز Chess.com: ${id}`, Math.round((done / totalIds) * 80));
      const puzzles = await fetchChesscomGames(id, gameCount, updateProgress);
      all.push(...puzzles);
      done++;
    }

    if (cancelRef.current) return;

    updateProgress('پازل‌ها آماده شدن!', 100);
    localStorage.setItem('farzin_mistake_puzzles', JSON.stringify(all));
    localStorage.setItem('farzin_mistake_puzzle_index', '0');
    setFoundPuzzles(all);

    setTimeout(() => {
      setStep(all.length > 0 ? 'done' : 'error');
      if (all.length === 0) setErrorMsg('متاسفانه پازلی از اشتباهات پیدا نشد. بازی‌های بیشتری انتخاب کن یا آیدی‌ها رو چک کن.');
    }, 600);
  };

  const startSolving = () => {
    navigate('/puzzle/mistakes');
  };

  return (
    <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-16" dir="rtl">

      <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0c0b0a]/90 backdrop-blur-xl border-b border-white/5">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/puzzles')}
          className="p-2.5 bg-[#1e1c19] rounded-xl text-zinc-400 border border-white/5">
          <ChevronRight size={22} />
        </motion.button>
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-farzin-accent" />
          <h1 className="font-black text-base text-white">مرور اشتباهات</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-md px-4 mt-6 flex flex-col gap-5">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-farzin-accent/15 to-[#141312] border border-farzin-accent/25 rounded-[28px] p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-farzin-accent/20 border border-farzin-accent/30 flex items-center justify-center">
              <BrainCircuit size={24} className="text-farzin-accent" />
            </div>
            <div>
              <h2 className="font-black text-white text-lg">تحلیل بازی‌های اخیرت</h2>
              <p className="text-[10px] text-zinc-500 font-bold mt-0.5">پازل از اشتباهات واقعی خودت</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            با وارد کردن آیدی لیچس یا Chess.com خودت، ما بازی‌های اخیرت رو آنالیز می‌کنیم و از جایی که اشتباه کردی برات پازل می‌سازیم.
          </p>
        </motion.div>

        {/* Setup Form */}
        {step === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">

            {/* Lichess IDs */}
            <div className="bg-[#141312] border border-white/5 rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                  <span className="text-[10px] font-black text-zinc-300">♟</span>
                </div>
                <span className="font-black text-sm text-white">آیدی لیچس</span>
                <span className="text-[9px] text-zinc-600 font-bold">(اختیاری)</span>
              </div>
              <input
                value={lichessIds}
                onChange={e => setLichessIds(e.target.value)}
                placeholder="مثال: magnus, hikaru"
                className="w-full bg-[#0c0b0a] border border-white/5 rounded-xl px-4 py-3 text-sm font-mono text-zinc-300 placeholder-zinc-700 outline-none focus:border-farzin-accent/50 transition-colors"
                dir="ltr"
              />
              <p className="text-[10px] text-zinc-600 mt-2">چند آیدی رو با کاما جدا کن</p>
            </div>

            {/* Chess.com IDs */}
            <div className="bg-[#141312] border border-white/5 rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-zinc-700/30 flex items-center justify-center">
                  <span className="text-[10px] font-black text-zinc-300">♙</span>
                </div>
                <span className="font-black text-sm text-white">آیدی Chess.com</span>
                <span className="text-[9px] text-zinc-600 font-bold">(اختیاری)</span>
              </div>
              <input
                value={chesscomIds}
                onChange={e => setChesscomIds(e.target.value)}
                placeholder="مثال: magnuscarlsen"
                className="w-full bg-[#0c0b0a] border border-white/5 rounded-xl px-4 py-3 text-sm font-mono text-zinc-300 placeholder-zinc-700 outline-none focus:border-farzin-accent/50 transition-colors"
                dir="ltr"
              />
            </div>

            {/* Game count */}
            <div className="bg-[#141312] border border-white/5 rounded-[24px] p-5">
              <div className="font-black text-sm text-white mb-3">تعداد بازی‌های اخیر</div>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(n => (
                  <button key={n} onClick={() => setGameCount(n)}
                    className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${gameCount === n ? 'bg-farzin-accent text-white' : 'bg-[#262421] text-zinc-500 border border-white/5 hover:text-white'}`}>
                    {toPD(n)}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-xs font-bold text-red-400">
                <AlertTriangle size={14} /> {errorMsg}
              </div>
            )}

            <motion.button whileTap={{ scale: 0.97 }} onClick={startAnalysis}
              className="w-full py-4 bg-gradient-to-l from-farzin-accent to-[#5c7a40] text-white font-black rounded-2xl flex items-center justify-center gap-2 text-base shadow-[0_8px_25px_rgba(119,149,86,0.3)]">
              <Zap size={18} fill="currentColor" /> شروع تحلیل
            </motion.button>
          </motion.div>
        )}

        {/* Analyzing */}
        {step === 'analyzing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-8">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#262421" strokeWidth="2"/>
                <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="#779546" strokeWidth="2.5"
                  strokeLinecap="round" strokeDasharray={`${progress} 100`} strokeDashoffset="0"
                  initial={{ strokeDasharray: '0 100' }}
                  animate={{ strokeDasharray: `${progress} 100` }}
                  transition={{ duration: 0.5 }}/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-black text-xl text-white">{toPD(progress)}٪</span>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Loader2 size={16} className="text-farzin-accent animate-spin" />
                <span className="font-black text-white text-sm">در حال تحلیل...</span>
              </div>
              <p className="text-xs text-zinc-500 max-w-[260px] leading-relaxed">{progressMsg}</p>
            </div>

            <p className="text-[10px] text-zinc-700 text-center">می‌تونی برگردی به منو. وقتی آماده شد بهت اطلاع می‌ده.</p>

            <button onClick={() => { cancelRef.current = true; setStep('setup'); }}
              className="text-xs text-zinc-600 hover:text-red-400 transition-colors font-bold flex items-center gap-1">
              <X size={12} /> لغو
            </button>
          </motion.div>
        )}

        {/* Done */}
        {step === 'done' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-white text-xl mb-1">پازل‌ها آماده شدن! 🎯</h3>
              <p className="text-zinc-500 text-sm">
                <span className="text-farzin-accent font-black">{toPD(foundPuzzles.length)} پازل</span> از اشتباهات بازی‌هات استخراج شد
              </p>
            </div>

            <div className="w-full bg-[#141312] border border-white/5 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar">
              {foundPuzzles.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-6 h-6 rounded-md bg-farzin-accent/10 flex items-center justify-center text-[10px] font-black text-farzin-accent">{toPD(i+1)}</div>
                  <div className="flex-1 text-[11px] text-zinc-400 truncate">{p.source}</div>
                  <Swords size={12} className="text-zinc-600 shrink-0" />
                </div>
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={startSolving}
              className="w-full py-4 bg-white text-[#0c0b0a] font-black rounded-2xl flex items-center justify-center gap-2 text-base">
              <Play size={18} fill="currentColor" /> شروع حل پازل‌ها
            </motion.button>

            <button onClick={() => setStep('setup')} className="text-xs text-zinc-600 hover:text-white transition-colors font-bold">
              تحلیل مجدد با آیدی‌های دیگر
            </button>
          </motion.div>
        )}

        {/* Error */}
        {step === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-white text-lg mb-1">پازلی پیدا نشد</h3>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-[280px]">{errorMsg}</p>
            </div>
            <button onClick={() => setStep('setup')}
              className="px-8 py-3 bg-[#1e1c19] border border-white/5 text-white font-black rounded-xl text-sm">
              برگشت
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
