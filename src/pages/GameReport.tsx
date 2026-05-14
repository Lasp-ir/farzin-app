import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, Target, Activity, Flame, Shield, BookOpen, 
    AlertTriangle, XCircle, HelpCircle, CheckCircle2, 
    Star, Award, Zap, Ghost, CircleSlash, Info, Search
} from 'lucide-react';
import { useStockfish } from '../hooks/useStockfish';
import { isBookPosition } from '../utils/ecoParser';
import { getPieceValue } from '../utils/analysisConfig';

// 🌟 فرمول‌های فوق‌دقیق Lichess
const calcWinPercent = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);

const calcMoveAccuracy = (winBefore: number, winAfter: number) => {
    if (winAfter >= winBefore) return 100;
    const winDiff = winBefore - winAfter;
    const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) - 3.166924740191411;
    return Math.max(0, Math.min(100, raw + 1)); 
};

// 🧠 موتور طبقه‌بندی هوشمند حرکات (۹ دسته کامل)
const classifyMoveDetailed = (
    winBefore: number, 
    winAfter: number, 
    isBook: boolean, 
    move: any, 
    prevFen: string,
    isSacrifice: boolean
) => {
    if (isBook) return 'book';
    const diff = winBefore - winAfter;

    // تشخیص Miss (از دست رفتن برد قاطع)
    if (winBefore > 75 && winAfter < 55) return 'miss';

    // تشخیص Brilliant (قربانی صحیح با حفظ برتری)
    if (isSacrifice && winAfter > 45 && diff < 5) return 'brilliant';

    // تشخیص Great (تنها حرکت خوب یا حرکت بسیار قوی)
    if (diff < 0.5 && winAfter > 60) return 'great';

    if (diff <= 1) return 'best';
    if (diff <= 3) return 'excellent';
    if (diff <= 7) return 'good';
    if (diff <= 15) return 'inaccuracy';
    if (diff <= 25) return 'mistake';
    return 'blunder';
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

const getGamePhase = (fen: string, moveNumber: number) => {
    if (moveNumber <= 10 || isBookPosition(fen)) return 'opening';
    const nonPawns = fen.split(' ')[0].replace(/[^qrnbQRNB]/g, '');
    let weight = 0;
    for(let char of nonPawns) weight += getPieceValue(char);
    return weight < 14 ? 'endgame' : 'middlegame';
};

export default function GameReport() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialData = location.state?.data || '';
    const meta = location.state?.meta || { white: {name: 'سفید'}, black: {name: 'سیاه'}, result: '*' };

    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    const [movesData, setMovesData] = useState<any[]>([]);
    const [cpHistory, setCpHistory] = useState<number[]>([]);
    const [isWaitingReset, setIsWaitingReset] = useState(false);
    
    const { isReady, lines, analyze, stop } = useStockfish() as any;
    const [currentIndex, setCurrentIndex] = useState(0);

    // آماده‌سازی اولیه دیتای بازی
    useEffect(() => {
        if (!initialData) { navigate('/analysis'); return; }
        try {
            const game = new Chess();
            game.loadPgn(initialData);
            const history = game.history({ verbose: true });
            const tempGame = new Chess();
            
            let parsed = [{ fen: tempGame.fen(), isBook: true, phase: 'opening', move: null, prevFen: null }];
            history.forEach((m, idx) => {
                const prevFen = tempGame.fen();
                tempGame.move(m);
                const fen = tempGame.fen();
                parsed.push({ 
                    fen, 
                    isBook: isBookPosition(fen), 
                    phase: getGamePhase(fen, Math.ceil((idx+1)/2)),
                    move: m,
                    prevFen
                });
            });
            setMovesData(parsed);
            setCpHistory([]);
            setCurrentIndex(0);
        } catch (e) { navigate('/analysis'); }
    }, [initialData]);

    // حلقه آنالیز موتور
    useEffect(() => {
        if (!isReady || movesData.length === 0 || currentIndex >= movesData.length) return;
        const currentMove = movesData[currentIndex];
        if (currentMove.isBook) {
            const lastCp = cpHistory.length > 0 ? cpHistory[cpHistory.length - 1] : 0;
            setCpHistory(prev => [...prev, lastCp]);
            setProgress(Math.round(((currentIndex + 1) / movesData.length) * 100));
            setCurrentIndex(idx => idx + 1);
        } else {
            setIsWaitingReset(true);
            analyze(currentMove.fen, 14); 
        }
    }, [isReady, currentIndex, movesData]);

    // دریافت خروجی از موتور
    useEffect(() => {
        if (lines && lines.length > 0 && lines[0].depth < 14) setIsWaitingReset(false);
        if (isAnalyzing && !isWaitingReset && lines && lines.length > 0 && lines[0].depth >= 14) {
            if (stop) stop(); 
            const cp = lines[0].isMate ? (lines[0].mateIn > 0 ? 10000 : -10000) : lines[0].score * 100;
            // ذخیره نمره همیشه از دید سفید برای محاسبات بعدی
            setCpHistory(prev => [...prev, cp]);
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
        
        // تبدیل نمرات به Win% جهانی (از دید سفید)
        const globalWinPercents = cpHistory.map(cp => calcWinPercent(cp));
        
        const data = {
            white: { accs: [] as any[], counts: { brilliant:0, great:0, best:0, book:0, excellent:0, good:0, inaccuracy:0, mistake:0, blunder:0, miss:0 }, phases: { op:[] as number[], mid:[] as number[], end:[] as number[] } },
            black: { accs: [] as any[], counts: { brilliant:0, great:0, best:0, book:0, excellent:0, good:0, inaccuracy:0, mistake:0, blunder:0, miss:0 }, phases: { op:[] as number[], mid:[] as number[], end:[] as number[] } }
        };

        const windowSize = Math.max(2, Math.min(8, Math.floor(globalWinPercents.length / 10)));

        for (let i = 0; i < globalWinPercents.length - 1; i++) {
            const isWhiteTurn = (i % 2 === 0);
            const side = isWhiteTurn ? data.white : data.black;
            
            // Win% قبل و بعد از حرکت از دید بازیکنِ صاحب نوبت
            const winBefore = isWhiteTurn ? globalWinPercents[i] : 100 - globalWinPercents[i];
            const winAfter = isWhiteTurn ? globalWinPercents[i+1] : 100 - globalWinPercents[i+1];
            
            const moveInfo = movesData[i+1];
            
            // تشخیص ساده قربانی برای Brilliant (اگر مهره گرفته شد و ارزش مهره بالا بود)
            const isSacrifice = moveInfo.move?.captured && ['n','b','r','q'].includes(moveInfo.move.captured);
            
            const acc = moveInfo.isBook ? 100 : calcMoveAccuracy(winBefore, winAfter);
            const cls = classifyMoveDetailed(winBefore, winAfter, moveInfo.isBook, moveInfo.move, moveInfo.prevFen, !!isSacrifice) as keyof typeof side.counts;
            
            // محاسبه وزن بر اساس نوسان پنجره فعلی
            const window = globalWinPercents.slice(Math.max(0, i - windowSize), i + 1);
            const weight = Math.max(0.5, Math.min(12, standardDeviation(window)));
            
            side.accs.push({ acc, weight });
            side.counts[cls]++;
            
            if (moveInfo.phase === 'opening') side.phases.op.push(acc);
            else if (moveInfo.phase === 'middlegame') side.phases.mid.push(acc);
            else if (moveInfo.phase === 'endgame') side.phases.end.push(acc);
        }

        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a,b)=>a+b,0)/arr.length : null;

        return {
            white: { total: calculateGameAccuracy(data.white.accs), counts: data.white.counts, phases: { op: avg(data.white.phases.op), mid: avg(data.white.phases.mid), end: avg(data.white.phases.end) } },
            black: { total: calculateGameAccuracy(data.black.accs), counts: data.black.counts, phases: { op: avg(data.black.phases.op), mid: avg(data.black.phases.mid), end: avg(data.black.phases.end) } }
        };
    }, [cpHistory, movesData, isAnalyzing]);

    if (isAnalyzing) {
        return (
            <div className="h-[100dvh] bg-[#110f0d] flex flex-col items-center justify-center p-6 relative" dir="rtl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-farzin-accent/10 via-transparent to-transparent opacity-50"></div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 w-full max-w-md bg-[#1e1c19]/90 backdrop-blur-xl border border-[#35332e] p-10 rounded-[40px] shadow-2xl flex flex-col items-center">
                    <div className="relative w-36 h-36 mb-8">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#262421" strokeWidth="6" />
                            <motion.circle cx="50" cy="50" r="45" fill="none" stroke="#779556" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} strokeLinecap="round" className="transition-all duration-500" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white">{progress}%</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Stockfish 16</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">در حال آنالیز لایه‌ها...</h2>
                    <p className="text-xs text-zinc-500 text-center font-bold">فرزین در حال کالبدشکافی {movesData.length} حرکت است</p>
                </motion.div>
            </div>
        );
    }

    if (!reportStats) return null;

    const ALL_CATEGORIES = [
        { label: 'درخشان', key: 'brilliant', icon: Zap, color: '#00ebff' },
        { label: 'عالی', key: 'great', icon: Award, color: '#5c8df7' },
        { label: 'بهترین', key: 'best', icon: Star, color: '#779556' },
        { label: 'تئوری', key: 'book', icon: BookOpen, color: '#c27a3e' },
        { label: 'دقیق', key: 'excellent', icon: CheckCircle2, color: '#96bc4b' },
        { label: 'خوب', key: 'good', icon: CheckCircle2, color: '#a1a1aa' },
        { label: 'بی‌دقتی', key: 'inaccuracy', icon: Info, color: '#f59e0b' },
        { label: 'اشتباه', key: 'mistake', icon: HelpCircle, color: '#ef4444' },
        { label: 'برد از دست رفته', key: 'miss', icon: CircleSlash, color: '#ff6b00' },
        { label: 'بلاندر', key: 'blunder', icon: XCircle, color: '#b91c1c' },
    ];

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
                        <div className="bg-farzin-accent/10 px-3 py-1 rounded-full border border-farzin-accent/20"><span className="text-[10px] text-farzin-accent font-black uppercase tracking-tighter">بررسی نهایی انجام شد</span></div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-3xl bg-[#262421] border border-[#35332e] text-zinc-200 flex items-center justify-center font-black text-2xl shadow-2xl">B</div>
                        <span className="font-black text-sm text-white max-w-[120px] truncate">{meta.black.name}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 mt-8 flex flex-col gap-6">
                
                {/* 🎯 دقت کلی (Accuracy) */}
                <div className="bg-[#1a1917]/60 backdrop-blur-md border border-[#35332e] rounded-[40px] p-8 shadow-2xl">
                    <div className="flex justify-around items-center">
                        {[ {side: 'سفید', acc: reportStats.white.total, color: '#fff'}, {side: 'سیاه', acc: reportStats.black.total, color: '#71717a'} ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="relative w-28 h-28 mb-4">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="#262421" strokeWidth="10" />
                                        <motion.circle initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * item.acc) / 100 }} transition={{ duration: 2, ease: "easeOut" }} cx="50" cy="50" r="42" fill="none" stroke={item.color} strokeWidth="10" strokeDasharray="264" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white">{item.acc.toFixed(0)}%</div>
                                </div>
                                <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">دقت {item.side}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 📊 جدول کامل دسته‌بندی حرکات (All Categories) */}
                <div className="bg-[#1a1917]/60 border border-[#35332e] rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="p-5 bg-[#211f1c] border-b border-[#35332e] flex items-center justify-between">
                        <div className="flex items-center gap-2"><Activity size={18} className="text-farzin-accent" /><span className="text-xs font-black text-white">کالبدشکافی حرکات</span></div>
                        <span className="text-[9px] font-bold text-zinc-500">مجموع {movesData.length - 1} حرکت</span>
                    </div>
                    <div className="p-3">
                        {ALL_CATEGORIES.map((cat, i) => (
                            <div key={i} className="flex items-center justify-between p-3.5 border-b border-[#262421] last:border-0 hover:bg-white/5 transition-colors rounded-2xl">
                                <span className="w-12 text-center font-black text-base text-white">{reportStats.white.counts[cat.key as keyof typeof reportStats.white.counts]}</span>
                                <div className="flex items-center gap-3 flex-1 justify-center">
                                    <cat.icon size={16} style={{ color: cat.color }} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                                    <span className="text-xs font-black text-zinc-300 min-w-[100px] text-center">{cat.label}</span>
                                </div>
                                <span className="w-12 text-center font-black text-base text-zinc-400">{reportStats.black.counts[cat.key as keyof typeof reportStats.black.counts]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ⚡ فازهای بازی (هوشمند) */}
                <div className="bg-[#1a1917]/60 border border-[#35332e] rounded-[40px] p-8 shadow-2xl">
                    <h3 className="text-xs font-black text-zinc-500 mb-6 flex items-center gap-2 uppercase tracking-widest"><Shield size={16} /> عملکرد در هر فاز</h3>
                    <div className="flex flex-col gap-4">
                        {[
                            { label: 'گشایش (Opening)', w: reportStats.white.phases.op, b: reportStats.black.phases.op, icon: BookOpen },
                            { label: 'وسط بازی (Middlegame)', w: reportStats.white.phases.mid, b: reportStats.black.phases.mid, icon: Flame },
                            { label: 'آخر بازی (Endgame)', w: reportStats.white.phases.end, b: reportStats.black.phases.end, icon: Shield }
                        ].map((phase, i) => (
                            phase.w !== null && (
                                <div key={i} className="group flex items-center justify-between p-5 bg-[#12110f] rounded-3xl border border-[#262421] hover:border-zinc-500 transition-all">
                                    <div className="flex flex-col items-center"><span className="text-lg font-black text-white">{phase.w.toFixed(0)}%</span><span className="text-[8px] font-bold text-zinc-600">WHITE</span></div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <phase.icon size={18} className="text-zinc-500 group-hover:scale-125 transition-transform" />
                                        <span className="text-[10px] font-black text-zinc-400">{phase.label}</span>
                                    </div>
                                    <div className="flex flex-col items-center"><span className="text-lg font-black text-zinc-400">{phase.b.toFixed(0)}%</span><span className="text-[8px] font-bold text-zinc-600">BLACK</span></div>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                    <button onClick={() => navigate('/analysis/board', { state: location.state })} className="w-full bg-farzin-accent hover:bg-[#68824b] text-white py-6 rounded-[30px] font-black text-base flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(119,149,86,0.3)] transition-all active:scale-95 group">
                        <Zap size={22} className="animate-pulse" /> ورود به میز مربی
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="bg-[#262421] hover:bg-[#35332e] text-zinc-300 py-5 rounded-[24px] font-black text-xs border border-[#35332e] transition-all">اشتراک گزارش</button>
                        <button onClick={() => navigate('/analysis')} className="bg-[#262421] hover:bg-[#35332e] text-zinc-300 py-5 rounded-[24px] font-black text-xs border border-[#35332e] transition-all">بازی جدید</button>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}