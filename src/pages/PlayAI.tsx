import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Flag, Handshake, Trophy, Zap, ChevronLeft, ChevronRight, FastForward, Rewind, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Board = Chessboard as any;

export default function PlayAI() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const opponent = location.state?.selectedBot || { name: 'شبیه‌ساز (مبتدی)', rating: 1200, accuracy: 'پایه' };

  const [game, setGame] = useState(new Chess());
  const [playerTime, setPlayerTime] = useState(600);
  const [opponentTime, setOpponentTime] = useState(600);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState<{ status: string; winner: string | null } | null>(null);

  // استیت‌های جدید برای ظاهر و چرخش تخته
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [moveSquares, setMoveSquares] = useState<Record<string, any>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});

  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
    const s = Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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

  const makeMove = (move: any) => {
    try {
      const gameCopy = new Chess();
      gameCopy.loadPgn(game.pgn());
      const result = gameCopy.move(move);
      
      if (result) {
        setGame(gameCopy);
        
        // تنظیم هایلایت زرد برای آخرین حرکت
        setMoveSquares({
          [result.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
          [result.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
        });
        setOptionSquares({}); // پاک کردن نقطه‌های راهنما

        if (gameCopy.isGameOver()) {
          if (gameCopy.isCheckmate()) {
            handleGameOver('checkmate', gameCopy.turn() === 'w' ? 'black' : 'white');
          } else {
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

  // تابعی که وقتی کاربر مهره را کلیک می‌کند اجرا می‌شود (برای نمایش نقطه‌ها)
  const onPieceDragBegin = (piece: string, sourceSquare: string) => {
    if (!isPlayerTurn || gameOver) return;
    
    // گرفتن لیست حرکات قانونی برای مهره انتخاب شده
    const moves = game.moves({ square: sourceSquare as any, verbose: true });
    if (moves.length === 0) return;

    const newSquares: any = {};
    moves.forEach((m: any) => {
      newSquares[m.to] = {
        background:
          game.get(m.to as any) && game.get(m.to as any).color !== game.get(sourceSquare as any)?.color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' // دایره توخالی برای زدن مهره حریف
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)', // نقطه توپر برای حرکت عادی
        borderRadius: '50%'
      };
    });
    // هایلایت کردن خانه‌ای که مهره در آن است
    newSquares[sourceSquare] = { background: 'rgba(255, 255, 0, 0.4)' };
    setOptionSquares(newSquares);
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    setOptionSquares({}); // همیشه بعد از رها کردن مهره نقطه‌ها را پاک کن
    if (!isPlayerTurn || gameOver) return false;
    
    const move = makeMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move) {
      setIsPlayerTurn(false);
      return true;
    }
    return false;
  };

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

  const handleGameOver = (reason: string, winnerColor: string | null) => setGameOver({ status: reason, winner: winnerColor });
  const handleResign = () => { if (!gameOver) handleGameOver('resign', 'black'); };
  const handleDraw = () => { if (!gameOver) handleGameOver('draw_agreed', null); };

  const history = game.history();
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }

  const PlayerInfo = ({ name, rating, time, isOpponent, isActive, accuracy }: any) => (
    <div className="flex-none flex items-center justify-between w-full py-2 px-1">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-bold text-sm ${isOpponent ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'}`}>
           {name.charAt(0)}
        </div>
        <div className="font-bold text-gray-200 text-sm flex items-center gap-2">
          {name} <span className="text-gray-500 font-normal">{rating}</span>
          {isOpponent && accuracy && accuracy !== 'پایه' && (
             <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1 py-0.5 rounded border border-amber-500/30">PRO</span>
          )}
        </div>
      </div>
      <div className={`text-2xl font-mono font-bold px-3 py-1 rounded transition-colors shadow-sm ${isActive ? 'bg-gray-200 text-gray-900' : (time < 60 ? 'bg-red-500/20 text-red-400' : 'bg-[#262421] text-gray-400')}`}>
        {formatTime(time)}
      </div>
    </div>
  );

  // منطق جابجایی پروفایل‌ها با چرخش تخته
  const isPlayerWhite = boardOrientation === 'white';

  return (
    <div className="flex flex-col h-screen bg-[#161512] text-gray-300 overflow-hidden font-sans">
      
      <div className="flex-none h-14 flex items-center justify-between px-4 bg-[#262421] border-b border-gray-800 shadow-md">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
             {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
           </button>
           <div className="flex flex-col">
             <span className="font-bold text-gray-200 text-sm leading-tight">کلاسیک</span>
             <span className="text-xs text-gray-500">۱۰+۰ • دوستانه</span>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-2 lg:p-6 w-full max-w-[1200px] mx-auto gap-4 lg:gap-6">
        
        <div className="flex flex-col flex-1 min-w-0 h-full items-center justify-center">
          <div className="w-full h-full flex flex-col max-w-[90vh] lg:max-w-full">
            
            {/* نمایش داینامیک پروفایل بالای تخته بر اساس جهت تخته */}
            {isPlayerWhite ? (
              <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} accuracy={opponent.accuracy} />
            ) : (
              <PlayerInfo name="کاربر شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} />
            )}
            
            <div dir="ltr" className="w-full flex-1 min-h-0 relative flex items-center justify-center">
              <div className="w-full aspect-square max-h-full relative shadow-[0_5px_15px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border-[3px] border-[#35332e]">
                <Board 
                  position={game.fen()} 
                  onPieceDrop={onDrop}
                  onPieceDragBegin={onPieceDragBegin}
                  boardOrientation={boardOrientation}
                  customSquareStyles={{ ...moveSquares, ...optionSquares }}
                  animationDuration={200}
                  customDarkSquareStyle={{ backgroundColor: '#779556' }}
                  customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                />
                
                {gameOver && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                    <Trophy size={48} className={gameOver.winner === 'white' ? 'text-amber-400 mb-4' : 'text-gray-400 mb-4'} />
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {gameOver.winner === 'white' ? 'شما بردید!' : gameOver.winner === 'black' ? 'ربات پیروز شد!' : 'تساوی!'}
                    </h2>
                    <button onClick={() => navigate('/archive')} className="mt-6 px-6 py-2 bg-[#262421] hover:bg-gray-700 text-white rounded font-bold border border-gray-600 transition-colors">
                      تحلیل بازی
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* نمایش داینامیک پروفایل پایین تخته بر اساس جهت تخته */}
            {isPlayerWhite ? (
              <PlayerInfo name="کاربر شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} />
            ) : (
              <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} accuracy={opponent.accuracy} />
            )}
            
          </div>
        </div>

        <div className="flex-none w-full lg:w-[350px] flex flex-col bg-[#262421] border border-[#35332e] rounded-sm shadow-xl h-[30vh] lg:h-full shrink-0">
          
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pt-2" dir="ltr">
            {movePairs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">منتظر حرکت سفید...</div>
            ) : (
              <div className="flex flex-col text-[15px]">
                {movePairs.map((pair, index) => (
                  <div key={index} className={`flex px-2 py-1 ${index % 2 === 0 ? 'bg-[#2b2927]' : 'bg-[#262421]'}`}>
                    <div className="w-10 text-gray-500 font-mono text-right pr-3 select-none">{index + 1}.</div>
                    <div className="flex-1 font-bold text-[#b0aba2] hover:text-white cursor-pointer px-1">{pair[0]}</div>
                    <div className="flex-1 font-bold text-[#b0aba2] hover:text-white cursor-pointer px-1">{pair[1] || ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-none flex items-center justify-center gap-2 bg-[#201e1b] text-[#b0aba2] p-2 border-y border-[#35332e]">
            <button className="p-2 hover:bg-white/5 rounded transition-colors"><Rewind size={20}/></button>
            <button className="p-2 hover:bg-white/5 rounded transition-colors"><ChevronLeft size={24}/></button>
            <button className="p-2 hover:bg-white/5 rounded transition-colors"><ChevronRight size={24}/></button>
            <button className="p-2 hover:bg-white/5 rounded transition-colors"><FastForward size={20}/></button>
            {/* دکمه چرخش تخته */}
            <button 
              onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')} 
              className="p-2 hover:bg-white/5 rounded transition-colors ml-4 border-l border-[#35332e] pl-4"
              title="چرخش تخته"
            >
              <RefreshCw size={20}/>
            </button>
          </div>

          <div className="flex-none flex bg-[#201e1b] p-3 gap-3">
            <button onClick={handleDraw} className="flex-1 py-2.5 bg-[#2b2927] hover:bg-[#35332e] text-gray-300 font-bold rounded flex items-center justify-center gap-2 transition-colors border border-[#35332e]">
              <Handshake size={18}/> تساوی
            </button>
            <button onClick={handleResign} className="flex-1 py-2.5 bg-[#2b2927] hover:bg-[#35332e] text-gray-300 font-bold rounded flex items-center justify-center gap-2 transition-colors border border-[#35332e]">
              <Flag size={18}/> تسلیم
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}