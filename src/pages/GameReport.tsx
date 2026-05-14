import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Target, Activity, Flame, Shield, BookOpen, AlertTriangle, XCircle, HelpCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useStockfish } from '../hooks/useStockfish';
import { isBookPosition } from '../utils/ecoParser';

// 🌟 ترجمه دقیق فرمول‌های Lichess (Win% و Accuracy%)
const calcWinPercent = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);

const calcMoveAccuracy = (winBefore: number, winAfter: number) => {
    if (winAfter >= winBefore) return 100;
    const winDiff = winBefore - winAfter;
    const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) - 3.166924740191411;
    return Math.max(0, Math.min(100, raw + 1)); // +1 uncertainty bonus
};

const standardDeviation = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

// تابع جامع محاسبه دقت کل بازی بر اساس پنجره‌های لغزان
const calculateGameAccuracy = (winPercents: number[], isWhite: boolean) => {
    if (winPercents.length < 2) return 100;
    
    const windowSize = Math.max(2, Math.min(8, Math.floor(winPercents.length / 10)));
    let windows: number[][] = [];
    
    // بازسازی منطق لیست‌بندی لیچس
    const padCount = Math.max(0, Math.min(windowSize, winPercents.length) - 2);
    for (let i = 0; i < padCount; i++) windows.push(winPercents.slice(0, windowSize));
    for (let i = 0; i <= winPercents.length - windowSize; i++) windows.push(winPercents.slice(i, i + windowSize));
    
    let accuracies = [];
    
    for (let i = 0; i < winPercents.length - 1; i++) {
        const isWhiteTurn = (i % 2 === 0);
        if (isWhiteTurn !== isWhite) continue;

        let winBefore = isWhiteTurn ? winPercents[i] : 100 - winPercents[i];
        let winAfter = isWhiteTurn ? winPercents[i+1] : 100 - winPercents[i+1];
        
        let acc = calcMoveAccuracy(winBefore, winAfter);
        
        let winIdx = Math.min(i, windows.length - 1);
        let stdDev = standardDeviation(windows[winIdx] || []);
        let weight = Math.max(0.5, Math.min(12, stdDev));
        
        accuracies.push({ acc, weight });
    }
    
    if (accuracies.length === 0) return 100;
    
    const sumWeights = accuracies.reduce((s, a) => s + a.weight, 0);
    const weightedMean = accuracies.reduce((s, a) => s + (a.acc * a.weight), 0) / sumWeights;
    
    const harmonicSum = accuracies.reduce((s, a) => s + (1 / Math.max(0.01, a.acc)), 0);
    const harmonicMean = accuracies.length / harmonicSum;
    
    return (weightedMean + harmonicMean) / 2;
};

// 🌟 طبقه‌بندی فازهای بازی (گشایش، وسط بازی، آخر بازی)
const getGamePhase = (fen: string, moveNumber: number) => {
    if (moveNumber <= 12 || isBookPosition(fen)) return 'opening';
    const nonPawns = fen.split(' ')[0].replace(/[^qrnbQRNB]/g, '');
    let weight = 0;
    for(let char of nonPawns) {
        if (char.toLowerCase() === 'q') weight += 9;
        else if (char.toLowerCase() === 'r') weight += 5;
        else weight += 3;
    }
    return weight < 14 ? 'endgame' : 'middlegame';
};

export default function GameReport() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialData = location.state?.data || '';
    const meta = location.state?.meta || { whiteName: 'سفید', blackName: 'سیاه', result: '*' };

    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [progress, setProgress] = useState(0);
    
    const [movesData, setMovesData] = useState<{fen: string, isBook: boolean, phase: string}[]>([]);
    const [cpHistory, setCpHistory] = useState<number[]>([]);
    
    const { isReady, lines, analyze, stop } = useStockfish() as any;
    
    const [currentIndex, setCurrentIndex] = useState(0);

    // آماده‌سازی دیتای اولیه
    useEffect(() => {
        if (!initialData) { navigate('/setup'); return; }
        try {
            const game = new Chess();
            game.loadPgn(initialData);
            const history = game.history({ verbose: true });
            
            const tempGame = new Chess();
            let parsedMoves = [{ fen: tempGame.fen(), isBook: true, phase: 'opening' }];
            
            history.forEach((m, idx) => {
                tempGame.move(m);
                const currentFen = tempGame.fen();
                parsedMoves.push({ 
                    fen: currentFen, 
                    isBook: isBookPosition(currentFen),
                    phase: getGamePhase(currentFen, Math.ceil(idx / 2))
                });
            });
            
            setMovesData(parsedMoves);
            setCpHistory([]);
            setCurrentIndex(0);
        } catch (e) {
            navigate('/setup');
        }
    }, [initialData]);

    // 🌟 موتور آنالیزگر زنده (Live Processing)
    useEffect(() => {
        if (!isReady || movesData.length === 0 || currentIndex >= movesData.length) return;

        const currentMove = movesData[currentIndex];
        
        // اگر حرکت کتابی باشه، بدون پردازش انجین ۱۰۰ ثبتش می‌کنیم
        if (currentMove.isBook) {
            setCpHistory(prev => {
                const newCp = prev.length > 0 ? prev[prev.length - 1] : 0;
                return [...prev, newCp];
            });
            setProgress(Math.round(((currentIndex + 1) / movesData.length) * 100));
            setCurrentIndex(idx => idx + 1);
            return;
        }

        analyze(currentMove.fen, 14); // عمق 14 برای سرعت بالای لایو رندرینگ
        
    }, [isReady, currentIndex, movesData]);

    // دریافت نتیجه از استوک‌فیش
    useEffect(() => {
        if (isAnalyzing && lines && lines[0] && lines[0].depth >= 14) {
            if (stop) stop(); // توقف برای حرکت بعدی
            
            const cp = lines[0].isMate 
                ? (lines[0].mateIn > 0 ? 10000 : -10000) 
                : lines[0].score * 100;

            const finalCp = (currentIndex % 2 === 0) ? cp : -cp; // نرمال‌سازی Cp از دید سفید

            setCpHistory(prev => [...prev, finalCp]);
            setProgress(Math.round(((currentIndex + 1) / movesData.length) * 100));
            setCurrentIndex(idx => idx + 1);
        }
    }, [lines, isAnalyzing, currentIndex]);

    // پایان آنالیز
    useEffect(() => {
        if (movesData.length > 0 && currentIndex >= movesData.length) {
            setTimeout(() => setIsAnalyzing(false), 1000);
        }
    }, [currentIndex, movesData]);

    // 🌟 محاسبه نهایی با فرمول‌های Lichess
    const reportStats = useMemo(() => {
        if (cpHistory.length < 2) return null;
        
        const winPercents = cpHistory.map(cp => calcWinPercent(cp));
        
        const whiteAcc = calculateGameAccuracy(winPercents, true);
        const blackAcc = calculateGameAccuracy(winPercents, false);

        // محاسبه دقت در فازهای مختلف
        const phases = { w: { opening: [] as number[], mid: [] as number[], end: [] as number[] }, b: { opening: [] as number[], mid: [] as number[], end: [] as number[] } };
        
        for (let i = 0; i < winPercents.length - 1; i++) {
            const isWhiteTurn = (i % 2 === 0);
            let winBefore = isWhiteTurn ? winPercents[i] : 100 - winPercents[i];
            let winAfter = isWhiteTurn ? winPercents[i+1] : 100 - winPercents[i+1];
            let acc = calcMoveAccuracy(winBefore, winAfter);
            if (movesData[i+1]?.isBook) acc = 100;

            const phase = movesData[i+1]?.phase;
            if (isWhiteTurn) {
                if (phase === 'opening') phases.w.opening.push(acc);
                if (phase === 'middlegame') phases.w.mid.push(acc);
                if (phase === 'endgame') phases.w.end.push(acc);
            } else {
                if (phase === 'opening') phases.b.opening.push(acc);
                if (phase === 'middlegame') phases.b.mid.push(acc);
                if (phase === 'endgame') phases.b.end.push(acc);
            }
        }

        const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 100;

        return {
            white: { total: whiteAcc, op: avg(phases.w.opening), mid: avg(phases.w.mid), end: avg(phases.w.end) },
            black: { total: blackAcc, op: avg(phases.b.opening), mid: avg(phases.b.mid), end: avg(phases.b.end) }
        };
    }, [cpHistory, movesData, isAnalyzing]);

    // رندر لودینگ آنالیز زنده
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{progress}%</span>
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-white mb-2">در حال تولید گزارش...</h2>
                    <p className="text-sm text-zinc-400 text-center leading-relaxed">
                        استوک‌فیش در حال ارزیابی تک‌تک حرکات ({currentIndex} از {movesData.length}) و استخراج داده‌های آماری است.
                    </p>
                </motion.div>
            </div>
        );
    }

    if (!reportStats) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-[#110f0d] pb-24 overflow-x-hidden font-sans" dir="rtl">
            
            {/* 🌟 هدر لوکس بازی */}
            <div className="bg-gradient-to-b from-[#1e1c19] to-[#110f0d] border-b border-[#35332e] px-4 py-8 pt-12 relative overflow-hidden">
                <button onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2 bg-[#262421] rounded-xl text-zinc-400 hover:text-white transition-all z-20"><ChevronRight size={20} /></button>
                
                <div className="max-w-3xl mx-auto flex items-center justify-between relative z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-2xl bg-white text-zinc-900 flex items-center justify-center font-black text-xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">سفید</div>
                        <span className="font-bold text-sm text-white">{meta.whiteName}</span>
                    </div>

                    <div className="flex flex-col items-center px-4">
                        <span className="text-3xl font-black text-farzin-accent drop-shadow-[0_0_15px_rgba(119,149,86,0.5)] mb-1" dir="ltr">{meta.result}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">گزارش نهایی</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-2xl bg-[#1e1c19] border border-[#35332e] text-zinc-300 flex items-center justify-center font-black text-xl shadow-lg">سیاه</div>
                        <span className="font-bold text-sm text-white">{meta.blackName}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8 flex flex-col gap-6">
                
                {/* 🌟 حلقه‌های دقت (Accuracy) */}
                <div className="bg-[#1a1917] border border-[#35332e] rounded-[32px] p-6 shadow-xl relative overflow-hidden">
                    <h3 className="font-black text-zinc-400 text-sm mb-6 flex items-center gap-2"><Target size={18}/> دقت بازی (Accuracy)</h3>
                    
                    <div className="flex justify-around items-center">
                        {/* دقت سفید */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-28 h-28">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#262421" strokeWidth="12" />
                                    <motion.circle initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * reportStats.white.total) / 100 }} transition={{ duration: 1.5, ease: "easeOut" }} cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeWidth="12" strokeDasharray="264" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-black text-white" dir="ltr">{reportStats.white.total.toFixed(1)}</span></div>
                            </div>
                        </div>

                        {/* دقت سیاه */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-28 h-28">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#12110f" strokeWidth="12" />
                                    <motion.circle initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (264 * reportStats.black.total) / 100 }} transition={{ duration: 1.5, ease: "easeOut" }} cx="50" cy="50" r="42" fill="none" stroke="#71717a" strokeWidth="12" strokeDasharray="264" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-black text-zinc-300" dir="ltr">{reportStats.black.total.toFixed(1)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🌟 فازهای بازی */}
                <div className="bg-[#1a1917] border border-[#35332e] rounded-[32px] p-6 shadow-xl">
                    <h3 className="font-black text-zinc-400 text-sm mb-6 flex items-center gap-2"><Activity size={18}/> بررسی فازهای بازی</h3>
                    
                    <div className="flex flex-col gap-4">
                        {[
                            { label: 'گشایش (Opening)', w: reportStats.white.op, b: reportStats.black.op, icon: BookOpen },
                            { label: 'وسط بازی (Middlegame)', w: reportStats.white.mid, b: reportStats.black.mid, icon: Flame },
                            { label: 'آخر بازی (Endgame)', w: reportStats.white.end, b: reportStats.black.end, icon: Shield }
                        ].map((phase, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-[#12110f] rounded-2xl border border-[#262421]">
                                <span className="w-12 text-center text-sm font-black text-white" dir="ltr">{phase.w.toFixed(1)}</span>
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <phase.icon size={14} />
                                    <span className="text-xs font-bold">{phase.label}</span>
                                </div>
                                <span className="w-12 text-center text-sm font-black text-zinc-400" dir="ltr">{phase.b.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* دکمه‌های اکشن */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button onClick={() => navigate('/analysis/board', { state: location.state })} className="flex-1 bg-farzin-accent hover:bg-[#68824b] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(119,149,86,0.3)] transition-all active:scale-95">
                        <CheckCircle2 size={20} /> بررسی دقیق حرکات با مربی
                    </button>
                    <button className="flex-1 bg-[#262421] hover:bg-[#35332e] text-white py-4 rounded-2xl font-black text-sm transition-all active:scale-95 border border-[#35332e]">
                        اشتراک‌گذاری گزارش
                    </button>
                </div>

            </div>
        </motion.div>
    );
}