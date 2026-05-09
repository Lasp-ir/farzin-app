import { useState, useEffect } from 'react';
import Chessground from 'react-chessground';
import 'react-chessground/dist/styles/chessground.css'; // استایل‌های ضروری تخته جدید
import { Chess } from 'chess.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Flag, Handshake, Trophy, ChevronLeft, ChevronRight, FastForward, Rewind, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [fenHistory, setFenHistory] = useState<string[]>([new Chess().fen()]);
  const [viewIndex, setViewIndex] = useState<number>(0);

  // پاپ‌آپ ارتقای اختصاصی ما (تنها پاپ‌آپ فعال)
  const [customPromotion, setCustomPromotion] = useState<{ from: string; to: string; color: string } | null>(null);

  const isViewingHistory = viewIndex < fenHistory.length - 1;

  const pieceSvgs: Record<string, Record<string, string>> = {
    w: {
      q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
      n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
      r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
      b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg'
    },
    b: {
      q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
      n: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Chess_ndt45.svg',
      r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
      b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg'
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
    const s = Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      if (isViewingHistory) return;
      if (isPlayerTurn) {
        setPlayerTime((prev) => { if (prev <= 1) handleGameOver('timeout', 'black'); return prev - 1; });
      } else {
        setOpponentTime((prev) => { if (prev <= 1) handleGameOver('timeout', 'white'); return prev - 1; });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayerTurn, gameOver, isViewingHistory]);

  // هندل کردن حرکت روی تخته جدید
  const onMove = (from: string, to: string) => {
    if (!isPlayerTurn || gameOver || isViewingHistory) return;

    const moves = game.moves({ verbose: true });
    const legalMove = moves.find((m: any) => m.from === from && m.to === to);

    if (!legalMove) return;

    if (legalMove.promotion) {
      const pieceOnBoard = game.get(from as any);
      setCustomPromotion({ from, to, color: pieceOnBoard?.color || 'w' });
      return;
    }

    const gameCopy = new Chess(game.fen());
    const result = gameCopy.move({ from, to });
    if (result) {
      updateGameState(gameCopy);
      setIsPlayerTurn(false);
    }
  };

  const updateGameState = (newGame: Chess) => {
    setGame(newGame);
    const newFen = newGame.fen();
    setFenHistory(prev => {
      const newHistory = [...prev, newFen];
      setViewIndex(newHistory.length - 1);
      return newHistory;
    });

    if (newGame.isGameOver()) {
      if (newGame.isCheckmate()) handleGameOver('checkmate', newGame.turn() === 'w' ? 'black' : 'white');
      else handleGameOver('draw', null);
    }
  };

  const handleCustomPromotionSelect = (promotionType: string) => {
    if (customPromotion) {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move({
        from: customPromotion.from,
        to: customPromotion.to,
        promotion: promotionType
      });
      if (result) {
        updateGameState(gameCopy);
        setIsPlayerTurn(false);
      }
    }
    setCustomPromotion(null);
  };

  useEffect(() => {
    if (!isPlayerTurn && !gameOver && !customPromotion) {
      const botMoveTimer = setTimeout(() => {
        const possibleMoves = game.moves({ verbose: true });
        if (possibleMoves.length > 0) {
          const randomIndex = Math.floor(Math.random() * possibleMoves.length);
          const chosenMove = possibleMoves[randomIndex];
          const gameCopy = new Chess(game.fen());
          gameCopy.move({ from: chosenMove.from, to: chosenMove.to, promotion: 'q' });
          updateGameState(gameCopy);
          setIsPlayerTurn(true);
        }
      }, 1000);
      return () => clearTimeout(botMoveTimer);
    }
  }, [isPlayerTurn, gameOver, game, customPromotion]);

  const handleGameOver = (reason: string, winnerColor: string | null) => setGameOver({ status: reason, winner: winnerColor });

  const history = game.history();
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }

  const isPlayerWhite = boardOrientation === 'white';

  const PlayerInfo = ({ name, rating, time, isOpponent, isActive }: any) => (
    <div className="flex-none flex items-center justify-between w-full py-2 px-1 relative z-10">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-bold text-sm ${isOpponent ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'}`}>
           {name.charAt(0)}
        </div>
        <div className="font-bold text-gray-200 text-sm flex items-center gap-2">
          {name} <span className="text-gray-500 font-normal">{rating}</span>
        </div>
      </div>
      <div className={`text-2xl font-mono font-bold px-3 py-1 rounded transition-colors shadow-sm ${isActive && !isViewingHistory ? 'bg-gray-200 text-gray-900' : 'bg-[#262421] text-gray-400'}`}>
        {formatTime(time)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#161512] text-gray-300 overflow-hidden font-sans relative">
      <div className="flex-none h-14 flex items-center justify-between px-4 bg-[#262421] border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
          {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-2 lg:p-6 w-full max-w-[1200px] mx-auto gap-4 lg:gap-6 relative">
        <div className="flex flex-col flex-1 min-w-0 h-full items-center justify-center relative">
          <div className="w-full h-full flex flex-col max-w-[90vh] lg:max-w-full">
            
            {isPlayerWhite ? (
              <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} />
            ) : (
              <PlayerInfo name="کاربر شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} />
            )}
            
            <div dir="ltr" className="w-full flex-1 min-h-0 relative flex items-center justify-center board-container">
              <div className="w-full aspect-square max-h-full relative shadow-2xl rounded-sm border-[3px] border-[#35332e]">
                <Chessground
                  fen={isViewingHistory ? fenHistory[viewIndex] : game.fen()}
                  onMove={onMove}
                  orientation={boardOrientation}
                  animation={{ duration: 200 }}
                  turnColor={game.turn() === 'w' ? 'white' : 'black'}
                  movable={{
                    free: false,
                    color: boardOrientation,
                    dests: new Map(Object.entries(game.moves({ verbose: true }).reduce((acc: any, m: any) => {
                      acc[m.from] = acc[m.from] || [];
                      acc[m.from].push(m.to);
                      return acc;
                    }, {})))
                  }}
                />

                {/* پاپ‌آپ مرکزی اختصاصی ما */}
                {customPromotion && (
                  <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#2b2927] p-4 rounded-xl shadow-2xl flex gap-4 border border-[#4a4740] animate-in zoom-in-95 duration-200">
                      {['q', 'n', 'r', 'b'].map((type) => (
                         <button key={type} onClick={() => handleCustomPromotionSelect(type)} className="w-16 h-16 sm:w-20 sm:h-20 bg-[#35332e] hover:bg-[#4a4740] rounded-lg p-2 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-transparent hover:border-[#779556]">
                           <img src={pieceSvgs[customPromotion.color][type]} alt={type} className="w-full h-full object-contain" />
                         </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {gameOver && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-[10000]">
                    <Trophy size={48} className="text-amber-400 mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-2">{gameOver.winner === 'white' ? 'شما بردید!' : 'ربات برنده شد!'}</h2>
                    <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded font-bold">شروع مجدد</button>
                  </div>
                )}
              </div>
            </div>
            
            {!isPlayerWhite ? (
              <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} />
            ) : (
              <PlayerInfo name="کاربر شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} />
            )}
          </div>
        </div>

        <div className="flex-none w-full lg:w-[350px] flex flex-col bg-[#262421] border border-[#35332e] rounded-sm shadow-xl h-[30vh] lg:h-full shrink-0 relative z-10">
          <div className="flex-1 min-h-0 overflow-y-auto pt-2 border-b border-[#35332e]" dir="ltr">
            <div className="flex flex-col text-[15px]">
              {movePairs.map((pair, index) => (
                <div key={index} className={`flex px-2 py-1 ${index % 2 === 0 ? 'bg-[#2b2927]' : 'bg-[#262421]'}`}>
                  <div className="w-10 text-gray-500 font-mono text-right pr-3 select-none">{index + 1}.</div>
                  <div onClick={() => setViewIndex(index * 2 + 1)} className={`flex-1 font-bold cursor-pointer px-1 rounded ${viewIndex === index * 2 + 1 ? 'bg-[#779556] text-white' : 'text-[#b0aba2] hover:text-white'}`}>{pair[0]}</div>
                  <div onClick={() => pair[1] && setViewIndex(index * 2 + 2)} className={`flex-1 font-bold cursor-pointer px-1 rounded ${viewIndex === index * 2 + 2 ? 'bg-[#779556] text-white' : 'text-[#b0aba2] hover:text-white'}`}>{pair[1] || ''}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-none flex items-center justify-center gap-2 bg-[#201e1b] text-[#b0aba2] p-2 border-y border-[#35332e]">
            <button onClick={() => setViewIndex(0)} className="p-2 hover:bg-white/5 rounded"><Rewind size={20}/></button>
            <button onClick={() => setViewIndex(p => Math.max(0, p - 1))} className="p-2 hover:bg-white/5 rounded"><ChevronLeft size={24}/></button>
            <button onClick={() => setViewIndex(p => Math.min(fenHistory.length - 1, p + 1))} className="p-2 hover:bg-white/5 rounded"><ChevronRight size={24}/></button>
            <button onClick={() => setViewIndex(fenHistory.length - 1)} className="p-2 hover:bg-white/5 rounded"><FastForward size={20}/></button>
            <button onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')} className="p-2 hover:bg-white/5 rounded border-l border-[#35332e] ml-2 pl-2"><RefreshCw size={20}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}