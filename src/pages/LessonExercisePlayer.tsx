import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, RefreshCw, ArrowRight, ShieldAlert, 
    CheckCircle2, Target, RotateCcw, Zap,
    Check, X, Lightbulb, Eye, MessageSquare, Award, Play
} from 'lucide-react';
import { useChessTheme } from '../hooks/useChessTheme';

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

export default function LessonExercisePlayer() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { lightSquareStyle, darkSquareStyle, customPieces } = useChessTheme();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [exercises, setExercises] = useState<any[]>([]);
    const [currentExIndex, setCurrentExIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    // استیت‌های موتور بازی
    const [game, setGame] = useState(new Chess());
    const [parsedData, setParsedData] = useState<{baseAnnotations: any, moves: any[]}>({ baseAnnotations: {arrows:[], circles:{}}, moves: [] });
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [status, setStatus] = useState<'playing' | 'solved' | 'wrong'>('playing');
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    
    const [clickedSquare, setClickedSquare] = useState<string | null>(null);
    const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
    const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, any>>({});
    const [feedback, setFeedback] = useState<{square: string, type: 'correct'|'wrong'} | null>(null);
    
    const [activeHint, setActiveHint] = useState<string | null>(null);
    const [solutionViewed, setSolutionViewed] = useState(false);
    const [isShowingSolution, setIsShowingSolution] = useState(false);

    // تاریخچه پیام‌های آموزشی استاد
    const [instructorMessages, setInstructorMessages] = useState<any[]>([]);

    useEffect(() => { fetchExercises(); }, [lessonId]);

    // اسکرول خودکار چت‌باکس آموزش
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [instructorMessages]);

    const fetchExercises = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/courses/lessons/${lessonId}/exercises`);
            if (res.ok) {
                const data = await res.json();
                setExercises(data);
                if (data.length > 0) loadExercise(data[0], 0);
                else setLoadError(true);
            }
        } catch (err) { setLoadError(true); } finally { setIsLoading(false); }
    };

    const loadExercise = (exercise: any, index: number) => {
        setIsLoading(true); setStatus('playing'); setCurrentMoveIndex(0); 
        setClickedSquare(null); setOptionSquares({}); setLastMoveSquares({}); 
        setFeedback(null); setActiveHint(null); setSolutionViewed(false);
        setInstructorMessages([]);

        try {
            const parsed = JSON.parse(exercise.moves);
            setParsedData(parsed);
            setCurrentExIndex(index);
            
            const newGame = new Chess(exercise.fen);
            setGame(newGame);

            // تعیین رنگ کاربر (رنگ اولین حرکت ثبت شده)
            if (parsed.moves.length > 0) {
                setPlayerColor(parsed.moves[0].color === 'w' ? 'white' : 'black');
            }

            // پیام اولیه استاد
            if (exercise.description) {
                setInstructorMessages([{ id: 'start', type: 'info', text: exercise.description }]);
            }

            setIsLoading(false);
        } catch (e) {
            console.error(e);
            setLoadError(true); setIsLoading(false);
        }
    };

    const highlightLegalMoves = (sourceSquare: string) => {
        const moves = game.moves({ square: sourceSquare as any, verbose: true });
        if (moves.length === 0) return;

        const newSquares: any = {};
        moves.forEach((m: any) => {
            const isCapture = game.get(m.to as any) && game.get(m.to as any).color !== game.get(sourceSquare as any)?.color;
            newSquares[m.to] = { backgroundImage: isCapture ? 'radial-gradient(circle, transparent 0%, transparent 65%, rgba(0,0,0,0.2) 67%, rgba(0,0,0,0.2) 100%)' : 'radial-gradient(circle, rgba(0,0,0,.2) 22%, transparent 23%)' };
        });
        newSquares[sourceSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        setOptionSquares(newSquares);
    };

    const executeComputerMove = (nextGame: any, compMoveData: any, nextIndex: number) => {
        setTimeout(() => {
            const from = compMoveData.uci.substring(0, 2);
            const to = compMoveData.uci.substring(2, 4);
            const prom = compMoveData.uci.length > 4 ? compMoveData.uci[4] : 'q';
            
            const compResult = nextGame.move({ from, to, promotion: prom });
            if(compResult.captured) playSound('capture');
            else if(nextGame.isCheck()) playSound('check');
            else playSound('move');

            setGame(new Chess(nextGame.fen()));
            setLastMoveSquares({ [from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
            
            if (compMoveData.comment) {
                setInstructorMessages(prev => [...prev, { id: Date.now(), type: 'comment', text: compMoveData.comment, move: compMoveData.san, color: compMoveData.color }]);
            }
            
            setCurrentMoveIndex(nextIndex);
            
            // اگه با حرکت حریف پازل تموم شد
            if (nextIndex >= parsedData.moves.length) {
                finishPuzzle();
            }
        }, 600);
    };

    const attemptMove = (sourceSquare: string, targetSquare: string, promotion = 'q') => {
        if (status !== 'playing' || isShowingSolution || loadError) return false;

        const expectedMoveData = parsedData.moves[currentMoveIndex];
        const userMoveStr = sourceSquare + targetSquare;
        const piece = game.get(sourceSquare as any);
        const fullMoveStr = (piece && piece.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')) ? userMoveStr + promotion : userMoveStr;

        if (fullMoveStr === expectedMoveData.uci || userMoveStr === expectedMoveData.uci) {
            // حرکت درست بود!
            const newGame = new Chess(game.fen());
            const result = newGame.move({ from: sourceSquare, to: targetSquare, promotion });
            
            if(result.captured) playSound('capture');
            else if(newGame.isCheck()) playSound('check');
            else playSound('move');

            setGame(newGame);
            setLastMoveSquares({ [sourceSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' }, [targetSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' } });
            setFeedback({ square: targetSquare, type: 'correct' });
            setClickedSquare(null); setOptionSquares({}); setActiveHint(null);
            
            // ثبت نظر استاد برای این حرکت
            if (expectedMoveData.comment) {
                setInstructorMessages(prev => [...prev, { id: Date.now(), type: 'comment', text: expectedMoveData.comment, move: expectedMoveData.san, color: expectedMoveData.color }]);
            }

            const nextIndex = currentMoveIndex + 1;
            
            if (nextIndex >= parsedData.moves.length) {
                finishPuzzle();
            } else {
                setCurrentMoveIndex(nextIndex);
                // آیا حرکت بعدی نوبت حریف است؟ (رنگ متفاوت)
                if (parsedData.moves[nextIndex].color !== expectedMoveData.color) {
                    executeComputerMove(newGame, parsedData.moves[nextIndex], nextIndex + 1);
                }
            }
            return true;
        } else {
            // حرکت اشتباه بود!
            try {
                const testGame = new Chess(game.fen());
                const isValid = testGame.move({ from: sourceSquare, to: targetSquare, promotion });
                
                if (isValid) {
                    setStatus('wrong'); playSound('error'); setGame(testGame);
                    setLastMoveSquares({ [sourceSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.5)' }, [targetSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.5)' } });
                    setFeedback({ square: targetSquare, type: 'wrong' });
                    setOptionSquares({}); setClickedSquare(null);
                    
                    // نمایش راهنمایی استاد
                    if (expectedMoveData.hint) {
                        setActiveHint(expectedMoveData.hint);
                        setInstructorMessages(prev => [...prev, { id: Date.now(), type: 'hint', text: expectedMoveData.hint }]);
                    }
                }
            } catch (e) {}
            return false;
        }
    };

    const finishPuzzle = () => {
        setTimeout(() => {
            setStatus('solved');
            playSound('gameOver');
        }, 500);
    };

    const handleRetry = () => {
        setStatus('playing');
        setFeedback(null);
        setActiveHint(null);
        // برگرداندن به حالت حرکت قبلی
        game.undo();
        setGame(new Chess(game.fen()));
        setLastMoveSquares({});
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        setFeedback(null); attemptMove(sourceSquare, targetSquare); return true; 
    };

    const handleSquareClick = (square: string) => {
        setFeedback(null); 
        if (status !== 'playing' || isShowingSolution || loadError) return;

        if (clickedSquare) {
            if (clickedSquare === square) { setClickedSquare(null); setOptionSquares({}); return; }
            const moves = game.moves({ square: clickedSquare as any, verbose: true });
            if (moves.find(m => m.to === square)) { attemptMove(clickedSquare, square); return; }
        }

        const piece = game.get(square as any);
        if (piece && piece.color === game.turn()) { setClickedSquare(square); highlightLegalMoves(square); } 
        else { setClickedSquare(null); setOptionSquares({}); }
    };

    const getSquareCoordinates = (square: string) => {
        const col = square.charCodeAt(0) - 97; const row = parseInt(square[1]) - 1; 
        const isWhite = playerColor === 'white';
        return { x: isWhite ? col : 7 - col, y: isWhite ? 7 - row : row };
    };

    // 🎨 پردازش نقاشی‌ها و گرافیک‌های روی تخته
    const currentAnnotationData = currentMoveIndex === 0 ? parsedData.baseAnnotations : (currentMoveIndex > 0 && currentMoveIndex <= parsedData.moves.length ? parsedData.moves[currentMoveIndex - 1] : null);
    
    let finalCustomSquares = { ...lastMoveSquares, ...optionSquares };
    if (currentAnnotationData?.circles) {
        Object.entries(currentAnnotationData.circles).forEach(([sq, color]) => {
            finalCustomSquares[sq] = { ...(finalCustomSquares[sq] || {}), boxShadow: `inset 0 0 0 4px ${color}`, borderRadius: '4px' };
        });
    }

    return (
        <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex flex-col md:flex-row" dir="rtl">
            
            {/* 🌟 بخش چت‌باکس آموزشی و نظرات استاد (سمت راست) */}
            <div className="w-full md:w-80 lg:w-96 bg-[#121110] border-l border-[#35332e] flex flex-col shrink-0 h-[40vh] md:h-screen">
                <div className="p-4 border-b border-[#35332e] bg-[#161512] flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">تمرینات جلسه</span>
                        <h2 className="font-black text-white text-base">پیشرفت: {currentExIndex + 1} از {exercises.length}</h2>
                    </div>
                    <button onClick={() => navigate(`/course/${courseId}/play`)} className="p-2 bg-[#262421] hover:bg-[#35332e] rounded-xl text-zinc-400 hover:text-white transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
                    {instructorMessages.map(msg => (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={msg.id} className={`p-4 rounded-2xl flex flex-col gap-2 shadow-sm ${msg.type === 'info' ? 'bg-[#1e1c19] border border-[#35332e]' : msg.type === 'hint' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                            <div className="flex items-center gap-2">
                                {msg.type === 'info' ? <MessageSquare size={16} className="text-sky-400"/> : msg.type === 'hint' ? <Lightbulb size={16} className="text-amber-500"/> : <CheckCircle2 size={16} className="text-emerald-500"/>}
                                <span className={`text-xs font-black ${msg.type === 'info' ? 'text-white' : msg.type === 'hint' ? 'text-amber-500' : 'text-emerald-400'}`}>
                                    {msg.type === 'info' ? 'پیام استاد' : msg.type === 'hint' ? 'راهنمایی استاد' : `بررسی حرکت ${msg.move}`}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-300 leading-loose">{msg.text}</p>
                        </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* 🌟 بخش اصلی حل پازل (تخته شطرنج) */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                <div className="w-full max-w-[500px] relative z-0">
                    {isLoading ? (
                        <div className="aspect-square w-full bg-[#1e1c19] rounded-xl flex items-center justify-center border border-[#35332e]"><RefreshCw className="animate-spin text-emerald-400" size={32} /></div>
                    ) : loadError ? (
                        <div className="aspect-square w-full bg-[#1e1c19] flex flex-col items-center justify-center border-4 border-[#35332e] rounded-xl text-center p-6"><ShieldAlert size={48} className="text-zinc-600 mb-4 opacity-50" /><h3 className="text-white font-black text-lg mb-2">تمرینی یافت نشد!</h3><button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-[#262421] text-white font-bold rounded-xl mt-4">بازگشت</button></div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="px-3 py-1.5 bg-[#161512] border border-[#35332e] rounded-lg text-xs font-bold text-zinc-400">نوبت {playerColor === 'white' ? 'سفید' : 'سیاه'}</span>
                                <div className="flex items-center gap-1.5">
                                    {exercises.map((_, idx) => (
                                        <div key={idx} className={`w-2.5 h-2.5 rounded-full ${idx < currentExIndex ? 'bg-emerald-500' : idx === currentExIndex ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-[#262421]'}`} />
                                    ))}
                                </div>
                            </div>
                            
                            <div dir="ltr" className={`rounded-lg relative flex shadow-2xl border-4 transition-colors duration-300 ${status === 'wrong' ? 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : status === 'solved' ? 'border-emerald-500/80 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-[#35332e]'}`}>
                                <Chessboard 
                                    id="LessonExerciseBoard" 
                                    position={game.fen()} 
                                    onPieceDrop={onDrop}
                                    onSquareClick={handleSquareClick}
                                    boardOrientation={playerColor}
                                    customDarkSquareStyle={darkSquareStyle} 
                                    customLightSquareStyle={lightSquareStyle}
                                    customPieces={customPieces}
                                    customSquareStyles={finalCustomSquares}
                                    customArrows={currentAnnotationData?.arrows || []}
                                    animationDuration={250}
                                />

                                {/* 💥 افکت‌ها و انیمیشن‌های اشتباه/درست (دقیقاً مشابه PuzzleBoard) */}
                                {feedback && (
                                    <div className="absolute inset-0 pointer-events-none grid grid-cols-8 grid-rows-8 z-20">
                                        {Array.from({ length: 64 }).map((_, i) => {
                                            const x = i % 8; const y = Math.floor(i / 8); const coords = getSquareCoordinates(feedback.square);
                                            if (x === coords.x && y === coords.y) {
                                                const isCorrect = feedback.type === 'correct';
                                                return (
                                                    <div key={i} className="relative w-full h-full flex items-center justify-center">
                                                        <motion.div animate={isCorrect ? { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] } : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: isCorrect ? 1.5 : 0.8, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0" style={{ background: isCorrect ? 'radial-gradient(circle, rgba(34,197,94,0) 10%, rgba(34,197,94,0.6) 60%, rgba(34,197,94,0) 100%)' : 'radial-gradient(circle, rgba(239,68,68,0) 10%, rgba(239,68,68,0.8) 60%, rgba(239,68,68,0) 100%)' }} />
                                                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute -top-[6px] -right-[6px] w-[22px] h-[22px] rounded-full flex items-center justify-center text-white shadow-[0_4px_10px_rgba(0,0,0,0.6)] border border-black/40 z-10" style={{ backgroundColor: isCorrect ? '#22c55e' : '#ef4444' }}>
                                                            {isCorrect ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                                                        </motion.div>
                                                    </div>
                                                );
                                            }
                                            return <div key={i} />;
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <AnimatePresence>
                    {status === 'wrong' && !loadError && (
                        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[400px] bg-[#1e1c19] border border-red-500/30 shadow-[0_20px_50px_rgba(239,68,68,0.15)] rounded-2xl p-5 z-50 flex flex-col gap-4">
                            <div className="flex items-center gap-4 text-red-400">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0 text-xl">💥</div>
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-lg text-white" dir="rtl">حرکت اشتباه!</span>
                                    <span className="text-xs opacity-80" dir="rtl">توضیحات راهنمایی استاد را در چت‌باکس بخوانید.</span>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full">
                                <button onClick={handleRetry} className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                    <RotateCcw size={18} /> تلاش مجدد
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === 'solved' && !loadError && (
                        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[400px] bg-[#1e1c19] border border-emerald-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl p-5 z-50 flex flex-col gap-4">
                            <div className="flex items-center gap-4 text-emerald-400">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center border shrink-0 text-2xl bg-emerald-500/10 border-emerald-500/20">🏆</div>
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-lg text-white" dir="rtl">آفرین! حل شد</span>
                                    <span className="text-xs opacity-80" dir="rtl">سناریوی آموزشی این تمرین با موفقیت به پایان رسید.</span>
                                </div>
                            </div>
                            
                            {currentExIndex < exercises.length - 1 ? (
                                <button onClick={() => loadExercise(exercises[currentExIndex + 1], currentExIndex + 1)} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#161512] rounded-xl font-black flex items-center justify-center gap-2 transition-colors shadow-lg mt-1">
                                    <ArrowRight size={18} /> تمرین بعدی
                                </button>
                            ) : (
                                <button onClick={() => navigate(`/course/${courseId}/play`)} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#161512] rounded-xl font-black flex items-center justify-center gap-2 transition-colors shadow-lg mt-1">
                                    <CheckCircle2 size={18} /> پایان و بازگشت به کلاس
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}