import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, Zap, Heart, Timer, Trophy, RefreshCw, X, RotateCcw,
    Flame, Skull, Clock, HeartCrack, ChevronLeft, Target, Check, BookOpen,
    Dumbbell, ChevronDown, ChevronUp, Play
} from 'lucide-react';
import { puzzleService } from '../api/puzzleService';
import { useChessTheme } from '../hooks/useChessTheme';

interface PuzzleLogEntry {
  index: number;
  initialFen: string;
  boardFen: string;
  correctMoves: string[];
  userMoves: string[];
  result: 'correct' | 'wrong';
}

const sounds = {
    move: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3'),
    capture: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3'),
    check: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3'),
    gameOver: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3'),
    error: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/illegal.mp3'),
    success: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/promote.mp3'),
};

const playSound = (type: keyof typeof sounds) => {
    const a = sounds[type]; a.currentTime = 0; a.play().catch(() => {});
};

const toPersianDigits = (num: number | string) => {
    const p = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return num.toString().replace(/\d/g, x => p[+x]);
};

const GAME_FONT = "'Lalezar', system-ui, sans-serif";
const PRACTICE_TIMES = [60, 120, 180, 240, 300];

export default function PuzzleRush() {
    const navigate = useNavigate();
    const { lightSquareStyle, darkSquareStyle, customPieces } = useChessTheme();

    const [setupTab, setSetupTab] = useState<'competitive' | 'practice'>('competitive');
    const [practiceTime, setPracticeTime] = useState(120);

    const [status, setStatus] = useState<'setup' | 'playing' | 'gameover'>('setup');
    const [rushMode, setRushMode] = useState<'competitive' | 'practice'>('competitive');
    const [timeMode, setTimeMode] = useState<number>(180);
    const [endReason, setEndReason] = useState<'time' | 'lives' | null>(null);

    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(180);
    const [currentDifficulty, setCurrentDifficulty] = useState(600);
    const [streak, setStreak] = useState(0);
    const [resultsHistory, setResultsHistory] = useState<('correct' | 'wrong')[]>([]);

    // Puzzle log for review
    const [puzzleLog, setPuzzleLog] = useState<PuzzleLogEntry[]>([]);
    const currentPuzzleRef = useRef<{ initialFen: string; boardFen: string; correctMoves: string[] }>({ initialFen: '', boardFen: '', correctMoves: [] });
    const currentUserMovesRef = useRef<string[]>([]);

    const [game, setGame] = useState(new Chess());
    const [puzzleMoves, setPuzzleMoves] = useState<string[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    const [isLoading, setIsLoading] = useState(false);

    const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, any>>({});
    const [wrongSquare, setWrongSquare] = useState<string | null>(null);
    const [correctSquare, setCorrectSquare] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const puzzleLogRef = useRef<PuzzleLogEntry[]>([]);

    // Keep ref in sync with state
    useEffect(() => { puzzleLogRef.current = puzzleLog; }, [puzzleLog]);

    useEffect(() => {
        if (status === 'playing' && !isLoading && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft <= 0 && status === 'playing') {
            endGame('time');
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [status, isLoading, timeLeft]);

    const startGame = (seconds: number, mode: 'competitive' | 'practice') => {
        setRushMode(mode);
        setTimeMode(seconds);
        setTimeLeft(seconds);
        setScore(0);
        setLives(3);
        setStreak(0);
        setResultsHistory([]);
        setCurrentDifficulty(600);
        setEndReason(null);
        setPuzzleLog([]);
        puzzleLogRef.current = [];
        currentUserMovesRef.current = [];
        setStatus('playing');
        loadNextPuzzle(600);
    };

    const loadNextPuzzle = async (difficulty: number) => {
        setIsLoading(true);
        setWrongSquare(null);
        setCorrectSquare(null);
        setCurrentMoveIndex(0);
        currentUserMovesRef.current = [];

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
                if (result?.captured) playSound('capture');
                else if (newGame.isCheck()) playSound('check');
                else playSound('move');

                setGame(new Chess(newGame.fen()));
                setLastMoveSquares({
                    [from]: { backgroundColor: 'rgba(255,255,0,0.25)' },
                    [to]: { backgroundColor: 'rgba(255,255,0,0.25)' }
                });
                setCurrentMoveIndex(1);
                setIsLoading(false);

                // Save current puzzle reference for log
                currentPuzzleRef.current = {
                    initialFen: data.fen,
                    boardFen: newGame.fen(),
                    correctMoves: moves
                };
            }, 300);
        } catch {
            setTimeout(() => loadNextPuzzle(difficulty), 1000);
        }
    };

    const savePuzzleToLog = (result: 'correct' | 'wrong') => {
        const entry: PuzzleLogEntry = {
            index: puzzleLogRef.current.length + 1,
            initialFen: currentPuzzleRef.current.initialFen,
            boardFen: currentPuzzleRef.current.boardFen,
            correctMoves: currentPuzzleRef.current.correctMoves,
            userMoves: [...currentUserMovesRef.current],
            result
        };
        const newLog = [...puzzleLogRef.current, entry];
        puzzleLogRef.current = newLog;
        setPuzzleLog(newLog);
    };

    const endGame = (reason: 'time' | 'lives') => {
        setEndReason(reason);
        setStatus('gameover');
        playSound('gameOver');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleWrongMove = (currentMode: 'competitive' | 'practice') => {
        playSound('error');
        savePuzzleToLog('wrong');
        setStreak(0);
        setResultsHistory(prev => [...prev, 'wrong']);

        if (currentMode === 'practice') {
            // Practice: no lives, just continue
            setTimeout(() => loadNextPuzzle(currentDifficulty), 700);
        } else {
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) setTimeout(() => endGame('lives'), 500);
                else setTimeout(() => loadNextPuzzle(currentDifficulty), 600);
                return newLives;
            });
        }
    };

    const attemptMove = (sourceSquare: string, targetSquare: string, promotion = 'q') => {
        if (status !== 'playing' || isLoading) return false;
        const expectedMove = puzzleMoves[currentMoveIndex];
        let userMoveStr = sourceSquare + targetSquare;
        const piece = game.get(sourceSquare as any);
        if (piece?.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')) userMoveStr += promotion;

        if (userMoveStr === expectedMove) {
            const newGame = new Chess(game.fen());
            const result = newGame.move({ from: sourceSquare, to: targetSquare, promotion });
            if (result?.captured) playSound('capture');
            else if (newGame.isCheck()) playSound('check');
            else playSound('move');

            currentUserMovesRef.current = [...currentUserMovesRef.current, userMoveStr];
            setGame(newGame);
            setCorrectSquare(targetSquare);
            setLastMoveSquares({});

            if (currentMoveIndex === puzzleMoves.length - 1) {
                playSound('success');
                savePuzzleToLog('correct');
                setScore(prev => {
                    const newScore = prev + 1;
                    const newDifficulty = currentDifficulty + (newScore % 3 === 0 ? 50 : 0);
                    setCurrentDifficulty(newDifficulty);
                    setStreak(s => s + 1);
                    setResultsHistory(r => [...r, 'correct']);
                    setTimeout(() => loadNextPuzzle(newDifficulty), 400);
                    return newScore;
                });
            } else {
                setTimeout(() => {
                    const compMove = puzzleMoves[currentMoveIndex + 1];
                    const from = compMove.substring(0, 2);
                    const to = compMove.substring(2, 4);
                    const nextGame = new Chess(newGame.fen());
                    const compResult = nextGame.move({ from, to, promotion: 'q' });
                    if (compResult?.captured) playSound('capture');
                    else if (nextGame.isCheck()) playSound('check');
                    else playSound('move');
                    setGame(nextGame);
                    setCorrectSquare(null);
                    setLastMoveSquares({
                        [from]: { backgroundColor: 'rgba(255,255,0,0.25)' },
                        [to]: { backgroundColor: 'rgba(255,255,0,0.25)' }
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
                    currentUserMovesRef.current = [...currentUserMovesRef.current, userMoveStr];
                    setWrongSquare(targetSquare);
                    setGame(testGame);
                    handleWrongMove(rushMode);
                }
            } catch {}
            return false;
        }
    };

    const onDrop = (src: string, tgt: string) => attemptMove(src, tgt);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60); const sec = s % 60;
        return toPersianDigits(`${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`);
    };

    const goToReview = () => {
        navigate('/puzzle/rush/review', {
            state: { puzzleLog: puzzleLogRef.current, score, rushMode, timeMode, endReason }
        });
    };

    let customSquares = { ...lastMoveSquares };
    if (correctSquare) customSquares[correctSquare] = { backgroundColor: 'rgba(34,197,94,0.6)' };
    if (wrongSquare) customSquares[wrongSquare] = { backgroundColor: 'rgba(239,68,68,0.7)' };

    // ==========================================
    // Setup Screen
    // ==========================================
    if (status === 'setup') {
        return (
            <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-10 relative overflow-hidden" dir="rtl">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Lalezar&display=swap');`}</style>

                <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none animate-pulse" style={{animationDelay:'2s'}}/>

                <div className="w-full max-w-2xl px-5 py-5 flex items-center justify-between border-b border-white/5 bg-[#121110]/60 backdrop-blur-xl sticky top-0 z-50">
                    <motion.button whileTap={{scale:0.95}} onClick={() => navigate('/puzzles')} className="p-2.5 bg-[#1e1c19] rounded-2xl text-zinc-400 border border-white/5">
                        <ChevronRight size={22}/>
                    </motion.button>
                    <div className="flex items-center gap-2">
                        <Zap size={22} className="text-yellow-400" fill="currentColor"/>
                        <h1 className="font-black text-xl text-white">رگبار سرعتی پازل</h1>
                    </div>
                    <div className="w-10"/>
                </div>

                {/* Mode Tabs */}
                <div className="w-full max-w-md px-5 mt-6">
                    <div className="flex bg-[#1a1916] border border-white/5 rounded-2xl p-1 gap-1">
                        <button
                            onClick={() => setSetupTab('competitive')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${setupTab === 'competitive' ? 'bg-yellow-500 text-[#0c0b0a] shadow-[0_4px_15px_rgba(234,179,8,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Zap size={15} fill={setupTab === 'competitive' ? 'currentColor' : 'none'}/> رقابتی
                        </button>
                        <button
                            onClick={() => setSetupTab('practice')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${setupTab === 'practice' ? 'bg-farzin-accent text-white shadow-[0_4px_15px_rgba(119,149,86,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Dumbbell size={15}/> تمرینی
                        </button>
                    </div>
                </div>

                <motion.div
                    key={setupTab}
                    initial={{opacity:0,y:20}}
                    animate={{opacity:1,y:0}}
                    transition={{type:'spring',stiffness:200,damping:25}}
                    className="w-full max-w-md px-5 mt-6 flex flex-col items-center text-center relative z-10"
                >
                    {setupTab === 'competitive' ? (
                        <>
                            <motion.div animate={{y:[0,-8,0]}} transition={{repeat:Infinity,duration:3,ease:'easeInOut'}}
                                className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-yellow-400 to-orange-500 p-[1px] mb-5 shadow-[0_15px_40px_rgba(234,179,8,0.25)]">
                                <div className="w-full h-full bg-[#161512] rounded-[27px] flex items-center justify-center">
                                    <Zap size={40} className="text-yellow-400" fill="currentColor"/>
                                </div>
                            </motion.div>
                            <h2 className="text-2xl font-black text-white mb-1">رکورد خودت رو بشکن!</h2>
                            <p className="text-zinc-500 text-xs font-bold leading-relaxed mb-8 max-w-[85%]">
                                ثانیه‌ها دارن می‌گذرن! پازل‌ها رو حل کن، فقط ۳ جون داری که اشتباه کنی!
                            </p>
                            <div className="flex flex-col gap-3.5 w-full">
                                {[
                                    { sec: 30, Icon: Skull, color: 'red', title: `${toPersianDigits(30)} ثانیه جنون‌آمیز`, sub: 'سرعت فوق جتی (هاردکور)' },
                                    { sec: 60, Icon: Flame, color: 'orange', title: `${toPersianDigits(1)} دقیقه طلایی`, sub: 'تمرکز بالا و ریتم سریع' },
                                    { sec: 180, Icon: Clock, color: 'yellow', title: `${toPersianDigits(3)} دقیقه استاندارد`, sub: 'فرمت اصلی چس‌کام' },
                                ].map(({ sec, Icon, color, title, sub }) => (
                                    <button key={sec} onClick={() => startGame(sec, 'competitive')}
                                        className={`w-full flex items-center justify-between bg-[#141312] border border-white/5 hover:border-${color}-500/40 p-4.5 rounded-[22px] group transition-all`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20 text-${color}-400 group-hover:bg-${color}-500 group-hover:text-white transition-all`}>
                                                <Icon size={22} fill={color === 'orange' ? 'currentColor' : 'none'}/>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className={`font-black text-white text-base group-hover:text-${color}-400 transition-colors`}>{title}</span>
                                                <span className="text-[10px] text-zinc-500 font-bold mt-0.5">{sub}</span>
                                            </div>
                                        </div>
                                        <ChevronLeft size={17} className="text-zinc-600 group-hover:text-white transition-colors"/>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <motion.div animate={{y:[0,-8,0]}} transition={{repeat:Infinity,duration:3,ease:'easeInOut'}}
                                className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-farzin-accent to-[#4a6b2e] p-[1px] mb-5 shadow-[0_15px_40px_rgba(119,149,86,0.25)]">
                                <div className="w-full h-full bg-[#161512] rounded-[27px] flex items-center justify-center">
                                    <Dumbbell size={38} className="text-farzin-accent"/>
                                </div>
                            </motion.div>
                            <h2 className="text-2xl font-black text-white mb-1">تمرین بدون فشار!</h2>
                            <p className="text-zinc-500 text-xs font-bold leading-relaxed mb-6 max-w-[85%]">
                                هر چند اشتباه هم بکنی، بازی ادامه داره! انقدر پازل حل کن تا وقتت تموم بشه. بعد مرور کن کجا اشتباه کردی.
                            </p>

                            {/* Time selector */}
                            <div className="w-full bg-[#141312] border border-white/5 rounded-[22px] p-4 mb-5">
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 text-center">مدت زمان تمرین</div>
                                <div className="flex gap-2 justify-center flex-wrap">
                                    {PRACTICE_TIMES.map(t => (
                                        <button key={t} onClick={() => setPracticeTime(t)}
                                            className={`px-4 py-2.5 rounded-xl font-black text-sm transition-all ${practiceTime === t ? 'bg-farzin-accent text-white shadow-[0_4px_15px_rgba(119,149,86,0.3)]' : 'bg-[#262421] text-zinc-500 border border-white/5 hover:text-white'}`}>
                                            {toPersianDigits(t >= 60 ? t/60 : t)}{t >= 60 ? ' دقیقه' : ' ثانیه'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => startGame(practiceTime, 'practice')}
                                className="w-full py-4 bg-gradient-to-l from-farzin-accent to-[#5c7a40] text-white font-black rounded-[22px] flex items-center justify-center gap-2 text-base shadow-[0_8px_25px_rgba(119,149,86,0.3)] active:scale-95 transition-all">
                                <Play size={18} fill="currentColor"/>
                                شروع تمرین · {toPersianDigits(practiceTime >= 60 ? practiceTime/60 : practiceTime)} {practiceTime >= 60 ? 'دقیقه' : 'ثانیه'}
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        );
    }

    // ==========================================
    // Gameplay
    // ==========================================
    const isPractice = rushMode === 'practice';

    return (
        <div className="min-h-[100dvh] bg-[#0c0b0a] text-zinc-200 flex flex-col items-center pb-8" dir="rtl">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Lalezar&display=swap');`}</style>

            <div className="w-full max-w-2xl px-5 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#0c0b0a]/90 backdrop-blur-md border-b border-white/5">
                <motion.button whileTap={{scale:0.95}} onClick={() => setStatus('setup')} className="p-2.5 bg-[#1e1c19] rounded-xl text-zinc-400 border border-white/5">
                    <ChevronRight size={22}/>
                </motion.button>
                <div className="flex flex-col items-center">
                    <span className="text-white font-black text-base flex items-center gap-1.5">
                        {isPractice ? <Dumbbell size={15} className="text-farzin-accent"/> : <Zap size={15} className="text-yellow-400" fill="currentColor"/>}
                        {isPractice ? 'تمرین رگبار پازل' : 'رگبار سرعتی پازل'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-black mt-0.5 flex items-center gap-1">
                        امتیاز فعلی: <Target size={10} className="text-blue-400"/> <span className="text-blue-400">{toPersianDigits(currentDifficulty)}</span>
                    </span>
                </div>
                <div className="w-10"/>
            </div>

            <div className="w-full max-w-md mt-5 px-4 relative z-0">
                {isLoading && status === 'playing' && (
                    <div className="absolute inset-0 z-20 bg-[#0c0b0a]/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}}>
                            <RefreshCw className={`${isPractice ? 'text-farzin-accent' : 'text-yellow-400'}`} size={34}/>
                        </motion.div>
                    </div>
                )}
                <div dir="ltr" className={`rounded-xl relative flex shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-[3px] transition-all duration-300 ${wrongSquare ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-[0.98]' : isPractice ? 'border-farzin-accent/20' : 'border-white/5'}`}>
                    <Chessboard
                        id="PuzzleRushBoard"
                        position={game.fen()}
                        onPieceDrop={onDrop}
                        boardOrientation={playerColor}
                        customDarkSquareStyle={darkSquareStyle}
                        customLightSquareStyle={lightSquareStyle}
                        customPieces={customPieces}
                        customSquareStyles={customSquares}
                        animationDuration={140}
                        autoPromoteToQueen={true}
                    />
                </div>
            </div>

            {/* Streak / combo */}
            <div className="w-full max-w-md px-4 flex-1 flex flex-col items-center justify-center min-h-[85px] py-2 relative">
                <AnimatePresence mode="wait">
                    {streak >= 3 ? (
                        <motion.div key="combo" initial={{scale:0.3,opacity:0}} animate={{scale:[1.3,1],opacity:1}} exit={{scale:0.5,opacity:0,y:-20}} transition={{type:'spring',stiffness:400,damping:15}} className="flex flex-col items-center">
                            <div style={{fontFamily:GAME_FONT,paddingTop:'6px'}} className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent text-3xl tracking-wide flex items-center gap-2">
                                <motion.div animate={{scale:[1,1.2,1]}} transition={{repeat:Infinity,duration:0.6}} className="text-orange-500"><Flame size={26} fill="currentColor"/></motion.div>
                                {toPersianDigits(streak)} تایی متوالی! 🔥
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="normal" initial={{opacity:0}} animate={{opacity:0.4}} exit={{opacity:0}} className="text-zinc-500 text-[11px] font-black tracking-widest">
                            {isPractice ? '🎯 هر اشتباه یه فرصت یادگیریه!' : '⚡ تمرکزت رو نذار از بین بره ⚡'}
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center max-w-[85%]" dir="ltr">
                    <AnimatePresence>
                        {resultsHistory.slice(-10).map((res, i) => (
                            <motion.div initial={{scale:0,width:0}} animate={{scale:1,width:'18px'}} key={`${i}-${res}`}
                                className={`h-4 rounded-full flex items-center justify-center text-[9px] font-black border ${res === 'correct' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                {res === 'correct' ? <Check size={10} strokeWidth={4}/> : <X size={10} strokeWidth={4}/>}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* HUD */}
            <div className="w-full max-w-md px-4 flex flex-col gap-3">
                <div className="w-full bg-[#141312]/70 border border-white/5 rounded-[28px] p-5 shadow-[0_15px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex justify-between items-center backdrop-blur-xl">
                    <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-[60px] opacity-20 pointer-events-none transition-colors duration-500 ${timeLeft <= 20 ? 'bg-red-500' : isPractice ? 'bg-farzin-accent' : 'bg-blue-400'}`}/>
                    <div className={`absolute bottom-0 left-0 w-28 h-28 rounded-full blur-[60px] opacity-20 pointer-events-none transition-colors duration-500 ${!isPractice && lives === 1 ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`}/>

                    <div className="flex flex-col items-center z-10 w-20">
                        <span className="text-[9px] text-zinc-500 font-black tracking-wider uppercase mb-1">زمان باقی‌مانده</span>
                        <span style={{fontFamily:GAME_FONT,paddingTop:'4px'}} className={`text-3xl tracking-widest ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : timeLeft <= 30 ? 'text-orange-400' : 'text-zinc-200'}`} dir="ltr">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <motion.div key={score} initial={{scale:1.3}} animate={{scale:1}} transition={{type:'spring',stiffness:300,damping:12}} className="flex flex-col items-center z-10 w-24 border-x border-white/5 px-2">
                        <span className={`text-[10px] font-black tracking-wider uppercase flex items-center gap-1 ${isPractice ? 'text-farzin-accent' : 'text-yellow-400'}`}>امتیاز پازل</span>
                        <span style={{fontFamily:GAME_FONT,paddingTop:'8px'}} className="text-6xl text-white leading-none">{toPersianDigits(score)}</span>
                    </motion.div>

                    <div className="flex flex-col items-center z-10 w-20">
                        {isPractice ? (
                            <>
                                <span className="text-[9px] text-zinc-500 font-black tracking-wider uppercase mb-1.5">بدون جون</span>
                                <div className="w-10 h-10 rounded-full bg-farzin-accent/10 border border-farzin-accent/30 flex items-center justify-center">
                                    <Dumbbell size={18} className="text-farzin-accent"/>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-[9px] text-zinc-500 font-black tracking-wider uppercase mb-2">فرصت‌های خطا</span>
                                <div className="flex items-center gap-1.5" dir="ltr">
                                    {[1,2,3].map(life => (
                                        <motion.div key={life}
                                            animate={lives < life ? {scale:0,opacity:0,rotate:-90} : (lives===1&&life===1) ? {scale:[1,1.3,1]} : {scale:1}}
                                            transition={(lives===1&&life===1) ? {repeat:Infinity,duration:0.6} : {type:'spring'}}>
                                            <Heart size={15} className={lives >= life ? 'text-red-500' : 'text-zinc-800'} fill={lives >= life ? 'currentColor' : 'none'}/>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Timer bar */}
                <div className="w-full h-1 bg-[#1a1918] rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        className={`h-full ${timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 30 ? 'bg-orange-500' : isPractice ? 'bg-gradient-to-l from-farzin-accent to-[#5c7a40]' : 'bg-gradient-to-l from-blue-500 to-sky-400'}`}
                        initial={{width:'100%'}} animate={{width:`${(timeLeft/timeMode)*100}%`}} transition={{ease:'linear',duration:1}}
                    />
                </div>

                <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}}
                    onClick={() => endGame('lives')}
                    className="mt-1 py-3 w-full bg-[#141312] text-zinc-500 hover:text-red-400 border border-white/5 rounded-[18px] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                    <X size={14}/> ثبت رکورد فعلی و خروج
                </motion.button>
            </div>

            {/* Game Over Modal */}
            <AnimatePresence>
                {status === 'gameover' && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4" dir="rtl">
                        <motion.div initial={{scale:0.85,y:30}} animate={{scale:1,y:0}} transition={{type:'spring',damping:20}}
                            className="bg-[#141312] w-full max-w-sm rounded-[32px] border border-white/5 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] flex flex-col">

                            <div className={`p-7 flex flex-col items-center border-b border-white/5 relative bg-gradient-to-br ${endReason==='time' ? 'from-blue-500/15' : isPractice ? 'from-farzin-accent/15' : 'from-red-500/15'} to-transparent`}>
                                {endReason === 'time' ? (
                                    <Clock size={55} className={`${isPractice ? 'text-farzin-accent' : 'text-blue-400'} mb-3`}/>
                                ) : (
                                    <HeartCrack size={55} className="text-red-400 mb-3"/>
                                )}
                                <h2 className="text-xl font-black text-white tracking-tight">
                                    {endReason === 'time' ? (isPractice ? 'وقت تمومه! تمرین عالی بود 💪' : 'زمان به آخر رسید! ⏱️') : 'فرصت‌هات سوخت! 💔'}
                                </h2>
                                <p className="text-zinc-500 text-xs font-bold mt-1.5 text-center">
                                    {isPractice ? 'تمرین' : 'چالش'} <b className="text-zinc-300 mx-0.5">{timeMode >= 60 ? `${toPersianDigits(timeMode/60)} دقیقه‌ای` : `${toPersianDigits(timeMode)} ثانیه‌ای`}</b> به پایان رسید
                                </p>
                            </div>

                            <div className="p-6 flex flex-col gap-4 items-center">
                                <div className="flex flex-col items-center w-full bg-[#0c0b0a] rounded-2xl py-5 border border-white/5 shadow-inner">
                                    <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-1">پازل‌های حل شده</span>
                                    <span style={{fontFamily:GAME_FONT,paddingTop:'10px'}} className="text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 leading-none">
                                        {toPersianDigits(score)}
                                    </span>
                                </div>

                                <div className="w-full flex flex-col gap-2.5 mt-1">
                                    {/* Review button - always shown */}
                                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                                        onClick={goToReview}
                                        className="w-full py-3.5 bg-gradient-to-l from-farzin-accent to-[#5c7a40] text-white font-black rounded-xl flex items-center justify-center gap-1.5 text-sm shadow-[0_5px_20px_rgba(119,149,86,0.3)]">
                                        <BookOpen size={16}/> مرور پازل‌ها
                                    </motion.button>
                                    <div className="flex gap-2.5">
                                        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                                            onClick={() => startGame(timeMode, rushMode)}
                                            className="flex-1 py-3.5 bg-white text-[#0c0b0a] font-black rounded-xl flex items-center justify-center gap-1.5 text-sm shadow-[0_5px_20px_rgba(255,255,255,0.15)]">
                                            <RotateCcw size={15} strokeWidth={3}/> دوباره
                                        </motion.button>
                                        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                                            onClick={() => setStatus('setup')}
                                            className="flex-1 py-3.5 bg-[#1e1c19] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 border border-white/5 text-sm">
                                            <X size={15}/> منو
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
