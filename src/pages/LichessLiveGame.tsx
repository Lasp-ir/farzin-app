import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Flag, Handshake, Trophy, Cpu, Zap, RotateCcw, PieChart } from 'lucide-react';

const Board = Chessboard as any;

export default function LichessLiveGame() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // دریافت آیدی بازی و توکن از لابی
    const gameId = location.state?.gameId;
    const token = location.state?.token;
    
    const [game, setGame] = useState(new Chess());
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [gameOver, setGameOver] = useState<{ status: string; winner: string | null } | null>(null);
    
    const [playerTime, setPlayerTime] = useState(180); 
    const [opponentTime, setOpponentTime] = useState(180);
    
    const [opponentInfo, setOpponentInfo] = useState({ name: 'حریف', rating: '?' });
    
    // 🌟 اتصال به استریم زنده بازی در Lichess
    useEffect(() => {
        if (!gameId || !token) {
            navigate('/play/online/lobby');
            return;
        }

        let abortController = new AbortController();

        const connectToGameStream = async () => {
            try {
                const response = await fetch(`https://lichess.org/api/board/game/stream/${gameId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: abortController.signal
                });

                if (!response.ok) throw new Error("اتصال به بازی برقرار نشد");

                const reader = response.body?.getReader();
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
                                
                                // سیگنال وضعیت اولیه بازی
                                if (data.type === 'gameFull') {
                                    // تشخیص رنگ خودمون
                                    const isWhite = data.white.id === data.id; // یا مقایسه با نام کاربری
                                    // برای سادگی فرض می‌کنیم اگر اسم توکن ما تو بخش white بود ما سفیدیم
                                    setOpponentInfo({ 
                                        name: data.black.name || 'Anonymous', 
                                        rating: data.black.rating?.toString() || '?' 
                                    });
                                    // (در کد کامل‌تر، ما رنگمون رو از آبجکت بازیکن‌ها استخراج می‌کنیم)
                                    
                                    // آپدیت تخته اگر حرکتی زده شده
                                    const newGame = new Chess();
                                    if (data.state.moves) {
                                        data.state.moves.split(' ').forEach((m: string) => newGame.move(m, { sloppy: true }));
                                    }
                                    setGame(newGame);
                                }
                                // دریافت حرکت جدید (حریف یا حتی خودمان)
                                else if (data.type === 'gameState') {
                                    const moves = data.moves.split(' ');
                                    const newGame = new Chess();
                                    moves.forEach((m: string) => { if(m) newGame.move(m, { sloppy: true }) });
                                    setGame(newGame);
                                    
                                    // آپدیت زمان‌ها از سرور (wtime, btime به میلی‌ثانیه)
                                    setPlayerTime(Math.floor(data.wtime / 1000));
                                    setOpponentTime(Math.floor(data.btime / 1000));

                                    // بررسی پایان بازی
                                    if (data.status !== 'started') {
                                        setGameOver({ status: data.status, winner: data.winner || null });
                                    }
                                }
                            } catch (e) {}
                        }
                    }
                }
            } catch (err) {
                if (err.name !== 'AbortError') console.error(err);
            }
        };

        connectToGameStream();
        return () => abortController.abort();
    }, [gameId, token, navigate]);

    // آپدیت وضعیت نوبت کاربر (با هر تغییر در تخته)
    useEffect(() => {
        setIsPlayerTurn(game.turn() === playerColor[0]);
    }, [game, playerColor]);

    // 🌟 ارسال حرکت واقعی به لیچس
    const handleMove = async (sourceSquare: string, targetSquare: string, piece: string) => {
        if (gameOver || !isPlayerTurn) return false;

        const moves = game.moves({ verbose: true });
        const move = moves.find(m => m.from === sourceSquare && m.to === targetSquare);
        if (!move) return false;

        // فرمت UCI (مثال: e2e4 یا e7e8q)
        const uciMove = `${sourceSquare}${targetSquare}${move.promotion ? 'q' : ''}`;

        // آپدیت خوش‌بینانه UI برای سرعت بالا (Optimistic UI Update)
        const gameCopy = new Chess(game.fen());
        gameCopy.move(move);
        setGame(gameCopy);

        try {
            // ارسال دستور حرکت به لیچس
            const response = await fetch(`https://lichess.org/api/board/game/${gameId}/move/${uciMove}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                // اگر لیچس ارور داد حرکت رو برمی‌گردونیم
                setGame(new Chess(game.fen()));
                return false;
            }
            return true;
        } catch (e) {
            setGame(new Chess(game.fen()));
            return false;
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // 🌟 ارسال سیگنال تسلیم و تساوی واقعی به لیچس
    const handleResign = async () => {
        if (gameOver) return;
        await fetch(`https://lichess.org/api/board/game/${gameId}/abort`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        await fetch(`https://lichess.org/api/board/game/${gameId}/resign`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
    };

    const handleDrawOffer = async () => {
        if (gameOver) return;
        await fetch(`https://lichess.org/api/board/game/${gameId}/draw/yes`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
    };

    const PlayerBar = ({ name, rating, time, isActive, isOpponent }: any) => (
        <div className={`flex items-center justify-between w-full py-3 px-4 bg-[#161512]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg transition-all ${isActive ? 'ring-1 ring-farzin-accent/50' : 'opacity-80'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isOpponent ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-gradient-to-br from-zinc-700 to-zinc-800 text-white'}`}>
                    {isOpponent ? <Cpu size={20} /> : 'ش'}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-white text-sm flex items-center gap-2">{name} <span className="text-zinc-500 font-mono text-xs">{rating}</span></span>
                </div>
            </div>
            <div className={`text-2xl font-mono font-black px-4 py-1.5 rounded-lg shadow-inner ${isActive ? 'bg-white text-black' : 'bg-[#262421] text-zinc-400'}`}>
                {formatTime(time)}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[100dvh] bg-[#050505] text-gray-300 overflow-hidden font-sans relative" dir="rtl">
            <div className="fixed top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-farzin-accent/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="flex-none h-16 flex items-center justify-between px-6 bg-[#11100e]/80 backdrop-blur-xl border-b border-white/5 z-20">
                <button onClick={() => navigate('/play/online/lobby')} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 active:scale-95">
                    <ArrowRight size={20} />
                </button>
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Live Lichess</span>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 lg:p-8 w-full max-w-[600px] mx-auto relative z-10">
                
                <div className="w-full mb-3">
                    <PlayerBar name={opponentInfo.name} rating={opponentInfo.rating} time={opponentTime} isActive={!isPlayerTurn && !gameOver} isOpponent={true} />
                </div>

                <div className="w-full aspect-square max-h-[60vh] relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-md border-[4px] border-[#2A2926] overflow-hidden">
                    <Board 
                        position={game.fen()} 
                        boardOrientation={playerColor}
                        onPieceDrop={(from: string, to: string, piece: string) => handleMove(from, to, piece)}
                        customDarkSquareStyle={{ backgroundColor: '#779556' }}
                        customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                        animationDuration={200}
                    />

                    <AnimatePresence>
                        {gameOver && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
                                <Trophy size={64} className={`mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] ${gameOver.winner === playerColor ? 'text-amber-400' : 'text-zinc-500'}`} />
                                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                                    {gameOver.winner === playerColor ? 'پیروزی درخشان!' : gameOver.winner === null ? 'تساوی' : 'شکست'}
                                </h2>
                                <p className="text-zinc-400 mb-8 font-bold text-sm">سرور لیچس: بازی با {gameOver.status} خاتمه یافت.</p>
                                
                                <div className="flex flex-col w-full max-w-[280px] gap-3">
                                    <button 
                                        onClick={() => navigate('/report', { state: { data: game.pgn(), forceNew: true, meta: { white: { name: playerColor === 'white' ? 'شما' : opponentInfo.name, elo: 1500 }, black: { name: playerColor === 'black' ? 'شما' : opponentInfo.name, elo: 1500 }, result: gameOver.winner === null ? '1/2-1/2' : gameOver.winner === 'white' ? '1-0' : '0-1' } } })} 
                                        className="w-full bg-gradient-to-r from-farzin-accent to-[#5c7a40] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(119,149,86,0.4)] active:scale-95 transition-all"
                                    >
                                        <PieChart size={18} /> کالبدشکافی استراتژیک
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => navigate('/play/online/lobby')} className="bg-[#262421] hover:bg-[#35332e] text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-[#35332e]"><RotateCcw size={14}/> حریف جدید</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-full mt-3">
                    <PlayerBar name="شما" rating={1500} time={playerTime} isActive={isPlayerTurn && !gameOver} isOpponent={false} />
                </div>

                {/* 🌟 دکمه‌های تسلیم و پیشنهاد تساوی که به سرور لیچس متصل هستند */}
                {!gameOver && (
                    <div className="flex w-full gap-3 mt-4">
                        <button onClick={handleDrawOffer} className="flex-1 bg-[#161512]/80 backdrop-blur border border-white/5 hover:bg-white/10 text-zinc-300 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"><Handshake size={16}/> پیشنهاد تساوی</button>
                        <button onClick={handleResign} className="flex-1 bg-rose-500/10 backdrop-blur border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"><Flag size={16}/> تسلیم شدن</button>
                    </div>
                )}
            </div>
        </div>
    );
}