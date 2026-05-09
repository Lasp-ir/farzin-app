import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Flag, Handshake, Trophy, ScrollText, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// این همان خطی است که جا مانده بود و باعث ارور شد!
const Board = Chessboard as any;

export default function PlayAI() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // اطلاعات ربات از صفحه قبل
  const opponent = location.state?.selectedBot || { name: 'شبیه‌ساز (مبتدی)', rating: 1200, accuracy: 'پایه' };

  // استیت‌های اصلی بازی
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  
  // تایمرها (۶۰۰ ثانیه = ۱۰ دقیقه)
  const [playerTime, setPlayerTime] = useState(600);
  const [opponentTime, setOpponentTime] = useState(600);
  
  // وضعیت‌های کنترل بازی
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState<{ status: string; winner: string | null } | null>(null);

  // فرمت زمان به MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
    const s = Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // مدیریت تایمرها
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      if (isPlayerTurn) {
        setPlayerTime((prev) => {
          if (prev <= 1) handleGameOver('timeout', 'black');
          return prev - 1;
        });
      } else {
        setOpponentTime((prev) => {
          if (prev <= 1) handleGameOver('timeout', 'white');
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayerTurn, gameOver]);

  // تابع مرکزی اعمال حرکت
  const makeMove = (move: any) => {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      
      if (result) {
        setGame(gameCopy);
        setFen(gameCopy.fen());
        setMoveHistory(gameCopy.history());
        
        // بررسی پایان بازی بعد از حرکت
        if (gameCopy.isGameOver()) {
          if (gameCopy.isCheckmate()) {
            handleGameOver('checkmate', gameCopy.turn() === 'w' ? 'black' : 'white');
          } else if (gameCopy.isDraw() || gameCopy.isStalemate() || gameCopy.isThreefoldRepetition()) {
            handleGameOver('draw', null);
          }
        }
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  // وقتی کاربر مهره را رها می‌کند
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (!isPlayerTurn || gameOver) return false;

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move) {
      setIsPlayerTurn(false);
      return true;
    }
    return false;
  };

  // منطق بات آفلاین (تا زمانی که به پایتون متصل شویم)
  useEffect(() => {
    if (!isPlayerTurn && !gameOver) {
      const thinkTime = opponent.accuracy === 'پایه' ? 1000 : 2500;
      
      const botMoveTimer = setTimeout(() => {
        const possibleMoves = game.moves();
        if (possibleMoves.length > 0) {
          const randomIndex = Math.floor(Math.random() * possibleMoves.length);
          makeMove(possibleMoves[randomIndex]);
          setIsPlayerTurn(true);
        }
      }, thinkTime);

      return () => clearTimeout(botMoveTimer);
    }
  }, [isPlayerTurn, gameOver, game, opponent.accuracy]);

  const handleGameOver = (reason: string, winnerColor: string | null) => {
    setGameOver({ status: reason, winner: winnerColor });
  };

  const handleResign = () => {
    if (!gameOver) handleGameOver('resign', 'black');
  };

  const handleDraw = () => {
    if (!gameOver) handleGameOver('draw_agreed', null);
  };

  // کامپوننت پروفایل
  const PlayerInfo = ({ name, rating, time, isOpponent, isActive, accuracy }: any) => (
    <div className={`flex items-center justify-between p-3 rounded-xl mb-2 mt-2 bg-gray-800 border ${isActive ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-gray-700/50'} transition-all duration-300`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${isOpponent ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'}`}>
           {name.charAt(0)}
        </div>
        <div>
          <div className="font-bold text-gray-100 flex items-center gap-2">
            {name} 
            {isOpponent && accuracy && accuracy !== 'پایه' && (
                <span className="text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                   <Zap size={10} /> PRO
                </span>
            )}
          </div>
          <div className="text-sm text-gray-400">ریتیگ: {rating}</div>
        </div>
      </div>
      <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${isActive ? 'bg-amber-500/20 text-amber-400' : (time < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-gray-900 text-gray-300')}`}>
        {formatTime(time)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white relative">
      
      {/* هدر */}
      <div className="flex items-center justify-between p-4 bg-gray-800/80 border-b border-gray-700 shadow-sm backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
             {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
           </button>
           <div className="flex flex-col">
             <span className="font-bold text-gray-200 leading-tight">بازی کلاسیک</span>
             <span className="text-xs text-gray-500">۱۰+۰ • در حال جریان</span>
           </div>
        </div>
        <div className="flex gap-4">
            <button onClick={handleDraw} className="text-gray-400 hover:text-white transition-colors" title="پیشنهاد تساوی"><Handshake size={20} /></button>
            <button onClick={handleResign} className="text-gray-400 hover:text-red-400 transition-colors" title="تسلیم شدن"><Flag size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-4 max-w-4xl mx-auto w-full lg:flex-row lg:items-start lg:gap-8">
        
        {/* بخش چپ: تخته و پروفایل‌ها */}
        <div className="w-full max-w-[500px] flex-1">
          <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} accuracy={opponent.accuracy} />

          <div className="w-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-sm border-2 border-gray-700/50 overflow-hidden relative">
            <Board 
              position={fen} 
              onPieceDrop={onDrop}
              animationDuration={200}
              customDarkSquareStyle={{ backgroundColor: '#739552' }}
              customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
            />
            
            {gameOver && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                <Trophy size={48} className={gameOver.winner === 'white' ? 'text-amber-400 mb-4' : 'text-gray-400 mb-4'} />
                <h2 className="text-3xl font-bold text-white mb-2">
                  {gameOver.winner === 'white' ? 'شما بردید!' : gameOver.winner === 'black' ? 'ربات پیروز شد!' : 'تساوی!'}
                </h2>
                <p className="text-gray-300">
                  {gameOver.status === 'checkmate' ? 'کیش و مات' : 
                   gameOver.status === 'timeout' ? 'پایان زمان' : 
                   gameOver.status === 'resign' ? 'تسلیم شدن' : 'توافق طرفین'}
                </p>
                <button onClick={() => navigate('/archive')} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-bold transition-colors">
                  تحلیل بازی
                </button>
              </div>
            )}
          </div>

          <PlayerInfo name="کاربر شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} />
        </div>

        {/* بخش راست: پنل PGN */}
        <div className="w-full max-w-[500px] lg:w-80 mt-6 lg:mt-2 bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-[300px] lg:h-[600px]">
          <div className="bg-gray-900/50 p-3 border-b border-gray-700 flex items-center gap-2">
            <ScrollText size={18} className="text-gray-400" />
            <span className="font-bold text-sm text-gray-200">تاریخچه حرکات</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {moveHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">بازی هنوز شروع نشده است</div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {moveHistory.reduce((acc: any[], move, index) => {
                  if (index % 2 === 0) acc.push([move]);
                  else acc[acc.length - 1].push(move);
                  return acc;
                }, []).map((pair, i) => (
                  <div key={i} className="col-span-2 flex hover:bg-gray-700/50 rounded px-2 py-1 transition-colors">
                    <span className="w-8 text-gray-500 font-mono">{i + 1}.</span>
                    <span className="flex-1 font-bold text-gray-200">{pair[0]}</span>
                    <span className="flex-1 font-bold text-gray-400">{pair[1] || ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}