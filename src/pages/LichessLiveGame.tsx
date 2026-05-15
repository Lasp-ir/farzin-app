import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Flag, Handshake, Trophy, ChevronLeft, ChevronRight, FastForward, Rewind, RefreshCw, Zap, PieChart, RotateCcw } from 'lucide-react';

const Board = Chessboard as any;

const pieceChars: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

const sounds = {
  move: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3'),
  capture: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3'),
  check: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3'),
  gameOver: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3'),
  promote: new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/promote.mp3'),
};

const playSound = (type: keyof typeof sounds) => {
  const audio = sounds[type];
  audio.currentTime = 0;
  audio.play().catch(e => console.log('Audio error:', e));
};

export default function LichessLiveGame() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🌟 استخراج تنظیمات لابی
  const initialTime = location.state?.time || 180; // پیش‌فرض 3 دقیقه
  const timeIncrement = location.state?.increment || 2;
  const initialPlayerColor = location.state?.color || 'white';
  
  // 🌟 متا دیتای حریف (در واقعیت از API لیچس میاد)
  const opponent = { name: 'MagnusCarlsen', rating: 2882, isOnline: true };

  const [playerTime, setPlayerTime] = useState(initialTime);
  const [opponentTime, setOpponentTime] = useState(initialTime);

  const [game, setGame] = useState(new Chess());
  const [isPlayerTurn, setIsPlayerTurn] = useState(initialPlayerColor === 'white');
  const [gameOver, setGameOver] = useState<{ status: string; winner: string | null } | null>(null);

  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(initialPlayerColor);
  const [moveSquares, setMoveSquares] = useState<Record<string, any>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [clickedSquare, setClickedSquare] = useState<string | null>(null);
  const [premove, setPremove] = useState<{from: string, to: string} | null>(null);

  const [fenHistory, setFenHistory] = useState<string[]>([new Chess().fen()]);
  const [viewIndex, setViewIndex] = useState<number>(0);
  const [customPromotion, setCustomPromotion] = useState<{ from: string; to: string; color: string } | null>(null);

  const isViewingHistory = viewIndex < fenHistory.length - 1;
  const playerPieceColor = initialPlayerColor === 'white' ? 'w' : 'b';

  const pieceSvgs: Record<string, Record<string, string>> = {
    w: { q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg', r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg' },
    b: { q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Chess_ndt45.svg', r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg' }
  };

  const formatTime = (seconds: number) => {
    if (initialTime === 0) return '∞';
    const m = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
    const s = Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 🌟 تایمر شبکه
  useEffect(() => {
    if (gameOver || initialTime === 0) return;
    const timer = setInterval(() => {
      if (isViewingHistory) return;
      if (isPlayerTurn) {
        setPlayerTime(p => { if (p <= 1) { handleGameOver('پایان زمان', 'black'); playSound('gameOver'); } return p - 1; });
      } else {
        setOpponentTime(p => { if (p <= 1) { handleGameOver('پایان زمان', 'white'); playSound('gameOver'); } return p - 1; });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayerTurn, gameOver, isViewingHistory, initialTime]);

  const makeMove = (movePayload: any) => {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(movePayload);
      
      if (result) {
        setGame(gameCopy);
        const newFen = gameCopy.fen();
        setFenHistory(prev => {
          const newHistory = [...prev, newFen];
          setViewIndex(newHistory.length - 1);
          return newHistory;
        });

        setMoveSquares({ [result.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [result.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
        setOptionSquares({});

        if (gameCopy.isGameOver()) {
          if (gameCopy.isCheckmate()) handleGameOver('مات', gameCopy.turn() === 'w' ? 'black' : 'white');
          else handleGameOver('تساوی', null);
          playSound('gameOver');
        } else if (gameCopy.isCheck()) playSound('check');
        else if (result.promotion) playSound('promote');
        else if (result.captured) playSound('capture');
        else playSound('move');

        return true;
      }
    } catch (e) { return false; }
    return false;
  };

  // 🌟 شبیه‌ساز دریافت حرکت از شبکه لیچس (Websocket Mock)
  useEffect(() => {
    if (!isPlayerTurn && !gameOver && !customPromotion) {
      // در دنیای واقعی اینجا منتظر پیام وب‌سوکت می‌مونیم
      const mockNetworkLatency = Math.random() * 2000 + 1000; 
      const botMoveTimer = setTimeout(() => {
        const possibleMoves = game.moves({ verbose: true });
        if (possibleMoves.length > 0) {
          const chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          const success = makeMove({ from: chosenMove.from, to: chosenMove.to, promotion: 'q' });
          if (success) {
             if(initialTime !== 0) setOpponentTime(prev => prev + timeIncrement);
             setIsPlayerTurn(true);
             // اسنپ کردن کاربر به حرکت جدید اگر در تاریخچه بود
             setViewIndex(fenHistory.length); 
          }
        }
      }, mockNetworkLatency);
      return () => clearTimeout(botMoveTimer);
    }
  }, [isPlayerTurn, gameOver, game, customPromotion, initialTime, timeIncrement]);

  // اجرای پریموو
  useEffect(() => {
    if (isPlayerTurn && premove && !gameOver && !isViewingHistory) {
      const moves = game.moves({ verbose: true });
      const move = moves.find(m => m.from === premove.from && m.to === premove.to);
      if (move) {
        const success = makeMove({ from: premove.from, to: premove.to, promotion: move.promotion ? 'q' : undefined });
        if (success) {
           if(initialTime !== 0) setPlayerTime(prev => prev + timeIncrement);
           setIsPlayerTurn(false);
           // TODO: ارسال حرکت از طریق POST ریکوئست به لیچس
        }
      }
      setPremove(null);
      setOptionSquares({});
    }
  }, [isPlayerTurn, game, premove, gameOver, isViewingHistory]);

  const highlightLegalMoves = (sourceSquare: string) => {
    const moves = game.moves({ square: sourceSquare as any, verbose: true });
    if (moves.length === 0) return;
    const newSquares: any = {};
    moves.forEach((m: any) => {
      const isCapture = game.get(m.to as any) && game.get(m.to as any).color !== game.get(sourceSquare as any)?.color;
      newSquares[m.to] = { backgroundImage: isCapture ? 'radial-gradient(circle, transparent 0%, transparent 65%, rgba(0,0,0,0.2) 67%, rgba(0,0,0,0.2) 100%)' : 'radial-gradient(circle, rgba(0,0,0,.2) 22%, transparent 23%)' };
    });
    newSquares[sourceSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    setOptionSquares(newSquares);
  };

  const onPieceDragBegin = (piece: string, sourceSquare: string) => {
    if (gameOver || isViewingHistory) return;
    if (!isPlayerTurn) {
      if (piece[0] === playerPieceColor) {
        setClickedSquare(sourceSquare);
        setOptionSquares({ [sourceSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
      }
      return;
    }
    setClickedSquare(sourceSquare);
    highlightLegalMoves(sourceSquare);
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    setOptionSquares({}); setClickedSquare(null);
    if (gameOver || isViewingHistory) { setViewIndex(fenHistory.length - 1); return false; }
    if (!isPlayerTurn) {
      if (piece[0] === playerPieceColor) setPremove({ from: sourceSquare, to: targetSquare });
      return false; 
    }

    const moves = game.moves({ verbose: true });
    const isPromotion = moves.some(m => m.from === sourceSquare && m.to === targetSquare && m.promotion);
    if (isPromotion) { setCustomPromotion({ from: sourceSquare, to: targetSquare, color: piece[0] }); return false; }

    const legalMove = moves.find(m => m.from === sourceSquare && m.to === targetSquare);
    if (!legalMove) return false;

    const success = makeMove({ from: sourceSquare, to: targetSquare });
    if (success) {
       if(initialTime !== 0) setPlayerTime(prev => prev + timeIncrement);
       setIsPlayerTurn(false);
       // TODO: ارسال به Lichess API
    }
    return success;
  };

  const handleSquareClick = (square: string) => {
    if (gameOver || isViewingHistory || customPromotion) return;
    if (premove) { setPremove(null); setClickedSquare(null); setOptionSquares({}); return; }

    if (!isPlayerTurn) {
      if (clickedSquare) { setPremove({ from: clickedSquare, to: square }); setClickedSquare(null); setOptionSquares({}); } 
      else {
        const pieceOnSquare = game.get(square as any);
        if (pieceOnSquare && pieceOnSquare.color === playerPieceColor) { setClickedSquare(square); setOptionSquares({ [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }); }
      }
      return;
    }

    if (clickedSquare === square) { setClickedSquare(null); setOptionSquares({}); return; }

    if (clickedSquare) {
      const moves = game.moves({ square: clickedSquare as any, verbose: true });
      const move = moves.find(m => m.to === square);
      if (move) {
        if (move.promotion) { setCustomPromotion({ from: clickedSquare, to: square, color: game.get(clickedSquare as any)?.color || 'w' }); return; }
        const success = makeMove({ from: clickedSquare, to: square });
        if (success) {
           if(initialTime !== 0) setPlayerTime(prev => prev + timeIncrement);
           setIsPlayerTurn(false);
        }
        setClickedSquare(null); setOptionSquares({});
        return;
      }
    }

    const pieceOnSquare = game.get(square as any);
    if (pieceOnSquare && pieceOnSquare.color === game.turn()) { setClickedSquare(square); highlightLegalMoves(square); } 
    else { setClickedSquare(null); setOptionSquares({}); }
  };

  const handleCustomPromotionSelect = (promotionType: string) => {
    if (customPromotion) {
      const moves = game.moves({ verbose: true });
      const exactMove = moves.find(m => m.from === customPromotion.from && m.to === customPromotion.to && m.promotion === promotionType);
      let success = false;
      if (exactMove) success = makeMove(exactMove.san);
      else success = makeMove({ from: customPromotion.from, to: customPromotion.to, promotion: promotionType });
      if (success) {
         if(initialTime !== 0) setPlayerTime(prev => prev + timeIncrement);
         setIsPlayerTurn(false);
      }
    }
    setCustomPromotion(null); setClickedSquare(null); setOptionSquares({});
  };

  const handleGameOver = (reason: string, winnerColor: string | null) => setGameOver({ status: reason, winner: winnerColor });
  const handleResign = () => { if (!gameOver) { handleGameOver('تسلیم', playerPieceColor === 'w' ? 'black' : 'white'); playSound('gameOver'); } };
  const handleDraw = () => { if (!gameOver) { handleGameOver('توافق', null); playSound('gameOver'); } };

  // استخراج مهره‌های زده شده
  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const sortOrder: Record<string, number> = { q: 1, r: 2, b: 3, n: 4, p: 5 };
  const currentMoves = game.history({ verbose: true }).slice(0, viewIndex);
  
  const capturedByWhite = currentMoves.filter(m => m.color === 'w' && m.captured).map(m => m.captured as string).sort((a, b) => sortOrder[a] - sortOrder[b]);
  const capturedByBlack = currentMoves.filter(m => m.color === 'b' && m.captured).map(m => m.captured as string).sort((a, b) => sortOrder[a] - sortOrder[b]);

  const tempGame = new Chess(fenHistory[viewIndex]);
  let wScore = 0; let bScore = 0;
  tempGame.board().forEach(row => row.forEach(piece => { if (piece) { if (piece.color === 'w') wScore += pieceValues[piece.type]; else bScore += pieceValues[piece.type]; } }));
  
  const whiteAdvantage = wScore - bScore;
  const whitePlayerProps = { capturedPieces: capturedByWhite, capturedColor: 'b', scoreAdvantage: whiteAdvantage > 0 ? whiteAdvantage : 0 };
  const blackPlayerProps = { capturedPieces: capturedByBlack, capturedColor: 'w', scoreAdvantage: whiteAdvantage < 0 ? Math.abs(whiteAdvantage) : 0 };

  const PlayerInfo = ({ name, rating, time, isOpponent, isActive, capturedPieces, capturedColor, scoreAdvantage }: any) => (
    <div className="flex-none flex items-center justify-between w-full py-3 px-2 relative z-10 transition-all duration-300">
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${isOpponent ? 'bg-gradient-to-br from-[#c27a3e] to-[#8a5327] text-white' : 'bg-gradient-to-br from-zinc-700 to-zinc-800 text-white border border-zinc-700'}`}>
             {isOpponent ? 'L' : 'ش'}
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-gray-100 text-[15px] flex items-center gap-2 leading-none">
              {name} <span className="text-zinc-500 font-medium text-sm">{rating}</span>
            </div>
            <div className="flex items-center h-[18px] mt-1.5">
              {capturedPieces && capturedPieces.length > 0 && (
                 <div className="flex items-center text-lg leading-none">
                   {capturedPieces.map((piece: string, idx: number) => (
                     <span key={idx} className={`${idx === 0 ? '' : '-ml-[6px]'}`} style={{ color: capturedColor === 'w' ? '#f4f4f5' : '#18181b', WebkitTextStroke: capturedColor === 'w' ? '1px #3f3f46' : '1px #71717a', textShadow: '0px 2px 4px rgba(0,0,0,0.4)' }}>
                       {pieceChars[piece]}
                     </span>
                   ))}
                 </div>
              )}
              {scoreAdvantage > 0 && <span className="text-xs text-emerald-500 font-bold ml-2 leading-none mt-1">+{scoreAdvantage}</span>}
            </div>
          </div>
        </div>
      </div>
      <div className={`text-2xl font-mono font-black px-4 py-1.5 rounded-lg transition-all duration-300 shadow-inner ${isActive && !isViewingHistory ? 'bg-zinc-200 text-zinc-900 shadow-md scale-105' : (time < 60 && initialTime !== 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50')}`}>
        {formatTime(time)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-gray-300 overflow-hidden font-sans relative" dir="rtl" onContextMenu={e => { e.preventDefault(); setPremove(null); setClickedSquare(null); setOptionSquares({}); }}>
      <div className="flex-none h-16 flex items-center justify-between px-6 bg-[#161512] border-b border-white/5 shadow-sm z-20">
        <div className="flex items-center gap-5">
           <button onClick={() => navigate('/play/online/lobby')} className="text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-zinc-800 rounded-lg"><ArrowRight size={22} /></button>
           <div className="flex flex-col">
             <span className="font-bold text-zinc-100 text-[15px] tracking-wide flex items-center gap-2">بازی زنده <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span></span>
             <span className="text-[11px] text-zinc-500 font-medium">Lichess Server • {initialTime === 0 ? 'بدون محدودیت' : `${Math.floor(initialTime / 60)}+${timeIncrement}`}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-3 lg:p-6 w-full max-w-[1250px] mx-auto gap-5 lg:gap-8 relative z-0">
        <div className="flex flex-col flex-1 min-w-0 h-full items-center justify-center relative z-0">
          <div className="w-full h-full flex flex-col max-w-[90vh] lg:max-w-full relative z-0 justify-center">
            
            {initialPlayerColor === 'white' ? <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} {...blackPlayerProps} /> : <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} {...whitePlayerProps} />}
            
            <div dir="ltr" className="w-full relative flex items-center justify-center z-0 my-1">
              <div className="w-full aspect-square max-h-[70vh] relative shadow-2xl rounded-sm border-[4px] border-[#2A2926] z-0 overflow-hidden">
                <Board 
                  position={isViewingHistory ? fenHistory[viewIndex] : game.fen()} 
                  onPieceDrop={onDrop} onPieceDragBegin={onPieceDragBegin} onSquareClick={handleSquareClick}
                  boardOrientation={boardOrientation} animationDuration={250} autoPromoteToQueen={true} 
                  customDarkSquareStyle={{ backgroundColor: '#779556' }} customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                  customSquareStyles={{ ...moveSquares, ...optionSquares, ...(premove ? {[premove.from]:{backgroundColor:'rgba(204,51,51,0.6)'}, [premove.to]:{backgroundColor:'rgba(204,51,51,0.6)'}} : {}) }}
                />

                {customPromotion && (
                  <div className="z-[1000] absolute w-[12.5%] h-[50%] flex flex-col pointer-events-none" style={{ left: `${(boardOrientation === 'black' ? 7 - (customPromotion.to.charCodeAt(0) - 97) : (customPromotion.to.charCodeAt(0) - 97)) * 12.5}%`, [parseInt(customPromotion.to[1], 10) === 8 ? 'top' : 'bottom']: '0%', flexDirection: parseInt(customPromotion.to[1], 10) === 8 ? 'column' : 'column-reverse' }}>
                    {['q', 'n', 'r', 'b'].map(t => (
                      <button key={t} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleCustomPromotionSelect(t); }} className="w-full h-1/4 flex items-center justify-center relative group cursor-pointer pointer-events-auto">
                        <div className="absolute w-[90%] h-[90%] rounded-full bg-zinc-100 shadow-[0_5px_15px_rgba(0,0,0,0.5)] group-hover:bg-white group-hover:scale-110 transition-all"></div>
                        <img src={pieceSvgs[customPromotion.color][t]} alt={t} className="relative z-10 w-[85%] h-[85%] object-contain drop-shadow-md pointer-events-none" draggable={false} />
                      </button>
                    ))}
                  </div>
                )}
                
                {gameOver && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 animate-in fade-in duration-300" dir="rtl">
                    <Trophy size={64} className={`mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] ${gameOver.winner === initialPlayerColor ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <h2 className="text-4xl font-black text-white mb-2">{gameOver.winner === initialPlayerColor ? 'شما بردید!' : gameOver.winner === null ? 'تساوی' : 'حریف پیروز شد'}</h2>
                    <p className="text-zinc-400 font-bold mb-8">بازی با {gameOver.status} خاتمه یافت.</p>
                    <div className="flex flex-col w-full max-w-[280px] gap-3">
                        <button onClick={() => navigate('/report', { state: { data: game.pgn(), forceNew: true, meta: { white: { name: initialPlayerColor === 'white' ? 'شما' : opponent.name, elo: 1500 }, black: { name: initialPlayerColor === 'black' ? 'شما' : opponent.name, elo: 1500 }, result: gameOver.winner === null ? '1/2-1/2' : gameOver.winner === 'white' ? '1-0' : '0-1' } } })} className="w-full bg-gradient-to-r from-farzin-accent to-[#5c7a40] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(119,149,86,0.3)] active:scale-95 transition-all"><PieChart size={18} /> کالبدشکافی استراتژیک</button>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => window.location.reload()} className="bg-[#1e1c19] hover:bg-[#262421] text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-[#35332e]"><RotateCcw size={14}/> بازی مجدد</button>
                            <button onClick={() => navigate('/play/online/lobby')} className="bg-[#1e1c19] hover:bg-[#262421] text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-[#35332e]"><Zap size={14}/> حریف تصادفی</button>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {initialPlayerColor === 'white' ? <PlayerInfo name="شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} {...whitePlayerProps} /> : <PlayerInfo name="شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} {...blackPlayerProps} />}
          </div>
        </div>

        {/* پنل تاریخچه حرکات */}
        <div className="flex-none w-full lg:w-[320px] flex flex-col bg-[#161512] border border-white/5 rounded-2xl shadow-2xl h-[30vh] lg:h-full shrink-0 relative z-10 overflow-hidden mt-4 lg:mt-0">
          <div className="bg-[#1a1916] px-4 py-3 border-b border-[#35332e] flex items-center justify-between">
             <span className="font-bold text-zinc-300 text-sm">تاریخچه مسابقه</span>
             <span className="text-[11px] bg-[#262421] text-zinc-400 px-2 py-1 rounded-md border border-[#35332e]">{game.history().length} حرکت</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pt-2 px-1 pb-4" dir="ltr">
            <div className="flex flex-col text-[14px] px-2 font-medium">
              {Array.from({ length: Math.ceil(game.history().length / 2) }).map((_, i) => (
                <div key={i} className={`flex px-2 py-1.5 rounded-lg mb-1 ${i % 2 === 0 ? 'bg-[#1a1916]' : ''}`}>
                  <div className="w-10 text-zinc-500 font-mono text-right pr-3 py-1 select-none">{i + 1}.</div>
                  <div onClick={() => setViewIndex(i * 2 + 1)} className={`flex-1 flex items-center justify-center cursor-pointer px-2 rounded-md ${viewIndex === i * 2 + 1 ? 'bg-farzin-accent text-white font-bold' : 'text-zinc-300 hover:bg-[#262421]'}`}>{game.history()[i * 2]}</div>
                  <div onClick={() => game.history()[i * 2 + 1] && setViewIndex(i * 2 + 2)} className={`flex-1 flex items-center justify-center cursor-pointer px-2 rounded-md ${viewIndex === i * 2 + 2 ? 'bg-farzin-accent text-white font-bold' : 'text-zinc-300 hover:bg-[#262421]'}`}>{game.history()[i * 2 + 1] || ''}</div>
                </div>
              ))}
            </div>
          </div>

          <div dir="ltr" className="flex-none flex items-center justify-center gap-1.5 bg-[#12110f] text-zinc-400 p-2 border-t border-[#35332e]">
            <button onClick={() => setBoardOrientation(p => p === 'white' ? 'black' : 'white')} className="p-2 hover:text-white rounded-lg transition-all mr-2 pr-4 border-r border-[#35332e]" title="چرخش تخته"><RefreshCw size={16}/></button>
            <button onClick={() => setViewIndex(0)} className="p-2 hover:text-white hover:bg-[#262421] rounded-lg"><Rewind size={16}/></button>
            <button onClick={() => setViewIndex(p => Math.max(0, p - 1))} className="p-2 hover:text-white hover:bg-[#262421] rounded-lg"><ChevronLeft size={20}/></button>
            <button onClick={() => setViewIndex(p => Math.min(fenHistory.length - 1, p + 1))} className="p-2 hover:text-white hover:bg-[#262421] rounded-lg"><ChevronRight size={20}/></button>
            <button onClick={() => setViewIndex(fenHistory.length - 1)} className="p-2 hover:text-white hover:bg-[#262421] rounded-lg"><FastForward size={16}/></button>
          </div>

          {!gameOver && (
            <div className="flex-none flex bg-[#0a0a0a] p-3 gap-2 border-t border-[#35332e]">
              <button onClick={handleDrawOffer} className="flex-1 py-3 bg-[#1e1c19] hover:bg-[#262421] text-zinc-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-[#35332e] active:scale-95 text-xs"><Handshake size={16}/> تساوی</button>
              <button onClick={handleResign} className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-red-500/20 active:scale-95 text-xs"><Flag size={16}/> تسلیم</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}