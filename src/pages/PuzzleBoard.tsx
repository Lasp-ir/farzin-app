import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, RefreshCw, ArrowRight, ShieldAlert, 
    CheckCircle2, Target, RotateCcw, Zap,
    SkipBack, SkipForward, Rewind, FastForward, Check, X, Lightbulb, TrendingUp, TrendingDown, Eye, Tag
} from 'lucide-react';
import { puzzleService } from '../api/puzzleService';
// 🔥 ایمپورت هوک تم
import { useChessTheme } from '../hooks/useChessTheme';

const THEME_DICTIONARY: Record<string, string> = {
    mateIn1: 'مات در ۱', mateIn2: 'مات در ۲', mateIn3: 'مات در ۳', mateIn4: 'مات در ۴', mateIn5: 'مات در ۵+',
    mate: 'مات', short: 'تاکتیک کوتاه', long: 'تاکتیک طولانی',
    fork: 'چنگال (Fork)', pin: 'آچمز (Pin)', skewer: 'سیخ‌کباب (Skewer)',
    sacrifice: 'قربانی مهره', discoveredAttack: 'حمله برخاسته',
    endgame: 'آخر بازی', middlegame: 'وسط بازی', opening: 'گشایش',
    crushing: 'برتری قاطع', advantage: 'کسب برتری',
    defensiveMove: 'حرکت دفاعی', hangingPiece: 'مهره بی‌دفاع',
    capturingDefender: 'حذف مدافع', promotion: 'ترفیع پیاده',
    advancedPawn: 'پیاده رونده', backRankMate: 'مات عرض آخر',
    attraction: 'کیشش (جذب)', clearance: 'پاکسازی مسیر', deflection: 'انحراف مدافع',
    zugzwang: 'تسوگ‌تسوانگ', quietMove: 'حرکت آرام', xRayAttack: 'حمله اشعه ایکس',
    doubleCheck: 'کیش دوگانه', smotheredMate: 'مات خفه',
    enPassant: 'آن‌پاسان', castling: 'قلعه رفتن', master: 'بازی مسترها',
    masterVsMaster: 'مستر مقابل مستر', superGM: 'سوپراستادبزرگ'
};

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

export default function PuzzleBoard() {
    const { mode } = useParams();
    const navigate = useNavigate();
    
    // 🔥 فراخوانی استایل‌های پویا از هوک تم
    const { lightSquareStyle, darkSquareStyle, customPieces } = useChessTheme();

    const [game, setGame] = useState(new Chess());
    const [puzzleData, setPuzzleData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [loadError, setLoadError] = useState(false);
    
    const [puzzleMoves, setPuzzleMoves] = useState<string[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [status, setStatus] = useState<'playing' | 'solved' | 'wrong'>('playing');
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    
    const [clickedSquare, setClickedSquare] = useState<string | null>(null);
    const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
    const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, any>>({});
    const [feedback, setFeedback] = useState<{square: string, type: 'correct'|'wrong'} | null>(null);
    
    const [usedHint, setUsedHint] = useState(false);
    const [hintSquare, setHintSquare] = useState<string | null>(null);
    const [scoreChange, setScoreChange] = useState<number | null>(null);
    
    const [solutionViewed, setSolutionViewed] = useState(false);
    const [isShowingSolution, setIsShowingSolution] = useState(false);

    const [history, setHistory] = useState<{fen: string, lastMove: any}[]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const rawThemes = puzzleData?.themes || '';
    const themeList = rawThemes.includes(',') ? rawThemes.split(',') : rawThemes.split(' ');
    const translatedThemes = themeList.filter(Boolean).map((t: string) => THEME_DICTIONARY[t.trim()] || t.trim()).slice(0, 4);

    useEffect(() => {
        loadNewPuzzle();
    }, [mode]);

    const loadNewPuzzle = async () => {
        if (isShowingSolution) return;
        setIsLoading(true);
        setLoadError(false);
        setStatus('playing');
        setCurrentMoveIndex(0);
        setHistory([]);
        setHistoryIndex(0);
        setClickedSquare(null);
        setOptionSquares({});
        setLastMoveSquares({});
        setFeedback(null);
        setUsedHint(false);
        setSolutionViewed(false);
        setHintSquare(null);
        setScoreChange(null); 
        
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

            const pColor = newGame.turn() === 'w' ? 'black' : 'white';
            setPlayerColor(pColor);
            setGame(newGame);
            setHistory([{ fen: newGame.fen(), lastMove: null }]);

            setIsLoading(false);

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
            setLoadError(true);
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

    const attemptMove = async (sourceSquare: string, targetSquare: string, promotion = 'q') => {
        if (status !== 'playing' || historyIndex < history.length - 1 || isShowingSolution || loadError) return false;

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
            
            setLastMoveSquares({
                [sourceSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' },
                [targetSquare]: { backgroundColor: 'rgba(34, 197, 94, 0.5)' }
            });
            setFeedback({ square: targetSquare, type: 'correct' });
            
            setClickedSquare(null);
            setOptionSquares({});
            setHintSquare(null);
            
            const newHistory = [...history, { fen: newGame.fen(), lastMove: {from: sourceSquare, to: targetSquare} }];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);

            if (currentMoveIndex === puzzleMoves.length - 1) {
                try {
                    const res = await puzzleService.submitResult(puzzleData.rating, 1200, true, usedHint);
                    setScoreChange(res.ratingChange);
                } catch(e) { console.error(e); }

                setTimeout(() => {
                    setStatus('solved');
                    playSound('gameOver');
                }, 600);
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
                    setFeedback(null); 
                    setLastMoveSquares({
                        [from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                        [to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
                    });
                    setCurrentMoveIndex(currentMoveIndex + 2);
                    
                    setHistory(prev => [...prev, { fen: nextGame.fen(), lastMove: {from, to} }]);
                    setHistoryIndex(newHistory.length);
                }, 800);
            }
            return true;
        } else {
            try {
                const testGame = new Chess(game.fen());
                const isValid = testGame.move({ from: sourceSquare, to: targetSquare, promotion });
                
                if (isValid) {
                    try {
                        const res = await puzzleService.submitResult(puzzleData.rating, 1200, false, false);
                        setScoreChange(res.ratingChange);
                    } catch(e) { console.error(e); }

                    setStatus('wrong');
                    playSound('error');
                    setGame(testGame);
                    setLastMoveSquares({
                        [sourceSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.5)' },
                        [targetSquare]: { backgroundColor: 'rgba(239, 68, 68, 0.5)' }
                    });
                    setFeedback({ square: targetSquare, type: 'wrong' });
                    setOptionSquares({});
                    setClickedSquare(null);
                    setHintSquare(null);
                }
            } catch (e) {}
            return false;
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        setFeedback(null);
        attemptMove(sourceSquare, targetSquare);
        return true; 
    };

    const handleSquareClick = (square: string) => {
        setFeedback(null); 
        if (status !== 'playing' || historyIndex < history.length - 1 || isShowingSolution || loadError) return;

        if (clickedSquare) {
            if (clickedSquare === square) {
                setClickedSquare(null);
                setOptionSquares({});
                return;
            }
            const moves = game.moves({ square: clickedSquare as any, verbose: true });
            if (moves.find(m => m.to === square)) {
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

    const handleHint = () => {
        if (status !== 'playing' || historyIndex < history.length - 1 || isShowingSolution || loadError) return;
        
        setUsedHint(true); 
        const expectedMove = puzzleMoves[currentMoveIndex];
        if (!expectedMove) return;

        const fromSq = expectedMove.substring(0, 2);
        const toSq = expectedMove.substring(2, 4);
        const prom = expectedMove.length > 4 ? expectedMove[4] : 'q';

        if (!hintSquare || hintSquare !== fromSq) {
            setHintSquare(fromSq);
            setClickedSquare(fromSq);
            highlightLegalMoves(fromSq);
        } else {
            setHintSquare(null);
            attemptMove(fromSq, toSq, prom);
        }
    };

    const handleRetry = () => {
        setStatus('playing');
        setFeedback(null);
        setGame(new Chess(history[historyIndex].fen)); 
        
        if (history[historyIndex].lastMove) {
            setLastMoveSquares({
                [history[historyIndex].lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                [history[historyIndex].lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
            });
        }
    };

    const handleShowSolution = async () => {
        if (isShowingSolution || loadError) return;
        setIsShowingSolution(true);
        setSolutionViewed(true);
        setFeedback(null);
        setHintSquare(null);
        setOptionSquares({});
        setClickedSquare(null);
        
        let tempGame = new Chess(history[historyIndex].fen);
        setGame(new Chess(tempGame.fen()));
        setLastMoveSquares({});
        
        await new Promise(r => setTimeout(r, 500));

        for (let i = currentMoveIndex; i < puzzleMoves.length; i++) {
            await new Promise(r => setTimeout(r, 600)); 
            
            const expectedMove = puzzleMoves[i];
            const fromSq = expectedMove.substring(0, 2);
            const toSq = expectedMove.substring(2, 4);
            const prom = expectedMove.length > 4 ? expectedMove[4] : 'q';
            
            const result = tempGame.move({ from: fromSq, to: toSq, promotion: prom });
            
            if(result.captured) playSound('capture');
            else if(tempGame.isCheck()) playSound('check');
            else playSound('move');

            setGame(new Chess(tempGame.fen()));
            setLastMoveSquares({
                [fromSq]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                [toSq]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
            });
            
            setHistory(prev => {
                const newHist = [...prev, { fen: tempGame.fen(), lastMove: {from: fromSq, to: toSq} }];
                setHistoryIndex(newHist.length - 1);
                return newHist;
            });
        }
        
        playSound('gameOver');
        setStatus('solved');
        setIsShowingSolution(false);
    };

    const goStart = () => {
        if (history.length > 0 && !isShowingSolution) {
            setFeedback(null); setHistoryIndex(0); setGame(new Chess(history[0].fen)); setLastMoveSquares({}); setOptionSquares({}); setClickedSquare(null);
        }
    };
    const goBack = () => {
        if (historyIndex > 0 && !isShowingSolution) {
            setFeedback(null); const newIndex = historyIndex - 1; setHistoryIndex(newIndex); setGame(new Chess(history[newIndex].fen));
            if(history[newIndex].lastMove) { setLastMoveSquares({ [history[newIndex].lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [history[newIndex].lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }); } else setLastMoveSquares({});
            setOptionSquares({}); setClickedSquare(null);
        }
    };
    const goForward = () => {
        if (historyIndex < history.length - 1 && !isShowingSolution) {
            setFeedback(null); const newIndex = historyIndex + 1; setHistoryIndex(newIndex); setGame(new Chess(history[newIndex].fen));
            if(history[newIndex].lastMove) { setLastMoveSquares({ [history[newIndex].lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [history[newIndex].lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }); }
            setOptionSquares({}); setClickedSquare(null);
        }
    };
    const goEnd = () => {
        if (history.length > 0 && !isShowingSolution) {
            setFeedback(null); const newIndex = history.length - 1; setHistoryIndex(newIndex); setGame(new Chess(history[newIndex].fen));
            if(history[newIndex].lastMove) { setLastMoveSquares({ [history[newIndex].lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [history[newIndex].lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }); }
            setOptionSquares({}); setClickedSquare(null);
        }
    };

    const getSquareCoordinates = (square: string) => {
        const col = square.charCodeAt(0) - 97; 
        const row = parseInt(square[1]) - 1; 
        const isWhite = playerColor === 'white';
        return { x: isWhite ? col : 7 - col, y: isWhite ? 7 - row : row };
    };

    let finalCustomSquares = { ...lastMoveSquares, ...optionSquares };
    if (hintSquare && !loadError) {
        finalCustomSquares[hintSquare] = {
            ...finalCustomSquares[hintSquare],
            boxShadow: 'inset 0 0 25px 5px rgba(59, 130, 246, 0.8)',
            backgroundColor: 'rgba(59, 130, 246, 0.4)'
        };
    }

    return (
        <div className="min-h-[100dvh] bg-[#161512] text-zinc-200 flex flex-col items-center pb-10" dir="rtl">
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
                <button onClick={loadNewPuzzle} disabled={isShowingSolution} className="p-2 bg-[#262421] rounded-xl text-zinc-400 hover:text-farzin-accent disabled:opacity-50 transition-colors" title="بارگذاری مجدد">
                    <RefreshCw size={20} className={isShowingSolution ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="w-full max-w-md mt-6 px-4 relative z-0">
                {isLoading ? (
                    <div className="aspect-square w-full bg-[#1e1c19] rounded-xl flex items-center justify-center border border-[#35332e]">
                        <RefreshCw className="animate-spin text-farzin-accent" size={32} />
                    </div>
                ) : loadError ? (
                    <div className="aspect-square w-full bg-[#1e1c19] rounded-[4px] flex flex-col items-center justify-center border-4 border-[#35332e] text-center p-6 shadow-2xl">
                        <ShieldAlert size={48} className="text-zinc-600 mb-4 opacity-50" />
                        <h3 className="text-white font-black text-lg mb-2">پازلی یافت نشد!</h3>
                        <p className="text-zinc-400 text-xs leading-relaxed mb-6 px-4">
                            متأسفانه در حال حاضر پازلی با این تاکتیک در دیتابیس وجود ندارد. لطفاً موضوع دیگری را امتحان کنید.
                        </p>
                        <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-[#262421] hover:bg-[#35332e] text-white font-bold rounded-xl border border-[#35332e] transition-all flex items-center gap-2 shadow-sm">
                            بازگشت به منو
                        </button>
                    </div>
                ) : (
                    <div dir="ltr" className={`rounded-[4px] relative flex shadow-2xl border-4 transition-colors duration-300 ${status === 'wrong' ? 'border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : status === 'solved' ? (solutionViewed ? 'border-zinc-500/80 shadow-[0_0_30px_rgba(113,113,122,0.3)]' : usedHint ? 'border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-emerald-500/80 shadow-[0_0_30px_rgba(34,197,94,0.3)]') : 'border-[#35332e]'}`}>
                        
                        <Chessboard 
                            id="FarzinPuzzleBoard" 
                            position={game.fen()} 
                            onPieceDrop={onDrop}
                            onSquareClick={handleSquareClick}
                            boardOrientation={playerColor}
                            // 🔥 اعمال استایل‌های داینامیک
                            customDarkSquareStyle={darkSquareStyle} 
                            customLightSquareStyle={lightSquareStyle}
                            customPieces={customPieces}
                            // -----------------------------
                            customSquareStyles={finalCustomSquares}
                            animationDuration={250}
                            autoPromoteToQueen={true}
                        />

                        {feedback && (
                            <div className="absolute inset-0 pointer-events-none grid grid-cols-8 grid-rows-8 z-20">
                                {Array.from({ length: 64 }).map((_, i) => {
                                    const x = i % 8;
                                    const y = Math.floor(i / 8);
                                    const coords = getSquareCoordinates(feedback.square);
                                    
                                    if (x === coords.x && y === coords.y) {
                                        const isCorrect = feedback.type === 'correct';
                                        return (
                                            <div key={i} className="relative w-full h-full flex items-center justify-center">
                                                <motion.div 
                                                    animate={isCorrect ? { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] } : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} 
                                                    transition={{ duration: isCorrect ? 1.5 : 0.8, repeat: Infinity, ease: "easeInOut" }} 
                                                    className="absolute inset-0 z-0" 
                                                    style={{ background: isCorrect ? 'radial-gradient(circle, rgba(34,197,94,0) 10%, rgba(34,197,94,0.6) 60%, rgba(34,197,94,0) 100%)' : 'radial-gradient(circle, rgba(239,68,68,0) 10%, rgba(239,68,68,0.8) 60%, rgba(239,68,68,0) 100%)' }} 
                                                />
                                                <motion.div 
                                                    initial={{ scale: 0, opacity: 0 }} 
                                                    animate={{ scale: 1, opacity: 1 }} 
                                                    transition={{ type: "spring", stiffness: 400, damping: 20 }} 
                                                    className="absolute -top-[6px] -right-[6px] w-[22px] h-[22px] rounded-full flex items-center justify-center text-white shadow-[0_4px_10px_rgba(0,0,0,0.6)] border border-black/40 z-10" 
                                                    style={{ backgroundColor: isCorrect ? '#22c55e' : '#ef4444' }}
                                                >
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

            <div className="w-full max-w-md mt-6 px-4 flex flex-col gap-3">
                <div className="flex items-center justify-between bg-[#1e1c19] border border-[#35332e] rounded-2xl p-2">
                    <div className="flex h-[34px] items-center bg-[#262421] rounded-lg border border-[#35332e] overflow-hidden shadow-sm" dir="ltr">
                        <button onClick={goStart} disabled={loadError || historyIndex === 0 || status === 'wrong' || isShowingSolution} className="p-1.5 px-2 text-zinc-400 hover:text-white hover:bg-[#35332e] disabled:opacity-30 transition-colors h-full flex items-center"><Rewind size={17} /></button>
                        <button onClick={goBack} disabled={loadError || historyIndex === 0 || status === 'wrong' || isShowingSolution} className="p-1.5 px-2 text-zinc-400 hover:text-white hover:bg-[#35332e] disabled:opacity-30 transition-colors border-l border-[#35332e]/50 h-full flex items-center"><SkipBack size={17} /></button>
                        <button onClick={goForward} disabled={loadError || historyIndex === history.length - 1 || status === 'wrong' || isShowingSolution} className="p-1.5 px-2 text-zinc-400 hover:text-white hover:bg-[#35332e] disabled:opacity-30 transition-colors border-l border-[#35332e]/50 h-full flex items-center"><SkipForward size={17} /></button>
                        <button onClick={goEnd} disabled={loadError || historyIndex === history.length - 1 || status === 'wrong' || isShowingSolution} className="p-1.5 px-2 text-zinc-400 hover:text-white hover:bg-[#35332e] disabled:opacity-30 transition-colors border-l border-[#35332e]/50 h-full flex items-center"><FastForward size={17} /></button>
                    </div>

                    <div className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                        {loadError ? (
                            <><ShieldAlert size={14} className="text-zinc-500" /> در دسترس نیست</>
                        ) : status === 'playing' ? (
                            <><Zap size={14} className="text-yellow-500" /> نوبت شماست</>
                        ) : status === 'solved' ? (
                            solutionViewed ? <><Eye size={14} className="text-zinc-400" /> مشاهده حل</> : 
                            usedHint ? <><Lightbulb size={14} className="text-blue-500" /> با راهنمایی</> : <><CheckCircle2 size={14} className="text-emerald-500" /> حل شد</>
                        ) : (
                            <><ShieldAlert size={14} className="text-red-500" /> اشتباه</>
                        )}
                    </div>
                </div>

                {status === 'playing' && !loadError && (
                    <div className="flex gap-3 mt-2">
                        <button 
                            onClick={handleHint} disabled={isShowingSolution}
                            className="flex-1 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <Lightbulb size={18} />
                            {hintSquare ? 'اجرای حرکت' : 'راهنمایی'}
                        </button>
                        <button 
                            onClick={loadNewPuzzle} disabled={isShowingSolution}
                            className="flex-1 py-3 bg-[#262421] hover:bg-[#35332e] text-zinc-400 hover:text-white border border-[#35332e] rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <FastForward size={18} />
                            رد شدن
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {status === 'wrong' && !loadError && (
                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[400px] bg-[#1e1c19] border border-red-500/30 shadow-[0_20px_50px_rgba(239,68,68,0.15)] rounded-2xl p-5 z-50 flex flex-col gap-4">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4 text-red-400">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0 text-xl">💥</div>
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-lg text-white" dir="rtl">حرکت اشتباه!</span>
                                    <span className="text-xs opacity-80" dir="rtl">این بهترین جواب برای این پوزیشن نیست.</span>
                                </div>
                            </div>
                            {scoreChange !== null && (
                                <div className="flex flex-col items-center justify-center bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400">
                                    <TrendingDown size={14} className="mb-0.5" />
                                    <span className="font-black text-sm" dir="ltr">{scoreChange}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 w-full">
                            <button onClick={handleRetry} className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                <RotateCcw size={18} /> مجدد
                            </button>
                            <button onClick={handleShowSolution} className="flex-1 py-3.5 bg-[#262421] hover:bg-[#35332e] text-zinc-300 border border-[#35332e] rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                <Eye size={18} /> مشاهده حل
                            </button>
                        </div>
                    </motion.div>
                )}

                {status === 'solved' && !loadError && (
                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className={`fixed bottom-10 left-4 right-4 md:left-auto md:right-auto md:w-[400px] bg-[#1e1c19] border shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl p-5 z-50 flex flex-col gap-4 ${solutionViewed ? 'border-zinc-500/30' : usedHint ? 'border-blue-500/30' : 'border-emerald-500/30'}`}>
                        <div className="flex items-center justify-between w-full">
                            <div className={`flex items-center gap-4 ${solutionViewed ? 'text-zinc-400' : usedHint ? 'text-blue-400' : 'text-emerald-400'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 text-2xl ${solutionViewed ? 'bg-zinc-500/10 border-zinc-500/20 text-xl' : usedHint ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                    {solutionViewed ? '👁️' : usedHint ? '💡' : '🏆'}
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="font-black text-lg text-white" dir="rtl">
                                        {solutionViewed ? 'پاسخ پازل را دیدی' : usedHint ? 'با راهنمایی رد شدی' : 'آفرین! پازل حل شد'}
                                    </span>
                                    <span className="text-xs opacity-80" dir="rtl">
                                        {solutionViewed || usedHint ? 'برای این پازل امتیازی دریافت نمی‌کنی.' : 'امتیاز ریتینگ به حساب شما واریز شد.'}
                                    </span>
                                </div>
                            </div>
                            {scoreChange !== null && scoreChange > 0 && !usedHint && !solutionViewed && (
                                <div className="flex flex-col items-center justify-center bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                                    <TrendingUp size={14} className="mb-0.5" />
                                    <span className="font-black text-sm" dir="ltr">+{scoreChange}</span>
                                </div>
                            )}
                        </div>

                        {translatedThemes.length > 0 && (
                            <div className="w-full flex flex-wrap items-center gap-1.5 pt-3 mt-1 border-t border-[#35332e]" dir="rtl">
                                <Tag size={12} className="text-zinc-500 mr-1" />
                                {translatedThemes.map((t, idx) => (
                                    <span key={idx} className="bg-[#161512] text-zinc-400 border border-[#35332e] px-2.5 py-1 rounded-md text-[10px] font-bold">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}

                        <button onClick={loadNewPuzzle} className={`w-full py-3.5 text-[#161512] rounded-xl font-black flex items-center justify-center gap-2 transition-colors shadow-lg mt-1 ${solutionViewed ? 'bg-zinc-300 hover:bg-white' : usedHint ? 'bg-blue-500 hover:bg-blue-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}>
                            <ArrowRight size={18} /> پازل بعدی
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}