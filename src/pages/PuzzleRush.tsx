import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, Zap, Heart, Timer, Trophy, RefreshCw, X, RotateCcw
} from 'lucide-react';
import { puzzleService } from '../api/puzzleService';

const sounds = {
    move: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3'),
    capture: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3'),
    check: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3'),
    gameOver: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3'),
    error: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/illegal.mp3'),
    success: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/promote.mp3'), // صدای جذاب برای حل درست
};

const playSound = (type: keyof typeof sounds) => {
    const audio = sounds[type];
    audio.currentTime = 0;
    audio.play().catch(e => console.log('Audio blocked:', e));
};

export default function PuzzleRush() {
    const navigate = useNavigate();

    // --- استیت‌های اصلی بازی سرعتی ---
    const [status, setStatus] = useState<'starting' | 'playing' | 'gameover'>('starting');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
    const [currentDifficulty, setCurrentDifficulty] = useState(600); // شروع از پازل‌های ساده
    
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

    // مدیریت تایمر
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // تایمر فقط وقتی در حال بازی هستیم و پازل در حال لود نیست کم میشه
        if (status === 'playing' && !isLoading && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft <= 0 && status === 'playing') {
            endGame();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status, isLoading, timeLeft]);

    // شروع اولین پازل
    useEffect(() => {
        if (status === 'starting') {
            loadNextPuzzle(600);
            setStatus('playing');
        }
    }, [status]);

    const loadNextPuzzle = async (difficulty: number) => {
        setIsLoading(true);
        setWrongSquare(null);
        setCorrectSquare(null);
        setCurrentMoveIndex(0);
        
        try {
            // دریافت پازل بر اساس درجه سختی فعلی
            const data = await puzzleService.getRatedPuzzle(difficulty);
            
            const newGame = new Chess(data.fen);
            const moves = data.moves.split(' ');
            setPuzzleMoves(moves);

            const pColor = newGame.turn() === 'w' ? 'black' : 'white';
            setPlayerColor(pColor);
            setGame(newGame);

            // حرکت اول حریف با تاخیر خیلی کم (چون سرعتیه)
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
            }, 300); // فقط ۳۰۰ میلی‌ثانیه تاخیر برای سرعت بیشتر

        } catch (error) {
            console.error("Error loading puzzle:", error);
            // اگه ارور داد دوباره همون سختی رو لود کن
            setTimeout(() => loadNextPuzzle(difficulty), 1000);
        }
    };

    const endGame = () => {
        setStatus('gameover');
        playSound('gameOver');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleWrongMove = () => {
        playSound('error');
        const newLives = lives - 1;
        setLives(newLives);
        
        if (newLives <= 0) {
            endGame();
        } else {
            // اگه هنوز جون داره، یه پازل هم‌سطح دیگه بیار
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
            // ✅ حرکت درست
            const newGame = new Chess(game.fen());
            const result = newGame.move({ from: sourceSquare, to: targetSquare, promotion });
            
            if(result.captured) playSound('capture');
            else if(newGame.isCheck()) playSound('check');
            else playSound('move');

            setGame(newGame);
            setCorrectSquare(targetSquare);
            setLastMoveSquares({});

            if (currentMoveIndex === puzzleMoves.length - 1) {
                // پازل کاملاً حل شد! 🎉
                playSound('success');
                const newScore = score + 1;
                setScore(newScore);
                
                // افزایش سختی به مرور زمان
                const newDifficulty = currentDifficulty + (newScore % 3 === 0 ? 50 : 0);
                setCurrentDifficulty(newDifficulty);

                // لود سریع پازل بعدی
                setTimeout(() => loadNextPuzzle(newDifficulty), 400);
            } else {
                // حرکت بعدی حریف (ربات)
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
            // ❌ حرکت اشتباه
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

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        return attemptMove(sourceSquare, targetSquare);
    };

    // فرمت کردن تایمر
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let customSquares = { ...lastMoveSquares };
    if (correctSquare) {
        customSquares[correctSquare] = { backgroundColor: 'rgba(34, 197, 94, 0.7)' };
    }
    if (wrongSquare) {
        customSquares[wrongSquare] = { backgroundColor: 'rgba(239, 68, 68, 0.8)' };
    }

    return (
        <div className="min-h-[100dvh] bg-[#161512] text-zinc-200 flex flex-col items-center pb-10" dir="rtl">
            
            {/* --- هدر اختصاصی رگبار پازل --- */}
            <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between bg-gradient-to-b from-[#1e1c19] to-transparent sticky top-0 z-10 border-b border-[#35332e]/50 backdrop-blur-md">
                <button onClick={() => navigate('/puzzles')} className="p-2.5 bg-[#262421] rounded-xl hover:text-white text-zinc-400 transition-colors border border-[#35332e]">
                    <ChevronRight size={20} />
                </button>
                
                {/* Score */}
                <motion.div 
                    key={score} // برای اجرای انیمیشن با هر تغییر امتیاز
                    initial={{ scale: 1.5, color: '#eab308' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    className="flex flex-col items-center"
                >
                    <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">امتیاز</span>
                    <span className="font-black text-3xl flex items-center gap-1 mt-[-4px]">
                        {score}
                    </span>
                </motion.div>

                {/* Hearts */}
                <div className="flex items-center gap-1 bg-[#262421] p-2 px-3 rounded-xl border border-[#35332e] shadow-inner" dir="ltr">
                    {[1, 2, 3].map((life) => (
                        <motion.div 
                            key={life}
                            animate={lives < life ? { scale: 0.5, opacity: 0.3 } : { scale: 1, opacity: 1 }}
                        >
                            <Heart size={18} className={lives >= life ? "text-red-500" : "text-zinc-600"} fill={lives >= life ? "currentColor" : "none"} />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* --- نوار تایمر --- */}
            <div className="w-full max-w-md px-4 mt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                    <div className={`flex items-center gap-2 font-mono font-black tracking-wider text-xl transition-colors ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>
                        <Timer size={20} className={timeLeft <= 30 ? 'text-red-500' : 'text-zinc-500'} />
                        {formatTime(timeLeft)}
                    </div>
                    <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">
                        <Zap size={14} fill="currentColor" />
                        <span className="text-xs font-black">رگبار پازل</span>
                    </div>
                </div>
                {/* Progress Bar Timer */}
                <div className="w-full h-1.5 bg-[#262421] rounded-full overflow-hidden">
                    <motion.div 
                        className={`h-full ${timeLeft <= 30 ? 'bg-red-500' : 'bg-blue-500'}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / 180) * 100}%` }}
                        transition={{ ease: "linear", duration: 1 }}
                    />
                </div>
            </div>

            {/* --- صفحه شطرنج --- */}
            <div className="w-full max-w-md mt-6 px-4 relative z-0">
                {isLoading && status === 'playing' && (
                    <div className="absolute inset-0 z-20 bg-[#161512]/50 backdrop-blur-sm flex items-center justify-center rounded-[4px]">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <RefreshCw className="text-yellow-500" size={36} />
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
                        animationDuration={150} // انیمیشن فوق سریع برای رگبار!
                        autoPromoteToQueen={true}
                    />
                </div>
            </div>

            {/* --- مودال پایان بازی (Game Over) --- */}
            <AnimatePresence>
                {status === 'gameover' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        dir="rtl"
                    >
                        <motion.div 
                            initial={{ scale: 0.8, y: 50 }} 
                            animate={{ scale: 1, y: 0 }} 
                            className="bg-[#1e1c19] w-full max-w-sm rounded-[32px] border border-[#35332e] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col"
                        >
                            <div className="bg-gradient-to-br from-yellow-500/20 to-transparent p-8 flex flex-col items-center justify-center border-b border-[#35332e] relative">
                                <Trophy size={64} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] mb-4" />
                                <h2 className="text-3xl font-black text-white mb-1">زمان تمام شد!</h2>
                                <p className="text-zinc-400 text-sm">رکورد شما در رگبار پازل</p>
                            </div>
                            
                            <div className="p-8 flex flex-col gap-6 items-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] tracking-widest text-zinc-500 font-bold uppercase mb-2">تعداد حل شده</span>
                                    <span className="text-6xl font-black text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                                        {score}
                                    </span>
                                </div>

                                <div className="w-full flex gap-3 mt-4">
                                    <button 
                                        onClick={() => window.location.reload()} // ریفرش ساده برای شروع مجدد
                                        className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 text-[#161512] font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_5px_20px_rgba(234,179,8,0.3)] active:scale-95"
                                    >
                                        <RotateCcw size={20} />
                                        دوباره
                                    </button>
                                    <button 
                                        onClick={() => navigate('/puzzles')} 
                                        className="flex-1 py-4 bg-[#262421] hover:bg-[#35332e] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-[#35332e] active:scale-95"
                                    >
                                        <X size={20} />
                                        خروج
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