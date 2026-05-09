import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Flag, Handshake, Trophy, ChevronLeft, ChevronRight, FastForward, Rewind, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Board = Chessboard as any;

// کاراکترهای استاندارد شطرنج برای مهره‌های زده‌شده
const pieceChars: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

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
  const [moveSquares, setMoveSquares] = useState<Record<string, any>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  
  const [clickedSquare, setClickedSquare] = useState<string | null>(null);
  const [premove, setPremove] = useState<{from: string, to: string} | null>(null);

  const [fenHistory, setFenHistory] = useState<string[]>([new Chess().fen()]);
  const [viewIndex, setViewIndex] = useState<number>(0);

  const [customPromotion, setCustomPromotion] = useState<{ from: string; to: string; color: string } | null>(null);

  const isViewingHistory = viewIndex < fenHistory.length - 1;
  const playerColor = boardOrientation === 'white' ? 'w' : 'b';

  const pieceSvgs: Record<string, Record<string, string>> = {
    w: {
      q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
      n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
      r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
      b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
      p: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
      k: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'
    },
    b: {
      q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
      n: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Chess_ndt45.svg',
      r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
      b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
      p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
      k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
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

  const makeMove = (movePayload: any) => {
    try {
      const gameCopy = new Chess();
      gameCopy.loadPgn(game.pgn());
      const result = gameCopy.move(movePayload);
      
      if (result) {
        setGame(gameCopy);
        const newFen = gameCopy.fen();
        setFenHistory(prev => {
          const newHistory = [...prev, newFen];
          setViewIndex(newHistory.length - 1);
          return newHistory;
        });

        setMoveSquares({
          [result.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
          [result.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
        });
        setOptionSquares({});

        if (gameCopy.isGameOver()) {
          if (gameCopy.isCheckmate()) handleGameOver('checkmate', gameCopy.turn() === 'w' ? 'black' : 'white');
          else handleGameOver('draw', null);
        }
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  useEffect(() => {
    if (isPlayerTurn && premove && !gameOver && !isViewingHistory) {
      const moves = game.moves({ verbose: true });
      const move = moves.find(m => m.from === premove.from && m.to === premove.to);
      
      if (move) {
        const success = makeMove({
          from: premove.from,
          to: premove.to,
          promotion: move.promotion ? 'q' : undefined
        });
        if (success) setIsPlayerTurn(false);
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
      newSquares[m.to] = {
        backgroundImage: isCapture
            ? 'radial-gradient(circle, transparent 0%, transparent 65%, rgba(0,0,0,0.2) 67%, rgba(0,0,0,0.2) 100%)' 
            : 'radial-gradient(circle, rgba(0,0,0,.2) 22%, transparent 23%)',
      };
    });
    newSquares[sourceSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    setOptionSquares(newSquares);
  };

  const onPieceDragBegin = (piece: string, sourceSquare: string) => {
    if (gameOver || isViewingHistory) return;
    if (!isPlayerTurn) {
      if (piece[0] === playerColor) {
        setClickedSquare(sourceSquare);
        setOptionSquares({ [sourceSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
      }
      return;
    }
    setClickedSquare(sourceSquare);
    highlightLegalMoves(sourceSquare);
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    setOptionSquares({}); 
    setClickedSquare(null);

    if (gameOver || isViewingHistory) {
      setViewIndex(fenHistory.length - 1);
      return false; 
    }

    if (!isPlayerTurn) {
      if (piece[0] === playerColor) {
        setPremove({ from: sourceSquare, to: targetSquare });
      }
      return false; 
    }

    const moves = game.moves({ verbose: true });
    const isPromotion = moves.some(m => m.from === sourceSquare && m.to === targetSquare && m.promotion);

    if (isPromotion) {
      setCustomPromotion({ from: sourceSquare, to: targetSquare, color: piece[0] });
      return false; 
    }

    const legalMove = moves.find(m => m.from === sourceSquare && m.to === targetSquare);
    if (!legalMove) return false;

    const success = makeMove({ from: sourceSquare, to: targetSquare });
    if (success) setIsPlayerTurn(false);
    return success;
  };

  const handleSquareClick = (square: string) => {
    if (gameOver || isViewingHistory || customPromotion) return;

    if (premove) {
      setPremove(null);
      setClickedSquare(null);
      setOptionSquares({});
      return;
    }

    if (!isPlayerTurn) {
      if (clickedSquare) {
        setPremove({ from: clickedSquare, to: square });
        setClickedSquare(null);
        setOptionSquares({});
      } else {
        const pieceOnSquare = game.get(square as any);
        if (pieceOnSquare && pieceOnSquare.color === playerColor) {
          setClickedSquare(square);
          setOptionSquares({ [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
        }
      }
      return;
    }

    if (clickedSquare === square) {
       setClickedSquare(null);
       setOptionSquares({});
       return;
    }

    if (clickedSquare) {
      const moves = game.moves({ square: clickedSquare as any, verbose: true });
      const move = moves.find(m => m.to === square);

      if (move) {
        if (move.promotion) {
          const pieceColor = game.get(clickedSquare as any)?.color || 'w';
          setCustomPromotion({ from: clickedSquare, to: square, color: pieceColor });
          return;
        }

        const success = makeMove({ from: clickedSquare, to: square });
        if (success) setIsPlayerTurn(false);
        setClickedSquare(null);
        setOptionSquares({});
        return;
      }
    }

    const pieceOnSquare = game.get(square as any);
    if (pieceOnSquare && pieceOnSquare.color === game.turn()) {
      setClickedSquare(square);
      highlightLegalMoves(square);
    } else {
      setClickedSquare(null);
      setOptionSquares({});
    }
  };

  const handleCustomPromotionSelect = (promotionType: string) => {
    if (customPromotion) {
      const moves = game.moves({ verbose: true });
      const exactMove = moves.find(m => 
        m.from === customPromotion.from && 
        m.to === customPromotion.to && 
        m.promotion === promotionType
      );

      let success = false;
      if (exactMove) {
        success = makeMove(exactMove.san);
      } else {
        success = makeMove({ 
          from: customPromotion.from, 
          to: customPromotion.to, 
          promotion: promotionType 
        });
      }

      if (success) setIsPlayerTurn(false);
    }
    cancelPromotion();
  };

  const cancelPromotion = () => {
    setCustomPromotion(null);
    setClickedSquare(null);
    setOptionSquares({});
  };

  useEffect(() => {
    if (!isPlayerTurn && !gameOver && !customPromotion) {
      const thinkTime = opponent.accuracy === 'پایه' ? 1000 : 2500;
      const botMoveTimer = setTimeout(() => {
        const possibleMoves = game.moves({ verbose: true });
        if (possibleMoves.length > 0) {
          const randomIndex = Math.floor(Math.random() * possibleMoves.length);
          const chosenMove = possibleMoves[randomIndex];
          makeMove({ from: chosenMove.from, to: chosenMove.to, promotion: 'q' });
          setIsPlayerTurn(true);
        }
      }, thinkTime);
      return () => clearTimeout(botMoveTimer);
    }
  }, [isPlayerTurn, gameOver, game, opponent.accuracy, customPromotion]);

  const handleGameOver = (reason: string, winnerColor: string | null) => setGameOver({ status: reason, winner: winnerColor });
  const handleResign = () => { if (!gameOver) handleGameOver('resign', 'black'); };
  const handleDraw = () => { if (!gameOver) handleGameOver('draw_agreed', null); };

  const history = game.history();
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }

  const isPlayerWhite = boardOrientation === 'white';

  const getPromotionOverlayStyle = (): React.CSSProperties => {
    if (!customPromotion) return {};
    const { to } = customPromotion;
    const file = to.charCodeAt(0) - 97; 
    const rank = parseInt(to[1], 10);   

    const isFlipped = boardOrientation === 'black';
    const visualFile = isFlipped ? 7 - file : file;
    const visualRank = isFlipped ? 9 - rank : rank;
    
    const leftPercent = visualFile * 12.5;
    const isTopEdge = visualRank === 8;

    return {
      position: 'absolute',
      left: `${leftPercent}%`,
      [isTopEdge ? 'top' : 'bottom']: '0%',
      width: '12.5%',
      height: '50%', 
      zIndex: 1000,
      display: 'flex',
      flexDirection: isTopEdge ? 'column' : 'column-reverse',
      pointerEvents: 'none' 
    };
  };

  const premoveStyles = premove ? {
    [premove.from]: { backgroundColor: 'rgba(204, 51, 51, 0.6)' },
    [premove.to]: { backgroundColor: 'rgba(204, 51, 51, 0.6)' }
  } : {};

  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const sortOrder: Record<string, number> = { q: 1, r: 2, b: 3, n: 4, p: 5 };

  const currentMoves = game.history({ verbose: true }).slice(0, viewIndex);
  
  const capturedByWhite = currentMoves
    .filter(m => m.color === 'w' && m.captured)
    .map(m => m.captured as string)
    .sort((a, b) => sortOrder[a] - sortOrder[b]);

  const capturedByBlack = currentMoves
    .filter(m => m.color === 'b' && m.captured)
    .map(m => m.captured as string)
    .sort((a, b) => sortOrder[a] - sortOrder[b]);

  const tempGame = new Chess(fenHistory[viewIndex]);
  let wScore = 0;
  let bScore = 0;
  tempGame.board().forEach(row => {
    row.forEach(piece => {
      if (piece) {
        if (piece.color === 'w') wScore += pieceValues[piece.type];
        else bScore += pieceValues[piece.type];
      }
    });
  });
  
  const whiteAdvantage = wScore - bScore;
  const whiteScoreAdv = whiteAdvantage > 0 ? whiteAdvantage : 0;
  const blackScoreAdv = whiteAdvantage < 0 ? Math.abs(whiteAdvantage) : 0;

  const whitePlayerProps = {
    capturedPieces: capturedByWhite,
    capturedColor: 'b',
    scoreAdvantage: whiteScoreAdv
  };

  const blackPlayerProps = {
    capturedPieces: capturedByBlack,
    capturedColor: 'w',
    scoreAdvantage: blackScoreAdv
  };

  // 🔥 استفاده از کاراکترها (متن) با رنگ‌بندی داینامیک برای مهره‌های زده‌شده
  const PlayerInfo = ({ name, rating, time, isOpponent, isActive, accuracy, capturedPieces, capturedColor, scoreAdvantage }: any) => (
    <div className="flex-none flex items-center justify-between w-full py-2 px-1 relative z-10">
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-bold text-sm ${isOpponent ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'}`}>
             {name.charAt(0)}
          </div>
          <div className="font-bold text-gray-200 text-sm flex items-center gap-2 leading-none">
            {name} <span className="text-gray-500 font-normal">{rating}</span>
            {isOpponent && accuracy && accuracy !== 'پایه' && (
               <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1 py-0.5 rounded border border-amber-500/30">PRO</span>
            )}
          </div>
        </div>
        <div className="flex items-center pl-10 h-[18px] mt-1">
          {capturedPieces && capturedPieces.length > 0 && (
             <div className="flex items-center text-lg leading-none">
               {capturedPieces.map((piece: string, idx: number) => (
                 <span 
                   key={idx} 
                   className={`${idx === 0 ? '' : '-ml-[5px]'}`} // هم‌پوشانی جذاب شبیه لیچس
                   style={{
                     // اگر مهره سفید باشه رنگش سفید با استروک تیره، اگه سیاه باشه رنگش مشکی با استروک روشن‌تر
                     color: capturedColor === 'w' ? '#fff' : '#1b1b1b',
                     WebkitTextStroke: capturedColor === 'w' ? '1px #333' : '1px #666',
                     textShadow: '0px 1px 1px rgba(0,0,0,0.5)'
                   }}
                 >
                   {pieceChars[piece]}
                 </span>
               ))}
             </div>
          )}
          {scoreAdvantage > 0 && (
             <span className="text-[11px] text-[#779556] font-bold ml-1.5 leading-none mt-1">+{scoreAdvantage}</span>
          )}
        </div>
      </div>
      <div className={`text-2xl font-mono font-bold px-3 py-1 rounded transition-colors shadow-sm ${isActive && !isViewingHistory ? 'bg-gray-200 text-gray-900' : (time < 60 ? 'bg-red-500/20 text-red-400' : 'bg-[#262421] text-gray-400')}`}>
        {formatTime(time)}
      </div>
    </div>
  );

  return (
    <div 
      className="flex flex-col h-screen bg-[#161512] text-gray-300 overflow-hidden font-sans relative" 
      onClick={() => { if (customPromotion) setCustomPromotion(null); }}
      onContextMenu={(e) => { 
        e.preventDefault(); 
        setPremove(null); 
        setClickedSquare(null); 
        setOptionSquares({}); 
      }}
    >
      
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

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-2 lg:p-6 w-full max-w-[1200px] mx-auto gap-4 lg:gap-6 relative z-0">
        <div className="flex flex-col flex-1 min-w-0 h-full items-center justify-center relative z-0">
          <div className="w-full h-full flex flex-col max-w-[90vh] lg:max-w-full relative z-0">
            
            {isPlayerWhite ? (
              <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} accuracy={opponent.accuracy} {...blackPlayerProps} />
            ) : (
              <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} accuracy={opponent.accuracy} {...whitePlayerProps} />
            )}
            
            <div dir="ltr" className="w-full flex-1 min-h-0 relative flex items-center justify-center z-0">
              <div className="w-full aspect-square max-h-full relative shadow-[0_5px_15px_rgba(0,0,0,0.5)] rounded-sm border-[3px] border-[#35332e] z-0">
                
                <Board 
                  position={isViewingHistory ? fenHistory[viewIndex] : game.fen()} 
                  onPieceDrop={onDrop}
                  onPieceDragBegin={onPieceDragBegin}
                  onSquareClick={handleSquareClick}
                  onPieceClick={(piece: string, square: string) => handleSquareClick(square)}
                  onSquareRightClick={() => {
                    setPremove(null);
                    setClickedSquare(null);
                    setOptionSquares({});
                  }}
                  boardOrientation={boardOrientation}
                  customSquareStyles={{ ...moveSquares, ...optionSquares, ...premoveStyles }}
                  animationDuration={200}
                  customDarkSquareStyle={{ backgroundColor: '#779556' }}
                  customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                  autoPromoteToQueen={true} 
                />

                {customPromotion && (
                  <div 
                    style={getPromotionOverlayStyle()}
                    className="z-[1000]"
                  >
                    {['q', 'n', 'r', 'b'].map((type) => (
                      <button 
                        key={type}
                        onPointerDown={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          handleCustomPromotionSelect(type); 
                        }}
                        className="w-full h-1/4 flex items-center justify-center relative group cursor-pointer pointer-events-auto"
                      >
                        <div className="absolute w-[90%] h-[90%] rounded-full bg-[#f2f2f2] shadow-[0_3px_10px_rgba(0,0,0,0.6)] group-hover:bg-white group-hover:scale-105 transition-all duration-150"></div>
                        <img 
                          src={pieceSvgs[customPromotion.color][type]} 
                          alt={type} 
                          className="relative z-10 w-[85%] h-[85%] object-contain drop-shadow-sm pointer-events-none" 
                          draggable={false} 
                        />
                      </button>
                    ))}
                  </div>
                )}
                
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
            
            {isPlayerWhite ? (
              <PlayerInfo name="کاربر شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} {...whitePlayerProps} />
            ) : (
              <PlayerInfo name="کاربر شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} {...blackPlayerProps} />
            )}
            
          </div>
        </div>

        <div className="flex-none w-full lg:w-[350px] flex flex-col bg-[#262421] border border-[#35332e] rounded-sm shadow-xl h-[30vh] lg:h-full shrink-0 relative z-10">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pt-2" dir="ltr">
            {movePairs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">منتظر حرکت سفید...</div>
            ) : (
              <div className="flex flex-col text-[15px]">
                {movePairs.map((pair, index) => {
                  const whiteMoveIndex = index * 2 + 1;
                  const blackMoveIndex = index * 2 + 2;
                  
                  return (
                    <div key={index} className={`flex px-2 py-1 ${index % 2 === 0 ? 'bg-[#2b2927]' : 'bg-[#262421]'}`}>
                      <div className="w-10 text-gray-500 font-mono text-right pr-3 select-none">{index + 1}.</div>
                      <div onClick={() => setViewIndex(whiteMoveIndex)} className={`flex-1 font-bold cursor-pointer px-1 rounded ${viewIndex === whiteMoveIndex ? 'bg-[#779556] text-white' : 'text-[#b0aba2] hover:text-white'}`}>
                        {pair[0]}
                      </div>
                      <div onClick={() => pair[1] && setViewIndex(blackMoveIndex)} className={`flex-1 font-bold cursor-pointer px-1 rounded ${viewIndex === blackMoveIndex ? 'bg-[#779556] text-white' : 'text-[#b0aba2] hover:text-white'}`}>
                        {pair[1] || ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-none flex items-center justify-center gap-2 bg-[#201e1b] text-[#b0aba2] p-2 border-y border-[#35332e]">
            <button onClick={() => setViewIndex(0)} className="p-2 hover:bg-white/5 rounded transition-colors"><Rewind size={20}/></button>
            <button onClick={() => setViewIndex(p => Math.max(0, p - 1))} className="p-2 hover:bg-white/5 rounded transition-colors"><ChevronLeft size={24}/></button>
            <button onClick={() => setViewIndex(p => Math.min(fenHistory.length - 1, p + 1))} className="p-2 hover:bg-white/5 rounded transition-colors"><ChevronRight size={24}/></button>
            <button onClick={() => setViewIndex(fenHistory.length - 1)} className="p-2 hover:bg-white/5 rounded transition-colors"><FastForward size={20}/></button>
            <button onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')} className="p-2 hover:bg-white/5 rounded transition-colors ml-4 border-l border-[#35332e] pl-4" title="چرخش تخته"><RefreshCw size={20}/></button>
          </div>

          <div className="flex-none flex bg-[#201e1b] p-3 gap-3">
            <button onClick={handleDraw} className="flex-1 py-2.5 bg-[#2b2927] hover:bg-[#35332e] text-gray-300 font-bold rounded flex items-center justify-center gap-2 transition-colors border border-[#35332e]"><Handshake size={18}/> تساوی</button>
            <button onClick={handleResign} className="flex-1 py-2.5 bg-[#2b2927] hover:bg-[#35332e] text-gray-300 font-bold rounded flex items-center justify-center gap-2 transition-colors border border-[#35332e]"><Flag size={18}/> تسلیم</button>
          </div>
        </div>
      </div>
    </div>
  );
}