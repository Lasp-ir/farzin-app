import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, Zap, Heart, Timer, Trophy, RefreshCw, X, RotateCcw,
    Flame, Skull, Clock, HeartCrack, ChevronLeft, Target
} from 'lucide-react';
import { puzzleService } from '../api/puzzleService';

const sounds = {
    move: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3'),
    capture: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3'),
    check: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3'),
    gameOver: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3'),
    error: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/illegal.mp3'),
    success: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/promote.mp3'),
};

const playSound = (type: keyof typeof sounds) => {
    const audio = sounds[type];
    audio.currentTime = 0;
    audio.play().catch(e => console.log('Audio blocked:', e));
};

export default function PuzzleRush() {
    const navigate = useNavigate();

    // --- استیت‌های اصلی ---
    const [status, setStatus] = useState<'setup' | 'playing' | 'gameover'>('setup');
    const [timeMode, setTimeMode] = useState<number>(180); 
    const [endReason, setEndReason] = useState<'time' | 'lives' | null>(null);
    
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(180);
    const [currentDifficulty, setCurrentDifficulty] = useState(600);
    
    // --- استیت‌های شطرنج ---
    const [game, setGame] = useState(new Chess());
    const [puzzleMoves, setPuzzleMoves] = useState<string[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    const [isLoading, setIsLoading] = useState(false);
    
    // --- استیت‌های UI ---
    const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, any>>({});
    const [wrongSquare, setWrongSquare] = useState<string | null>(null);
    const [correctSquare, setCorrectSquare] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // مدیریت تایمر
    useEffect(() => {
        if (status === 'playing' && !isLoading && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft <= 0 && status === 'playing') {
            endGame('time');
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [status, isLoading, timeLeft]);

    // شروع بازی
    const startGame = (seconds: number) => {
        setTimeMode(seconds);
        setTimeLeft(seconds);
        setScore(0);
        setLives(3);
        setCurrentDifficulty(600);
        setEndReason(null);
        setStatus('playing');
        loadNextPuzzle(600);
    };

    const loadNextPuzzle = async (difficulty: number) => {
        setIsLoading(true);
        setWrongSquare(null);
        setCorrectSquare(null);
        setCurrentMoveIndex(0);
        
        try {
            const data = await puzzleService.getRatedPuzzle(difficulty);
            const newGame = new Chess(data.fen);
            const moves = data.moves.split(' ');
            setPuzzleMoves(moves);
            const pColor = newGame.turn() === 'w' ? 'black' : 'white';
            setPlayerColor(pColor);
            setGame(newGame);

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
                setIsLoading(false);
            }, 300);

        } catch (error) {
            console.error("Error loading puzzle:", error);
            setTimeout(() => loadNextPuzzle(difficulty), 1000);
        }
    };

    const endGame = (reason: 'time' | 'lives') => {
        setEndReason(reason);
        setStatus('gameover');
        playSound('gameOver');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleWrongMove = () => {
        playSound('error');
        const newLives = lives - 1;
        setLives(newLives);
        
        if (newLives <= 0) {
            setTimeout(() => endGame('lives'), 500); // تاخیر کوتاه برای دیدن آخرین اشتباه
        } else {
            setTimeout(() => loadNextPuzzle(currentDifficulty), 600);
        }
    };

    const attemptMove = (sourceSquare: string, targetSquare: string, promotion = 'q') => {
        if (status !== 'playing' || isLoading) return false;

        const expectedMove = puzzleMoves[currentMoveIndex];
        let userMoveStr = sourceSquare + targetSquare;
        
        const piece = game.get(sourceSquare as any);
        if (piece && piece.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')) {
            userMoveStr += promotion;
        }

        if (userMoveStr === expectedMove) {
            const newGame = new Chess(game.fen());
            const result = newGame.move({ from: sourceSquare, to: targetSquare, promotion });
            
            if(result.captured) playSound('capture');
            else if(newGame.isCheck()) playSound('check');
            else playSound('move');

            setGame(newGame);
            setCorrectSquare(targetSquare);
            setLastMoveSquares({});

            if (currentMoveIndex === puzzleMoves.length - 1) {
                playSound('success');
                const newScore = score + 1;
                setScore(newScore);
                const newDifficulty = currentDifficulty + (newScore % 3 === 0 ? 50 : 0);
                setCurrentDifficulty(newDifficulty);
                setTimeout(() => loadNextPuzzle(newDifficulty), 400);
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
                    setCorrectSquare(null); 
                    setLastMoveSquares({
                        [from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                        [to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
                    });
                    setCurrentMoveIndex(currentMoveIndex + 2);
                }, 300);
            }
            return true;
        } else {
            try {
                const testGame = new Chess(game.fen());
                const isValid = testGame.move({ from: sourceSquare, to: targetSquare, promotion });
                if (isValid) {
                    setWrongSquare(targetSquare);
                    setGame(testGame);
                    handleWrongMove();
                }
            } catch (e) {}
            return false;
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => attemptMove(sourceSquare, targetSquare);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let customSquares = { ...lastMoveSquares };
    if (correctSquare) customSquares[correctSquare] = { backgroundColor: 'rgba(34, 197, 94, 0.7)' };
    if (wrongSquare) customSquares[wrongSquare] = { backgroundColor: 'rgba(239, 68, 68, 0.8)' };

    // ==========================================
    // رندر صفحه انتخاب زمان (Lobby)
    // ==========================================
    if (status === 'setup') {
        return (
            <div className="min-h-[100dvh] bg-[#161512] text-zinc-200 flex flex-col items-center pb-10" dir="rtl">
                <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between border-b border-[#35332e] bg-[#161512]/80 backdrop-blur-md sticky top-0 z-10">
                    <button onClick={() => navigate('/puzzles')} className="p-2.5 bg-[#262421] rounded-xl hover:text-white text-zinc-400 transition-colors border border-[#35332e]">
                        <ChevronRight size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Zap size={20} className="text-yellow-500" fill="currentColor" />
                        <h1 className="text-white font-black text-lg">رگبار پازل</h1>
                    </div>
                    <div className="w-10"></div>
                </div>

                <div className="w-full max-w-md px-5 mt-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-500/20 to-orange-500/5 border border-yellow-500/30 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(234,179,8,0.15)] relative">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"></div>
                        <Zap size={40} className="text-yellow-500 relative z-10" fill="currentColor" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-2">انتخاب زمان</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                        هرچه سریع‌تر پازل‌ها را حل کنید. فقط ۳ فرصت برای اشتباه دارید!
                    </p>

                    <div className="flex flex-col gap-4 w-full">
                        <button onClick={() => startGame(30)} className="w-full flex items-center justify-between bg-[#1e1c19] border border-[#35332e] hover:border-red-500/50 p-4 rounded-2xl group transition-all active:scale-95">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 group-hover:scale-110 transition-transform">
                                    <Skull size={24} />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-black text-white text-lg">۳۰ ثانیه</span>
                                    <span className="text-[11px] text-zinc-500 font-bold">جنون‌آمیز و سرعتی</span>
                                </div>
                            </div>
                            <ChevronLeft size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                        </button>

                        <button onClick={() => startGame(60)} className="w-full flex items-center justify-between bg-[#1e1c19] border border-[#35332e] hover:border-orange-500/50 p-4 rounded-2xl group transition-all active:scale-95">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500 group-hover:scale-110 transition-transform">
                                    <Flame size={24} fill="currentColor" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-black text-white text-lg">۱ دقیقه</span>
                                    <span className="text-[11px] text-zinc-500 font-bold">متوسط و چالشی</span>
                                </div>
                            </div>
                            <ChevronLeft size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                        </button>

                        <button onClick={() => startGame(180)} className="w-full flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-[#1e1c19] border border-yellow-500/30 hover:border-yellow-400 p-4 rounded-2xl group transition-all active:scale-95 shadow-[0_5px_20px_rgba(234,179,8,0.1)]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 text-yellow-500 group-hover:scale-110 transition-transform">
                                    <Clock size={24} />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-black text-white text-lg">۳ دقیقه</span>
                                    <span className="text-[11px] text-yellow-500/80 font-bold">حالت کلاسیک جهانی</span>
                                </div>
                            </div>
                            <ChevronLeft size={20} className="text-yellow-500/50 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // رندر صفحه بازی اصلی (Playing & GameOver)
    // ==========================================
    return (
        <div className="min-h-[100dvh] bg-[#161512] text-zinc-200 flex flex-col items-center pb-8" dir="rtl">
            
            {/* --- هدر خلوت و تمرکزی --- */}
            <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#161512]/90 backdrop-blur-md border-b border-[#35332e]/50">
                <button onClick={() => setStatus('setup')} className="p-2 bg-[#262421] rounded-xl hover:text-white text-zinc-400 transition-colors border border-[#35332e]">
                    <ChevronRight size={24} />
                </button>
                
                <div className="flex flex-col items-center">
                    <span className="text-white font-black text-lg flex items-center gap-2">
                        <Zap size={18} className="text-yellow-500" fill="currentColor" />
                        رگبار پازل
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold tracking-widest mt-0.5 flex items-center gap-1">
                        سختی پازل: <Target size={10} className="text-blue-400" /> <span className="text-blue-400">{currentDifficulty}</span>
                    </span>
                </div>

                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* --- صفحه شطرنج در یک دیو LTR ایزوله --- */}
            <div className="w-full max-w-md mt-6 px-4 relative z-0">
                {isLoading && status === 'playing' && (
                    <div className="absolute inset-0 z-20 bg-[#161512]/60 backdrop-blur-sm flex items-center justify-center rounded-[4px] border-4 border-transparent">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <RefreshCw className="text-yellow-500" size={40} />
                        </motion.div>
                    </div>
                )}
                
                <div dir="ltr" className={`rounded-[4px] relative flex shadow-2xl border-4 transition-all duration-200 ${wrongSquare ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-[0.98]' : 'border-[#35332e]'}`}>
                    <Chessboard 
                        id="PuzzleRushBoard" 
                        position={game.fen()} 
                        onPieceDrop={onDrop}
                        boardOrientation={playerColor}
                        customDarkSquareStyle={{ backgroundColor: '#779556' }}
                        customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                        customSquareStyles={customSquares}
                        animationDuration={150} 
                        autoPromoteToQueen={true}
                    />
                </div>
            </div>

            {/* --- داشبورد پایینی (HUD) مدرن --- */}
            <div className="w-full max-w-md mt-6 px-4 flex flex-col gap-3 flex-1 justify-end">
                
                <div className="w-full bg-[#1e1c19] border border-[#35332e] rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden flex justify-between items-center">
                    {/* Glow Effects */}
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${timeLeft <= 30 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${lives === 1 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>

                    {/* تایمر (راست) */}
                    <div className="flex flex-col items-center z-10 w-20">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                            زمان <Timer size={12}/>
                        </span>
                        <span className={`font-mono text-2xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : timeLeft <= 30 ? 'text-orange-500' : 'text-zinc-200'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* امتیاز بزرگ (وسط) */}
                    <motion.div 
                        key={score}
                        initial={{ scale: 1.2, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center z-10 w-24 border-x border-[#35332e]/50 px-2"
                    >
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                            امتیاز <Trophy size={12} className="text-yellow-500"/>
                        </span>
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 drop-shadow-sm leading-none pt-1">
                            {score}
                        </span>
                    </motion.div>

                    {/* جان‌ها (چپ) */}
                    <div className="flex flex-col items-center z-10 w-20">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                            جان <HeartCrack size={12} className="text-red-500"/>
                        </span>
                        <div className="flex items-center gap-1" dir="ltr">
                            {[1, 2, 3].map((life) => (
                                <motion.div 
                                    key={life}
                                    animate={lives < life ? { scale: 0.5, opacity: 0.2 } : { scale: 1, opacity: 1 }}
                                >
                                    <Heart size={16} className={lives >= life ? "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" : "text-zinc-700"} fill={lives >= life ? "currentColor" : "none"} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-[#262421] rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                        className={`h-full ${timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 30 ? 'bg-orange-500' : 'bg-blue-500'}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / timeMode) * 100}%` }}
                        transition={{ ease: "linear", duration: 1 }}
                    />
                </div>

                {/* دکمه پایان زودهنگام */}
                <button 
                    onClick={() => endGame('lives')}
                    className="mt-1 py-3 w-full bg-[#1e1c19] hover:bg-red-500/10 text-zinc-500 hover:text-red-400 border border-[#35332e] hover:border-red-500/30 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                    <X size={16} />
                    پایان زودهنگام
                </button>
            </div>

            {/* --- مودال پایان بازی هوشمند --- */}
            <AnimatePresence>
                {status === 'gameover' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        dir="rtl"
                    >
                        <motion.div 
                            initial={{ scale: 0.8, y: 50 }} 
                            animate={{ scale: 1, y: 0 }} 
                            className="bg-[#1e1c19] w-full max-w-sm rounded-[32px] border border-[#35332e] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col"
                        >
                            <div className={`p-8 flex flex-col items-center justify-center border-b border-[#35332e] relative bg-gradient-to-br ${endReason === 'time' ? 'from-blue-500/20' : 'from-red-500/20'} to-transparent`}>
                                {endReason === 'time' ? (
                                    <Clock size={64} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] mb-4" />
                                ) : (
                                    <HeartCrack size={64} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] mb-4" />
                                )}
                                
                                <h2 className="text-3xl font-black text-white mb-1">
                                    {endReason === 'time' ? 'زمان تمام شد!' : 'جان‌هایت تمام شد!'}
                                </h2>
                                <p className="text-zinc-400 text-sm mt-1">
                                    حالت <b className="text-white mx-1">{timeMode / 60 >= 1 ? `${timeMode / 60} دقیقه` : `${timeMode} ثانیه`}</b>
                                </p>
                            </div>
                            
                            <div className="p-8 flex flex-col gap-6 items-center">
                                <div className="flex flex-col items-center w-full bg-[#161512] rounded-2xl py-6 border border-[#35332e] shadow-inner">
                                    <span className="text-[10px] tracking-widest text-zinc-500 font-bold uppercase mb-2">تعداد حل شده</span>
                                    <span className="text-6xl font-black text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 drop-shadow-md">
                                        {score}
                                    </span>
                                </div>

                                <div className="w-full flex gap-3 mt-2">
                                    <button 
                                        onClick={() => startGame(timeMode)} 
                                        className="flex-1 py-4 bg-white hover:bg-zinc-200 text-[#161512] font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_5px_20px_rgba(255,255,255,0.2)] active:scale-95"
                                    >
                                        <RotateCcw size={20} />
                                        دوباره
                                    </button>
                                    <button 
                                        onClick={() => setStatus('setup')} 
                                        className="flex-1 py-4 bg-[#262421] hover:bg-[#35332e] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-[#35332e] active:scale-95"
                                    >
                                        <X size={20} />
                                        لابی
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}