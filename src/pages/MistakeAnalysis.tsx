import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, BrainCircuit, CheckCircle2, AlertTriangle,
  Loader2, Play, X, Zap, RefreshCw, Target, Swords
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = 'inaccuracy' | 'mistake' | 'blunder';

interface MistakePuzzle {
  id: string;
  fen: string;
  moves: string;        // "setupMove bestMove" space-separated UCI
  rating: number;
  themes: string;
  source: string;
  category: Category;
}

type Step = 'setup' | 'analyzing' | 'done' | 'error';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toPD = (n: number | string) =>
  n.toString().replace(/\d/g, x => ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'][+x]);

function sanToUci(san: string, fen: string): string {
  try {
    const g = new Chess(fen);
    const m = g.move(san);
    return m ? `${m.from}${m.to}${m.promotion || ''}` : '';
  } catch { return ''; }
}

const epFormula = (score: number) => 1 / (1 + Math.pow(10, -score / 4));

function classifyEpLoss(epLoss: number): Category | null {
  if (epLoss > 0.30) return 'blunder';
  if (epLoss > 0.20) return 'mistake';
  if (epLoss > 0.10) return 'inaccuracy';
  return null;
}

const JUDGMENT_MAP: Record<string, Category> = {
  Blunder: 'blunder',
  Mistake: 'mistake',
  Inaccuracy: 'inaccuracy',
  Miss: 'mistake',
};

const CATEGORY_LABEL: Record<Category, string> = {
  blunder: 'اشتباه فاحش',
  mistake: 'اشتباه',
  inaccuracy: 'بی‌دقتی',
};

const CATEGORY_COLOR: Record<Category, string> = {
  blunder: 'text-red-400 bg-red-500/10 border-red-500/25',
  mistake: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
  inaccuracy: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
};

// ─── Stockfish batch worker for Chess.com ────────────────────────────────────

class StockfishBatch {
  worker: Worker | null = null;
  currentResolve: ((result: { bestMove: string; evalCp: number }) => void) | null = null;
  lastEvalCp = 0;
  isReady = false;
  queue: Array<{ fen: string; resolve: Function; reject: Function }> = [];

  init() {
    try {
      this.worker = new Worker('/engine/farzin-worker.js', { type: 'module' });
      this.worker.onmessage = (e) => {
        const { type, data } = e.data;
        if (type !== 'engine_out') return;
        if (data === 'uciok') {
          this.worker!.postMessage({ type: 'uci_cmd', data: 'setoption name MultiPV value 1' });
          this.worker!.postMessage({ type: 'uci_cmd', data: 'isready' });
        }
        if (data === 'readyok') {
          this.isReady = true;
          this.processNext();
        }
        if (data.startsWith('info depth')) {
          const cpMatch = data.match(/score cp (-?\d+)/);
          if (cpMatch) this.lastEvalCp = parseInt(cpMatch[1]);
        }
        if (data.startsWith('bestmove')) {
          const bestMove = data.split(' ')[1];
          if (this.currentResolve) {
            this.currentResolve({ bestMove, evalCp: this.lastEvalCp });
            this.currentResolve = null;
          }
          this.processNext();
        }
      };
      this.worker.onerror = () => {
        // If worker fails, resolve all queued items with a dummy result
        if (this.currentResolve) {
          this.currentResolve({ bestMove: '', evalCp: 0 });
          this.currentResolve = null;
        }
        while (this.queue.length) {
          const item = this.queue.shift()!;
          (item.resolve as any)({ bestMove: '', evalCp: 0 });
        }
      };
      this.worker.postMessage({ type: 'uci_cmd', data: 'uci' });
    } catch {
      // Worker not available – leave isReady false so analyze() rejects
    }
  }

  processNext() {
    if (this.queue.length === 0) return;
    const item = this.queue.shift()!;
    this.currentResolve = item.resolve as any;
    this.lastEvalCp = 0;
    this.worker!.postMessage({ type: 'uci_cmd', data: `position fen ${item.fen}` });
    this.worker!.postMessage({ type: 'uci_cmd', data: 'go depth 12' });
  }

  analyze(fen: string): Promise<{ bestMove: string; evalCp: number }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) { resolve({ bestMove: '', evalCp: 0 }); return; }
      this.queue.push({ fen, resolve, reject });
      if (this.isReady && !this.currentResolve) this.processNext();
    });
  }

  terminate() { this.worker?.terminate(); this.worker = null; }
}

// ─── Lichess fetcher ──────────────────────────────────────────────────────────

async function fetchLichessGames(
  username: string,
  count: number,
  selectedCategories: Set<Category>,
  onProgress: (msg: string) => void,
  cancelRef: React.MutableRefObject<boolean>,
): Promise<MistakePuzzle[]> {
  onProgress(`در حال دریافت بازی‌های ${username} از لیچس...`);
  const puzzles: MistakePuzzle[] = [];

  const resp = await fetch(
    `https://lichess.org/api/games/user/${username}?max=${count}&evals=true&pgnInJson=true&analysed=true`,
    { headers: { Accept: 'application/x-ndjson' } },
  );
  if (!resp.ok) throw new Error(`لیچس HTTP ${resp.status}`);

  const text = await resp.text();
  const lines = text.trim().split('\n').filter(l => l.trim());

  let gameIndex = 0;
  for (const line of lines) {
    if (cancelRef.current) break;
    gameIndex++;

    let game: any;
    try { game = JSON.parse(line); } catch { continue; }

    onProgress(`تحلیل بازی ${toPD(gameIndex)} از ${toPD(lines.length)} (لیچس · ${username})...`);

    if (!game.moves || !game.analysis) continue;

    const sanMoves: string[] = game.moves.split(' ');
    const analysis: any[] = game.analysis;
    const isWhite =
      (game.players?.white?.user?.name || '').toLowerCase() === username.toLowerCase();

    // Build FEN array: fens[0]=initial, fens[k]=FEN after sanMoves[k-1]
    const chess = new Chess();
    const fens: string[] = [chess.fen()];
    for (const san of sanMoves) {
      try { chess.move(san); fens.push(chess.fen()); } catch { break; }
    }

    for (let i = 1; i < analysis.length; i++) {
      const ev = analysis[i];
      if (!ev?.judgment) continue;

      const jName: string = ev.judgment?.name || '';
      const category: Category = JUDGMENT_MAP[jName] ?? 'inaccuracy';
      if (!selectedCategories.has(category)) continue;

      // Determine whose move: move index i (0-based) -> i%2===0 => White played
      const moveIsWhite = i % 2 === 0;
      if (moveIsWhite !== isWhite) continue;  // only player's own mistakes

      if (i < 1) continue;

      // setup FEN = position before opponent's previous move (i-1 ply)
      const setupFenIdx = i - 1;
      const setupFen = fens[setupFenIdx];
      if (!setupFen) continue;

      const setupMoveSan = sanMoves[i - 1];
      if (!setupMoveSan) continue;

      const correctMoveUci = (ev.best || '').replace(/\s+/g, '');
      if (!correctMoveUci || correctMoveUci.length < 4) continue;

      const setupMoveUci = sanToUci(setupMoveSan, setupFen);
      if (!setupMoveUci) continue;

      puzzles.push({
        id: `lichess_${game.id}_${i}`,
        fen: setupFen,
        moves: `${setupMoveUci} ${correctMoveUci}`,
        rating: category === 'blunder' ? 1500 : category === 'mistake' ? 1350 : 1200,
        themes: category,
        source: `لیچس · ${username} · حرکت ${toPD(Math.ceil(i / 2))}`,
        category,
      });
    }
  }

  return puzzles;
}

// ─── Chess.com fetcher ────────────────────────────────────────────────────────

async function fetchChesscomGames(
  username: string,
  count: number,
  selectedCategories: Set<Category>,
  onProgress: (msg: string) => void,
  cancelRef: React.MutableRefObject<boolean>,
  stockfish: StockfishBatch,
): Promise<MistakePuzzle[]> {
  onProgress(`در حال دریافت آرشیو ${username} از Chess.com...`);
  const puzzles: MistakePuzzle[] = [];

  const archivesResp = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
  if (!archivesResp.ok) throw new Error('کاربر Chess.com پیدا نشد');
  const { archives } = await archivesResp.json();
  if (!archives?.length) return puzzles;

  const latestArchive = archives[archives.length - 1];
  onProgress('در حال بارگذاری بازی‌های اخیر از Chess.com...');
  const gamesResp = await fetch(latestArchive);
  if (!gamesResp.ok) return puzzles;
  const { games } = await gamesResp.json();
  if (!games?.length) return puzzles;

  const recentGames = (games as any[]).slice(-Math.min(count, games.length));
  const useEngine = stockfish.isReady;

  for (let gi = 0; gi < recentGames.length; gi++) {
    if (cancelRef.current) break;
    const game = recentGames[gi];
    onProgress(`آنالیز بازی ${toPD(gi + 1)} از ${toPD(recentGames.length)} (Chess.com · ${username})...`);

    try {
      const pgn: string = game.pgn || '';
      const isWhite = (game.white?.username || '').toLowerCase() === username.toLowerCase();
      const playerColor = isWhite ? 'w' : 'b';

      const chess = new Chess();
      try { chess.loadPgn(pgn); } catch { continue; }
      const history = chess.history({ verbose: true });
      if (history.length < 6) continue;

      // Rebuild position array
      const rebuilder = new Chess();
      const positionFens: string[] = [rebuilder.fen()];
      for (const mv of history) {
        rebuilder.move(mv);
        positionFens.push(rebuilder.fen());
      }

      if (useEngine) {
        // Engine-based EP loss analysis
        let prevEvalCp = 0;
        let prevAnalyzed = false;

        for (let i = 0; i < history.length; i++) {
          if (cancelRef.current) break;
          const mv = history[i];
          if (mv.color !== playerColor) continue;
          if (i < 1) continue;

          // FEN before this move
          const fenBefore = positionFens[i];
          // FEN after this move
          const fenAfter = positionFens[i + 1];
          if (!fenBefore || !fenAfter) continue;

          const [resBefore, resAfter] = await Promise.all([
            !prevAnalyzed ? stockfish.analyze(fenBefore) : Promise.resolve({ bestMove: '', evalCp: prevEvalCp }),
            stockfish.analyze(fenAfter),
          ]);
          prevAnalyzed = true;
          prevEvalCp = resAfter.evalCp;

          const cpBefore = resBefore.evalCp;
          const cpAfter = resAfter.evalCp;

          const epBefore = isWhite ? epFormula(cpBefore / 100) : epFormula(-cpBefore / 100);
          const epAfter = isWhite ? epFormula(cpAfter / 100) : epFormula(-cpAfter / 100);
          const epLoss = Math.max(0, epBefore - epAfter);

          const category = classifyEpLoss(epLoss);
          if (!category || !selectedCategories.has(category)) continue;

          const bestMove = resBefore.bestMove;
          if (!bestMove || bestMove.length < 4) continue;

          // Setup: position before opponent's last move (i-1 ply)
          const setupFen = positionFens[i - 1];
          const setupMoveSan = history[i - 1];
          const setupUci = `${setupMoveSan.from}${setupMoveSan.to}${setupMoveSan.promotion || ''}`;

          puzzles.push({
            id: `chesscom_${gi}_${i}`,
            fen: setupFen,
            moves: `${setupUci} ${bestMove}`,
            rating: category === 'blunder' ? 1500 : category === 'mistake' ? 1350 : 1200,
            themes: category,
            source: `Chess.com · ${username} · حرکت ${toPD(Math.floor(i / 2) + 1)}`,
            category,
          });
        }
      } else {
        // Fallback: material-swing heuristic
        for (let i = 2; i < history.length - 1; i++) {
          const mv = history[i];
          if (mv.color !== playerColor) continue;
          if (!mv.captured) continue;

          const afterFen = positionFens[i + 1];
          const testChess = new Chess(afterFen);
          const oppMoves = testChess.moves({ verbose: true });
          const recaptures = oppMoves.filter(m => m.to === mv.to && m.captured);
          if (!recaptures.length) continue;

          const pieceVal: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
          const capturedVal = pieceVal[mv.captured || ''] ?? 0;
          const recaptureVal = recaptures.reduce(
            (max, m) => Math.max(max, pieceVal[m.piece] ?? 0), 0,
          );

          if (recaptureVal - capturedVal < 2) continue;
          if (!selectedCategories.has('blunder')) continue;

          const setupFen = positionFens[i - 1];
          const setupMv = history[i - 1];
          const setupUci = `${setupMv.from}${setupMv.to}${setupMv.promotion || ''}`;
          const opp = recaptures[0];
          const oppUci = `${opp.from}${opp.to}${opp.promotion || ''}`;

          puzzles.push({
            id: `chesscom_${gi}_${i}`,
            fen: setupFen,
            moves: `${setupUci} ${oppUci}`,
            rating: 1400,
            themes: 'blunder hangingPiece',
            source: `Chess.com · ${username} · حرکت ${toPD(Math.floor(i / 2) + 1)}`,
            category: 'blunder',
          });
        }
      }
    } catch { /* skip bad game */ }
  }

  return puzzles;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MistakeAnalysis() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('setup');
  const [lichessIds, setLichessIds] = useState('');
  const [chesscomIds, setChesscomIds] = useState('');
  const [gameCount, setGameCount] = useState<5 | 10 | 15 | 20>(10);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    new Set(['blunder', 'mistake', 'inaccuracy']),
  );
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [foundPuzzles, setFoundPuzzles] = useState<MistakePuzzle[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const cancelRef = useRef(false);
  const stockfishRef = useRef<StockfishBatch | null>(null);

  // Cleanup engine on unmount
  useEffect(() => {
    return () => { stockfishRef.current?.terminate(); };
  }, []);

  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) { if (next.size > 1) next.delete(cat); }
      else next.add(cat);
      return next;
    });
  }, []);

  const updateProgress = useCallback((msg: string, pct?: number) => {
    setProgressMsg(msg);
    if (pct !== undefined) setProgress(pct);
  }, []);

  const startAnalysis = useCallback(async () => {
    const lIds = lichessIds.split(',').map(s => s.trim()).filter(Boolean);
    const cIds = chesscomIds.split(',').map(s => s.trim()).filter(Boolean);

    if (lIds.length === 0 && cIds.length === 0) {
      setErrorMsg('حداقل یک آیدی لیچس یا Chess.com وارد کن');
      return;
    }

    setErrorMsg('');
    cancelRef.current = false;
    setStep('analyzing');
    setProgress(0);

    // Init Stockfish for Chess.com (non-blocking)
    const sf = new StockfishBatch();
    stockfishRef.current = sf;
    sf.init();

    const all: MistakePuzzle[] = [];
    const totalIds = lIds.length + cIds.length;
    let done = 0;

    try {
      for (const id of lIds) {
        if (cancelRef.current) break;
        setProgress(Math.round((done / totalIds) * 85));
        try {
          const puzzles = await fetchLichessGames(id, gameCount, selectedCategories, updateProgress, cancelRef);
          all.push(...puzzles);
        } catch (err: any) {
          updateProgress(`خطا در لیچس (${id}): ${err.message}`);
        }
        done++;
      }

      for (const id of cIds) {
        if (cancelRef.current) break;
        setProgress(Math.round((done / totalIds) * 85));
        try {
          const puzzles = await fetchChesscomGames(id, gameCount, selectedCategories, updateProgress, cancelRef, sf);
          all.push(...puzzles);
        } catch (err: any) {
          updateProgress(`خطا در Chess.com (${id}): ${err.message}`);
        }
        done++;
      }
    } finally {
      sf.terminate();
      stockfishRef.current = null;
    }

    if (cancelRef.current) return;

    updateProgress('پازل‌ها آماده شدن!', 100);
    localStorage.setItem('farzin_mistake_puzzles', JSON.stringify(all));
    localStorage.setItem('farzin_mistake_puzzle_index', '0');
    setFoundPuzzles(all);

    setTimeout(() => {
      if (all.length === 0) {
        setErrorMsg('پازلی از اشتباهات پیدا نشد. بازی‌های بیشتری انتخاب کن یا آیدی‌ها رو چک کن.');
        setStep('error');
      } else {
        setStep('done');
      }
    }, 500);
  }, [lichessIds, chesscomIds, gameCount, selectedCategories, updateProgress]);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    stockfishRef.current?.terminate();
    stockfishRef.current = null;
    setStep('setup');
  }, []);

  // Computed stats for done screen
  const blunderCount = foundPuzzles.filter(p => p.category === 'blunder').length;
  const mistakeCount = foundPuzzles.filter(p => p.category === 'mistake').length;
  const inaccuracyCount = foundPuzzles.filter(p => p.category === 'inaccuracy').length;

  return (
    <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-20" dir="rtl">

      {/* Header */}
      <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0c0b0a]/90 backdrop-blur-xl border-b border-white/5">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/puzzles')}
          className="p-2.5 bg-[#1e1c19] rounded-xl text-zinc-400 border border-white/5"
        >
          <ChevronRight size={22} />
        </motion.button>
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-farzin-accent" />
          <h1 className="font-black text-base text-white">مرور اشتباهات</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-md px-4 mt-6 flex flex-col gap-5">

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-farzin-accent/15 to-[#141312] border border-farzin-accent/25 rounded-[28px] p-6 flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-farzin-accent/20 border border-farzin-accent/30 flex items-center justify-center">
              <BrainCircuit size={24} className="text-farzin-accent" />
            </div>
            <div>
              <h2 className="font-black text-white text-lg">تحلیل بازی‌های اخیرت</h2>
              <p className="text-[10px] text-zinc-500 font-bold mt-0.5">یاد بگیر از اشتباهات خودت</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            آیدی لیچس یا Chess.com خودت رو وارد کن. ما بازی‌هات رو آنالیز می‌کنیم و از جاهایی که اشتباه کردی پازل می‌سازیم — دقیقاً مثل لیچس.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Setup ── */}
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {/* Lichess IDs */}
              <div className="bg-[#141312] border border-white/5 rounded-[24px] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">♟</span>
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
                  <span className="text-base">♙</span>
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
                <p className="text-[10px] text-zinc-600 mt-2">چند آیدی رو با کاما جدا کن</p>
              </div>

              {/* Game count */}
              <div className="bg-[#141312] border border-white/5 rounded-[24px] p-5">
                <div className="font-black text-sm text-white mb-3">تعداد بازی‌های اخیر</div>
                <div className="flex gap-2">
                  {([5, 10, 15, 20] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => setGameCount(n)}
                      className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                        gameCount === n
                          ? 'bg-farzin-accent text-white shadow-[0_4px_15px_rgba(119,149,86,0.35)]'
                          : 'bg-[#262421] text-zinc-500 border border-white/5 hover:text-white'
                      }`}
                    >
                      {toPD(n)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-[#141312] border border-white/5 rounded-[24px] p-5">
                <div className="font-black text-sm text-white mb-3">نوع اشتباهات</div>
                <div className="flex flex-col gap-2">
                  {(['blunder', 'mistake', 'inaccuracy'] as Category[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        selectedCategories.has(cat)
                          ? `${CATEGORY_COLOR[cat]} border-current/30`
                          : 'bg-[#262421] border-white/5 text-zinc-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        selectedCategories.has(cat) ? 'bg-current border-current' : 'border-zinc-700'
                      }`}>
                        {selectedCategories.has(cat) && (
                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 fill-[#0c0b0a]">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#0c0b0a" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="font-black text-sm">{CATEGORY_LABEL[cat]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-xs font-bold text-red-400">
                  <AlertTriangle size={14} className="shrink-0" /> {errorMsg}
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={startAnalysis}
                className="w-full py-4 bg-gradient-to-l from-farzin-accent to-[#5c7a40] text-white font-black rounded-2xl flex items-center justify-center gap-2 text-base shadow-[0_8px_25px_rgba(119,149,86,0.3)]"
              >
                <Zap size={18} fill="currentColor" />
                شروع تحلیل بازی‌ها
              </motion.button>
            </motion.div>
          )}

          {/* ── Step 2: Analyzing ── */}
          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex flex-col items-center gap-8 py-8"
            >
              {/* Circular progress */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none" stroke="#262421" strokeWidth="2"
                  />
                  <motion.circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#779546"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="100"
                    strokeDashoffset={100 - progress}
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - progress }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-black text-2xl text-white leading-none">{toPD(progress)}</span>
                  <span className="text-[10px] text-zinc-500 font-bold">٪</span>
                </div>
              </div>

              <div className="text-center flex flex-col gap-2 max-w-[280px]">
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 size={16} className="text-farzin-accent animate-spin" />
                  <span className="font-black text-white text-sm">در حال تحلیل...</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{progressMsg}</p>
              </div>

              <div className="w-full bg-[#141312] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-farzin-accent animate-pulse" />
                  در حال آنالیز بازی‌ها و استخراج اشتباهات...
                </div>
              </div>

              <button
                onClick={handleCancel}
                className="text-xs text-zinc-600 hover:text-red-400 transition-colors font-bold flex items-center gap-1.5 mt-2"
              >
                <X size={13} /> لغو تحلیل
              </button>
            </motion.div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-emerald-400" />
              </div>

              <div className="text-center">
                <h3 className="font-black text-white text-xl mb-1">تکمیل شد!</h3>
                <p className="text-zinc-500 text-sm">
                  <span className="text-farzin-accent font-black">{toPD(foundPuzzles.length)} پازل</span>
                  {' '}از اشتباهات بازی‌هات استخراج شد
                </p>
              </div>

              {/* Breakdown */}
              <div className="w-full flex gap-3">
                {blunderCount > 0 && (
                  <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center">
                    <div className="font-black text-red-400 text-xl">{toPD(blunderCount)}</div>
                    <div className="text-[10px] text-red-400/70 font-bold mt-0.5">اشتباه فاحش</div>
                  </div>
                )}
                {mistakeCount > 0 && (
                  <div className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 text-center">
                    <div className="font-black text-orange-400 text-xl">{toPD(mistakeCount)}</div>
                    <div className="text-[10px] text-orange-400/70 font-bold mt-0.5">اشتباه</div>
                  </div>
                )}
                {inaccuracyCount > 0 && (
                  <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3 text-center">
                    <div className="font-black text-yellow-400 text-xl">{toPD(inaccuracyCount)}</div>
                    <div className="text-[10px] text-yellow-400/70 font-bold mt-0.5">بی‌دقتی</div>
                  </div>
                )}
              </div>

              {/* Puzzle list preview */}
              <div className="w-full bg-[#141312] border border-white/5 rounded-2xl p-4 max-h-44 overflow-y-auto">
                {foundPuzzles.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <div className="w-6 h-6 rounded-md bg-farzin-accent/10 flex items-center justify-center text-[10px] font-black text-farzin-accent shrink-0">
                      {toPD(i + 1)}
                    </div>
                    <div className="flex-1 text-[11px] text-zinc-400 truncate">{p.source}</div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${CATEGORY_COLOR[p.category]}`}>
                      {CATEGORY_LABEL[p.category]}
                    </span>
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/puzzle/mistakes')}
                className="w-full py-4 bg-white text-[#0c0b0a] font-black rounded-2xl flex items-center justify-center gap-2 text-base"
              >
                <Play size={18} fill="currentColor" /> شروع تمرین
              </motion.button>

              <button
                onClick={() => { setStep('setup'); setFoundPuzzles([]); }}
                className="text-xs text-zinc-600 hover:text-white transition-colors font-bold flex items-center gap-1"
              >
                <RefreshCw size={12} /> تحلیل مجدد
              </button>
            </motion.div>
          )}

          {/* ── Step 4: Error ── */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 py-4"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="font-black text-white text-lg mb-1">پازلی پیدا نشد</h3>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-[280px]">{errorMsg}</p>
              </div>
              <button
                onClick={() => setStep('setup')}
                className="px-8 py-3 bg-[#1e1c19] border border-white/5 text-white font-black rounded-xl text-sm flex items-center gap-2"
              >
                <ChevronRight size={16} /> بازگشت
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
