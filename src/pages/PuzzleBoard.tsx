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

// --- صداهای بازی ---
const sounds = {
    move: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3'),
    capture: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3'),
    check: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3'),
    gameOver: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3'),
    error: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/illegal.mp3'),
};

const playSound = (type: keyof typeof sounds) => {
    const audio = sounds[type];
    audio.currentTime = 0;
    audio.play().catch(e => console.log('Audio blocked:', e));
};

// --- آیکون‌های SVG برای تیک و ضربدر روی صفحه ---
const checkIcon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' style='filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.6));'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E")`;
const crossIcon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' style='filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.6));'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E")`;

export default function PuzzleBoard() {
    const { mode } = useParams();
    const navigate = useNavigate();

    const [game, setGame] = useState(new Chess());
    const [puzzleData, setPuzzleData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [puzzleMoves, setPuzzleMoves] = useState<string[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [status, setStatus] = useState<'playing' | 'solved' | 'wrong'>('playing');
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    
    // استایل‌های صفحه
    const [clickedSquare, setClickedSquare] = useState<string | null>(null);
    const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
    const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, any>>({});
    const [feedbackIcon, setFeedbackIcon] = useState<{square: string, source: string, type: 'correct'|'wrong'} | null>(null);
    
    const [history, setHistory] = useState<{fen: string, lastMove: any}[]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);

    useEffect(() => {
        loadNewPuzzle();
    }, [mode]);

    const loadNewPuzzle = async () => {
        setIsLoading(true);
        setStatus('playing');
        setCurrentMoveIndex(0);
        setHistory([]);
        setHistoryIndex(0);
        setClickedSquare(null);
        setOptionSquares({});
        setLastMoveSquares({});
        setFeedbackIcon(null);
        
        try {
            let data;
            if (mode === 'daily') data = await puzzleService.getDailyPuzzle();
            else if (mode === 'rated') data = await puzzleService.getRatedPuzzle(1200);
            else if (mode?.startsWith('theme_')) data = await puzzleService.getThemePuzzle(mode.split('_')[1]);
            else data = await puzzleService.getDailyPuzzle();

            setPuzzleData(data);
            
            // قدم ۱: ساخت بازی با FEN اولیه
            const newGame = new Chess(data.fen);
            const moves = data.moves.split(' ');
            setPuzzleMoves(moves);

            // 🧠 تعیین رنگ بازیکن قبل از رندر شدن صفحه برای جلوگیری از پرش
            const pColor = newGame.turn() === 'w' ? 'black' : 'white';
            setPlayerColor(pColor);
            setGame(newGame);
            setHistory([{ fen: newGame.fen(), lastMove: null }]);

            // پایان لودینگ تا صفحه با حالت اولیه رسم بشه
            setIsLoading(false);

            // قدم ۲: حرکت حریف بعد از یک مکث طبیعی
            setTimeout(() => {
                const firstMove = moves[0];
                const from = firstMove.substring(0, 2);
                const to = firstMove.substring(2, 4);
                
                const result = newGame.move({ from, to, promotion: 'q' });
                if(result.captured) playSound('capture');
                else if(newGame.isCheck()) playSound('check');
                else playSound('move');

                setGame(new Chess(newGame.fen()));
                setLastMoveSquares({
                    [from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                    [to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
                });
                setCurrentMoveIndex(1);
                
                setHistory(prev => [...prev, { fen: newGame.fen(), lastMove: {from, to} }]);
                setHistoryIndex(1);
            }, 700);

        } catch (error) {
            console.error("Error loading puzzle:", error);
            setIsLoading(false);
        }
    };

    const highlightLegalMoves = (sourceSquare: string) => {
        const moves = game.moves({ square: sourceSquare as any, verbose: true });
        if (moves.length === 0) return;

        const newSquares: any = {};
        moves.forEach((m: any) => {
            const isCapture = game.get(m.to as any) && game.get(m.to as any).color !== game.get(sourceSquare as any)?.color;
            newSquares[m.to] = {
                backgroundImage: isCapture
                    ? 'radial-gradient(circle, transparent 0%, transparent 65%, rgba(0,0,0,0.2) 67%, rgba(0,0,0,0.2) 100%)' 
                    : 'radial-gradient(circle, rgba(0,0,0,.2) 22%, transparent 23%)',
            };
        });
        newSquares[sourceSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        setOptionSquares(newSquares);
    };

    const attemptMove = (sourceSquare: string, targetSquare: string, promotion = 'q') => {
        if (status !== 'playing' || historyIndex < history.length - 1) return false;

        const expectedMove = puzzleMoves[currentMoveIndex];
        let userMoveStr = sourceSquare + targetSquare;
        
        const piece = game.get(sourceSquare as any);
        if (piece && piece.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')) {
            userMoveStr += promotion;
        }

        if (userMoveStr === expectedMove) {
            // ✅ حرکت درست
            const newGame = new Chess(game.fen());
            const result = newGame.move({ from: sourceSquare, to: targetSquare, promotion });
            
            if(result.captured) playSound('capture');
            else if(newGame.isCheck()) playSound('check');
            else playSound('move');

            setGame(newGame);
            
            // نمایش تیک سبز
            setFeedbackIcon({ square: targetSquare, source: sourceSquare, type: 'correct' });
            setLastMoveSquares({});
            setClickedSquare(null);
            setOptionSquares({});
            
            const newHistory = [...history, { fen: newGame.fen(), lastMove: {from: sourceSquare, to: targetSquare} }];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);

            if (currentMoveIndex === puzzleMoves.length - 1) {
                setTimeout(() => {
                    setStatus('solved');
                    playSound('gameOver');
                }, 500);
            } else {
                setTimeout(() => {
                    const compMove = puzzleMoves[currentMoveIndex + 1];
                    const from = compMove.substring(0, 2);
                    const to = compMove.substring(2, 4);
                    
                    const nextGame = new Chess(newGame.fen());
                    const compResult = nextGame.move({ from, to, promotion: 'q' });
                    
                    if(compResult.captured) playSound('capture');
                    else if(nextGame.isCheck()) playSound('check');
                    else playSound('move');

                    setGame(nextGame);
                    setFeedbackIcon(null); // پاک کردن تیک
                    setLastMoveSquares({
                        [from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                        [to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
                    });
                    setCurrentMoveIndex(currentMoveIndex + 2);
                    
                    setHistory(prev => [...prev, { fen: nextGame.fen(), lastMove: {from, to} }]);
                    setHistoryIndex(newHistory.length);
                }, 700);
            }
            return true;
        } else {
            // ❌ حرکت اشتباه
            try {
                const testGame = new Chess(game.fen());
                const isValid = testGame.move({ from: sourceSquare, to: targetSquare, promotion });
                
                if (isValid) {
                    setStatus('wrong');
                    playSound('error');
                    // نمایش ضربدر قرمز (بدون ثبت حرکت روی صفحه)
                    setFeedbackIcon({ square: targetSquare, source: sourceSquare, type: 'wrong' });
                    setOptionSquares({});
                    setClickedSquare(null);
                }
            } catch (e) {}
            return false;
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        setFeedbackIcon(null);
        return attemptMove(sourceSquare, targetSquare);
    };

    const handleSquareClick = (square: string) => {
        setFeedbackIcon(null); // با هر کلیک جدید، فیدبک قبلی پاک میشه
        
        if (status !== 'playing' || historyIndex < history.length - 1) return;

        if (clickedSquare) {
            if (clickedSquare === square) {
                setClickedSquare(null);
                setOptionSquares({});
                return;
            }
            const moves = game.moves({ square: clickedSquare as any, verbose: true });
            const move = moves.find(m => m.to === square);

            if (move) {
                attemptMove(clickedSquare, square);
                return;
            }
        }

        const piece = game.get(square as any);
        if (piece && piece.color === game.turn()) {
            setClickedSquare(square);
            highlightLegalMoves(square);
        } else {
            setClickedSquare(null);
            setOptionSquares({});
        }
    };

    const handleRetry = () => {
        setStatus('playing');
        setFeedbackIcon(null);
        if (history[historyIndex].lastMove) {
            setLastMoveSquares({
                [history[historyIndex].lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                [history[historyIndex].lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
            });
        }
    };

    const goBack = () => {
        if (historyIndex > 0) {
            setFeedbackIcon(null);
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setGame(new Chess(history[newIndex].fen));
            if(history[newIndex].lastMove) {
                setLastMoveSquares({
                    [history[newIndex].lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                    [history[newIndex].lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
                });
            } else setLastMoveSquares({});
            setOptionSquares({});
            setClickedSquare(null);
        }
    };

    const goForward = () => {
        if (historyIndex < history.length - 1) {
            setFeedbackIcon(null);
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setGame(new Chess(history[newIndex].fen));
            if(history[newIndex].lastMove) {
                setLastMoveSquares({
                    [history[newIndex].lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                    [history[newIndex].lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
                });
            }
            setOptionSquares({});
            setClickedSquare(null);
        }
    };

    // --- ساخت استایل‌های ترکیبی برای رندر صفحه ---
    let finalCustomSquares = { ...lastMoveSquares, ...optionSquares };
    if (feedbackIcon) {
        finalCustomSquares[feedbackIcon.square] = {
            ...finalCustomSquares[feedbackIcon.square],
            backgroundImage: feedbackIcon.type === 'correct' ? checkIcon : crossIcon,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '60%',
            backgroundColor: feedbackIcon.type === 'correct' ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)',
        };
        if (feedbackIcon.type === 'wrong') {
            finalCustomSquares[feedbackIcon.source] = { backgroundColor: 'rgba(239, 68, 68, 0.5)' };
        }
    }

    return (
        <div className="min-h-[100dvh] bg-[#161512] text-zinc-200 flex flex-col items-center" dir="rtl">
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
                <button onClick={loadNewPuzzle} className="p-2 bg-[#262421] rounded-xl text-zinc-400 hover:text-farzin-accent transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

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
                            onSquareClick={handleSquareClick}
                            boardOrientation={playerColor}
                            customDarkSquareStyle={{ backgroundColor: '#779556' }}
                            customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                            customSquareStyles={finalCustomSquares}
                            animationDuration={300}
                            autoPromoteToQueen={true}
                        />
                    </div>
                )}
            </div>

            <div className="w-full max-w-md mt-6 px-4">
                <div className="flex items-center justify-between bg-[#1e1c19] border border-[#35332e] rounded-2xl p-2">
                    <button onClick={goBack} disabled={historyIndex === 0} className="p-3 rounded-xl hover:bg-[#262421] disabled:opacity-30 transition-all">
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
                    <button onClick={goForward} disabled={historyIndex === history.length - 1} className="p-3 rounded-xl hover:bg-[#262421] disabled:opacity-30 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {status === 'wrong' && (
                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[400px] bg-[#1e1c19] border border-red-500/30 shadow-[0_20px_50px_rgba(239,68,68,0.15)] rounded-2xl p-5 z-50 flex flex-col gap-4">
                        <div className="flex items-center gap-4 text-red-400">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0"><ShieldAlert size={24} /></div>
                            <div className="flex flex-col">
                                <span className="font-black text-lg text-white">حرکت اشتباه!</span>
                                <span className="text-xs">این بهترین جواب برای این پوزیشن نیست.</span>
                            </div>
                        </div>
                        <button onClick={handleRetry} className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                            <RotateCcw size={18} /> سعی مجدد
                        </button>
                    </motion.div>
                )}

                {status === 'solved' && (
                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[400px] bg-[#1e1c19] border border-emerald-500/30 shadow-[0_20px_50px_rgba(34,197,94,0.15)] rounded-2xl p-5 z-50 flex flex-col gap-4">
                        <div className="flex items-center gap-4 text-emerald-400">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0"><CheckCircle2 size={24} /></div>
                            <div className="flex flex-col">
                                <span className="font-black text-lg text-white">آفرین! پازل حل شد</span>
                                <span className="text-xs">+12 امتیاز ریتینگ (به زودی)</span>
                            </div>
                        </div>
                        <button onClick={loadNewPuzzle} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#161512] rounded-xl font-black flex items-center justify-center gap-2 transition-colors shadow-lg">
                            <ArrowRight size={18} /> پازل بعدی
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}