import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Flag, Handshake, Trophy, ChevronLeft, ChevronRight, FastForward, Rewind, RefreshCw, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  audio.play().catch(e => console.log('Audio blocked by browser:', e));
};

export default function PlayAI() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const opponent = location.state?.selectedBot || { name: 'فرزین (آلفا)', rating: 1500, accuracy: 'پیشرفته' };
  
  // 🔥 دریافت زمان پایه و پاداش زمانی (Increment)
  const initialTime = location.state?.time !== undefined ? location.state.time : 600;
  const timeIncrement = location.state?.increment !== undefined ? location.state.increment : 0;
  
  const [playerTime, setPlayerTime] = useState(initialTime);
  const [opponentTime, setOpponentTime] = useState(initialTime);

  const [initialPlayerColor] = useState<'white' | 'black'>(() => {
    const passedColor = location.state?.color || 'white';
    if (passedColor === 'random') return Math.random() > 0.5 ? 'white' : 'black';
    return passedColor;
  });

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
    w: { q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg', r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg', p: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg', k: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg' },
    b: { q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Chess_ndt45.svg', r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg', p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg', k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg' }
  };

  const formatTime = (seconds: number) => {
    if (initialTime === 0) return '∞';
    const m = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
    const s = Math.floor(Math.max(0, seconds) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (gameOver || initialTime === 0) return;
    const timer = setInterval(() => {
      if (isViewingHistory) return;
      if (isPlayerTurn) {
        setPlayerTime((prev) => { if (prev <= 1) { handleGameOver('timeout', 'black'); playSound('gameOver'); } return prev - 1; });
      } else {
        setOpponentTime((prev) => { if (prev <= 1) { handleGameOver('timeout', 'white'); playSound('gameOver'); } return prev - 1; });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayerTurn, gameOver, isViewingHistory, initialTime]);

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
          playSound('gameOver');
        } else if (gameCopy.isCheck()) {
          playSound('check');
        } else if (result.promotion) {
          playSound('promote');
        } else if (result.captured) {
          playSound('capture');
        } else {
          playSound('move');
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
        if (success) {
           // 🔥 اعمال پاداش زمانی به کاربر (اگر زمان بی‌نهایت نباشد)
           if(initialTime !== 0) setPlayerTime(prev => prev + timeIncrement);
           setIsPlayerTurn(false);
        }
      }
      setPremove(null);
      setOptionSquares({});
    }
  }, [isPlayerTurn, game, premove, gameOver, isViewingHistory, initialTime, timeIncrement]);

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
    setOptionSquares({}); 
    setClickedSquare(null);

    if (gameOver || isViewingHistory) {
      setViewIndex(fenHistory.length - 1);
      return false; 
    }

    if (!isPlayerTurn) {
      if (piece[0] === playerPieceColor) {
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
    if (success) {
       // 🔥 اعمال پاداش زمانی به کاربر
       if(initialTime !== 0) setPlayerTime(prev => prev + timeIncrement);
       setIsPlayerTurn(false);
    }
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
        if (pieceOnSquare && pieceOnSquare.color === playerPieceColor) {
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
        if (success) {
           // 🔥 اعمال پاداش زمانی به کاربر
           if(initialTime !== 0) setPlayerTime(prev => prev + timeIncrement);
           setIsPlayerTurn(false);
        }
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

      if (success) {
         // 🔥 اعمال پاداش زمانی به کاربر در صورت ارتقا
         if(initialTime !== 0) setPlayerTime(prev => prev + timeIncrement);
         setIsPlayerTurn(false);
      }
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
          const success = makeMove({ from: chosenMove.from, to: chosenMove.to, promotion: 'q' });
          if (success) {
             // 🔥 اعمال پاداش زمانی به ربات بعد از حرکت
             if(initialTime !== 0) setOpponentTime(prev => prev + timeIncrement);
             setIsPlayerTurn(true);
          }
        }
      }, thinkTime);
      return () => clearTimeout(botMoveTimer);
    }
  }, [isPlayerTurn, gameOver, game, opponent.accuracy, customPromotion, initialTime, timeIncrement]);

  const handleGameOver = (reason: string, winnerColor: string | null) => setGameOver({ status: reason, winner: winnerColor });
  const handleResign = () => { if (!gameOver) { handleGameOver('تسلیم', playerPieceColor === 'w' ? 'black' : 'white'); playSound('gameOver'); } };
  const handleDraw = () => { if (!gameOver) { handleGameOver('توافق', null); playSound('gameOver'); } };

  const history = game.history();
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }

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

  const PlayerInfo = ({ name, rating, time, isOpponent, isActive, accuracy, capturedPieces, capturedColor, scoreAdvantage, isThinking }: any) => (
    <div className="flex-none flex items-center justify-between w-full py-3 px-2 relative z-10 transition-all duration-300">
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${isOpponent ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-gradient-to-br from-zinc-700 to-zinc-800 text-white border border-zinc-700'}`}>
             {isOpponent ? <Cpu size={20} /> : name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-gray-100 text-[15px] flex items-center gap-2 leading-none">
              {name} <span className="text-zinc-500 font-medium text-sm">{rating}</span>
              {isOpponent && accuracy && accuracy !== 'پایه' && !isThinking && (
                 <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md border border-indigo-500/30 tracking-wider">PRO</span>
              )}
              {isThinking && (
                 <div className="flex items-center gap-[3px] ml-1 bg-zinc-800/80 px-2 py-1.5 rounded-full border border-zinc-700/50 shadow-inner h-[20px]">
                    <span className="w-1 h-1 bg-indigo-400 rounded-full dot-typing dot-1"></span>
                    <span className="w-1 h-1 bg-indigo-400 rounded-full dot-typing dot-2"></span>
                    <span className="w-1 h-1 bg-indigo-400 rounded-full dot-typing dot-3"></span>
                 </div>
              )}
            </div>
            
            <div className="flex items-center h-[18px] mt-1.5">
              {capturedPieces && capturedPieces.length > 0 && (
                 <div className="flex items-center text-lg leading-none">
                   {capturedPieces.map((piece: string, idx: number) => (
                     <span 
                       key={idx} 
                       className={`${idx === 0 ? '' : '-ml-[6px]'}`}
                       style={{
                         color: capturedColor === 'w' ? '#f4f4f5' : '#18181b',
                         WebkitTextStroke: capturedColor === 'w' ? '1px #3f3f46' : '1px #71717a',
                         textShadow: '0px 2px 4px rgba(0,0,0,0.4)'
                       }}
                     >
                       {pieceChars[piece]}
                     </span>
                   ))}
                 </div>
              )}
              {scoreAdvantage > 0 && (
                 <span className="text-xs text-emerald-500 font-bold ml-2 leading-none mt-1">+{scoreAdvantage}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={`text-2xl font-mono font-bold px-4 py-1.5 rounded-lg transition-all duration-300 shadow-inner ${isActive && !isViewingHistory ? 'bg-zinc-200 text-zinc-900 shadow-md scale-105' : (time < 60 && initialTime !== 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50')}`}>
        {formatTime(time)}
      </div>
    </div>
  );

  return (
    <div 
      className="flex flex-col h-screen bg-transparent text-gray-300 overflow-hidden font-sans relative" 
      onClick={() => { if (customPromotion) setCustomPromotion(null); }}
      onContextMenu={(e) => { 
        e.preventDefault(); 
        setPremove(null); 
        setClickedSquare(null); 
        setOptionSquares({}); 
      }}
    >
      <div className="flex-none h-16 flex items-center justify-between px-6 bg-[#18181b] border-b border-zinc-800/80 shadow-sm z-20">
        <div className="flex items-center gap-5">
           <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-zinc-800 rounded-lg">
             {i18n.language === 'fa' ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
           </button>
           <div className="flex flex-col">
             <span className="font-bold text-zinc-100 text-[15px] tracking-wide">کلاسیک</span>
             <span className="text-[11px] text-zinc-500 font-medium">
               {initialTime === 0 ? 'بدون محدودیت زمانی' : `${Math.floor(initialTime / 60)}${timeIncrement > 0 ? `|${timeIncrement}` : ''} • دوستانه`}
             </span>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-3 lg:p-6 w-full max-w-[1250px] mx-auto gap-5 lg:gap-8 relative z-0">
        <div className="flex flex-col flex-1 min-w-0 h-full items-center justify-center relative z-0">
          <div className="w-full h-full flex flex-col max-w-[90vh] lg:max-w-full relative z-0 justify-center">
            
            {initialPlayerColor === 'white' ? (
              <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} accuracy={opponent.accuracy} isThinking={!isPlayerTurn && !gameOver && !isViewingHistory} {...blackPlayerProps} />
            ) : (
              <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} accuracy={opponent.accuracy} isThinking={!isPlayerTurn && !gameOver && !isViewingHistory} {...whitePlayerProps} />
            )}
            
            <div dir="ltr" className="w-full relative flex items-center justify-center z-0 my-1">
              <div className="w-full aspect-square max-h-[70vh] relative shadow-2xl rounded-sm border-[4px] border-[#2A2926] z-0 overflow-hidden">
                
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
                  animationDuration={250}
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
                        <div className="absolute w-[90%] h-[90%] rounded-full bg-zinc-100 shadow-[0_5px_15px_rgba(0,0,0,0.5)] group-hover:bg-white group-hover:scale-110 transition-all duration-200"></div>
                        <img 
                          src={pieceSvgs[customPromotion.color][type]} 
                          alt={type} 
                          className="relative z-10 w-[85%] h-[85%] object-contain drop-shadow-md pointer-events-none" 
                          draggable={false} 
                        />
                      </button>
                    ))}
                  </div>
                )}
                
                {gameOver && (
                  <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-in fade-in zoom-in-95 duration-300">
                    <Trophy size={56} className={gameOver.winner === 'white' ? 'text-amber-400 mb-5 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'text-zinc-400 mb-5'} />
                    <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                      {gameOver.winner === initialPlayerColor ? 'شما بردید!' : gameOver.winner === null ? 'تساوی!' : 'ربات پیروز شد!'}
                    </h2>
                    <p className="text-zinc-300 mb-8 font-medium">بازی با {gameOver.status} خاتمه یافت.</p>
                    <button onClick={() => navigate('/archive')} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95">
                      تحلیل بازی
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {initialPlayerColor === 'white' ? (
              <PlayerInfo name="شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} isThinking={false} {...whitePlayerProps} />
            ) : (
              <PlayerInfo name="شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} isThinking={false} {...blackPlayerProps} />
            )}
            
          </div>
        </div>

        <div className="flex-none w-full lg:w-[360px] flex flex-col bg-[#1C1B19] border border-zinc-800/50 rounded-2xl shadow-2xl h-[35vh] lg:h-full shrink-0 relative z-10 overflow-hidden mt-4 lg:mt-0">
          
          <div className="bg-[#242320] px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
             <span className="font-bold text-zinc-300 text-sm">تاریخچه حرکات</span>
             <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">{history.length} حرکت</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pt-2 px-1 pb-4" dir="ltr">
            {movePairs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm font-medium">منتظر حرکت سفید...</div>
            ) : (
              <div className="flex flex-col text-[15px] px-2 font-medium">
                {movePairs.map((pair, index) => {
                  const whiteMoveIndex = index * 2 + 1;
                  const blackMoveIndex = index * 2 + 2;
                  
                  return (
                    <div key={index} className={`flex px-2 py-1.5 rounded-lg mb-1 ${index % 2 === 0 ? 'bg-zinc-800/30' : 'bg-transparent'}`}>
                      <div className="w-10 text-zinc-500 font-mono text-right pr-3 select-none py-1">{index + 1}.</div>
                      <div onClick={() => setViewIndex(whiteMoveIndex)} className={`flex-1 flex items-center justify-center cursor-pointer px-2 rounded-md transition-colors ${viewIndex === whiteMoveIndex ? 'bg-indigo-600/90 text-white shadow-sm' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                        {pair[0]}
                      </div>
                      <div onClick={() => pair[1] && setViewIndex(blackMoveIndex)} className={`flex-1 flex items-center justify-center cursor-pointer px-2 rounded-md transition-colors ${viewIndex === blackMoveIndex ? 'bg-indigo-600/90 text-white shadow-sm' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                        {pair[1] || ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div dir="ltr" className="flex-none flex items-center justify-center gap-1.5 bg-[#18181b] text-zinc-400 p-2.5 border-y border-zinc-800/80 shadow-inner">
            <button onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')} className="p-2 hover:bg-zinc-800 hover:text-zinc-200 rounded-lg transition-all mr-3 pr-5 border-r border-zinc-700/50" title="چرخش تخته"><RefreshCw size={18}/></button>
            <button onClick={() => setViewIndex(0)} className="p-2 hover:bg-zinc-800 hover:text-zinc-200 rounded-lg transition-all" title="اولین حرکت"><Rewind size={18}/></button>
            <button onClick={() => setViewIndex(p => Math.max(0, p - 1))} className="p-2 hover:bg-zinc-800 hover:text-zinc-200 rounded-lg transition-all" title="حرکت قبلی"><ChevronLeft size={22}/></button>
            <button onClick={() => setViewIndex(p => Math.min(fenHistory.length - 1, p + 1))} className="p-2 hover:bg-zinc-800 hover:text-zinc-200 rounded-lg transition-all" title="حرکت بعدی"><ChevronRight size={22}/></button>
            <button onClick={() => setViewIndex(fenHistory.length - 1)} className="p-2 hover:bg-zinc-800 hover:text-zinc-200 rounded-lg transition-all" title="آخرین حرکت"><FastForward size={18}/></button>
          </div>

          <div className="flex-none flex bg-[#121212] p-4 gap-3">
            <button onClick={handleDraw} className="flex-1 py-3 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-zinc-700/50 active:scale-95 shadow-sm"><Handshake size={18}/> تساوی</button>
            <button onClick={handleResign} className="flex-1 py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 hover:text-rose-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-rose-500/20 active:scale-95 shadow-sm"><Flag size={18}/> تسلیم</button>
          </div>
        </div>
      </div>
    </div>
  );
}