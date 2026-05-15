import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// 🌟 مشکل اینجا بود: Trophy به لیست ایمپورت‌ها اضافه شد
import { ChevronRight, Zap, Flame, Infinity as InfinityIcon, Shield, Search, X, CheckCircle2, AlertCircle, Bot, Info, ShieldAlert, PlayCircle, Trophy } from 'lucide-react';

export default function LichessLobby() {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(localStorage.getItem('lichess_token'));
    const [inputToken, setInputToken] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchTime, setSearchTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [ongoingGames, setOngoingGames] = useState<any[]>([]);

    const controllersRef = useRef<{ seek?: AbortController, event?: AbortController }>({});
    const lastTimeControlRef = useRef<string>('10+0');

    // 🌟 تابع هوشمند چک کردن بازی‌های در جریان
    const checkOngoingGames = async (autoJoin = false) => {
        if (!token) return;
        try {
            const res = await fetch('https://lichess.org/api/account/playing', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOngoingGames(data.nowPlaying || []);
                
                // اگر در حالت جستجو هستیم و بازی پیدا شد، مستقیماً واردش شو
                if (autoJoin && data.nowPlaying && data.nowPlaying.length > 0) {
                    const latestGame = data.nowPlaying[0];
                    controllersRef.current.seek?.abort();
                    controllersRef.current.event?.abort();
                    setIsSearching(false);
                    navigate(`/play/online/game/${latestGame.gameId}`, { 
                        state: { timeControl: lastTimeControlRef.current, gameId: latestGame.gameId, token } 
                    });
                }
            }
        } catch (e) {}
    };

    // چک کردن در بدو ورود
    useEffect(() => {
        if (token) checkOngoingGames();
    }, [token]);

    // 🌟 تایمر جستجو + رادار پشتیبان (Polling)
    useEffect(() => {
        let timer: any;
        let poller: any;
        if (isSearching) {
            timer = setInterval(() => setSearchTime(p => p + 1), 1000);
            // هر 3 ثانیه چک کن آیا لیچس در سکوت بازی رو شروع کرده یا نه
            poller = setInterval(() => {
                checkOngoingGames(true);
            }, 3000);
        } else {
            setSearchTime(0);
        }
        return () => {
            clearInterval(timer);
            clearInterval(poller);
        };
    }, [isSearching]);

    useEffect(() => {
        return () => {
            controllersRef.current.seek?.abort();
            controllersRef.current.event?.abort();
        };
    }, []);

    const handleLogin = () => {
        if (!inputToken.trim()) { setError("لطفاً توکن را وارد کنید"); return; }
        
        fetch('https://lichess.org/api/account', {
            headers: { 'Authorization': `Bearer ${inputToken}` }
        }).then(res => {
            if (res.ok) {
                localStorage.setItem('lichess_token', inputToken);
                setToken(inputToken);
                setError(null);
                checkOngoingGames(); // بلافاصله بعد لاگین بازی‌ها رو بیار
            } else {
                setError("توکن نامعتبر است. لطفاً توکنی با دسترسی Play games with the board API ایجاد کنید.");
            }
        }).catch(() => setError("خطا در برقراری ارتباط با لیچس."));
    };

    const handleLogout = () => {
        localStorage.removeItem('lichess_token');
        setToken(null);
        setOngoingGames([]);
    };

    // استریم اصلی (برای مچ‌میکینگ عمومی)
    const listenForGameStart = async (eventController: AbortController, seekController: AbortController, timeControl: string) => {
        try {
            const res = await fetch('https://lichess.org/api/stream/event', {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: eventController.signal
            });
            const reader = res.body?.getReader();
            const decoder = new TextDecoder('utf-8');
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(l => l.trim() !== '');
                    for (let line of lines) {
                        try {
                            const data = JSON.parse(line);
                            if (data.type === 'gameStart') {
                                seekController.abort();
                                eventController.abort();
                                setIsSearching(false);
                                navigate(`/play/online/game/${data.game.id || data.game.gameId}`, { 
                                    state: { timeControl, gameId: data.game.id || data.game.gameId, token } 
                                });
                                return;
                            }
                        } catch (e) {}
                    }
                }
            }
        } catch (e: any) {}
    };

    const handleSeek = async (timeControl: string) => {
        if (!token) return;
        setIsSearching(false); setError(null);
        lastTimeControlRef.current = timeControl;

        const [minStr, incStr] = timeControl.split('+');
        const minutes = parseInt(minStr, 10);
        const increment = parseInt(incStr, 10);

        if (minutes < 10) {
            setError("لیچس به کلاینت‌ها اجازه مچ‌میکینگ عمومی در زمان‌های Bullet/Blitz را نمی‌دهد. برای بازی‌های سرعتی از بخش ربات استفاده کنید.");
            return;
        }

        setIsSearching(true);
        controllersRef.current.seek?.abort();
        controllersRef.current.event?.abort();

        const eventController = new AbortController();
        const seekController = new AbortController();
        controllersRef.current = { event: eventController, seek: seekController };

        listenForGameStart(eventController, seekController, timeControl);

        try {
            const formData = new URLSearchParams();
            formData.append('rated', 'false');
            formData.append('time', minutes.toString());
            formData.append('increment', increment.toString());

            const response = await fetch('https://lichess.org/api/board/seek', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
                signal: seekController.signal
            });

            if (!response.ok) {
                eventController.abort();
                const errText = await response.text();
                let exactError: any = errText;
                try { const errJson = JSON.parse(errText); exactError = errJson.error || errJson.message || errText; } catch(e) {}
                const errorString = typeof exactError === 'string' ? exactError : JSON.stringify(exactError);

                if (response.status === 400 && errorString.toLowerCase().includes('already seeking')) throw new Error("شما در حال حاضر یک جستجوی فعال دارید.");
                else if (response.status === 403) throw new Error("دسترسی غیرمجاز (403): لطفاً بررسی کنید توکن دسترسی Board API داشته باشد.");
                else if (response.status === 429) throw new Error("درخواست بیش از حد (429). کمی صبر کنید.");
                throw new Error(`خطا (${response.status}): ${errorString}`);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') { setIsSearching(false); setError(err.message); }
        }
    };

    const handleChallengeMaia = async (timeControl: string) => {
        if (!token) return;
        setIsSearching(true); setError(null);
        lastTimeControlRef.current = timeControl;

        controllersRef.current.seek?.abort();
        controllersRef.current.event?.abort();

        const eventController = new AbortController();
        const seekController = new AbortController();
        controllersRef.current = { event: eventController, seek: seekController };

        listenForGameStart(eventController, seekController, timeControl);

        const [minStr, incStr] = timeControl.split('+');
        const limitInSeconds = parseInt(minStr, 10) * 60;
        const increment = parseInt(incStr, 10);

        try {
            const formData = new URLSearchParams();
            formData.append('rated', 'false');
            formData.append('clock.limit', limitInSeconds.toString()); 
            formData.append('clock.increment', increment.toString());

            const response = await fetch('https://lichess.org/api/challenge/maia1', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
                signal: seekController.signal
            });

            if (!response.ok) {
                eventController.abort();
                const errText = await response.text();
                let exactError: any = errText;
                try { const errJson = JSON.parse(errText); exactError = errJson.error || errJson.message || errText; } catch(e) {}
                const errorString = typeof exactError === 'string' ? exactError : JSON.stringify(exactError);
                if (response.status === 403) throw new Error("دسترسی غیرمجاز (403).");
                throw new Error(`خطای ربات (${response.status}): ${errorString}`);
            }

            const data = await response.json();
            // اگر ربات درجا قبول کرد که چه بهتر، اگر نه منتظر رادار Polling و Event Stream می‌مانیم
            if (data.game && data.game.id) {
                eventController.abort();
                setIsSearching(false);
                navigate(`/play/online/game/${data.game.id}`, { state: { timeControl, gameId: data.game.id, token } });
            } else if (data.challenge && data.challenge.id) {
                // منتظر می‌مانیم تا رادارِ ثانویه پیدایش کند
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') { setIsSearching(false); setError(err.message); }
        }
    };

    const handleCancelSearch = () => {
        controllersRef.current.seek?.abort();
        controllersRef.current.event?.abort();
        setIsSearching(false); 
        setError("جستجو توسط شما لغو شد.");
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
                    <p className="text-xs text-zinc-500 font-bold mt-1">متصل به سرورهای واقعی Lichess.org</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-3xl mx-auto">
                <AnimatePresence mode="wait">
                    {!token ? (
                        <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-[#11100e]/80 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] text-center shadow-[0_30px_60px_rgba(0,0,0,0.6)] w-full">
                            <Shield size={64} className="mx-auto text-zinc-600 mb-6" />
                            <h2 className="text-2xl font-black mb-3">اتصال واقعی به لیچس</h2>
                            <p className="text-sm text-zinc-400 font-bold mb-6 leading-relaxed">برای بازی، یک توکن با دسترسی <span className="text-sky-400 bg-sky-500/10 px-2 py-1 rounded">Play games with the board API</span> در سایت لیچس ایجاد کرده و اینجا وارد کنید.</p>
                            
                            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 justify-center"><AlertCircle size={14}/> {error}</div>}
                            
                            <input 
                                type="password" 
                                placeholder="lip_..." 
                                value={inputToken}
                                onChange={(e) => setInputToken(e.target.value)}
                                className="w-full bg-[#1e1c19] border border-[#35332e] text-center focus:border-farzin-accent rounded-xl py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors mb-4" 
                                dir="ltr"
                            />

                            <button onClick={handleLogin} className="w-full bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all">
                                تایید و اتصال
                            </button>
                        </motion.div>
                    ) : isSearching ? (
                        <motion.div key="searching" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full">
                            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                                <div className="absolute inset-0 border-4 border-farzin-accent/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                                <div className="absolute inset-4 border-4 border-farzin-accent/40 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
                                <div className="absolute inset-10 bg-farzin-accent/20 rounded-full blur-[20px] animate-pulse"></div>
                                <div className="relative z-10 bg-[#161512]/90 backdrop-blur-xl border border-white/10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl">
                                    <Search size={32} className="text-farzin-accent animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black mb-2 text-center">در انتظار اتصال حریف واقعی...</h2>
                            <p className="text-farzin-accent font-mono font-bold tracking-widest text-lg mb-8">00:{searchTime.toString().padStart(2, '0')}</p>
                            <button onClick={handleCancelSearch} className="px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full font-bold hover:bg-red-500/20 active:scale-95 transition-all flex items-center gap-2">
                                <X size={18} /> لغو جستجو
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                            
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h3 className="font-black text-lg text-zinc-300">یک کنترل زمانی انتخاب کنید</h3>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2 bg-farzin-accent/10 text-farzin-accent px-3 py-1.5 rounded-full border border-farzin-accent/30">
                                        <CheckCircle2 size={14} /> <span className="text-[10px] font-bold">متصل</span>
                                    </div>
                                    <button onClick={handleLogout} className="bg-zinc-800 hover:bg-zinc-700 text-xs px-3 py-1.5 rounded-full border border-zinc-600 transition-colors">تغییر توکن</button>
                                </div>
                            </div>

                            {/* 🌟 بخش رادار بازی‌های در جریان */}
                            {ongoingGames.length > 0 && (
                                <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <PlayCircle size={20} className="animate-pulse" />
                                        <span className="font-black text-sm">شما {ongoingGames.length} بازی فعال دارید!</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {ongoingGames.map((g: any) => (
                                            <button 
                                                key={g.gameId} 
                                                onClick={() => navigate(`/play/online/game/${g.gameId}`, { state: { gameId: g.gameId, token, timeControl: '10+0' } })}
                                                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 py-3 rounded-xl flex items-center justify-between px-4 transition-all active:scale-95"
                                            >
                                                <span className="font-bold text-xs flex items-center gap-2"><Trophy size={14}/> حریف: {g.opponent?.username || 'ناشناس'}</span>
                                                <span className="text-[10px] bg-emerald-500/20 px-2 py-1 rounded-md">ورود به بازی</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl leading-relaxed flex items-center gap-2 shadow-inner"><AlertCircle size={20} className="shrink-0"/> {error}</div>}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                {timeControls.map((tc) => {
                                    const min = parseInt(tc.id.split('+')[0]);
                                    const isSpeedGame = min < 10;
                                    
                                    return (
                                    <button 
                                        key={tc.id} 
                                        onClick={() => handleSeek(tc.id)}
                                        className={`backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col items-center gap-3 transition-all group active:scale-95 ${isSpeedGame ? 'bg-[#11100e]/40 opacity-50 cursor-not-allowed hover:bg-red-500/5 hover:border-red-500/30' : 'bg-[#11100e]/80 hover:border-farzin-accent/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(119,149,86,0.15)]'}`}
                                        title={isSpeedGame ? "API اجازه ساخت بازی سرعتی عمومی را نمی‌دهد" : ""}
                                    >
                                        <div className={`p-3 rounded-2xl ${tc.bg} ${tc.color} ${tc.border} border transition-transform ${!isSpeedGame && 'group-hover:scale-110'}`}><tc.icon size={24} /></div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="font-black text-xl text-white" dir="ltr">{tc.id}</span>
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{tc.name}</span>
                                        </div>
                                    </button>
                                )})}
                            </div>

                            <div className="w-full bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-5 shadow-inner flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-indigo-400">
                                    <ShieldAlert size={18} />
                                    <h4 className="font-bold text-sm">محیط تست امن (بدون بن شدن)</h4>
                                </div>
                                <p className="text-[11px] text-indigo-300/70 mb-2">برای تست کدها، لغو مکرر بازی و تست بازی‌های سرعتی (Bullet/Blitz) فقط از این دکمه‌ها استفاده کنید.</p>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <button onClick={() => handleChallengeMaia('1+0')} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-95">
                                        <Zap size={16} /> <span className="text-xs font-black" dir="ltr">1+0</span>
                                    </button>
                                    <button onClick={() => handleChallengeMaia('3+2')} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-95">
                                        <Flame size={16} /> <span className="text-xs font-black" dir="ltr">3+2</span>
                                    </button>
                                    <button onClick={() => handleChallengeMaia('10+0')} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-95">
                                        <Shield size={16} /> <span className="text-xs font-black" dir="ltr">10+0</span>
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}