// src/pages/AnalysisBoard.tsx
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Cpu, Settings, FastForward, Rewind, 
  SkipBack, SkipForward, Activity, User, ShieldAlert,
  Zap, Share2, Download, History, Loader2
} from 'lucide-react';

// 🔥 ایمپورت کردن هوک قدرتمندمون
import { useStockfish } from '../hooks/useStockfish';

export default function AnalysisBoard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // دریافت دیتای پاس داده شده از صفحه ستاپ
  const { data, type, meta } = location.state || { data: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', type: 'FEN', meta: null };

  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState<any[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isLoaded, setIsLoaded] = useState(false);

  // 🧠 فراخوانی مغز موتور فرزین
  const { isReady, engineStatus, evaluation, lines, analyze, stop } = useStockfish();

  useEffect(() => {
    if (!data && type !== 'EMPTY') {
      navigate('/analysis');
      return;
    }

    const newGame = new Chess();
    try {
      if (type === 'PGN') {
        newGame.loadPgn(data);
      } else if (type === 'FEN') {
        newGame.load(data);
      }
      
      setGame(newGame);
      setHistory(newGame.history({ verbose: true }));
      setCurrentMoveIndex(newGame.history().length > 0 ? newGame.history().length - 1 : -1);
    } catch (e) {
      console.error("Error loading chess data", e);
    }
    
    setIsLoaded(true);
  }, [data, type, navigate]);

  // استخراج پوزیشن فعلی
  const currentPosition = useMemo(() => {
    const tempGame = new Chess();
    if (type === 'FEN' && data) {
      try { tempGame.load(data); } catch(e){} 
    }
    for (let i = 0; i <= currentMoveIndex; i++) {
      if (history[i]) tempGame.move(history[i]);
    }
    return tempGame.fen();
  }, [history, currentMoveIndex, data, type]);

  // ⚡️ راه‌اندازی اتوماتیک موتور با هر تغییر پوزیشن
  useEffect(() => {
    if (isReady && currentPosition) {
      analyze(currentPosition, 24); // هدف: رسیدن به عمق ۲۴
    }
  }, [currentPosition, isReady, analyze]);

  // کنترلرهای حرکت
  const goToMove = (index: number) => setCurrentMoveIndex(index);
  const nextMove = () => { if (currentMoveIndex < history.length - 1) setCurrentMoveIndex(prev => prev + 1); };
  const prevMove = () => { if (currentMoveIndex > -1) setCurrentMoveIndex(prev => prev - 1); };
  const goStart = () => setCurrentMoveIndex(-1);
  const goEnd = () => setCurrentMoveIndex(history.length - 1);

  // محاسبه ارتفاع نوار ارزیابی به درصد
  const evalPercentage = useMemo(() => {
    // محدود کردن بین 5% تا 95% برای ظاهر بهتر
    let percent = 50 + (evaluation * 10);
    if (percent > 95) percent = 95;
    if (percent < 5) percent = 5;
    return percent;
  }, [evaluation]);

  return (
    <div className="min-h-screen bg-[#161512] text-zinc-200 flex flex-col items-center pb-10 overflow-x-hidden" dir="rtl">
      
      {/* هدر */}
      <div className={`w-full max-w-2xl px-5 py-5 flex items-center justify-between z-10 transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={() => navigate(-1)} className="p-2.5 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] transition-colors active:scale-95 text-zinc-400">
          <ChevronRight size={20} />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="font-black text-lg text-white flex items-center gap-2">
              <Activity size={18} className="text-farzin-accent" />
              آزمایشگاه تحلیل
            </h1>
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest mt-0.5 uppercase">Engine Room</span>
        </div>
        <button className="p-2.5 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] transition-colors active:scale-95 text-zinc-400">
          <Settings size={20} />
        </button>
      </div>

      <div className={`w-full max-w-2xl flex flex-col transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* اطلاعات حریف سیاه و استاتوس موتور */}
        <div className="px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#262421] border border-[#35332e] flex items-center justify-center shadow-inner">
                    <User size={16} className="text-zinc-400" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-white">{meta?.blackName || 'بازیکن سیاه'}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {meta?.blackTitle && meta?.blackTitle !== 'بدون تایتل' && (
                            <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-1.5 rounded">{meta.blackTitle}</span>
                        )}
                        <span className="text-[10px] font-mono text-zinc-500">{meta?.blackElo || '---'}</span>
                    </div>
                </div>
            </div>
            
            {/* ⚡️ نمایش زنده وضعیت موتور */}
            <div className="bg-[#1e1c19] border border-[#35332e] px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-inner">
                {!isReady ? (
                  <Loader2 size={14} className="text-amber-500 animate-spin" />
                ) : (
                  <Cpu size={14} className="text-farzin-accent animate-pulse" />
                )}
                <span className="font-mono text-[10px] font-bold text-white max-w-[120px] truncate" dir="ltr">
                  {isReady ? 'Farzin 1.0 (NNUE)' : engineStatus}
                </span>
            </div>
        </div>

        {/* ناحیه تخته و نوار ارزیابی */}
        <div className="flex px-4 my-2 gap-3 aspect-square sm:max-h-[600px] w-full">
            {/* نوار ارزیابی زنده */}
            <div className="w-6 shrink-0 bg-[#262421] rounded-lg border border-[#35332e] overflow-hidden flex flex-col relative shadow-inner">
                {/* بخش سیاه */}
                <div className="w-full bg-[#35332e] transition-all duration-300 ease-out" style={{ height: `${100 - evalPercentage}%` }}></div>
                {/* بخش سفید */}
                <div className="w-full bg-zinc-200 transition-all duration-300 ease-out flex-1 flex flex-col justify-start items-center pt-1">
                    <span className="text-[9px] font-mono font-black text-zinc-800 rotate-90 mt-4">
                      {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
                    </span>
                </div>
            </div>

            <div className="flex-1 rounded-lg overflow-hidden shadow-2xl border-4 border-[#262421]">
                <Chessboard 
                    position={currentPosition} 
                    boardOrientation="white"
                    customDarkSquareStyle={{ backgroundColor: '#779556' }}
                    customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                    arePiecesDraggable={false} 
                />
            </div>
        </div>

        {/* اطلاعات حریف سفید */}
        <div className="px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-200 border border-[#35332e] flex items-center justify-center shadow-inner">
                    <User size={16} className="text-zinc-800" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-white">{meta?.whiteName || 'بازیکن سفید'}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {meta?.whiteTitle && meta?.whiteTitle !== 'بدون تایتل' && (
                            <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-1.5 rounded">{meta.whiteTitle}</span>
                        )}
                        <span className="text-[10px] font-mono text-zinc-500">{meta?.whiteElo || '---'}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="w-8 h-8 rounded-lg bg-[#1e1c19] border border-[#35332e] flex items-center justify-center hover:bg-[#262421] text-zinc-400 transition-colors"><Share2 size={14}/></button>
                <button className="w-8 h-8 rounded-lg bg-[#1e1c19] border border-[#35332e] flex items-center justify-center hover:bg-[#262421] text-zinc-400 transition-colors"><Download size={14}/></button>
            </div>
        </div>

        {/* کنترلرهای حرکتی */}
        <div className="px-5 my-4">
            <div className="w-full bg-[#1e1c19] border border-[#35332e] rounded-2xl flex items-center justify-between p-2 shadow-lg">
                <button onClick={goStart} disabled={currentMoveIndex === -1} className="p-3 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"><Rewind size={20} /></button>
                <button onClick={prevMove} disabled={currentMoveIndex === -1} className="p-3 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"><SkipBack size={20} /></button>
                <div className="w-px h-8 bg-[#35332e]"></div>
                <button onClick={nextMove} disabled={currentMoveIndex === history.length - 1} className="p-3 text-white hover:text-farzin-accent disabled:opacity-30 disabled:hover:text-white transition-colors"><SkipForward size={20} /></button>
                <button onClick={goEnd} disabled={currentMoveIndex === history.length - 1} className="p-3 text-white hover:text-farzin-accent disabled:opacity-30 disabled:hover:text-white transition-colors"><FastForward size={20} /></button>
            </div>
        </div>

        {/* ⚡️ خروجی واقعی موتور (Engine Lines) */}
        <div className="px-5 mb-4">
            <div className="bg-gradient-to-b from-[#1e1c19] to-[#161512] border border-[#35332e] rounded-[24px] p-4 shadow-xl min-h-[160px]">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#35332e]">
                    <span className="text-xs font-black text-white flex items-center gap-2">
                      <Zap size={14} className={isReady ? "text-amber-400" : "text-zinc-500"}/> 
                      {isReady ? `تحلیل زنده (عمق ${lines[0]?.depth || 0})` : 'منتظر موتور...'}
                    </span>
                    <span className="text-[10px] font-mono bg-farzin-accent/10 text-farzin-accent px-2 py-0.5 rounded border border-farzin-accent/20">
                      Eval: {evaluation > 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2)}
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    <AnimatePresence mode="popLayout">
                      {lines.map((line) => {
                          if (!line) return null;
                          const moves = line.pv.split(' ');
                          const mainMove = moves[0];
                          const lineContinuation = moves.slice(1, 6).join(' '); // فقط نمایش 5 حرکت اول برای جلوگیری از شلوغی
                          
                          let scoreText = '';
                          if (line.isMate) {
                              scoreText = line.mateIn! > 0 ? `+M${line.mateIn}` : `-M${Math.abs(line.mateIn!)}`;
                          } else {
                              scoreText = line.score > 0 ? `+${line.score.toFixed(2)}` : line.score.toFixed(2);
                          }

                          return (
                              <motion.div 
                                  layout
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  key={line.multipv} 
                                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${line.multipv === 1 ? 'bg-[#262421] border border-[#403e3a]' : 'hover:bg-[#1e1c19]'}`}
                              >
                                  <div className={`w-12 text-center font-mono font-black text-[13px] ${line.multipv === 1 ? 'text-amber-400' : 'text-zinc-500'}`} dir="ltr">
                                    {scoreText}
                                  </div>
                                  <div className="flex flex-col gap-0.5 overflow-hidden">
                                      <span className={`font-bold text-sm font-mono ${line.multipv === 1 ? 'text-white' : 'text-zinc-300'}`}>{mainMove}</span>
                                      <span className="font-mono text-[10px] text-zinc-500 truncate text-left" dir="ltr">{lineContinuation}</span>
                                  </div>
                              </motion.div>
                          );
                      })}
                    </AnimatePresence>
                </div>
            </div>
        </div>

        {/* تاریخچه حرکات */}
        <div className="px-5 mb-6">
            <div className="bg-[#1e1c19] border border-[#35332e] rounded-[24px] p-5 shadow-xl min-h-[150px]">
                <div className="flex items-center gap-2 mb-4 text-zinc-400">
                    <History size={16} />
                    <h3 className="font-black text-xs uppercase tracking-widest">تاریخچه حرکات</h3>
                </div>
                
                <div className="flex flex-wrap gap-x-2 gap-y-2 text-sm font-mono leading-loose" dir="ltr">
                    {history.reduce((result: any[], move: any, index: number) => {
                        if (index % 2 === 0) result.push([move]);
                        else result[result.length - 1].push(move);
                        return result;
                    }, []).map((pair: any[], movePairIndex: number) => (
                        <div key={movePairIndex} className="flex items-center gap-1.5">
                            <span className="text-zinc-600 w-5 text-right">{movePairIndex + 1}.</span>
                            <span 
                                onClick={() => goToMove(movePairIndex * 2)}
                                className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${currentMoveIndex === movePairIndex * 2 ? 'bg-farzin-accent text-white font-bold shadow-sm' : 'text-zinc-300 hover:bg-[#262421]'}`}
                            >
                                {pair[0].san}
                            </span>
                            {pair[1] && (
                                <span 
                                    onClick={() => goToMove(movePairIndex * 2 + 1)}
                                    className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors ${currentMoveIndex === movePairIndex * 2 + 1 ? 'bg-farzin-accent text-white font-bold shadow-sm' : 'text-zinc-400 hover:bg-[#262421]'}`}
                                >
                                    {pair[1].san}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                
                {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-zinc-600">
                        <ShieldAlert size={24} className="mb-2 opacity-50" />
                        <span className="text-xs">هیچ حرکتی ثبت نشده است</span>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}