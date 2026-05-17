import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, Zap, Heart, Timer, Trophy, RefreshCw, X, RotateCcw,
    Flame, Skull, Clock, HeartCrack, ChevronLeft, Target, Check
} from 'lucide-react';
import { puzzleService } from '../api/puzzleService';
// 🔥 ایمپورت هوک تم
import { useChessTheme } from '../hooks/useChessTheme';

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

const toPersianDigits = (num: number | string) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

const GAME_FONT = "'Lalezar', system-ui, sans-serif";

export default function PuzzleRush() {
    const navigate = useNavigate();

    // 🔥 فراخوانی استایل‌های پویا از هوک تم
    const { lightSquareStyle, darkSquareStyle, customPieces } = useChessTheme();

    const [status, setStatus] = useState<'setup' | 'playing' | 'gameover'>('setup');
    const [timeMode, setTimeMode] = useState<number>(180); 
    const [endReason, setEndReason] = useState<'time' | 'lives' | null>(null);
    
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(180);
    const [currentDifficulty, setCurrentDifficulty] = useState(600);
    
    const [streak, setStreak] = useState(0);
    const [resultsHistory, setResultsHistory] = useState<('correct' | 'wrong')[]>([]);

    const [game, setGame] = useState(new Chess());
    const [puzzleMoves, setPuzzleMoves] = useState<string[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    const [isLoading, setIsLoading] = useState(false);
    
    const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, any>>({});
    const [wrongSquare, setWrongSquare] = useState<string | null>(null);
    const [correctSquare, setCorrectSquare] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    const startGame = (seconds: number) => {
        setTimeMode(seconds);
        setTimeLeft(seconds);
        setScore(0);
        setLives(3);
        setStreak(0);
        setResultsHistory([]);
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
                    [from]: { backgroundColor: 'rgba(255, 255, 0, 0.25)' },
                    [to]: { backgroundColor: 'rgba(255, 255, 0, 0.25)' }
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
        setStreak(0);
        setResultsHistory(prev => [...prev, 'wrong']);

        if (newLives <= 0) {
            setTimeout(() => endGame('lives'), 500); 
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
                setStreak(prev => prev + 1);
                setResultsHistory(prev => [...prev, 'correct']);

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
                        [from]: { backgroundColor: 'rgba(255, 255, 0, 0.25)' },
                        [to]: { backgroundColor: 'rgba(255, 255, 0, 0.25)' }
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
        return toPersianDigits(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    let customSquares = { ...lastMoveSquares };
    if (correctSquare) customSquares[correctSquare] = { backgroundColor: 'rgba(34, 197, 94, 0.6)' };
    if (wrongSquare) customSquares[wrongSquare] = { backgroundColor: 'rgba(239, 68, 68, 0.7)' };

    // ==========================================
    // رندر لابی (Setup)
    // ==========================================
    if (status === 'setup') {
        return (
            <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-10 relative overflow-hidden" dir="rtl">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Lalezar&display=swap');`}</style>
                
                <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

                <div className="w-full max-w-2xl px-5 py-5 flex items-center justify-between border-b border-white/5 bg-[#121110]/60 backdrop-blur-xl sticky top-0 z-50">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/puzzles')} className="p-2.5 bg-[#1e1c19] rounded-2xl text-zinc-400 hover:text-white transition-colors border border-white/5 shadow-md">
                        <ChevronRight size={22} />
                    </motion.button>
                    <div className="flex items-center gap-2">
                        <Zap size={22} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" fill="currentColor" />
                        <h1 className="text-white font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-zinc-400">رگبار سرعتی پازل</h1>
                    </div>
                    <div className="w-10"></div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="w-full max-w-md px-5 mt-10 flex flex-col items-center text-center relative z-10"
                >
                    <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-yellow-400 to-orange-500 p-[1px] mb-6 shadow-[0_15px_40px_rgba(234,179,8,0.25)]"
                    >
                        <div className="w-full h-full bg-[#161512] rounded-[31px] flex items-center justify-center">
                            <Zap size={44} className="text-yellow-400" fill="currentColor" />
                        </div>
                    </motion.div>
                    
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">رکورد خودت رو بشکن!</h2>
                    <p className="text-zinc-400 text-xs font-bold leading-relaxed mb-10 max-w-[85%]">
                        ثانیه‌ها دارن می‌گذرن! پازل‌ها رو مثل برق و باد حل کن، فقط ۳ تا شانس داری که اشتباه کنی! آماده‌ای؟
                    </p>

                    <div className="flex flex-col gap-4 w-full">
                        <button onClick={() => startGame(30)} className="w-full flex items-center justify-between bg-[#141312] border border-white/5 hover:border-red-500/40 p-4.5 rounded-[24px] group transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all shadow-inner">
                                    <Skull size={22} />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-black text-white text-lg group-hover:text-red-400 transition-colors">{toPersianDigits('30')} ثانیه جنون‌آمیز</span>
                                    <span className="text-[10px] text-zinc-500 font-black mt-0.5">سرعت فوق جتی (هاردکور)</span>
                                </div>
                            </div>
                            <ChevronLeft size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
                        </button>

                        <button onClick={() => startGame(60)} className="w-full flex items-center justify-between bg-[#141312] border border-white/5 hover:border-orange-500/40 p-4.5 rounded-[24px] group transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-inner">
                                    <Flame size={22} fill="currentColor" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-black text-white text-lg group-hover:text-orange-400 transition-colors">{toPersianDigits('1')} دقیقه طلایی</span>
                                    <span className="text-[10px] text-zinc-500 font-black mt-0.5">تمرکز بالا و ریتم سریع</span>
                                </div>
                            </div>
                            <ChevronLeft size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
                        </button>

                        <button onClick={() => startGame(180)} className="w-full flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-[#141312] border border-yellow-500/20 hover:border-yellow-400 p-5 rounded-[24px] group transition-all shadow-[0_5px_20px_rgba(234,179,8,0.1)]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 text-yellow-400 group-hover:bg-yellow-400 group-hover:text-[#161512] transition-all shadow-md">
                                    <Clock size={22} />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-black text-white text-lg group-hover:text-yellow-400 transition-colors">{toPersianDigits('3')} دقیقه استاندارد</span>
                                    <span className="text-[10px] text-yellow-400/70 font-black mt-0.5">فرمت اصلی و بین‌المللی چس‌کام</span>
                                </div>
                            </div>
                            <ChevronLeft size={18} className="text-yellow-500/50 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ==========================================
    // رندر گیم‌پلی با فونت‌های داینامیک
    // ==========================================
    return (
        <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-8" dir="rtl">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Lalezar&display=swap');`}</style>
            
            <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#0c0b0a]/90 backdrop-blur-md border-b border-white/5">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setStatus('setup')} className="p-2.5 bg-[#1e1c19] rounded-xl hover:text-white text-zinc-400 transition-colors border border-white/5">
                    <ChevronRight size={22} />
                </motion.button>
                
                <div className="flex flex-col items-center">
                    <span className="text-white font-black text-base flex items-center gap-1.5">
                        <Zap size={16} className="text-yellow-400" fill="currentColor" />
                        رگبار سرعتی پازل
                    </span>
                    <span className="text-[10px] text-zinc-500 font-black mt-0.5 flex items-center gap-1">
                        امتیاز پازل فعلی: <Target size={11} className="text-blue-400" /> <span className="text-blue-400 font-bold" dir="ltr">{toPersianDigits(currentDifficulty)}</span>
                    </span>
                </div>

                <div className="w-10"></div> 
            </div>

            <div className="w-full max-w-md mt-6 px-4 relative z-0">
                {isLoading && status === 'playing' && (
                    <div className="absolute inset-0 z-20 bg-[#0c0b0a]/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <RefreshCw className="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" size={36} />
                        </motion.div>
                    </div>
                )}
                
                <div dir="ltr" className={`rounded-xl relative flex shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-[3px] transition-all duration-300 ${wrongSquare ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-[0.98]' : 'border-white/5'}`}>
                    <Chessboard 
                        id="PuzzleRushBoard" 
                        position={game.fen()} 
                        onPieceDrop={onDrop}
                        boardOrientation={playerColor}
                        // 🔥 اعمال استایل‌های داینامیک
                        customDarkSquareStyle={darkSquareStyle} 
                        customLightSquareStyle={lightSquareStyle}
                        customPieces={customPieces}
                        // -----------------------------
                        customSquareStyles={customSquares}
                        animationDuration={140} 
                        autoPromoteToQueen={true}
                    />
                </div>
            </div>

            {/* فضای میانی: استریک و کامبو */}
            <div className="w-full max-w-md px-4 flex-1 flex flex-col items-center justify-center min-h-[95px] py-2 relative">
                <AnimatePresence mode="wait">
                    {streak >= 3 ? (
                        <motion.div
                            key="combo"
                            initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
                            animate={{ scale: [1.3, 1], opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            className="flex flex-col items-center"
                        >
                            <div style={{ fontFamily: GAME_FONT, paddingTop: '6px' }} className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent text-3xl tracking-wide flex items-center gap-2 drop-shadow-[0_4px_20px_rgba(249,115,22,0.4)]">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="text-orange-500">
                                    <Flame size={28} fill="currentColor" />
                                </motion.div>
                                {toPersianDigits(streak)} تایی متوالی! 🔥
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="normal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            className="text-zinc-500 text-[11px] font-black tracking-widest uppercase"
                        >
                            ⚡ تمرکزت رو نذار از بین بره ⚡
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2 mt-4 flex-wrap justify-center max-w-[85%]" dir="ltr">
                    <AnimatePresence>
                        {resultsHistory.slice(-10).map((res, i) => (
                            <motion.div
                                initial={{ scale: 0, width: 0 }}
                                animate={{ scale: 1, width: '20px' }}
                                key={`${i}-${res}`}
                                className={`h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${res === 'correct' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}`}
                            >
                                {res === 'correct' ? <Check size={11} strokeWidth={4} /> : <X size={11} strokeWidth={4} />}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* داشبورد پایینی HUD */}
            <div className="w-full max-w-md px-4 flex flex-col gap-3">
                <div className="w-full bg-[#141312]/70 border border-white/5 rounded-[28px] p-5 shadow-[0_15px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex justify-between items-center backdrop-blur-xl">
                    
                    <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-[60px] opacity-20 pointer-events-none transition-colors duration-500 ${timeLeft <= 20 ? 'bg-red-500' : 'bg-blue-400'}`}></div>
                    <div className={`absolute bottom-0 left-0 w-28 h-28 rounded-full blur-[60px] opacity-20 pointer-events-none transition-colors duration-500 ${lives === 1 ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`}></div>

                    <div className="flex flex-col items-center z-10 w-20">
                        <span className="text-[10px] text-zinc-500 font-black tracking-wider uppercase mb-1 flex items-center gap-1">
                            زمان باقی‌مانده
                        </span>
                        <span 
                            style={{ fontFamily: GAME_FONT, paddingTop: '4px' }} 
                            className={`text-3xl tracking-widest ${timeLeft <= 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]' : timeLeft <= 30 ? 'text-orange-400' : 'text-zinc-200'}`} 
                            dir="ltr"
                        >
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <motion.div 
                        key={score}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 12 }}
                        className="flex flex-col items-center z-10 w-24 border-x border-white/5 px-2"
                    >
                        <span className="text-[10px] text-yellow-400 font-black tracking-wider uppercase flex items-center gap-1">
                            امتیاز پازل
                        </span>
                        <span 
                            style={{ fontFamily: GAME_FONT, paddingTop: '8px' }} 
                            className="text-6xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] leading-none"
                        >
                            {toPersianDigits(score)}
                        </span>
                    </motion.div>

                    <div className="flex flex-col items-center z-10 w-20">
                        <span className="text-[10px] text-zinc-500 font-black tracking-wider uppercase mb-2">
                            فرصت‌های خطا
                        </span>
                        <div className="flex items-center gap-1.5" dir="ltr">
                            {[1, 2, 3].map((life) => (
                                <motion.div 
                                    key={life}
                                    animate={lives < life ? { scale: 0, opacity: 0, rotate: -90 } : (lives === 1 && life === 1) ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                                    transition={(lives === 1 && life === 1) ? { repeat: Infinity, duration: 0.6 } : { type: "spring" }}
                                >
                                    <Heart size={15} className={lives >= life ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" : "text-zinc-800"} fill={lives >= life ? "currentColor" : "none"} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-full h-1 bg-[#1a1918] rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                        className={`h-full ${timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 30 ? 'bg-orange-500' : 'bg-gradient-to-l from-blue-500 to-sky-400'}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / timeMode) * 100}%` }}
                        transition={{ ease: "linear", duration: 1 }}
                    />
                </div>

                <motion.button 
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => endGame('lives')}
                    className="mt-1 py-3 w-full bg-[#141312] text-zinc-500 hover:text-red-400 border border-white/5 rounded-[18px] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                    <X size={14} />
                    ثبت رکورد فعلی و خروج
                </motion.button>
            </div>

            {/* مودال پایان بازی */}
            <AnimatePresence>
                {status === 'gameover' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
                        dir="rtl"
                    >
                        <motion.div 
                            initial={{ scale: 0.85, y: 30 }} 
                            animate={{ scale: 1, y: 0 }} 
                            transition={{ type: "spring", damping: 20 }}
                            className="bg-[#141312] w-full max-w-sm rounded-[32px] border border-white/5 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] flex flex-col"
                        >
                            <div className={`p-8 flex flex-col items-center justify-center border-b border-white/5 relative bg-gradient-to-br ${endReason === 'time' ? 'from-blue-500/15' : 'from-red-500/15'} to-transparent`}>
                                {endReason === 'time' ? (
                                    <Clock size={60} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] mb-4" />
                                ) : (
                                    <HeartCrack size={60} className="text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] mb-4" />
                                )}
                                
                                <h2 className="text-2xl font-black text-white tracking-tight">
                                    {endReason === 'time' ? 'زمان به آخر رسید! ⏱️' : 'فرصت‌هات سوخت! 💔'}
                                </h2>
                                <p className="text-zinc-500 text-xs font-bold mt-1.5">
                                    تلاش شما در چالش سرعتی <b className="text-zinc-300 mx-0.5">{timeMode / 60 >= 1 ? `${toPersianDigits(timeMode / 60)} دقیقه‌ای` : `${toPersianDigits(timeMode)} ثانیه‌ای`}</b>
                                </p>
                            </div>
                            
                            <div className="p-7 flex flex-col gap-5 items-center">
                                <div className="flex flex-col items-center w-full bg-[#0c0b0a] rounded-2xl py-5 border border-white/5 shadow-inner">
                                    <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-1">پازل‌های حل شده</span>
                                    <span 
                                        style={{ fontFamily: GAME_FONT, paddingTop: '10px' }} 
                                        className="text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 drop-shadow-md leading-none"
                                    >
                                        {toPersianDigits(score)}
                                    </span>
                                </div>

                                <div className="w-full flex gap-3 mt-1">
                                    <motion.button 
                                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => startGame(timeMode)} 
                                        className="flex-1 py-4 bg-white text-[#0c0b0a] font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_5px_20px_rgba(255,255,255,0.15)] text-sm"
                                    >
                                        <RotateCcw size={16} strokeWidth={3} />
                                        رکوردشکنی دوباره
                                    </motion.button>
                                    <motion.button 
                                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => setStatus('setup')} 
                                        className="flex-1 py-4 bg-[#1e1c19] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border border-white/5 text-sm"
                                    >
                                        <X size={16} />
                                        انتخاب زمان
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}