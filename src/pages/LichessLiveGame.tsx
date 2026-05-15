import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Flag, Handshake, Trophy, Cpu, Zap, RotateCcw, PieChart } from 'lucide-react';

const Board = Chessboard as any;
const pieceChars: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

export default function LichessLiveGame() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // مقادیر اولیه (در واقعیت از وب‌سوکت لیچس پر می‌شن)
    const [game, setGame] = useState(new Chess());
    const [playerColor] = useState<'white' | 'black'>(location.state?.color || 'white');
    const [isPlayerTurn, setIsPlayerTurn] = useState(playerColor === 'white');
    const [gameOver, setGameOver] = useState<{ status: string; winner: string | null } | null>(null);
    
    const [playerTime, setPlayerTime] = useState(180); // 3 دقیقه تستی
    const [opponentTime, setOpponentTime] = useState(180);
    
    const [moveSquares, setMoveSquares] = useState<Record<string, any>>({});
    const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
    const [clickedSquare, setClickedSquare] = useState<string | null>(null);

    const opponentInfo = { name: 'MagnusC_Bot', rating: 2850 };

    // شبیه‌ساز تایمر
    useEffect(() => {
        if (gameOver) return;
        const timer = setInterval(() => {
            if (isPlayerTurn) setPlayerTime(p => Math.max(0, p - 1));
            else setOpponentTime(p => Math.max(0, p - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [isPlayerTurn, gameOver]);

    // شبیه‌ساز حرکت حریف (در واقعیت این بخش با رویدادهای سرور لیچس جایگزین میشه)
    useEffect(() => {
        if (!isPlayerTurn && !gameOver) {
            const timeout = setTimeout(() => {
                const moves = game.moves({ verbose: true });
                if (moves.length > 0) {
                    const randomMove = moves[Math.floor(Math.random() * moves.length)];
                    makeMove(randomMove);
                }
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [isPlayerTurn, gameOver, game]);

    const makeMove = (movePayload: any) => {
        try {
            const gameCopy = new Chess(game.fen());
            const result = gameCopy.move(movePayload);
            if (result) {
                setGame(gameCopy);
                setMoveSquares({ [result.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [result.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
                setOptionSquares({});
                setIsPlayerTurn(gameCopy.turn() === playerColor[0]);

                if (gameCopy.isGameOver()) {
                    if (gameCopy.isCheckmate()) setGameOver({ status: 'مات', winner: gameCopy.turn() === 'w' ? 'black' : 'white' });
                    else setGameOver({ status: 'تساوی', winner: null });
                }
                return true;
            }
        } catch (e) { return false; }
        return false;
    };

    const handleSquareClick = (square: string) => {
        if (gameOver || !isPlayerTurn) return;
        
        if (clickedSquare) {
            const success = makeMove({ from: clickedSquare, to: square, promotion: 'q' });
            if (success) {
                setClickedSquare(null);
                setOptionSquares({});
                // اینجا حرکت باید به API لیچس ارسال بشه
                return;
            }
        }
        
        const piece = game.get(square as any);
        if (piece && piece.color === playerColor[0]) {
            setClickedSquare(square);
            const moves = game.moves({ square: square as any, verbose: true });
            const newOpts: any = { [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } };
            moves.forEach((m: any) => {
                const isCapture = game.get(m.to as any);
                newOpts[m.to] = { backgroundImage: isCapture ? 'radial-gradient(circle, transparent 0%, transparent 65%, rgba(0,0,0,0.4) 67%, rgba(0,0,0,0.4) 100%)' : 'radial-gradient(circle, rgba(0,0,0,.4) 22%, transparent 23%)' };
            });
            setOptionSquares(newOpts);
        } else {
            setClickedSquare(null);
            setOptionSquares({});
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleResign = () => setGameOver({ status: 'تسلیم', winner: playerColor === 'white' ? 'black' : 'white' });
    const handleDrawOffer = () => setGameOver({ status: 'تساوی', winner: null });

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
            {/* افکت‌های پس‌زمینه */}
            <div className="fixed top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-farzin-accent/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="flex-none h-16 flex items-center justify-between px-6 bg-[#11100e]/80 backdrop-blur-xl border-b border-white/5 z-20">
                <button onClick={() => navigate('/play/online/lobby')} className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 active:scale-95">
                    <ArrowRight size={20} />
                </button>
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Live Match</span>
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
                        onSquareClick={handleSquareClick}
                        onPieceDrop={(from: string, to: string, piece: string) => {
                            if(gameOver || !isPlayerTurn || piece[0] !== playerColor[0]) return false;
                            const res = makeMove({ from, to, promotion: 'q' });
                            return res;
                        }}
                        customDarkSquareStyle={{ backgroundColor: '#779556' }}
                        customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                        customSquareStyles={{ ...moveSquares, ...optionSquares }}
                        animationDuration={200}
                    />

                    <AnimatePresence>
                        {gameOver && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
                                <Trophy size={64} className={`mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] ${gameOver.winner === playerColor ? 'text-amber-400' : 'text-zinc-500'}`} />
                                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                                    {gameOver.winner === playerColor ? 'پیروزی درخشان!' : gameOver.winner === null ? 'تساوی' : 'شکست'}
                                </h2>
                                <p className="text-zinc-400 mb-8 font-bold text-sm">بازی با {gameOver.status} خاتمه یافت.</p>
                                
                                <div className="flex flex-col w-full max-w-[280px] gap-3">
                                    <button 
                                        onClick={() => navigate('/report', { state: { data: game.pgn(), meta: { white: { name: playerColor === 'white' ? 'شما' : opponentInfo.name, elo: 1500 }, black: { name: playerColor === 'black' ? 'شما' : opponentInfo.name, elo: 1500 }, result: '*' } } })} 
                                        className="w-full bg-gradient-to-r from-farzin-accent to-[#5c7a40] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(119,149,86,0.4)] active:scale-95 transition-all"
                                    >
                                        <PieChart size={18} /> کالبدشکافی استراتژیک
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => window.location.reload()} className="bg-[#262421] hover:bg-[#35332e] text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-[#35332e]"><RotateCcw size={14}/> بازی مجدد</button>
                                        <button onClick={() => navigate('/play/online/lobby')} className="bg-[#262421] hover:bg-[#35332e] text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-[#35332e]"><Zap size={14}/> حریف جدید</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-full mt-3">
                    <PlayerBar name="شما" rating={1500} time={playerTime} isActive={isPlayerTurn && !gameOver} isOpponent={false} />
                </div>

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