import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion } from 'framer-motion';
import { 
    ChevronRight, Target, Activity, Flame, Shield, BookOpen, 
    XCircle, HelpCircle, CheckCircle2, Star, Award, Zap, CircleSlash, Info, Crown
} from 'lucide-react';
import { useStockfish } from '../hooks/useStockfish';
import { isBookPosition } from '../utils/ecoParser';
import { getPieceValue } from '../utils/analysisConfig';

// 🌟 ریاضیات خالص Lichess (دست‌نخورده و دقیق)
const calcWinPercent = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);

const calcMoveAccuracy = (winBefore: number, winAfter: number) => {
    if (winAfter >= winBefore) return 100;
    const winDiff = winBefore - winAfter;
    const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) - 3.166924740191411;
    return Math.max(0, Math.min(100, raw + 1)); 
};

const standardDeviation = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length);
};

const calculateGameAccuracy = (accuracies: {acc: number, weight: number}[]) => {
    if (accuracies.length === 0) return 100;
    const sumWeights = accuracies.reduce((s, a) => s + a.weight, 0);
    const weightedMean = sumWeights > 0 ? accuracies.reduce((s, a) => s + (a.acc * a.weight), 0) / sumWeights : 100;
    const harmonicSum = accuracies.reduce((s, a) => s + (1 / Math.max(0.01, a.acc)), 0);
    const harmonicMean = harmonicSum > 0 ? accuracies.length / harmonicSum : 100;
    return (weightedMean + harmonicMean) / 2;
};

const getGamePhase = (fen: string, moveNumber: number) => {
    if (moveNumber <= 10 || isBookPosition(fen)) return 'opening';
    const nonPawns = fen.split(' ')[0].replace(/[^qrnbQRNB]/g, '');
    let weight = 0;
    for(let char of nonPawns) weight += getPieceValue(char);
    return weight < 14 ? 'endgame' : 'middlegame';
};

// 🔴 امن‌ترین روش استخراج نمره انجین (با فیلتر مقادیر نامعتبر)
const getWhiteScore = (line: any, isWhiteTurnForEval: boolean) => {
    let cp = (line.score || 0) * 100;
    if (line.mate !== undefined || line.mateIn !== undefined) {
        let mVal = parseInt(line.mateIn !== undefined ? line.mateIn : line.mate, 10);
        if (!isNaN(mVal)) {
            if (mVal > 0) cp = 10000;
            else if (mVal < 0) cp = -10000;
        }
    }
    return isWhiteTurnForEval ? cp : -cp;
};

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, y: 30, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function GameReport() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialData = location.state?.data || '';
    const meta = location.state?.meta || { white: {name: 'سفید'}, black: {name: 'سیاه'}, result: '*' };

    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    const [movesData, setMovesData] = useState<any[]>([]);
    const [engineResults, setEngineResults] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const { isReady, lines, analyze, stop, setOption } = useStockfish() as any;
    const [isWaitingReset, setIsWaitingReset] = useState(false);
    const startTimeRef = useRef(0);

    useEffect(() => {
        if (!initialData) { navigate('/analysis'); return; }
        try {
            const game = new Chess();
            game.loadPgn(initialData);
            const history = game.history({ verbose: true });
            const tempGame = new Chess();
            
            let parsed = [{ fen: tempGame.fen(), isBook: true, phase: 'opening', move: null, san: 'Start' }];
            history.forEach((m, idx) => {
                tempGame.move(m);
                const fen = tempGame.fen();
                parsed.push({ fen, isBook: isBookPosition(fen), phase: getGamePhase(fen, Math.ceil((idx+1)/2)), move: m, san: m.san });
            });
            setMovesData(parsed);
            setEngineResults(new Array(parsed.length).fill(null));
            setCurrentIndex(0);
        } catch (e) { navigate('/analysis'); }
    }, [initialData]);

    useEffect(() => {
        if (!isReady || movesData.length === 0 || currentIndex >= movesData.length) return;
        
        const currentMove = movesData[currentIndex];
        const tempG = new Chess(currentMove.fen);
        const isOver = typeof tempG.isGameOver === 'function' ? tempG.isGameOver() : (tempG as any).game_over();
        
        // بای‌پس موتور در پوزیشن‌های پایانی (توقف انتظار)
        if (isOver) {
            if (stop) stop();
            // نیازی به لاین واقعی نیست، چون ما مقادیر را دستی تزریق می‌کنیم
            setEngineResults(prev => {
                const newRes = [...prev];
                newRes[currentIndex] = [{ depth: 24, score: 0 }];
                return newRes;
            });
            setProgress(Math.round(((currentIndex + 1) / movesData.length) * 100));
            setCurrentIndex(idx => idx + 1);
            return;
        }

        if (setOption) setOption('MultiPV', 2); 
        setIsWaitingReset(true);
        startTimeRef.current = Date.now();
        analyze(currentMove.fen, 24); 
    }, [isReady, currentIndex, movesData]);

    useEffect(() => {
        if (lines && lines.length > 0 && lines[0].depth <= 4) setIsWaitingReset(false);

        if (isAnalyzing && !isWaitingReset && lines && lines.length > 0) {
            const timePassed = Date.now() - startTimeRef.current;
            const currentDepth = lines[0].depth;
            const isMate = lines[0].isMate;

            if ((timePassed >= 600 && currentDepth >= 16) || currentDepth >= 22 || (isMate && timePassed >= 200)) {
                if (stop) stop(); 
                setEngineResults(prev => {
                    const newRes = [...prev];
                    newRes[currentIndex] = lines;
                    return newRes;
                });
                setProgress(Math.round(((currentIndex + 1) / movesData.length) * 100));
                setCurrentIndex(idx => idx + 1);
            }
        }
    }, [lines, isAnalyzing, currentIndex, isWaitingReset]);

    useEffect(() => {
        if (movesData.length > 0 && currentIndex >= movesData.length) {
            setTimeout(() => setIsAnalyzing(false), 500);
        }
    }, [currentIndex, movesData]);

    const reportStats = useMemo(() => {
        if (!movesData || movesData.length < 2) return null;
        for (let i = 0; i < movesData.length; i++) {
            if (!engineResults[i] || !engineResults[i][0]) return null; 
        }
        
        const data = {
            white: { 
                accs: [] as {acc: number, weight: number}[], 
                counts: { brilliant:0, great:0, best:0, book:0, excellent:0, good:0, inaccuracy:0, mistake:0, blunder:0, miss:0 }, 
                phases: { op:[] as {acc: number, weight: number}[], mid:[] as {acc: number, weight: number}[], end:[] as {acc: number, weight: number}[] } 
            },
            black: { 
                accs: [] as {acc: number, weight: number}[], 
                counts: { brilliant:0, great:0, best:0, book:0, excellent:0, good:0, inaccuracy:0, mistake:0, blunder:0, miss:0 }, 
                phases: { op:[] as {acc: number, weight: number}[], mid:[] as {acc: number, weight: number}[], end:[] as {acc: number, weight: number}[] } 
            }
        };

        const graphPoints: any[] = [];
        const winPercentsWhitePOV: number[] = [];
        const wScoresGlobal: number[] = [];

        // 🔴 معماری ایزوله: پیش‌تولید امنِ امتیازها با اولویت دادن به قوانین قطعیِ بازی
        for (let i = 0; i < movesData.length; i++) {
            const tempG = new Chess(movesData[i].fen);
            const isCheckmated = typeof tempG.isCheckmate === 'function' ? tempG.isCheckmate() : (tempG as any).in_checkmate();
            
            let wScore = 0;
            if (isCheckmated) {
                // اگر در این پوزیشن، بازیکنی مات شده است، یعنی بازیکن قبلی مات کرده!
                // i % 2 === 0 به این معنی است که نوبت سفید است (یعنی سفید مات شده).
                wScore = (i % 2 === 0) ? -10000 : 10000;
            } else {
                const isWhiteTurnForEval = i % 2 === 0;
                wScore = getWhiteScore(engineResults[i][0], isWhiteTurnForEval);
            }
            wScoresGlobal.push(wScore);
            winPercentsWhitePOV.push(calcWinPercent(wScore));
        }

        const windowSize = Math.max(2, Math.min(8, Math.floor(winPercentsWhitePOV.length / 10)));

        for (let i = 1; i < movesData.length; i++) {
            const moveInfo = movesData[i];
            if (!moveInfo || !moveInfo.move) continue;
            
            const isWhiteTurn = (i - 1) % 2 === 0; 
            const side = isWhiteTurn ? data.white : data.black;

            // استفاده از امتیازهای ایزوله و مطمئن
            const wCpBefore = wScoresGlobal[i-1];
            const wCpAfter = wScoresGlobal[i];
            const cpLossRaw = !isWhiteTurn ? (wCpAfter - wCpBefore) : (wCpBefore - wCpAfter);
            const cpLoss = Math.max(0, cpLossRaw) / 100;

            const winBeforeGlobal = winPercentsWhitePOV[i-1];
            const winAfterGlobal = winPercentsWhitePOV[i];
            const winBefore = !isWhiteTurn ? 100 - winBeforeGlobal : winBeforeGlobal;
            const winAfter = !isWhiteTurn ? 100 - winAfterGlobal : winAfterGlobal;
            
            const epB = winBefore / 100;
            const epC = winAfter / 100;

            const parentLines = engineResults[i-1];
            let bestUciMove = '';
            const rawPv = parentLines[0].pv || '';
            const actualPv = rawPv.includes(' pv ') ? rawPv.split(' pv ')[1] : rawPv;
            if (actualPv) bestUciMove = actualPv.trim().split(' ')[0];
            const userUciMove = `${moveInfo.move.from}${moveInfo.move.to}${moveInfo.move.promotion || ''}`;

            const isEndgame = moveInfo.phase === 'endgame';
            const inaccuracyLimit = isEndgame ? 1.0 : 1.5;
            const mistakeLimit = isEndgame ? 2.0 : 2.5;

            let cls = 'good';
            if (moveInfo.isBook) {
                cls = 'book';
            } else if (wCpAfter === 10000 || wCpAfter === -10000 || userUciMove === bestUciMove || cpLoss <= 0.05) {
                // اگر حرکت باعث مات شدن یا برنده شدن قطعی شد، بهترین حرکت است.
                cls = 'best';
            } else if (epB < 0.10) {
                cls = cpLoss <= 0.50 ? 'excellent' : 'good';
            } else {
                if (cpLoss <= 0.20) cls = 'excellent';
                else if (cpLoss <= 0.50) cls = 'good';
                else if (cpLoss <= inaccuracyLimit) cls = 'inaccuracy';
                else if (cpLoss <= mistakeLimit) cls = 'mistake';
                else cls = 'blunder';
            }

            if (['inaccuracy', 'mistake', 'blunder'].includes(cls) && i >= 2) {
                const gpWCp = wScoresGlobal[i-2];
                const epA = (!isWhiteTurn ? 100 - calcWinPercent(gpWCp) : calcWinPercent(gpWCp)) / 100;
                if (epA <= 0.60 && (epB - epA >= 0.15) && epC <= epA + 0.10 && epC >= epA - 0.20) cls = 'miss';
            }

            if (['best', 'excellent'].includes(cls) && parentLines.length > 1) {
                const wCpSecond = getWhiteScore(parentLines[1], (i - 1) % 2 === 0);
                const epSecond = (!isWhiteTurn ? 100 - calcWinPercent(wCpSecond) : calcWinPercent(wCpSecond)) / 100;
                if (epB < 0.95 && epSecond < 0.90 && ((epB - epSecond >= 0.20) || (epB >= 0.45 && epSecond <= 0.25) || (epB >= 0.75 && epSecond <= 0.55))) {
                    cls = 'great';
                    try {
                        const tempG = new Chess(movesData[i].fen);
                        const oppMoves = tempG.moves({ verbose: true });
                        let isSacrifice = false;
                        for (const oppMove of oppMoves) {
                            if (oppMove.captured && ['n', 'b', 'r', 'q'].includes(oppMove.captured.toLowerCase())) {
                                const capVal = getPieceValue(oppMove.captured); 
                                tempG.move(oppMove.san);
                                let maxRecaptureVal = 0;
                                for (const ourMove of tempG.moves({ verbose: true })) {
                                    if (ourMove.to === oppMove.to && ourMove.captured) maxRecaptureVal = Math.max(maxRecaptureVal, getPieceValue(ourMove.captured));
                                }
                                tempG.undo();
                                if (capVal - maxRecaptureVal >= 2) { isSacrifice = true; break; }
                            }
                        }
                        if (isSacrifice && epB < 0.85) cls = 'brilliant';
                    } catch(e) {}
                }
            }

            const acc = moveInfo.isBook ? 100 : calcMoveAccuracy(winBefore, winAfter);
            const window = winPercentsWhitePOV.slice(Math.max(0, i - windowSize), i + 1);
            const weight = Math.max(0.5, Math.min(12, standardDeviation(window)));
            
            const accObj = { acc, weight };
            side.accs.push(accObj);
            side.counts[cls as keyof typeof side.counts]++;
            
            if (moveInfo.phase === 'opening') side.phases.op.push(accObj);
            else if (moveInfo.phase === 'middlegame') side.phases.mid.push(accObj);
            else if (moveInfo.phase === 'endgame') side.phases.end.push(accObj);

            graphPoints.push({ index: i, winPercent: winPercentsWhitePOV[i], cls, isWhiteTurn, san: moveInfo.san });
        }

        const calcPhaseAcc = (arr: {acc: number, weight: number}[]) => arr.length > 0 ? calculateGameAccuracy(arr) : null;

        const GRAPH_WIDTH = 1000; const GRAPH_HEIGHT = 200; const MID_Y = GRAPH_HEIGHT / 2;
        let linePath = `M 0,${GRAPH_HEIGHT - (winPercentsWhitePOV[0] / 100) * GRAPH_HEIGHT} `;
        graphPoints.forEach(pt => {
            const x = (pt.index / graphPoints.length) * GRAPH_WIDTH;
            const y = GRAPH_HEIGHT - (pt.winPercent / 100) * GRAPH_HEIGHT;
            linePath += `L ${x},${y} `; pt.x = x; pt.y = y; 
        });

        const areaWhite = `${linePath} L ${GRAPH_WIDTH},${MID_Y} L 0,${MID_Y} Z`;
        const areaBlack = `${linePath} L ${GRAPH_WIDTH},${MID_Y} L 0,${MID_Y} Z`;

        return {
            white: { 
                total: calculateGameAccuracy(data.white.accs), 
                counts: data.white.counts, 
                phases: { op: calcPhaseAcc(data.white.phases.op), mid: calcPhaseAcc(data.white.phases.mid), end: calcPhaseAcc(data.white.phases.end) } 
            },
            black: { 
                total: calculateGameAccuracy(data.black.accs), 
                counts: data.black.counts, 
                phases: { op: calcPhaseAcc(data.black.phases.op), mid: calcPhaseAcc(data.black.phases.mid), end: calcPhaseAcc(data.black.phases.end) } 
            },
            graph: { points: graphPoints, linePath, areaWhite, areaBlack, width: GRAPH_WIDTH, height: GRAPH_HEIGHT }
        };
    }, [engineResults, isAnalyzing, movesData]);

    if (isAnalyzing) {
        return (
            <div className="h-[100dvh] bg-[#0a0908] flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] max-w-[800px] max-h-[800px] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#77955620_100%)] animate-spin" style={{ animationDuration: '4s' }}></div>
                <div className="absolute inset-0 bg-[#0a0908]/80 backdrop-blur-[50px]"></div>

                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 w-full max-w-md bg-[#161512]/60 backdrop-blur-3xl border border-farzin-accent/30 p-12 rounded-[48px] shadow-[0_0_100px_rgba(119,149,86,0.15)] flex flex-col items-center">
                    <div className="relative w-40 h-40 mb-10">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="loadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#96bc4b" />
                                    <stop offset="100%" stopColor="#779556" />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="46" fill="none" stroke="#262421" strokeWidth="4" />
                            <motion.circle cx="50" cy="50" r="46" fill="none" stroke="url(#loadGrad)" strokeWidth="6" strokeDasharray="289" strokeDashoffset={289 - (289 * progress) / 100} strokeLinecap="round" className="transition-all duration-300" style={{ filter: 'drop-shadow(0 0 10px rgba(119,149,86,0.5))' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-white drop-shadow-lg">{progress}</span>
                            <span className="text-farzin-accent text-xl">%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                        <Activity size={24} className="text-farzin-accent animate-pulse" />
                        <h2 className="text-2xl font-black text-white tracking-tight">کالبدشکافی استراتژیک</h2>
                    </div>
                    <p className="text-sm text-zinc-400 text-center font-bold">موتور در حال ارزیابی {movesData.length} حرکت (مطابق آنالیز مربی) است. لطفا شکیبا باشید.</p>
                </motion.div>
            </div>
        );
    }

    if (!reportStats) return null;

    const ALL_CATEGORIES = [
        { label: 'درخشان', key: 'brilliant', icon: Zap, color: '#00ebff', bg: 'bg-[#00ebff]/10' },
        { label: 'عالی', key: 'great', icon: Award, color: '#5c8df7', bg: 'bg-[#5c8df7]/10' },
        { label: 'بهترین', key: 'best', icon: Star, color: '#96bc4b', bg: 'bg-[#96bc4b]/10' },
        { label: 'تئوری', key: 'book', icon: BookOpen, color: '#c27a3e', bg: 'bg-[#c27a3e]/10' },
        { label: 'دقیق', key: 'excellent', icon: CheckCircle2, color: '#779556', bg: 'bg-[#779556]/10' },
        { label: 'خوب', key: 'good', icon: CheckCircle2, color: '#a1a1aa', bg: 'bg-[#a1a1aa]/10' },
        { label: 'بی‌دقتی', key: 'inaccuracy', icon: Info, color: '#f59e0b', bg: 'bg-[#f59e0b]/10' },
        { label: 'اشتباه', key: 'mistake', icon: HelpCircle, color: '#ef4444', bg: 'bg-[#ef4444]/10' },
        { label: 'فرصت سوزی', key: 'miss', icon: CircleSlash, color: '#ff6b00', bg: 'bg-[#ff6b00]/10' },
        { label: 'بلاندر', key: 'blunder', icon: XCircle, color: '#b91c1c', bg: 'bg-[#b91c1c]/10' },
    ];

    const getMarkerColor = (cls: string) => ALL_CATEGORIES.find(c => c.key === cls)?.color || 'transparent';

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="min-h-screen bg-[#0a0908] pb-32 font-sans overflow-x-hidden" dir="rtl">
            <div className="fixed top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-farzin-accent/10 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none"></div>

            <motion.div variants={itemVariants} className="relative w-full pt-12 pb-8 px-4 z-10">
                <button onClick={() => navigate(-1)} className="absolute top-8 right-6 p-3 bg-[#1e1c19]/80 backdrop-blur-md rounded-2xl border border-[#35332e] text-zinc-400 hover:text-white transition-all shadow-xl hover:scale-105 z-20"><ChevronRight size={24} /></button>
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] bg-white text-zinc-900 flex items-center justify-center font-black text-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)]">W</div>
                        <span className="font-black text-sm text-white max-w-[120px] truncate bg-[#161512] px-4 py-1.5 rounded-full border border-[#35332e]">{meta.white.name}</span>
                    </div>
                    <div className="flex flex-col items-center px-4">
                        <span className="text-[10px] text-farzin-accent font-black tracking-[0.3em] uppercase mb-2 bg-farzin-accent/10 px-4 py-1 rounded-full border border-farzin-accent/20 flex items-center gap-2"><Crown size={12}/> گزارش پریمیوم فرزین</span>
                        <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" dir="ltr">{meta.result === '*' ? '½-½' : meta.result}</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] bg-[#1a1917] border-2 border-[#35332e] text-zinc-200 flex items-center justify-center font-black text-3xl shadow-2xl">B</div>
                        <span className="font-black text-sm text-white max-w-[120px] truncate bg-[#161512] px-4 py-1.5 rounded-full border border-[#35332e]">{meta.black.name}</span>
                    </div>
                </div>
            </motion.div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8 relative z-10 mt-6">
                
                <motion.div variants={itemVariants} className="bg-[#161512]/80 backdrop-blur-2xl border border-[#35332e]/80 rounded-[48px] p-8 sm:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-farzin-accent/50 to-transparent opacity-50"></div>
                    <h3 className="text-center font-black text-zinc-400 tracking-[0.2em] uppercase text-xs mb-8">Game Accuracy</h3>
                    
                    <div className="flex justify-around items-center">
                        {[ {side: 'سفید', acc: reportStats.white.total, color: '#fff'}, {side: 'سیاه', acc: reportStats.black.total, color: '#71717a'} ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center group cursor-pointer">
                                <div className="relative w-36 h-36 sm:w-44 sm:h-44 mb-6 transition-transform duration-500 group-hover:scale-105">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <defs>
                                            <linearGradient id={`grad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor={item.color} />
                                                <stop offset="100%" stopColor={item.color} stopOpacity="0.5" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#262421" strokeWidth="12" />
                                        <motion.circle initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * item.acc) / 100 }} transition={{ duration: 2, ease: "easeOut", delay: 0.5 }} cx="50" cy="50" r="42" fill="none" stroke={`url(#grad${i})`} strokeWidth="12" strokeDasharray="264" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 15px ${item.color}60)` }} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg">{item.acc.toFixed(1)}</span>
                                        <span className="text-zinc-500 font-bold text-sm">%</span>
                                    </div>
                                </div>
                                <div className="bg-[#1e1c19] px-6 py-2 rounded-full border border-[#35332e] shadow-lg">
                                    <span className="text-xs font-black text-white uppercase tracking-widest">دقت {item.side}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'گشایش', en: 'Opening', w: reportStats.white.phases.op, b: reportStats.black.phases.op, icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
                        { label: 'وسط بازی', en: 'Middlegame', w: reportStats.white.phases.mid, b: reportStats.black.phases.mid, icon: Flame, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
                        { label: 'آخر بازی', en: 'Endgame', w: reportStats.white.phases.end, b: reportStats.black.phases.end, icon: Shield, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' }
                    ].map((phase, i) => (
                        phase.w !== null && (
                            <div key={i} className={`flex flex-col items-center justify-between p-6 bg-[#161512]/80 backdrop-blur-md rounded-[32px] border ${phase.border} shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-all`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 ${phase.bg} blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2`}></div>
                                <div className="flex flex-col items-center gap-2 mb-6 relative z-10">
                                    <div className={`p-3 rounded-2xl ${phase.bg} ${phase.color} shadow-inner`}><phase.icon size={20} /></div>
                                    <span className="text-sm font-black text-white">{phase.label}</span>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{phase.en}</span>
                                </div>
                                <div className="w-full flex justify-between items-end relative z-10 px-2">
                                    <div className="flex flex-col items-center"><span className="text-xl font-black text-white">{phase.w.toFixed(1)}</span><span className="text-[10px] text-zinc-500 font-bold uppercase">سفید</span></div>
                                    <div className="h-8 w-[1px] bg-[#35332e]"></div>
                                    <div className="flex flex-col items-center"><span className="text-xl font-black text-zinc-400">{phase.b.toFixed(1)}</span><span className="text-[10px] text-zinc-500 font-bold uppercase">سیاه</span></div>
                                </div>
                            </div>
                        )
                    ))}
                </motion.div>

                <motion.div variants={itemVariants} className="bg-[#161512]/80 backdrop-blur-2xl border border-[#35332e] rounded-[48px] overflow-hidden shadow-2xl p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h3 className="text-sm font-black text-white flex items-center gap-3"><Activity size={20} className="text-farzin-accent" /> نبض استراتژیک بازی</h3>
                        <span className="text-[10px] font-black text-zinc-500 bg-[#1e1c19] px-3 py-1 rounded-full border border-[#35332e]">EVALUATION GRAPH</span>
                    </div>
                    <div className="relative w-full aspect-[2.5/1] sm:aspect-[3/1] bg-[#0a0908] rounded-[32px] border border-[#262421] overflow-hidden shadow-inner">
                        <svg viewBox={`0 0 ${reportStats.graph.width} ${reportStats.graph.height}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                            <path d={reportStats.graph.areaWhite} fill="#ffffff" fillOpacity="0.08" />
                            <path d={reportStats.graph.areaBlack} fill="#000000" fillOpacity="0.6" />
                            <path d={reportStats.graph.linePath} fill="none" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }} />
                            
                            {reportStats.graph.points.map((pt, i) => {
                                if (['blunder', 'mistake', 'miss', 'brilliant', 'great'].includes(pt.cls)) {
                                    const color = getMarkerColor(pt.cls);
                                    return (
                                        <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
                                            <circle r="8" fill={color} stroke="#0a0908" strokeWidth="3" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
                                            {pt.cls === 'brilliant' && <text y="1" fontSize="11" fill="#0a0908" fontWeight="black" textAnchor="middle" dominantBaseline="central">!</text>}
                                            {pt.cls === 'blunder' && <text y="1" fontSize="11" fill="#fff" fontWeight="black" textAnchor="middle" dominantBaseline="central">×</text>}
                                        </g>
                                    );
                                }
                                return null;
                            })}
                        </svg>
                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/20 pointer-events-none border-t border-dashed border-white/10" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-[#161512]/80 backdrop-blur-2xl border border-[#35332e] rounded-[48px] overflow-hidden shadow-2xl">
                    <div className="p-6 sm:p-8 bg-[#1a1917] border-b border-[#35332e] flex items-center justify-between">
                        <div className="flex items-center gap-3"><Target size={22} className="text-purple-400" /><span className="text-sm font-black text-white">کالبدشکافی حرکات</span></div>
                        <span className="text-[10px] font-black text-zinc-400 bg-[#262421] px-4 py-1.5 rounded-full shadow-inner">{movesData.length - 1} MOVE</span>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 gap-2">
                        {ALL_CATEGORIES.map((cat, i) => {
                            const wCount = reportStats.white.counts[cat.key as keyof typeof reportStats.white.counts];
                            const bCount = reportStats.black.counts[cat.key as keyof typeof reportStats.black.counts];
                            if (wCount === 0 && bCount === 0 && ['brilliant', 'great', 'miss'].includes(cat.key)) return null; 
                            
                            return (
                                <div key={i} className="flex items-center justify-between p-4 bg-[#0a0908]/50 hover:bg-[#1e1c19] border border-transparent hover:border-[#35332e] transition-all rounded-[24px] group">
                                    <span className={`w-14 text-center font-black text-xl ${wCount > 0 ? 'text-white' : 'text-zinc-600'}`}>{wCount}</span>
                                    <div className="flex items-center gap-3 flex-1 justify-center">
                                        <div className={`p-2 rounded-xl ${cat.bg} border border-[#35332e]/50 shadow-inner group-hover:scale-110 transition-transform`}><cat.icon size={18} style={{ color: cat.color }} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" /></div>
                                        <span className="text-sm font-black text-zinc-300 min-w-[120px] text-center">{cat.label}</span>
                                    </div>
                                    <span className={`w-14 text-center font-black text-xl ${bCount > 0 ? 'text-zinc-300' : 'text-zinc-600'}`}>{bCount}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col gap-4 mt-2">
                    <button onClick={() => navigate('/analysis/board', { state: location.state })} className="w-full bg-gradient-to-r from-farzin-accent to-[#5c7a40] text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(119,149,86,0.4)] transition-all active:scale-95 hover:shadow-[0_20px_60px_rgba(119,149,86,0.6)] group border border-[#8eb069]/50">
                        <Zap size={24} className="group-hover:scale-110 transition-transform" /> مرور حرکات با مربی فرزین
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="bg-[#1a1917] hover:bg-[#262421] text-white py-5 rounded-[28px] font-black text-sm border border-[#35332e] shadow-lg transition-all active:scale-95">اشتراک گزارش</button>
                        <button onClick={() => navigate('/analysis')} className="bg-[#1a1917] hover:bg-[#262421] text-white py-5 rounded-[28px] font-black text-sm border border-[#35332e] shadow-lg transition-all active:scale-95">بازی جدید</button>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}