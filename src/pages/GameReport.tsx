import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion } from 'framer-motion';
import { 
    ChevronRight, Target, Activity, Flame, Shield, BookOpen, 
    XCircle, HelpCircle, CheckCircle2, Star, Award, Zap, CircleSlash, Info
} from 'lucide-react';
import { useStockfish } from '../hooks/useStockfish';
import { isBookPosition } from '../utils/ecoParser';
import { getPieceValue } from '../utils/analysisConfig';

// 🌟 ۱. ریاضیات دقیق Lichess برای محاسبه درصد دقت 🌟
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
    const weightedMean = accuracies.reduce((s, a) => s + (a.acc * a.weight), 0) / (sumWeights || 1);
    const harmonicSum = accuracies.reduce((s, a) => s + (1 / Math.max(0.1, a.acc)), 0);
    const harmonicMean = accuracies.length / harmonicSum;
    return (weightedMean + harmonicMean) / 2;
};

// 🌟 ۲. منطق همگام‌سازی فازها و گرفتن امتیازات خام
const getGamePhase = (fen: string, moveNumber: number) => {
    if (moveNumber <= 10 || isBookPosition(fen)) return 'opening';
    const nonPawns = fen.split(' ')[0].replace(/[^qrnbQRNB]/g, '');
    let weight = 0;
    for(let char of nonPawns) weight += getPieceValue(char);
    return weight < 14 ? 'endgame' : 'middlegame';
};

const getWhiteScore = (line: any) => line.isMate ? (line.mateIn > 0 ? 10000 : -10000) : line.score * 100;

export default function GameReport() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialData = location.state?.data || '';
    const meta = location.state?.meta || { white: {name: 'سفید'}, black: {name: 'سیاه'}, result: '*' };

    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    
    // دیتای بازی
    const [movesData, setMovesData] = useState<any[]>([]);
    
    // ذخیره نتیجه تحلیل استوک‌فیش برای تک تک پوزیشن‌ها
    const [engineResults, setEngineResults] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const { isReady, lines, analyze, stop, setOption } = useStockfish() as any;
    
    const [isWaitingReset, setIsWaitingReset] = useState(false);
    const startTimeRef = useRef(0);

    // آماده‌سازی اولیه پوزیشن‌ها
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

    // حلقه آنالیز با Throttle (تزریق زمان و MultiPV)
    useEffect(() => {
        if (!isReady || movesData.length === 0 || currentIndex >= movesData.length) return;
        
        if (setOption) setOption('MultiPV', 2); // ضروری برای تشخیص Great/Brilliant
        
        setIsWaitingReset(true);
        startTimeRef.current = Date.now();
        analyze(movesData[currentIndex].fen, 24); // درخواست عمق بی‌نهایت، خودمان متوقفش می‌کنیم
        
    }, [isReady, currentIndex, movesData]);

    // چک کردن زمان و عمق به صورت هیبریدی
    useEffect(() => {
        if (lines && lines.length > 0 && lines[0].depth <= 4) setIsWaitingReset(false);

        if (isAnalyzing && !isWaitingReset && lines && lines.length > 0) {
            const timePassed = Date.now() - startTimeRef.current;
            const currentDepth = lines[0].depth;
            const isMate = lines[0].isMate;

            // 🌟 شرط پایان تحلیل یک حرکت: حداقل 800ms و عمق 16، یا رسیدن به عمق 22
            if ((timePassed >= 800 && currentDepth >= 16) || currentDepth >= 22 || (isMate && timePassed >= 400)) {
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

    // پایان کل پروسه
    useEffect(() => {
        if (movesData.length > 0 && currentIndex >= movesData.length) {
            setTimeout(() => setIsAnalyzing(false), 500);
        }
    }, [currentIndex, movesData]);

    // 🌟 ۳. کالبدشکافی دقیق منطبق با AnalysisBoard
    const reportStats = useMemo(() => {
        if (engineResults.includes(null) || engineResults.length < 2) return null;
        
        const data = {
            white: { accs: [] as any[], counts: { brilliant:0, great:0, best:0, book:0, excellent:0, good:0, inaccuracy:0, mistake:0, blunder:0, miss:0 }, phases: { op:[] as number[], mid:[] as number[], end:[] as number[] } },
            black: { accs: [] as any[], counts: { brilliant:0, great:0, best:0, book:0, excellent:0, good:0, inaccuracy:0, mistake:0, blunder:0, miss:0 }, phases: { op:[] as number[], mid:[] as number[], end:[] as number[] } }
        };

        const graphPoints: any[] = [];
        const winPercentsWhitePOV: number[] = [];

        // استخراج Win% جهانی برای ترسیم گراف
        engineResults.forEach(lines => {
            const wScore = getWhiteScore(lines[0]);
            winPercentsWhitePOV.push(calcWinPercent(wScore));
        });

        const windowSize = Math.max(2, Math.min(8, Math.floor(winPercentsWhitePOV.length / 10)));

        for (let i = 1; i < engineResults.length; i++) {
            const parentLines = engineResults[i-1];
            const currentLines = engineResults[i];
            const moveInfo = movesData[i];
            
            const isWhiteTurn = (i - 1) % 2 === 0; // بازیکنی که حرکت i را انجام داده
            const side = isWhiteTurn ? data.white : data.black;

            const wScoreBefore = getWhiteScore(parentLines[0]);
            const wScoreAfter = getWhiteScore(currentLines[0]);

            // CpLoss دقیقا با فرمول AnalysisBoard
            const cpLossRaw = isWhiteTurn ? wScoreBefore - wScoreAfter : wScoreAfter - wScoreBefore;
            const cpLoss = Math.max(0, cpLossRaw) / 100;

            const winBefore = calcWinPercent(isWhiteTurn ? wScoreBefore : -wScoreBefore);
            const winAfter = calcWinPercent(isWhiteTurn ? wScoreAfter : -wScoreAfter);
            const epB = winBefore / 100;
            const epC = winAfter / 100;

            // تشخیص بهترین حرکت انجین
            let bestUciMove = '';
            const rawPv = parentLines[0].pv || '';
            const actualPv = rawPv.includes(' pv ') ? rawPv.split(' pv ')[1] : rawPv;
            if (actualPv) bestUciMove = actualPv.trim().split(' ')[0];
            const userUciMove = `${moveInfo.move.from}${moveInfo.move.to}${moveInfo.move.promotion || ''}`;

            const isEndgame = moveInfo.phase === 'endgame';
            const inaccuracyLimit = isEndgame ? 1.0 : 1.5;
            const mistakeLimit = isEndgame ? 2.0 : 2.5;

            // 🌟 هسته تطبیق لیبل‌ها (Copy from AnalysisBoard)
            let cls = 'good';
            if (moveInfo.isBook) {
                cls = 'book';
            } else if (currentLines[0].isMate || userUciMove === bestUciMove || cpLoss <= 0.05) {
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

            // تشخیص Miss (پدربزرگ)
            if (['inaccuracy', 'mistake', 'blunder'].includes(cls) && i >= 2) {
                const gpLines = engineResults[i-2];
                const gpWScore = getWhiteScore(gpLines[0]);
                const epA = calcWinPercent(isWhiteTurn ? gpWScore : -gpWScore) / 100;
                if (epA <= 0.60 && (epB - epA >= 0.15) && epC <= epA + 0.10 && epC >= epA - 0.20) {
                    cls = 'miss';
                }
            }

            // تشخیص Great / Brilliant
            if (['best', 'excellent'].includes(cls) && parentLines.length > 1) {
                const wScoreSecond = getWhiteScore(parentLines[1]);
                const epSecond = calcWinPercent(isWhiteTurn ? wScoreSecond : -wScoreSecond) / 100;
                if (epB < 0.95 && epSecond < 0.90 && ((epB - epSecond >= 0.20) || (epB >= 0.45 && epSecond <= 0.25) || (epB >= 0.75 && epSecond <= 0.55))) {
                    cls = 'great';
                    // تشخیص فداکاری (Brilliant)
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
                }
            }

            // ثبت آمار
            const acc = moveInfo.isBook ? 100 : calcMoveAccuracy(winBefore, winAfter);
            const window = winPercentsWhitePOV.slice(Math.max(0, i - windowSize), i + 1);
            const weight = Math.max(0.5, Math.min(12, standardDeviation(window)));
            
            side.accs.push({ acc, weight });
            side.counts[cls as keyof typeof side.counts]++;
            
            if (moveInfo.phase === 'opening') side.phases.op.push(acc);
            else if (moveInfo.phase === 'middlegame') side.phases.mid.push(acc);
            else if (moveInfo.phase === 'endgame') side.phases.end.push(acc);

            graphPoints.push({ index: i, winPercent: winPercentsWhitePOV[i], cls, san: moveInfo.san });
        }

        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a,b)=>a+b,0)/arr.length : null;

        const GRAPH_WIDTH = 1000;
        const GRAPH_HEIGHT = 200;
        const MID_Y = GRAPH_HEIGHT / 2;
        
        let linePath = `M 0,${GRAPH_HEIGHT - (winPercentsWhitePOV[0] / 100) * GRAPH_HEIGHT} `;
        graphPoints.forEach(pt => {
            const x = (pt.index / graphPoints.length) * GRAPH_WIDTH;
            const y = GRAPH_HEIGHT - (pt.winPercent / 100) * GRAPH_HEIGHT;
            linePath += `L ${x},${y} `;
            pt.x = x; pt.y = y; 
        });

        const areaWhite = `${linePath} L ${GRAPH_WIDTH},${MID_Y} L 0,${MID_Y} Z`;
        const areaBlack = `${linePath} L ${GRAPH_WIDTH},${MID_Y} L 0,${MID_Y} Z`;

        return {
            white: { total: calculateGameAccuracy(data.white.accs), counts: data.white.counts, phases: { op: avg(data.white.phases.op), mid: avg(data.white.phases.mid), end: avg(data.white.phases.end) } },
            black: { total: calculateGameAccuracy(data.black.accs), counts: data.black.counts, phases: { op: avg(data.black.phases.op), mid: avg(data.black.phases.mid), end: avg(data.black.phases.end) } },
            graph: { points: graphPoints, linePath, areaWhite, areaBlack, width: GRAPH_WIDTH, height: GRAPH_HEIGHT }
        };
    }, [engineResults, isAnalyzing, movesData]);

    if (isAnalyzing) {
        return (
            <div className="h-[100dvh] bg-[#110f0d] flex flex-col items-center justify-center p-6 relative" dir="rtl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-farzin-accent/10 via-transparent to-transparent opacity-50"></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 w-full max-w-md bg-[#1e1c19]/90 backdrop-blur-xl border border-[#35332e] p-10 rounded-[40px] shadow-2xl flex flex-col items-center">
                    <div className="relative w-36 h-36 mb-8">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#262421" strokeWidth="6" />
                            <motion.circle cx="50" cy="50" r="45" fill="none" stroke="#779556" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} strokeLinecap="round" className="transition-all duration-300" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white">{progress}%</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-white mb-2">پردازش عمیق حرکات...</h2>
                    <p className="text-xs text-zinc-500 text-center font-bold">موتور در حال تخصیص زمان کافی برای ارزیابی {movesData.length} حرکت است.</p>
                </motion.div>
            </div>
        );
    }

    if (!reportStats) return null;

    const ALL_CATEGORIES = [
        { label: 'درخشان', key: 'brilliant', icon: Zap, color: '#14b8a6' },
        { label: 'عالی', key: 'great', icon: Award, color: '#3b82f6' },
        { label: 'بهترین', key: 'best', icon: Star, color: '#779556' },
        { label: 'تئوری', key: 'book', icon: BookOpen, color: '#c27a3e' },
        { label: 'دقیق', key: 'excellent', icon: CheckCircle2, color: '#96bc4b' },
        { label: 'خوب', key: 'good', icon: CheckCircle2, color: '#a1a1aa' },
        { label: 'بی‌دقتی', key: 'inaccuracy', icon: Info, color: '#f59e0b' },
        { label: 'اشتباه', key: 'mistake', icon: HelpCircle, color: '#ef4444' },
        { label: 'برد از دست رفته', key: 'miss', icon: CircleSlash, color: '#ff6b00' },
        { label: 'بلاندر', key: 'blunder', icon: XCircle, color: '#b91c1c' },
    ];

    const getMarkerColor = (cls: string) => ALL_CATEGORIES.find(c => c.key === cls)?.color || 'transparent';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#110f0d] pb-24 font-sans" dir="rtl">
            <div className="bg-gradient-to-b from-[#1e1c19] to-[#110f0d] border-b border-[#35332e] px-4 py-10 relative overflow-hidden">
                <button onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2.5 bg-[#262421] rounded-2xl text-zinc-500 hover:text-white transition-all hover:scale-110"><ChevronRight size={22} /></button>
                <div className="max-w-3xl mx-auto flex items-center justify-between relative z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-3xl bg-white text-zinc-900 flex items-center justify-center font-black text-2xl shadow-[0_10px_40px_rgba(255,255,255,0.15)]">W</div>
                        <span className="font-black text-sm text-white max-w-[120px] truncate">{meta.white.name}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-5xl font-black text-farzin-accent drop-shadow-[0_0_20px_rgba(119,149,86,0.4)] block mb-2" dir="ltr">{meta.result === '*' ? '½-½' : meta.result}</span>
                        <div className="bg-farzin-accent/10 px-3 py-1 rounded-full border border-farzin-accent/20"><span className="text-[10px] text-farzin-accent font-black uppercase tracking-tighter">آنالیز دقیق لیچس</span></div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-3xl bg-[#262421] border border-[#35332e] text-zinc-200 flex items-center justify-center font-black text-2xl shadow-2xl">B</div>
                        <span className="font-black text-sm text-white max-w-[120px] truncate">{meta.black.name}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-6 flex flex-col gap-6">
                
                {/* 🎯 دقت کلی */}
                <div className="bg-[#1a1917]/60 backdrop-blur-md border border-[#35332e] rounded-[40px] p-8 shadow-2xl">
                    <div className="flex justify-around items-center">
                        {[ {side: 'سفید', acc: reportStats.white.total, color: '#fff'}, {side: 'سیاه', acc: reportStats.black.total, color: '#71717a'} ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="relative w-28 h-28 mb-4">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#262421" strokeWidth="10" />
                                        <motion.circle initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * item.acc) / 100 }} transition={{ duration: 2, ease: "easeOut" }} cx="50" cy="50" r="42" fill="none" stroke={item.color} strokeWidth="10" strokeDasharray="264" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white">{item.acc.toFixed(1)}%</div>
                                </div>
                                <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">دقت {item.side}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 📈 گراف ارزیابی با مارکرهای دقیق */}
                <div className="bg-[#1a1917]/60 border border-[#35332e] rounded-[40px] overflow-hidden shadow-2xl p-5">
                    <h3 className="text-xs font-black text-white mb-4 flex items-center gap-2"><Activity size={16} className="text-sky-400" /> روند بازی و حرکات سرنوشت‌ساز</h3>
                    <div className="relative w-full aspect-[3/1] bg-[#12110f] rounded-[24px] border border-[#262421] overflow-hidden">
                        <svg viewBox={`0 0 ${reportStats.graph.width} ${reportStats.graph.height}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                            <path d={reportStats.graph.areaWhite} fill="#ffffff" fillOpacity="0.1" />
                            <path d={reportStats.graph.areaBlack} fill="#000000" fillOpacity="0.4" />
                            <path d={reportStats.graph.linePath} fill="none" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.8" />
                            
                            {reportStats.graph.points.map((pt, i) => {
                                if (['blunder', 'mistake', 'miss', 'brilliant', 'great'].includes(pt.cls)) {
                                    const color = getMarkerColor(pt.cls);
                                    return (
                                        <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
                                            <circle r="6" fill={color} stroke="#12110f" strokeWidth="2" />
                                            {pt.cls === 'brilliant' && <text y="1" fontSize="10" fill="#12110f" fontWeight="bold" textAnchor="middle" dominantBaseline="central">!</text>}
                                            {pt.cls === 'blunder' && <text y="1" fontSize="10" fill="#12110f" fontWeight="bold" textAnchor="middle" dominantBaseline="central">×</text>}
                                        </g>
                                    );
                                }
                                return null;
                            })}
                        </svg>
                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/20 pointer-events-none border-t border-dashed border-white/10" />
                    </div>
                </div>

                {/* 📊 جدول کامل دسته‌بندی حرکات (Sync با AnalysisBoard) */}
                <div className="bg-[#1a1917]/60 border border-[#35332e] rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="p-5 bg-[#211f1c] border-b border-[#35332e] flex items-center justify-between">
                        <div className="flex items-center gap-2"><Target size={18} className="text-farzin-accent" /><span className="text-xs font-black text-white">کالبدشکافی حرکات</span></div>
                        <span className="text-[9px] font-bold text-zinc-500">مجموع {movesData.length - 1} حرکت</span>
                    </div>
                    <div className="p-3">
                        {ALL_CATEGORIES.map((cat, i) => {
                            const wCount = reportStats.white.counts[cat.key as keyof typeof reportStats.white.counts];
                            const bCount = reportStats.black.counts[cat.key as keyof typeof reportStats.black.counts];
                            if (wCount === 0 && bCount === 0 && ['brilliant', 'great', 'miss'].includes(cat.key)) return null; 
                            
                            return (
                                <div key={i} className="flex items-center justify-between p-3.5 border-b border-[#262421] last:border-0 hover:bg-white/5 transition-colors rounded-2xl">
                                    <span className="w-12 text-center font-black text-base text-white">{wCount}</span>
                                    <div className="flex items-center gap-3 flex-1 justify-center">
                                        <cat.icon size={16} style={{ color: cat.color }} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                                        <span className="text-xs font-black text-zinc-300 min-w-[100px] text-center">{cat.label}</span>
                                    </div>
                                    <span className="w-12 text-center font-black text-base text-zinc-400">{bCount}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                    <button onClick={() => navigate('/analysis/board', { state: location.state })} className="w-full bg-farzin-accent hover:bg-[#68824b] text-white py-6 rounded-[30px] font-black text-base flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(119,149,86,0.3)] transition-all active:scale-95 group">
                        <Zap size={22} className="animate-pulse" /> مرور حرکات با مربی فرزین
                    </button>
                </div>

            </div>
        </motion.div>
    );
}