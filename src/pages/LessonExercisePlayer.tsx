import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, RefreshCw, ArrowRight, ShieldAlert, 
    CheckCircle2, RotateCcw, Check, X, Lightbulb, Award
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

    const [exercises, setExercises] = useState<any[]>([]);
    const [currentExIndex, setCurrentExIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [game, setGame] = useState(new Chess());
    const [parsedData, setParsedData] = useState<{baseAnnotations: any, moves: any[]}>({ baseAnnotations: {arrows:[], circles:{}}, moves: [] });
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [status, setStatus] = useState<'playing' | 'solved' | 'wrong'>('playing');
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    
    const [clickedSquare, setClickedSquare] = useState<string | null>(null);
    const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
    const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, any>>({});
    const [feedback, setFeedback] = useState<{square: string, type: 'correct'|'wrong'} | null>(null);
    const [activeHintSquare, setActiveHintSquare] = useState<string | null>(null);

    // 🔥 استیت جدید برای پیام فعال (فقط یک پیام در لحظه نمایش داده می‌شود)
    const [activeMessage, setActiveMessage] = useState<{type: 'info'|'hint'|'success'|'error', title: string, text: string} | null>(null);

    // عکس موقت استاد (بعداً از دیتابیس میاد)
    const instructorAvatar = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop";

    useEffect(() => { fetchExercises(); }, [lessonId]);

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
        setFeedback(null); setActiveHintSquare(null);

        try {
            const parsed = JSON.parse(exercise.moves);
            setParsedData(parsed);
            setCurrentExIndex(index);
            
            const newGame = new Chess(exercise.fen);
            setGame(newGame);

            if (parsed.moves.length > 0) {
                setPlayerColor(parsed.moves[0].color === 'w' ? 'white' : 'black');
            }

            // نمایش صورت مسئله در چت‌باکس
            if (exercise.description) {
                setActiveMessage({ type: 'info', title: 'صورت مسئله', text: exercise.description });
            } else {
                setActiveMessage({ type: 'info', title: 'شروع تمرین', text: 'بهترین حرکت را پیدا کنید.' });
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

    const attemptMove = (sourceSquare: string, targetSquare: string, promotion = 'q') => {
        if (status !== 'playing' || loadError || currentMoveIndex >= parsedData.moves.length) return false;

        const expectedMoveData = parsedData.moves[currentMoveIndex];
        const userMoveStr = sourceSquare + targetSquare;
        const piece = game.get(sourceSquare as any);
        const fullMoveStr = (piece && piece.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')) ? userMoveStr + promotion : userMoveStr;

        if (fullMoveStr === expectedMoveData.uci || userMoveStr === expectedMoveData.uci) {
            const newGame = new Chess(game.fen());
            const result = newGame.move({ from: sourceSquare, to: targetSquare, promotion });
            
            if(result.captured) playSound('capture');
            else if(newGame.isCheck()) playSound('check');
            else playSound('move');

            setGame(newGame);
            setLastMoveSquares({ [sourceSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' }, [targetSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' } });
            setFeedback({ square: targetSquare, type: 'correct' });
            setClickedSquare(null); setOptionSquares({}); setActiveHintSquare(null);
            
            // نمایش پیام تشویقی یا کامنت استاد
            if (expectedMoveData.comment) {
                setActiveMessage({ type: 'success', title: 'حرکت عالی!', text: expectedMoveData.comment });
            } else {
                setActiveMessage({ type: 'success', title: 'آفرین!', text: 'حرکت درستی بود. ادامه بده...' });
            }

            const nextIndex = currentMoveIndex + 1;
            
            if (nextIndex < parsedData.moves.length) {
                setCurrentMoveIndex(nextIndex);
                if (parsedData.moves[nextIndex].color !== expectedMoveData.color) {
                    setTimeout(() => {
                        const compMoveData = parsedData.moves[nextIndex];
                        const compGame = new Chess(newGame.fen());
                        const from = compMoveData.uci.substring(0, 2);
                        const to = compMoveData.uci.substring(2, 4);
                        const prom = compMoveData.uci.length > 4 ? compMoveData.uci[4] : 'q';
                        
                        const compResult = compGame.move({ from, to, promotion: prom });
                        if(compResult.captured) playSound('capture');
                        else if(compGame.isCheck()) playSound('check');
                        else playSound('move');

                        setGame(compGame);
                        setLastMoveSquares({ [from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
                        setFeedback(null);
                        
                        if (compMoveData.comment) {
                            setActiveMessage({ type: 'info', title: 'حرکت حریف', text: compMoveData.comment });
                        }

                        if (nextIndex + 1 >= parsedData.moves.length) { finishPuzzle(); } 
                        else { setCurrentMoveIndex(nextIndex + 1); }
                    }, 800); 
                }
            } else {
                finishPuzzle();
            }
            return true;

        } else {
            try {
                const testGame = new Chess(game.fen());
                const isValid = testGame.move({ from: sourceSquare, to: targetSquare, promotion });
                
                if (isValid) {
                    setStatus('wrong'); playSound('error'); setGame(testGame);
                    setLastMoveSquares({ [sourceSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.5)' }, [targetSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.5)' } });
                    setFeedback({ square: targetSquare, type: 'wrong' });
                    setOptionSquares({}); setClickedSquare(null);
                    
                    if (expectedMoveData.hint) {
                        setActiveMessage({ type: 'error', title: 'دقت کن!', text: expectedMoveData.hint });
                    } else {
                        setActiveMessage({ type: 'error', title: 'اشتباه بود!', text: 'این بهترین حرکت نیست. دوباره تلاش کن.' });
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
            setActiveMessage({ type: 'success', title: 'پایان تمرین', text: 'تبریک می‌گم! این سناریو رو با موفقیت حل کردی.' });
        }, 500);
    };

    const handleRetry = () => {
        setStatus('playing');
        setFeedback(null);
        setActiveHintSquare(null);
        game.undo();
        setGame(new Chess(game.fen()));
        setLastMoveSquares({});
        
        // بازگرداندن پیام به حالت صورت مسئله
        const exercise = exercises[currentExIndex];
        if (exercise.description) setActiveMessage({ type: 'info', title: 'تلاش مجدد', text: exercise.description });
        else setActiveMessage(null);
    };

    const handleHintClick = () => {
        if (status !== 'playing' || loadError || currentMoveIndex >= parsedData.moves.length) return;
        const expectedMoveData = parsedData.moves[currentMoveIndex];
        
        setActiveHintSquare(expectedMoveData.uci.substring(0, 2));

        if (expectedMoveData.hint) {
            setActiveMessage({ type: 'hint', title: 'راهنمایی', text: expectedMoveData.hint });
        } else {
            setActiveMessage({ type: 'hint', title: 'راهنمایی', text: 'به مهره‌ای که با رنگ زرد روشن شده دقت کن!' });
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => { setFeedback(null); attemptMove(sourceSquare, targetSquare); return true; };

    const handleSquareClick = (square: string) => {
        setFeedback(null); 
        if (status !== 'playing' || loadError) return;
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

    const currentAnnotationData = currentMoveIndex === 0 ? parsedData.baseAnnotations : (currentMoveIndex > 0 && currentMoveIndex <= parsedData.moves.length ? parsedData.moves[currentMoveIndex - 1] : null);
    
    let finalCustomSquares = { ...lastMoveSquares, ...optionSquares };
    if (currentAnnotationData?.circles) {
        Object.entries(currentAnnotationData.circles).forEach(([sq, color]) => {
            finalCustomSquares[sq] = { ...(finalCustomSquares[sq] || {}), boxShadow: `inset 0 0 0 4px ${color}`, borderRadius: '4px' };
        });
    }
    if (activeHintSquare) {
        finalCustomSquares[activeHintSquare] = { ...finalCustomSquares[activeHintSquare], backgroundColor: 'rgba(245, 158, 11, 0.6)' };
    }

    return (
        <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex flex-col items-center" dir="rtl">
            
            {/* 🌟 هدر */}
            <div className="w-full px-5 py-4 flex items-center justify-between bg-[#1e1c19] border-b border-[#35332e] sticky top-0 z-10 shrink-0">
                <button onClick={() => navigate(`/course/${courseId}/play`)} className="p-2 bg-[#262421] rounded-xl hover:text-white text-zinc-400 transition-colors"><ChevronRight size={24} /></button>
                <div className="flex flex-col items-center">
                    <span className="text-emerald-400 font-black text-sm uppercase flex items-center gap-2"><Award size={16} /> تمرینات تعاملی دوره</span>
                    <span className="text-[11px] text-zinc-400 font-bold mt-1">پیشرفت: {currentExIndex + 1} از {exercises.length}</span>
                </div>
                <div className="w-10"></div>
            </div>
            
            {/* 🌟 محتوای اصلی (تخته در مرکز، چت در پایین) */}
            <div className="flex-1 w-full max-w-md flex flex-col items-center pt-6 px-4 gap-6 overflow-y-auto custom-scrollbar pb-32">
                
                {/* بخش تخته */}
                <div className="w-full relative z-0 shrink-0">
                    {isLoading ? (
                        <div className="aspect-square w-full bg-[#1e1c19] rounded-xl flex items-center justify-center border border-[#35332e]"><RefreshCw className="animate-spin text-emerald-400" size={32} /></div>
                    ) : loadError ? (
                        <div className="aspect-square w-full bg-[#1e1c19] flex flex-col items-center justify-center border-4 border-[#35332e] rounded-xl text-center p-6"><ShieldAlert size={48} className="text-zinc-600 mb-4 opacity-50" /><h3 className="text-white font-black text-lg mb-2">تمرینی یافت نشد!</h3></div>
                    ) : (
                        <div dir="ltr" className={`rounded-xl relative flex shadow-2xl border-4 transition-colors duration-300 ${status === 'wrong' ? 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : status === 'solved' ? 'border-emerald-500/80 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-[#35332e]'}`}>
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

                            {/* 💥 افکت‌های اشتباه/درست */}
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
                    )}
                </div>

                {/* 🌟 دکمه راهنمایی */}
                {status === 'playing' && !loadError && (
                    <div className="w-full shrink-0">
                        <button onClick={handleHintClick} className="w-full py-3 bg-[#161512] hover:bg-[#1e1c19] text-amber-500 border border-[#35332e] hover:border-amber-500/50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                            <Lightbulb size={18} /> راهنمایی نیاز دارم
                        </button>
                    </div>
                )}

                {/* 💬 سیستم جدید چت حباب‌دار استاد */}
                <AnimatePresence mode="wait">
                    {activeMessage && !loadError && (
                        <motion.div 
                            key={activeMessage.text} // تغییر کلید باعث انیمیشن ورود مجدد می‌شود
                            initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="w-full flex items-end gap-3 mt-2"
                        >
                            <img src={instructorAvatar} alt="استاد" className="w-12 h-12 rounded-full object-cover border-2 border-[#35332e] shadow-lg shrink-0" />
                            
                            <div className={`relative flex-1 p-4 rounded-2xl rounded-br-sm shadow-xl border ${
                                activeMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30' : 
                                activeMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 
                                activeMessage.type === 'hint' ? 'bg-amber-500/10 border-amber-500/30' : 
                                'bg-[#1e1c19] border-[#35332e]'
                            }`}>
                                <h4 className={`text-xs font-black mb-1 tracking-wider ${
                                    activeMessage.type === 'error' ? 'text-red-400' : 
                                    activeMessage.type === 'success' ? 'text-emerald-400' : 
                                    activeMessage.type === 'hint' ? 'text-amber-500' : 
                                    'text-sky-400'
                                }`}>{activeMessage.title}</h4>
                                <p className="text-sm text-white leading-relaxed font-medium">{activeMessage.text}</p>
                                
                                {/* دم حباب چت */}
                                <div className={`absolute -right-2 bottom-0 w-4 h-4 border-b border-r transform rotate-45 translate-x-1/2 -translate-y-1 ${
                                    activeMessage.type === 'error' ? 'bg-[#2a1215] border-red-500/30' : 
                                    activeMessage.type === 'success' ? 'bg-[#12221a] border-emerald-500/30' : 
                                    activeMessage.type === 'hint' ? 'bg-[#2a2215] border-amber-500/30' : 
                                    'bg-[#1e1c19] border-[#35332e]'
                                }`}></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* 🛑 پنل‌های شناور پایان بازی (اشتباه / حل شده) */}
            <AnimatePresence>
                {status === 'wrong' && !loadError && (
                    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[450px] md:bottom-6 bg-[#161512] border-t md:border border-[#35332e] md:rounded-2xl p-5 z-50 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <button onClick={handleRetry} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black flex items-center justify-center gap-2 transition-colors shadow-lg">
                            <RotateCcw size={18} /> تلاش مجدد
                        </button>
                    </motion.div>
                )}

                {status === 'solved' && !loadError && (
                    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[450px] md:bottom-6 bg-[#161512] border-t md:border border-[#35332e] md:rounded-2xl p-5 z-50 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        {currentExIndex < exercises.length - 1 ? (
                            <button onClick={() => loadExercise(exercises[currentExIndex + 1], currentExIndex + 1)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#161512] rounded-xl font-black flex items-center justify-center gap-2 transition-colors shadow-lg">
                                <ArrowRight size={18} /> پازل بعدی
                            </button>
                        ) : (
                            <button onClick={() => navigate(`/course/${courseId}/play`)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#161512] rounded-xl font-black flex items-center justify-center gap-2 transition-colors shadow-lg">
                                <CheckCircle2 size={18} /> پایان و بازگشت به کلاس
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}