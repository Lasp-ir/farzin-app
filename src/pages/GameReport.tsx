import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, Target, Activity, Flame, Shield, BookOpen, 
    XCircle, HelpCircle, CheckCircle2, Star, Award, Zap, CircleSlash, Info, Crown, Cpu
} from 'lucide-react';
import { useStockfish } from '../hooks/useStockfish';
import { isBookPosition } from '../utils/ecoParser';
import { getPieceValue, epFormula, getAbsScore } from '../utils/analysisConfig';

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

const DynamicChessLoader = ({ progress, totalMoves }: { progress: number, totalMoves: number }) => {
    const [scenario, setScenario] = useState(0);
    const [loadingText, setLoadingText] = useState("در حال خواندن ذهن حریف...");

    const SCENARIOS = useMemo(() => [
        { id: 1, p1: '♞', p2: '♗', a1: { y: [0, -30, 0], rotate: [0, 20, -20, 0] }, a2: { y: [0, -15, 0], scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] } },
        { id: 2, p1: '♖', p2: '♟', a1: { x: [0, 40, 0], scale: [1, 1.2, 1] }, a2: { x: [0, -40, 0], rotate: [0, -45, 0], opacity: [1, 0, 1] } },
        { id: 3, p1: '♕', p2: '♔', a1: { scale: [1, 1.5, 1], filter: ['drop-shadow(0 0 10px #779556)', 'drop-shadow(0 0 30px #779556)', 'drop-shadow(0 0 10px #779556)'] }, a2: { x: [0, 10, -10, 10, -10, 0] } },
        { id: 4, p1: '♘', p2: '♙', a1: { rotate: [0, 360], scale: [1, 0.8, 1] }, a2: { y: [0, -50, 0], filter: ['blur(0px)', 'blur(4px)', 'blur(0px)'] } },
    ], []);

    useEffect(() => {
        setScenario(Math.floor(Math.random() * SCENARIOS.length));
        const texts = ["کشف تاکتیک‌های پنهان...", "محاسبه احتمالات بی‌نهایت...", "استخراج نقاط ضعف...", "هماهنگی گراف با مربی..."];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % texts.length;
            setLoadingText(texts[idx]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const currentScenario = SCENARIOS[scenario] || SCENARIOS[0];

    return (
        <div className="flex flex-col items-center justify-center w-full h-full relative z-20">
            <div className="flex items-center justify-center gap-12 mb-12 h-32 relative">
                <div className="absolute inset-0 bg-farzin-accent/20 blur-[60px] rounded-full"></div>
                <motion.div animate={currentScenario.a1} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] text-white">
                    {currentScenario.p1}
                </motion.div>
                <motion.div animate={currentScenario.a2} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-7xl drop-shadow-[0_0_20px_rgba(119,149,86,0.8)] text-farzin-accent">
                    {currentScenario.p2}
                </motion.div>
            </div>
            <div className="relative w-48 h-48 mb-8">
                <div className="absolute inset-0 border-4 border-dashed border-[#35332e] rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border-2 border-[#1e1c19] rounded-full"></div>
                <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="loadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#96bc4b" />
                            <stop offset="100%" stopColor="#779556" />
                        </linearGradient>
                    </defs>
                    <motion.circle cx="50" cy="50" r="46" fill="none" stroke="url(#loadGrad)" strokeWidth="3" strokeDasharray="289" strokeDashoffset={289 - (289 * progress) / 100} strokeLinecap="round" className="transition-all duration-300" style={{ filter: 'drop-shadow(0 0 12px rgba(119,149,86,0.6))' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#110f0d]/50 backdrop-blur-sm rounded-full m-4">
                    <span className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{progress}<span className="text-xl text-farzin-accent">%</span></span>
                </div>
            </div>
            <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2"><Cpu size={20} className="text-farzin-accent animate-pulse" /> موتور هوش مصنوعی فرزین</h2>
            <AnimatePresence mode="wait">
                <motion.p key={loadingText} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-xs text-zinc-400 font-bold bg-[#1a1917] px-4 py-2 rounded-full border border-[#35332e] shadow-lg">
                    {loadingText} (حرکت {Math.ceil(progress * totalMoves / 100)} از {totalMoves})
                </motion.p>
            </AnimatePresence>
        </div>
    );
};

const pageTransition = { initial: { opacity: 0, scale: 0.98, filter: 'blur(10px)' }, animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } }, exit: { opacity: 0, scale: 1.02, filter: 'blur(10px)', transition: { duration: 0.4 } } };
const itemFadeIn = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

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
        if (isOver) {
            if (stop) stop();
            setEngineResults(prev => { const newRes = [...prev]; newRes[currentIndex] = [{ depth: 24, score: 0 }]; return newRes; });
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
                setEngineResults(prev => { const newRes = [...prev]; newRes[currentIndex] = lines; return newRes; });
                setProgress(Math.round(((currentIndex + 1) / movesData.length) * 100));
                setCurrentIndex(idx => idx + 1);
            }
        }
    }, [lines, isAnalyzing, currentIndex, isWaitingReset]);

    useEffect(() => {
        if (movesData.length > 0 && currentIndex >= movesData.length) setTimeout(() => setIsAnalyzing(false), 800);
    }, [currentIndex, movesData]);

    const reportStats = useMemo(() => {
        if (!movesData || movesData.length < 2) return null;
        for (let i = 0; i < movesData.length; i++) if (!engineResults[i] || !engineResults[i][0]) return null; 
        
        const data = {
            white: { accs: [] as {acc: number, weight: number}[], counts: { brilliant:0, great:0, best:0, book:0, excellent:0, good:0, inaccuracy:0, mistake:0, blunder:0, miss:0 }, phases: { op:[] as {acc: number, weight: number}[], mid:[] as {acc: number, weight: number}[], end:[] as {acc: number, weight: number}[] } },
            black: { accs: [] as {acc: number, weight: number}[], counts: { brilliant:0, great:0, best:0, book:0, excellent:0, good:0, inaccuracy:0, mistake:0, blunder:0, miss:0 }, phases: { op:[] as {acc: number, weight: number}[], mid:[] as {acc: number, weight: number}[], end:[] as {acc: number, weight: number}[] } }
        };

        const graphPoints: any[] = [];
        const winPercentsWhitePOV: number[] = [];
        const wScoresPawnsGlobal: number[] = [];
        const epGlobalRaw: number[] = [];

        for (let i = 0; i < movesData.length; i++) {
            const fenTurn = movesData[i].fen.split(' ')[1] as 'w' | 'b';
            const tempG = new Chess(movesData[i].fen);
            const isCheckmated = typeof tempG.isCheckmate === 'function' ? tempG.isCheckmate() : (tempG as any).in_checkmate();
            const isDraw = typeof tempG.isDraw === 'function' ? tempG.isDraw() : (tempG as any).in_draw();
            
            let wScorePawns = 0;
            let ep = 0.5;

            if (isCheckmated) {
                wScorePawns = fenTurn === 'b' ? 100 : -100;
                ep = epFormula(wScorePawns);
            } else if (isDraw) {
                wScorePawns = 0;
                ep = 0.5;
            } else if (engineResults[i] && engineResults[i][0]) {
                wScorePawns = getAbsScore(engineResults[i][0], fenTurn);
                ep = epFormula(wScorePawns);
            }

            wScoresPawnsGlobal.push(wScorePawns);
            epGlobalRaw.push(ep); 
            winPercentsWhitePOV.push(calcWinPercent(wScorePawns * 100)); 
        }

        const windowSize = Math.max(2, Math.min(8, Math.floor(winPercentsWhitePOV.length / 10)));

        for (let i = 1; i < movesData.length; i++) {
            const moveInfo = movesData[i];
            if (!moveInfo || !moveInfo.move) continue;
            
            const playerWhoMovedIsBlack = (i - 1) % 2 !== 0;
            const side = playerWhoMovedIsBlack ? data.black : data.white;

            const absScoreB = wScoresPawnsGlobal[i-1];
            const absScoreC = wScoresPawnsGlobal[i];

            let cpLossRaw = playerWhoMovedIsBlack ? (absScoreC - absScoreB) : (absScoreB - absScoreC);
            let cpLoss = Math.max(0, cpLossRaw);

            const getPlayerEP = (absSc: number) => epFormula(playerWhoMovedIsBlack ? -absSc : absSc);
            const epB = getPlayerEP(absScoreB);
            const epC = getPlayerEP(absScoreC);

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
            if (moveInfo.isBook) cls = 'book';
            else if (wScoresPawnsGlobal[i] === 100 || wScoresPawnsGlobal[i] === -100 || userUciMove === bestUciMove || cpLoss <= 0.05) cls = 'best';
            else if (epB < 0.10) cls = cpLoss <= 0.50 ? 'excellent' : 'good';
            else {
                if (cpLoss <= 0.20) cls = 'excellent';
                else if (cpLoss <= 0.50) cls = 'good';
                else if (cpLoss <= inaccuracyLimit) cls = 'inaccuracy';
                else if (cpLoss <= mistakeLimit) cls = 'mistake';
                else cls = 'blunder';
            }

            if (['inaccuracy', 'mistake', 'blunder'].includes(cls) && i >= 2) {
                const epA = getPlayerEP(wScoresPawnsGlobal[i-2]);
                if (epA <= 0.60 && (epB - epA >= 0.15) && epC <= epA + 0.10 && epC >= epA - 0.20) cls = 'miss';
            }

            if (['best', 'excellent'].includes(cls) && parentLines.length > 1) {
                const wCpSecond = getAbsScore(parentLines[1], playerWhoMovedIsBlack ? 'w' : 'b'); 
                const epSecond = getPlayerEP(wCpSecond);
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

            const winBeforeGlobal = winPercentsWhitePOV[i-1];
            const winAfterGlobal = winPercentsWhitePOV[i];
            const winBefore = playerWhoMovedIsBlack ? 100 - winBeforeGlobal : winBeforeGlobal;
            const winAfter = playerWhoMovedIsBlack ? 100 - winAfterGlobal : winAfterGlobal;
            
            const acc = moveInfo.isBook ? 100 : calcMoveAccuracy(winBefore, winAfter);
            const window = winPercentsWhitePOV.slice(Math.max(0, i - windowSize), i + 1);
            const weight = Math.max(0.5, Math.min(12, standardDeviation(window)));
            
            const accObj = { acc, weight };
            side.accs.push(accObj);
            side.counts[cls as keyof typeof side.counts]++;
            
            if (moveInfo.phase === 'opening') side.phases.op.push(accObj);
            else if (moveInfo.phase === 'middlegame') side.phases.mid.push(accObj);
            else if (moveInfo.phase === 'endgame') side.phases.end.push(accObj);

            graphPoints.push({ index: i, ep: epGlobalRaw[i], cls, isWhiteTurn: !playerWhoMovedIsBlack, san: moveInfo.san });
        }

        const calcPhaseAcc = (arr: {acc: number, weight: number}[]) => arr.length > 0 ? calculateGameAccuracy(arr) : null;

        const GRAPH_WIDTH = 1000; const GRAPH_HEIGHT = 200; const MID_Y = GRAPH_HEIGHT / 2;
        let linePath = `M 0,${GRAPH_HEIGHT - (epGlobalRaw[0]) * GRAPH_HEIGHT} `;
        graphPoints.forEach(pt => {
            const x = (pt.index / graphPoints.length) * GRAPH_WIDTH;
            const y = GRAPH_HEIGHT - (pt.ep) * GRAPH_HEIGHT;
            linePath += `L ${x},${y} `; pt.x = x; pt.y = y; 
        });

        const areaWhite = `${linePath} L ${GRAPH_WIDTH},${MID_Y} L 0,${MID_Y} Z`;
        const areaBlack = `${linePath} L ${GRAPH_WIDTH},${MID_Y} L 0,${MID_Y} Z`;

        return {
            white: { total: calculateGameAccuracy(data.white.accs), counts: data.white.counts, phases: { op: calcPhaseAcc(data.white.phases.op), mid: calcPhaseAcc(data.white.phases.mid), end: calcPhaseAcc(data.white.phases.end) } },
            black: { total: calculateGameAccuracy(data.black.accs), counts: data.black.counts, phases: { op: calcPhaseAcc(data.black.phases.op), mid: calcPhaseAcc(data.black.phases.mid), end: calcPhaseAcc(data.black.phases.end) } },
            graph: { points: graphPoints, linePath, areaWhite, areaBlack, width: GRAPH_WIDTH, height: GRAPH_HEIGHT }
        };
    }, [engineResults, isAnalyzing, movesData]);

    if (isAnalyzing) {
        return (
            <AnimatePresence>
                {/* 🔴 استفاده از fixed inset-0 برای حل مشکل اسکرول در لودینگ */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-6 overflow-hidden" dir="rtl">
                    <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-farzin-accent/20 blur-[120px] rounded-full mix-blend-screen animate-pulse pointer-events-none"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
                    
                    <div className="relative z-10 w-full max-w-md">
                        <DynamicChessLoader progress={progress} totalMoves={movesData.length} />
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    if (!reportStats) return null;

    const ALL_CATEGORIES = [
        { label: 'درخشان', key: 'brilliant', icon: Zap, color: '#00ebff', bg: 'bg-[#00ebff]/10', border: 'border-[#00ebff]/30' },
        { label: 'عالی', key: 'great', icon: Award, color: '#5c8df7', bg: 'bg-[#5c8df7]/10', border: 'border-[#5c8df7]/30' },
        { label: 'بهترین', key: 'best', icon: Star, color: '#96bc4b', bg: 'bg-[#96bc4b]/10', border: 'border-[#96bc4b]/30' },
        { label: 'تئوری', key: 'book', icon: BookOpen, color: '#c27a3e', bg: 'bg-[#c27a3e]/10', border: 'border-[#c27a3e]/30' },
        { label: 'دقیق', key: 'excellent', icon: CheckCircle2, color: '#779556', bg: 'bg-[#779556]/10', border: 'border-[#779556]/30' },
        { label: 'خوب', key: 'good', icon: CheckCircle2, color: '#a1a1aa', bg: 'bg-[#a1a1aa]/10', border: 'border-[#a1a1aa]/30' },
        { label: 'بی‌دقتی', key: 'inaccuracy', icon: Info, color: '#f59e0b', bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]/30' },
        { label: 'اشتباه', key: 'mistake', icon: HelpCircle, color: '#ef4444', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/30' },
        { label: 'فرصت سوزی', key: 'miss', icon: CircleSlash, color: '#ff6b00', bg: 'bg-[#ff6b00]/10', border: 'border-[#ff6b00]/30' },
        { label: 'بلاندر', key: 'blunder', icon: XCircle, color: '#b91c1c', bg: 'bg-[#b91c1c]/10', border: 'border-[#b91c1c]/30' },
    ];

    const getMarkerColor = (cls: string) => ALL_CATEGORIES.find(c => c.key === cls)?.color || 'transparent';

    return (
        // 🔴 استفاده از fixed inset-0 و overflow-y-auto برای رفع قطعی اسکرول دوتایی
        <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition} className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#050505] pb-32 font-sans overflow-y-auto overflow-x-hidden custom-scrollbar" dir="rtl">
            <div className="fixed top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-farzin-accent/10 blur-[180px] rounded-full pointer-events-none z-0"></div>
            <div className="fixed bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5c8df7]/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

            <motion.div variants={itemFadeIn} className="relative w-full pt-10 pb-6 px-4 z-10">
                <button onClick={() => navigate(-1)} className="absolute top-8 right-4 sm:right-8 p-3 bg-[#1e1c19]/50 backdrop-blur-xl rounded-2xl border border-white/5 text-zinc-400 hover:text-white transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-105 hover:bg-white/5 z-20"><ChevronRight size={24} /></button>
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] bg-gradient-to-br from-white to-zinc-300 text-zinc-900 flex items-center justify-center font-black text-4xl shadow-[0_10px_40px_rgba(255,255,255,0.15)]">W</div>
                        <span className="font-black text-sm text-white max-w-[120px] truncate bg-[#161512]/80 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-lg">{meta.white.name}</span>
                    </div>
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] sm:text-[11px] text-farzin-accent font-black tracking-[0.3em] uppercase mb-3 bg-farzin-accent/10 px-4 py-1.5 rounded-full border border-farzin-accent/30 flex items-center gap-2 shadow-[0_0_15px_rgba(119,149,86,0.2)]"><Crown size={14}/> گزارش پریمیوم</span>
                        <span className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 drop-shadow-[0_10px_20px_rgba(255,255,255,0.1)]" dir="ltr">{meta.result === '*' ? '½-½' : meta.result}</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] bg-gradient-to-br from-[#262421] to-[#12110f] border border-[#35332e] text-zinc-200 flex items-center justify-center font-black text-4xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">B</div>
                        <span className="font-black text-sm text-white max-w-[120px] truncate bg-[#161512]/80 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-lg">{meta.black.name}</span>
                    </div>
                </div>
            </motion.div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-6 sm:gap-8 relative z-10 mt-4">
                
                <motion.div variants={itemFadeIn} className="bg-[#11100e]/60 backdrop-blur-3xl border border-white/5 rounded-[40px] sm:rounded-[56px] p-8 sm:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.6)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-farzin-accent/60 to-transparent"></div>
                    <h3 className="text-center font-black text-zinc-500 tracking-[0.3em] uppercase text-xs mb-10 flex items-center justify-center gap-2"><Target size={16}/> Game Accuracy</h3>
                    
                    <div className="flex justify-around items-center">
                        {[ {side: 'سفید', acc: reportStats.white.total, color: '#ffffff', glow: 'rgba(255,255,255,0.4)'}, {side: 'سیاه', acc: reportStats.black.total, color: '#a1a1aa', glow: 'rgba(161,161,170,0.2)'} ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center group">
                                <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-8 transition-all duration-700 group-hover:scale-110">
                                    <div className="absolute inset-0 rounded-full blur-[40px] opacity-40 transition-opacity duration-700 group-hover:opacity-80" style={{ backgroundColor: item.color }}></div>
                                    <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="44" fill="none" stroke="#262421" strokeWidth="8" />
                                        <motion.circle initial={{ strokeDashoffset: 276 }} animate={{ strokeDashoffset: 276 - (276 * item.acc) / 100 }} transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }} cx="50" cy="50" r="44" fill="none" stroke={item.color} strokeWidth="8" strokeDasharray="276" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${item.glow})` }} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                        <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">{item.acc.toFixed(1)}</span>
                                        <span className="text-zinc-400 font-black text-sm uppercase tracking-widest mt-1">Percent</span>
                                    </div>
                                </div>
                                <div className="bg-[#1e1c19]/80 backdrop-blur-md px-8 py-2.5 rounded-full border border-white/10 shadow-xl group-hover:bg-white/10 transition-colors">
                                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">دقت {item.side}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemFadeIn} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {[
                        { label: 'گشایش', en: 'Opening', w: reportStats.white.phases.op, b: reportStats.black.phases.op, icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', glow: 'shadow-[0_0_30px_rgba(251,191,36,0.1)]' },
                        { label: 'وسط بازی', en: 'Middlegame', w: reportStats.white.phases.mid, b: reportStats.black.phases.mid, icon: Flame, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.1)]' },
                        { label: 'آخر بازی', en: 'Endgame', w: reportStats.white.phases.end, b: reportStats.black.phases.end, icon: Shield, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20', glow: 'shadow-[0_0_30px_rgba(56,189,248,0.1)]' }
                    ].map((phase, i) => (
                        phase.w !== null && (
                            <div key={i} className={`flex flex-col items-center justify-between p-6 sm:p-8 bg-[#11100e]/60 backdrop-blur-2xl rounded-[40px] border ${phase.border} ${phase.glow} relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 ${phase.bg} blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`}></div>
                                <div className="flex flex-col items-center gap-2 mb-8 relative z-10">
                                    <div className={`p-4 rounded-3xl ${phase.bg} ${phase.color} shadow-inner mb-2`}><phase.icon size={24} /></div>
                                    <span className="text-base font-black text-white">{phase.label}</span>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{phase.en}</span>
                                </div>
                                <div className="w-full flex justify-between items-center relative z-10 bg-black/40 px-4 py-3 rounded-2xl border border-white/5">
                                    <div className="flex flex-col items-center"><span className="text-xl font-black text-white">{phase.w.toFixed(1)}</span></div>
                                    <div className="h-6 w-[2px] bg-[#35332e] rounded-full"></div>
                                    <div className="flex flex-col items-center"><span className="text-xl font-black text-zinc-400">{phase.b.toFixed(1)}</span></div>
                                </div>
                            </div>
                        )
                    ))}
                </motion.div>

                <motion.div variants={itemFadeIn} className="bg-[#11100e]/60 backdrop-blur-3xl border border-white/5 rounded-[40px] sm:rounded-[56px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-6 sm:p-10">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-3"><Activity size={22} className="text-farzin-accent" /> نبض استراتژیک بازی</h3>
                        <span className="text-[9px] sm:text-[11px] font-black text-zinc-400 bg-[#1e1c19] px-4 py-2 rounded-full border border-[#35332e] tracking-widest shadow-inner">EVALUATION GRAPH</span>
                    </div>
                    <div className="relative w-full aspect-[2/1] sm:aspect-[3/1] bg-[#000000] rounded-[32px] sm:rounded-[40px] border border-[#262421] overflow-hidden shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)]">
                        <svg viewBox={`0 0 ${reportStats.graph.width} ${reportStats.graph.height}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                            <path d={reportStats.graph.areaWhite} fill="#ffffff" fillOpacity="0.1" />
                            <path d={reportStats.graph.areaBlack} fill="#000000" fillOpacity="0.8" />
                            <path d={reportStats.graph.linePath} fill="none" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
                            
                            {reportStats.graph.points.map((pt, i) => {
                                if (['blunder', 'mistake', 'miss', 'brilliant', 'great'].includes(pt.cls)) {
                                    const color = getMarkerColor(pt.cls);
                                    return (
                                        <g key={i} transform={`translate(${pt.x}, ${pt.y})`} className="cursor-crosshair hover:scale-150 transition-transform">
                                            <circle r="8" fill={color} stroke="#000" strokeWidth="3" style={{ filter: `drop-shadow(0 0 12px ${color})` }} />
                                            {pt.cls === 'brilliant' && <text y="1" fontSize="12" fill="#000" fontWeight="black" textAnchor="middle" dominantBaseline="central">!</text>}
                                            {pt.cls === 'blunder' && <text y="1" fontSize="12" fill="#fff" fontWeight="black" textAnchor="middle" dominantBaseline="central">×</text>}
                                        </g>
                                    );
                                }
                                return null;
                            })}
                        </svg>
                        <div className="absolute inset-x-0 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                    </div>
                </motion.div>

                <motion.div variants={itemFadeIn} className="bg-[#11100e]/60 backdrop-blur-3xl border border-white/5 rounded-[40px] sm:rounded-[56px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                    <div className="p-6 sm:p-10 bg-gradient-to-b from-[#1a1917]/80 to-transparent border-b border-[#35332e] flex items-center justify-between">
                        <div className="flex items-center gap-3"><Target size={24} className="text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.5)]" /><span className="text-base font-black text-white">کالبدشکافی حرکات</span></div>
                        <span className="text-[10px] sm:text-xs font-black text-zinc-400 bg-black/50 px-5 py-2 rounded-full shadow-inner border border-white/5 tracking-widest">{movesData.length - 1} MOVES</span>
                    </div>
                    <div className="p-4 sm:p-8 grid grid-cols-1 gap-3">
                        {ALL_CATEGORIES.map((cat, i) => {
                            const wCount = reportStats.white.counts[cat.key as keyof typeof reportStats.white.counts];
                            const bCount = reportStats.black.counts[cat.key as keyof typeof reportStats.black.counts];
                            if (wCount === 0 && bCount === 0 && ['brilliant', 'great', 'miss'].includes(cat.key)) return null; 
                            
                            return (
                                <div key={i} className="flex items-center justify-between p-4 sm:p-5 bg-black/40 hover:bg-[#1a1917] border border-transparent hover:border-[#35332e] transition-all rounded-[32px] group">
                                    <span className={`w-16 text-center font-black text-2xl ${wCount > 0 ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-zinc-700'}`}>{wCount}</span>
                                    <div className="flex items-center gap-4 flex-1 justify-center">
                                        <div className={`p-3 rounded-2xl ${cat.bg} ${cat.border} border shadow-inner group-hover:scale-110 transition-transform duration-300`}><cat.icon size={20} style={{ color: cat.color }} className="drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" /></div>
                                        <span className="text-sm sm:text-base font-black text-zinc-200 min-w-[120px] text-center tracking-wide">{cat.label}</span>
                                    </div>
                                    <span className={`w-16 text-center font-black text-2xl ${bCount > 0 ? 'text-zinc-400' : 'text-zinc-700'}`}>{bCount}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div variants={itemFadeIn} className="flex flex-col gap-4 mt-4">
                    <button onClick={() => navigate('/analysis/board', { state: location.state })} className="w-full relative overflow-hidden bg-gradient-to-r from-farzin-accent to-[#5c7a40] text-white py-7 rounded-[40px] font-black text-xl flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(119,149,86,0.4)] transition-all active:scale-95 hover:shadow-[0_20px_60px_rgba(119,149,86,0.6)] group border border-[#8eb069]/50">
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
                        <Zap size={28} className="group-hover:scale-110 transition-transform drop-shadow-lg" /> مرور بازی با مربی فرزین
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="bg-[#11100e]/80 backdrop-blur-xl hover:bg-[#1e1c19] text-white py-6 rounded-[32px] font-black text-sm border border-white/10 shadow-xl transition-all active:scale-95">اشتراک‌گذاری گزارش</button>
                        <button onClick={() => navigate('/analysis')} className="bg-[#11100e]/80 backdrop-blur-xl hover:bg-[#1e1c19] text-white py-6 rounded-[32px] font-black text-sm border border-white/10 shadow-xl transition-all active:scale-95">آنالیز بازی جدید</button>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
}