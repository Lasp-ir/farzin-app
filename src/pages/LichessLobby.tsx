import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, Flame, Infinity as InfinityIcon, Shield, Search, X, CheckCircle2 } from 'lucide-react';

export default function LichessLobby() {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(localStorage.getItem('lichess_token'));
    const [isSearching, setIsSearching] = useState(false);
    const [searchTime, setSearchTime] = useState(0);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // شبیه‌ساز تایمر جستجو
    useEffect(() => {
        let interval: any;
        if (isSearching) interval = setInterval(() => setSearchTime(p => p + 1), 1000);
        else setSearchTime(0);
        return () => clearInterval(interval);
    }, [isSearching]);

    const handleLogin = () => {
        // در دنیای واقعی اینجا کاربر به Lichess OAuth ریدایرکت میشه
        // برای تست، یک توکن دمو ست می‌کنیم
        const demoToken = "lip_demo_token_123";
        localStorage.setItem('lichess_token', demoToken);
        setToken(demoToken);
    };

    const handleSeek = (timeControl: string) => {
        setSelectedTime(timeControl);
        setIsSearching(true);
        // شبیه‌سازی پیدا شدن حریف بعد از 4 ثانیه (در واقعیت اینجا به وب‌سوکت لیچس وصل می‌شیم)
        setTimeout(() => {
            setIsSearching(false);
            navigate('/play/online/game/game_demo_123', { state: { timeControl, color: 'white' } });
        }, 4000);
    };

    const timeControls = [
        { id: '1+0', name: 'گلوله', icon: Zap, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30' },
        { id: '3+0', name: 'برق‌آسا', icon: Flame, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
        { id: '3+2', name: 'برق‌آسا', icon: Flame, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
        { id: '5+0', name: 'برق‌آسا', icon: Flame, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
        { id: '5+3', name: 'برق‌آسا', icon: Flame, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
        { id: '10+0', name: 'سریع', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
        { id: '15+10', name: 'سریع', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
        { id: '30+0', name: 'کلاسیک', icon: InfinityIcon, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/30' },
    ];

    return (
        <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col font-sans relative overflow-hidden" dir="rtl">
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-farzin-accent/10 blur-[150px] rounded-full pointer-events-none"></div>
            
            <div className="flex-none px-6 py-8 flex items-center gap-4 relative z-10">
                <button onClick={() => navigate('/')} className="p-2.5 bg-[#161512]/80 backdrop-blur-xl border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-all shadow-lg active:scale-95"><ChevronRight size={22} /></button>
                <div>
                    <h1 className="text-xl font-black">آرنای جهانی فرزین</h1>
                    <p className="text-xs text-zinc-500 font-bold mt-1">متصل به سرورهای Lichess.org</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-3xl mx-auto">
                <AnimatePresence mode="wait">
                    {!token ? (
                        <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-[#11100e]/80 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] text-center shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
                            <Shield size={64} className="mx-auto text-zinc-600 mb-6" />
                            <h2 className="text-2xl font-black mb-3">اتصال به شبکه جهانی</h2>
                            <p className="text-sm text-zinc-400 font-bold mb-8 leading-relaxed">برای بازی با میلیون‌ها بازیکن در سراسر جهان، ابتدا باید اکانت لیچس خود را متصل کنید. ما به هیچ عنوان به رمز عبور شما دسترسی نخواهیم داشت.</p>
                            <button onClick={handleLogin} className="w-full bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all">
                                ورود با Lichess
                            </button>
                        </motion.div>
                    ) : isSearching ? (
                        <motion.div key="searching" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                                <div className="absolute inset-0 border-4 border-farzin-accent/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                                <div className="absolute inset-4 border-4 border-farzin-accent/40 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
                                <div className="absolute inset-10 bg-farzin-accent/20 rounded-full blur-[20px] animate-pulse"></div>
                                <div className="relative z-10 bg-[#161512]/90 backdrop-blur-xl border border-white/10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl">
                                    <Search size={32} className="text-farzin-accent animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black mb-2">در حال یافتن حریف...</h2>
                            <p className="text-farzin-accent font-mono font-bold tracking-widest text-lg mb-8">00:{searchTime.toString().padStart(2, '0')}</p>
                            <button onClick={() => setIsSearching(false)} className="px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full font-bold hover:bg-red-500/20 active:scale-95 transition-all flex items-center gap-2">
                                <X size={18} /> لغو جستجو
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h3 className="font-black text-lg text-zinc-300">یک کنترل زمانی انتخاب کنید</h3>
                                <div className="flex items-center gap-2 bg-farzin-accent/10 text-farzin-accent px-3 py-1.5 rounded-full border border-farzin-accent/30">
                                    <CheckCircle2 size={14} /> <span className="text-[10px] font-bold">متصل</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {timeControls.map((tc) => (
                                    <button 
                                        key={tc.id} 
                                        onClick={() => handleSeek(tc.id)}
                                        className="bg-[#11100e]/80 backdrop-blur-xl border border-white/5 hover:border-farzin-accent/50 p-6 rounded-3xl flex flex-col items-center gap-3 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(119,149,86,0.15)] group active:scale-95"
                                    >
                                        <div className={`p-3 rounded-2xl ${tc.bg} ${tc.color} ${tc.border} border transition-transform group-hover:scale-110`}><tc.icon size={24} /></div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="font-black text-xl text-white" dir="ltr">{tc.id}</span>
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{tc.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}