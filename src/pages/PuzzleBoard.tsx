import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, RefreshCw, ArrowRight, ShieldAlert, 
    CheckCircle2, Target, RotateCcw, ArrowLeft, ArrowRight as ArrowRightIcon, Zap
} from 'lucide-react';
import { puzzleService } from '../api/puzzleService';

export default function PuzzleBoard() {
    const { mode } = useParams();
    const navigate = useNavigate();

    const [game, setGame] = useState(new Chess());
    const [puzzleData, setPuzzleData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // منطق پازل
    const [puzzleMoves, setPuzzleMoves] = useState<string[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [status, setStatus] = useState<'playing' | 'solved' | 'wrong'>('playing');
    
    // UI و تاریخچه
    const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
    const [history, setHistory] = useState<{fen: string, lastMove: any}[]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [customSquareStyles, setCustomSquareStyles] = useState({});

    useEffect(() => {
        loadNewPuzzle();
    }, [mode]);

    // آپدیت هایلایت‌ها بر اساس حرکت آخر
    useEffect(() => {
        const styles: any = {};
        if (lastMove) {
            styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
            styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        }
        setCustomSquareStyles(styles);
    }, [lastMove]);

    const loadNewPuzzle = async () => {
        setIsLoading(true);
        setStatus('playing');
        setCurrentMoveIndex(0);
        setLastMove(null);
        setHistory([]);
        setHistoryIndex(0);
        setCustomSquareStyles({});
        
        try {
            let data;
            if (mode === 'daily') data = await puzzleService.getDailyPuzzle();
            else if (mode === 'rated') data = await puzzleService.getRatedPuzzle(1200);
            else if (mode?.startsWith('theme_')) data = await puzzleService.getThemePuzzle(mode.split('_')[1]);
            else data = await puzzleService.getDailyPuzzle();

            setPuzzleData(data);
            
            const newGame = new Chess(data.fen);
            const moves = data.moves.split(' ');
            setPuzzleMoves(moves);

            // ذخیره وضعیت اولیه در تاریخچه
            const initialFen = newGame.fen();
            setHistory([{ fen: initialFen, lastMove: null }]);

            // حرکت ربات (حریف) با تاخیر برای نمایش انیمیشن
            setTimeout(() => {
                const firstMove = moves[0];
                const from = firstMove.substring(0, 2);
                const to = firstMove.substring(2, 4);
                
                newGame.move({ from, to, promotion: 'q' });
                setGame(new Chess(newGame.fen()));
                setLastMove({ from, to });
                setCurrentMoveIndex(1);
                
                // اضافه کردن حرکت حریف به تاریخچه
                setHistory(prev => [...prev, { fen: newGame.fen(), lastMove: {from, to} }]);
                setHistoryIndex(1);
            }, 800);

        } catch (error) {
            console.error("Error loading puzzle:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        // اگه بازی تموم شده یا تو حالت مرور تاریخچه هستیم، اجازه حرکت نمیدیم
        if (status !== 'playing' || historyIndex < history.length - 1) return false;

        const piece = game.get(sourceSquare);
        let userMoveStr = sourceSquare + targetSquare;
        if (piece && piece.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')) {
            userMoveStr += 'q';
        }

        const expectedMove = puzzleMoves[currentMoveIndex];

        if (userMoveStr === expectedMove) {
            // ✅ حرکت درست
            const newGame = new Chess(game.fen());
            newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
            
            setGame(newGame);
            setLastMove({ from: sourceSquare, to: targetSquare });
            
            const newHistory = [...history, { fen: newGame.fen(), lastMove: {from: sourceSquare, to: targetSquare} }];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);

            // سبز کردن موقت خونه
            setCustomSquareStyles({
                [sourceSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' },
                [targetSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' }
            });

            if (currentMoveIndex === puzzleMoves.length - 1) {
                setTimeout(() => setStatus('solved'), 500);
            } else {
                // حرکت بعدی حریف
                setTimeout(() => {
                    const compMove = puzzleMoves[currentMoveIndex + 1];
                    const from = compMove.substring(0, 2);
                    const to = compMove.substring(2, 4);
                    
                    const nextGame = new Chess(newGame.fen());
                    nextGame.move({ from, to, promotion: 'q' });
                    
                    setGame(nextGame);
                    setLastMove({ from, to });
                    setCurrentMoveIndex(currentMoveIndex + 2);
                    
                    setHistory(prev => [...prev, { fen: nextGame.fen(), lastMove: {from, to} }]);
                    setHistoryIndex(newHistory.length); // +1 because we added to previous
                }, 600);
            }
            return true;
        } else {
            // ❌ حرکت اشتباه
            try {
                // چک میکنیم آیا اصلا حرکت قانونی شطرنج هست یا نه
                const testGame = new Chess(game.fen());
                const isValid = testGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
                
                if (isValid) {
                    setStatus('wrong');
                    // قرمز کردن موقت خونه اشتباه
                    setCustomSquareStyles({
                        ...customSquareStyles,
                        [sourceSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.6)' },
                        [targetSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.6)' }
                    });
                }
            } catch (e) {}
            return false;
        }
    };

    const handleRetry = () => {
        setStatus('playing');
        // برگرداندن هایلایت به حرکت آخرِ ثبت شده در تاریخچه
        if (history[historyIndex].lastMove) {
            setLastMove(history[historyIndex].lastMove);
        } else {
            setCustomSquareStyles({});
        }
    };

    // --- نویگیشن تاریخچه ---
    const goBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setGame(new Chess(history[newIndex].fen));
            setLastMove(history[newIndex].lastMove);
        }
    };

    const goForward = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setGame(new Chess(history[newIndex].fen));
            setLastMove(history[newIndex].lastMove);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[#161512] text-zinc-200 flex flex-col items-center" dir="rtl">
            {/* Header */}
            <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between bg-[#1e1c19] border-b border-[#35332e] sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 bg-[#262421] rounded-xl hover:text-white text-zinc-400 transition-colors">
                    <ChevronRight size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-white font-black text-lg uppercase tracking-wider flex items-center gap-2">
                        <Target size={18} className="text-farzin-accent" />
                        {mode === 'daily' ? 'پازل روزانه' : mode === 'rated' ? 'تمرین امتیازی' : 'پازل موضوعی'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold tracking-widest mt-0.5">
                        RATING: <span className="text-amber-400">{puzzleData?.rating || '---'}</span>
                    </span>
                </div>
                <button onClick={loadNewPuzzle} className="p-2 bg-[#262421] rounded-xl text-zinc-400 hover:text-farzin-accent transition-colors" title="رد کردن پازل">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Board Area */}
            <div className="w-full max-w-md mt-6 px-4 relative z-0">
                {isLoading ? (
                    <div className="aspect-square w-full bg-[#1e1c19] rounded-xl flex items-center justify-center border border-[#35332e]">
                        <RefreshCw className="animate-spin text-farzin-accent" size={32} />
                    </div>
                ) : (
                    <div className={`rounded-[4px] overflow-hidden shadow-2xl border-4 transition-colors duration-300 ${status === 'wrong' ? 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : status === 'solved' ? 'border-emerald-500/80 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-[#35332e]'}`}>
                        <Chessboard 
                            id="FarzinPuzzleBoard" 
                            position={game.fen()} 
                            onPieceDrop={onDrop}
                            boardOrientation={game.turn() === 'w' ? 'black' : 'white'}
                            customDarkSquareStyle={{ backgroundColor: '#779656' }}
                            customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                            customSquareStyles={customSquareStyles}
                            animationDuration={300}
                        />
                    </div>
                )}
            </div>

            {/* Controls & Navigation */}
            <div className="w-full max-w-md mt-6 px-4">
                <div className="flex items-center justify-between bg-[#1e1c19] border border-[#35332e] rounded-2xl p-2">
                    <button 
                        onClick={goBack} 
                        disabled={historyIndex === 0}
                        className="p-3 rounded-xl hover:bg-[#262421] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ArrowRightIcon size={20} />
                    </button>
                    <div className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                        {status === 'playing' ? (
                            <><Zap size={14} className="text-yellow-500" /> نوبت شماست</>
                        ) : status === 'solved' ? (
                            <><CheckCircle2 size={14} className="text-emerald-500" /> حل شد</>
                        ) : (
                            <><ShieldAlert size={14} className="text-red-500" /> اشتباه</>
                        )}
                    </div>
                    <button 
                        onClick={goForward} 
                        disabled={historyIndex === history.length - 1}
                        className="p-3 rounded-xl hover:bg-[#262421] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>
            </div>

            {/* پاپ‌آپ‌های وضعیت (Framer Motion) */}
            <AnimatePresence>
                {status === 'wrong' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[400px] bg-[#1e1c19] border border-red-500/30 shadow-[0_20px_50px_rgba(239,68,68,0.15)] rounded-2xl p-5 z-50 flex flex-col gap-4"
                    >
                        <div className="flex items-center gap-4 text-red-400">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                                <ShieldAlert size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-lg text-white">حرکت اشتباه!</span>
                                <span className="text-xs">این بهترین جواب برای این پوزیشن نیست.</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleRetry}
                            className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <RotateCcw size={18} />
                            سعی مجدد
                        </button>
                    </motion.div>
                )}

                {status === 'solved' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[400px] bg-[#1e1c19] border border-emerald-500/30 shadow-[0_20px_50px_rgba(34,197,94,0.15)] rounded-2xl p-5 z-50 flex flex-col gap-4"
                    >
                        <div className="flex items-center gap-4 text-emerald-400">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-lg text-white">آفرین! پازل حل شد</span>
                                <span className="text-xs">+12 امتیاز ریتینگ (به زودی)</span>
                            </div>
                        </div>
                        <button 
                            onClick={loadNewPuzzle}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#161512] rounded-xl font-black flex items-center justify-center gap-2 transition-colors shadow-lg"
                        >
                            <ArrowRight size={18} />
                            پازل بعدی
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}