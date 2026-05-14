import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, Target, Activity, Flame, Shield, BookOpen, 
    AlertTriangle, XCircle, HelpCircle, CheckCircle2, 
    ChevronLeft, Star, Award, Zap, Ghost, CircleSlash, Info
} from 'lucide-react';
import { useStockfish } from '../hooks/useStockfish';
import { isBookPosition } from '../utils/ecoParser';
import { COACH_COLORS } from '../utils/analysisConfig';

// 🌟 فرمول‌های استاندارد Lichess
const calcWinPercent = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);

const calcMoveAccuracy = (winBefore: number, winAfter: number) => {
    if (winAfter >= winBefore) return 100;
    const winDiff = winBefore - winAfter;
    const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) - 3.166924740191411;
    return Math.max(0, Math.min(100, raw + 1)); 
};

// طبقه‌بندی حرکت بر اساس اختلاف Win%
const classifyMove = (winBefore: number, winAfter: number, isBook: boolean) => {
    if (isBook) return 'book';
    const diff = winBefore - winAfter;
    if (diff <= 0.5) return 'best';
    if (diff <= 2) return 'excellent';
    if (diff <= 5) return 'good';
    if (diff <= 10) return 'inaccuracy';
    if (diff <= 20) return 'mistake';
    return 'blunder';
};

const standardDeviation = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

const calculateGameAccuracy = (accuracies: {acc: number, weight: number}[]) => {
    if (accuracies.length === 0) return 100;
    const sumWeights = accuracies.reduce((s, a) => s + a.weight, 0);
    const weightedMean = accuracies.reduce((s, a) => s + (a.acc * a.weight), 0) / sumWeights;
    const harmonicSum = accuracies.reduce((s, a) => s + (1 / Math.max(0.01, a.acc)), 0);
    const harmonicMean = accuracies.length / harmonicSum;
    return (weightedMean + harmonicMean) / 2;
};

const getGamePhase = (fen: string, moveNumber: number) => {
    if (moveNumber <= 12 || isBookPosition(fen)) return 'opening';
    const nonPawns = fen.split(' ')[0].replace(/[^qrnbQRNB]/g, '');
    let weight = 0;
    for(let char of nonPawns) {
        const c = char.toLowerCase();
        if (c === 'q') weight += 9;
        else if (c === 'r') weight += 5;
        else weight += 3;
    }
    return weight < 14 ? 'endgame' : 'middlegame';
};

export default function GameReport() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialData = location.state?.data || '';
    const meta = location.state?.meta || { white: {name: 'سفید'}, black: {name: 'سیاه'}, result: '*' };

    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    const [movesData, setMovesData] = useState<{fen: string, isBook: boolean, phase: string}[]>([]);
    const [cpHistory, setCpHistory] = useState<number[]>([]);
    const [isWaitingReset, setIsWaitingReset] = useState(false);
    
    const { isReady, lines, analyze, stop } = useStockfish() as any;
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!initialData) { navigate('/analysis'); return; }
        try {
            const game = new Chess();
            game.loadPgn(initialData);
            const history = game.history({ verbose: true });
            const tempGame = new Chess();
            let parsedMoves = [{ fen: tempGame.fen(), isBook: true, phase: 'opening' }];
            history.forEach((m, idx) => {
                tempGame.move(m);
                const fen = tempGame.fen();
                parsedMoves.push({ fen, isBook: isBookPosition(fen), phase: getGamePhase(fen, Math.ceil((idx+1) / 2)) });
            });
            setMovesData(parsedMoves);
            setCpHistory([]);
            setCurrentIndex(0);
        } catch (e) { navigate('/analysis'); }
    }, [initialData]);

    useEffect(() => {
        if (!isReady || movesData.length === 0 || currentIndex >= movesData.length) return;
        const currentMove = movesData[currentIndex];
        if (currentMove.isBook) {
            setCpHistory(prev => [...prev, prev.length > 0 ? prev[prev.length - 1] : 0]);
            setProgress(Math.round(((currentIndex + 1) / movesData.length) * 100));
            setCurrentIndex(idx => idx + 1);
        } else {
            setIsWaitingReset(true);
            analyze(currentMove.fen, 14); 
        }
    }, [isReady, currentIndex, movesData]);

    useEffect(() => {
        if (lines && lines.length > 0 && lines[0].depth < 14) setIsWaitingReset(false);
        if (isAnalyzing && !isWaitingReset && lines && lines.length > 0 && lines[0].depth >= 14) {
            if (stop) stop(); 
            const cp = lines[0].isMate ? (lines[0].mateIn > 0 ? 10000 : -10000) : lines[0].score * 100;
            const finalCp = (currentIndex % 2 === 0) ? cp : -cp; 
            setCpHistory(prev => [...prev, finalCp]);
            setProgress(Math.round(((currentIndex + 1) / movesData.length) * 100));
            setCurrentIndex(idx => idx + 1);
        }
    }, [lines, isAnalyzing, currentIndex, isWaitingReset]);

    useEffect(() => {
        if (movesData.length > 0 && currentIndex >= movesData.length) {
            setTimeout(() => setIsAnalyzing(false), 800);
        }
    }, [currentIndex, movesData]);

    const reportStats = useMemo(() => {
        if (cpHistory.length < 2) return null;
        const winPercents = cpHistory.map(cp => calcWinPercent(cp));
        
        // محاسبه پنجره‌های نوسان (Volatility Windows)
        const windowSize = Math.max(2, Math.min(8, Math.floor(winPercents.length / 10)));
        let windows: number[][] = [];
        for (let i = 0; i <= winPercents.length - windowSize; i++) windows.push(winPercents.slice(i, i + windowSize));

        const data = {
            white: { accs: [] as any[], counts: { brilliant: 0, great: 0, best: 0, book: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }, phases: { op: [] as number[], mid: [] as number[], end: [] as number[] } },
            black: { accs: [] as any[], counts: { brilliant: 0, great: 0, best: 0, book: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }, phases: { op: [] as number[], mid: [] as number[], end: [] as number[] } }
        };

        for (let i = 0; i < winPercents.length - 1; i++) {
            const isWhiteTurn = (i % 2 === 0);
            const side = isWhiteTurn ? data.white : data.black;
            let winBefore = isWhiteTurn ? winPercents[i] : 100 - winPercents[i];
            let winAfter = isWhiteTurn ? winPercents[i+1] : 100 - winPercents[i+1];
            
            let acc = movesData[i+1]?.isBook ? 100 : calcMoveAccuracy(winBefore, winAfter);
            let cls = classifyMove(winBefore, winAfter, movesData[i+1]?.isBook) as keyof typeof side.counts;
            
            let weight = Math.max(0.5, Math.min(12, standardDeviation(windows[Math.min(i, windows.length-1)] || [])));
            
            side.accs.push({ acc, weight });
            side.counts[cls]++;
            
            const phase = movesData[i+1]?.phase;
            if (phase === 'opening') side.phases.op.push(acc);
            else if (phase === 'middlegame') side.phases.mid.push(acc);
            else if (phase === 'endgame') side.phases.end.push(acc);
        }

        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a,b)=>a+b,0)/arr.length : null;

        return {
            white: { total: calculateGameAccuracy(data.white.accs), counts: data.white.counts, phases: { op: avg(data.white.phases.op), mid: avg(data.white.phases.mid), end: avg(data.white.phases.end) } },
            black: { total: calculateGameAccuracy(data.black.accs), counts: data.black.counts, phases: { op: avg(data.black.phases.op), mid: avg(data.black.phases.mid), end: avg(data.black.phases.end) } }
        };
    }, [cpHistory, movesData, isAnalyzing]);

    if (isAnalyzing) {
        return (
            <div className="h-[100dvh] bg-[#110f0d] flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-farzin-accent/10 via-[#110f0d] to-[#110f0d]"></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 w-full max-w-md bg-[#1e1c19]/80 backdrop-blur-2xl border border-[#35332e] p-8 rounded-[36px] shadow-2xl flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-8">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#262421" strokeWidth="8" />
                            <motion.circle cx="50" cy="50" r="45" fill="none" stroke="#779556" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} strokeLinecap="round" className="transition-all duration-300 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-3xl text-white">{progress}%</div>
                    </div>
                    <h2 className="text-xl font-black text-white mb-2">در حال کالبدشکافی بازی...</h2>
                    <p className="text-xs text-zinc-500 text-center leading-relaxed">استوک‌فیش در حال بررسی دقیق استراتژی‌ها ({currentIndex} از {movesData.length})</p>
                </motion.div>
            </div>
        );
    }

    if (!reportStats) return null;

    const STAT_ROWS = [
        { label: 'حرکات تئوری', key: 'book', icon: BookOpen, color: '#c27a3e' },
        { label: 'بهترین حرکت', key: 'best', icon: Star, color: '#779556' },
        { label: 'حرکات عالی', key: 'excellent', icon: Award, color: '#96bc4b' },
        { label: 'حرکات خوب', key: 'good', icon: CheckCircle2, color: '#a1a1aa' },
        { label: 'بی‌دقتی', key: 'inaccuracy', icon: Info, color: '#f59e0b' },
        { label: 'اشتباه', key: 'mistake', icon: HelpCircle, color: '#ef4444' },
        { label: 'بلاندر (فاحش)', key: 'blunder', icon: XCircle, color: '#b91c1c' },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#110f0d] pb-24 font-sans" dir="rtl">
            
            {/* 🌟 هدر بازی */}
            <div className="bg-gradient-to-b from-[#1e1c19] to-[#110f0d] border-b border-[#35332e] px-4 py-8 relative">
                <button onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2 bg-[#262421] rounded-xl text-zinc-500 hover:text-white transition-all"><ChevronRight size={20} /></button>
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl shadow-xl">W</div>
                        <span className="font-bold text-xs text-white max-w-[100px] truncate">{meta.white.name}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-4xl font-black text-farzin-accent block mb-1" dir="ltr">{meta.result === '*' ? '½-½' : meta.result}</span>
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">گزارش نهایی</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-2xl bg-[#262421] text-white flex items-center justify-center font-black text-xl border border-[#35332e] shadow-xl">B</div>
                        <span className="font-bold text-xs text-white max-w-[100px] truncate">{meta.black.name}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8 flex flex-col gap-6">
                
                {/* 🌟 کارت دقت (Accuracy) */}
                <div className="bg-[#1a1917] border border-[#35332e] rounded-[32px] p-6 shadow-xl">
                    <div className="flex justify-around items-center">
                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 mb-3">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#262421" strokeWidth="12" />
                                    <motion.circle initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * reportStats.white.total) / 100 }} transition={{ duration: 1.5 }} cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeWidth="12" strokeDasharray="264" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">{reportStats.white.total.toFixed(0)}%</div>
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase">دقت سفید</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 mb-3">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#262421" strokeWidth="12" />
                                    <motion.circle initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * reportStats.black.total) / 100 }} transition={{ duration: 1.5 }} cx="50" cy="50" r="42" fill="none" stroke="#71717a" strokeWidth="12" strokeDasharray="264" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-zinc-300">{reportStats.black.total.toFixed(0)}%</div>
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase">دقت سیاه</span>
                        </div>
                    </div>
                </div>

                {/* 🌟 خلاصه حرکات (Move Summary) */}
                <div className="bg-[#1a1917] border border-[#35332e] rounded-[32px] overflow-hidden shadow-xl">
                    <div className="p-4 bg-[#211f1c] border-b border-[#35332e] flex items-center gap-2">
                        <Activity size={16} className="text-zinc-500" />
                        <span className="text-xs font-black text-zinc-300">خلاصه عملکرد حرکات</span>
                    </div>
                    <div className="p-2">
                        {STAT_ROWS.map((row, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-[#262421] last:border-0">
                                <span className="w-10 text-center font-black text-sm text-white" dir="ltr">{reportStats.white.counts[row.key as keyof typeof reportStats.white.counts]}</span>
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <row.icon size={14} style={{ color: row.color }} />
                                    <span className="text-xs font-bold">{row.label}</span>
                                </div>
                                <span className="w-10 text-center font-black text-sm text-zinc-400" dir="ltr">{reportStats.black.counts[row.key as keyof typeof reportStats.black.counts]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🌟 فازهای بازی (با منطق حذف فازهای شروع نشده) */}
                <div className="bg-[#1a1917] border border-[#35332e] rounded-[32px] p-6 shadow-xl">
                    <h3 className="text-xs font-black text-zinc-500 mb-5 flex items-center gap-2">دقت بر اساس فاز بازی</h3>
                    <div className="flex flex-col gap-3">
                        {[
                            { label: 'گشایش (Opening)', w: reportStats.white.phases.op, b: reportStats.black.phases.op, icon: BookOpen },
                            { label: 'وسط بازی (Middlegame)', w: reportStats.white.phases.mid, b: reportStats.black.phases.mid, icon: Flame },
                            { label: 'آخر بازی (Endgame)', w: reportStats.white.phases.end, b: reportStats.black.phases.end, icon: Shield }
                        ].map((phase, i) => (
                            // 🌟 فقط اگر دقت برای فاز تعریف شده بود (یعنی بازی به آن فاز رسیده بود) نمایش بده
                            phase.w !== null && (
                                <div key={i} className="flex items-center justify-between p-4 bg-[#12110f] rounded-2xl border border-[#262421]">
                                    <span className="w-12 text-center text-sm font-black text-white" dir="ltr">{phase.w.toFixed(0)}%</span>
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <phase.icon size={14} />
                                        <span className="text-[11px] font-bold">{phase.label}</span>
                                    </div>
                                    <span className="w-12 text-center text-sm font-black text-zinc-400" dir="ltr">{phase.b.toFixed(0)}%</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* دکمه‌های اقدام */}
                <div className="flex flex-col gap-3 mt-4">
                    <button onClick={() => navigate('/analysis/board', { state: location.state })} className="w-full bg-farzin-accent hover:bg-[#68824b] text-white py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95">
                        <Zap size={20} /> ورود به میز بررسی حرکات (Coach)
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-[#262421] hover:bg-[#35332e] text-zinc-300 py-4 rounded-[20px] font-bold text-xs border border-[#35332e] transition-all">اشتراک‌گذاری گزارش</button>
                        <button onClick={() => navigate('/analysis')} className="bg-[#262421] hover:bg-[#35332e] text-zinc-300 py-4 rounded-[20px] font-bold text-xs border border-[#35332e] transition-all">تحلیل بازی جدید</button>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}