import { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Flag, Handshake, ChevronLeft, ChevronRight, FastForward, Rewind, RefreshCw, Zap, PieChart, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

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
  try {
    const audio = sounds[type].cloneNode() as HTMLAudioElement;
    audio.play().catch(() => {});
  } catch (e) {}
};

export default function LichessLiveGame() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const gameId = location.state?.gameId;
  const token = location.state?.token;

  const [myLichessId, setMyLichessId] = useState<string>('');
  const [opponent, setOpponent] = useState({ name: 'در حال اتصال...', rating: '?' });
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const playerColorRef = useRef<'white' | 'black'>('white'); 

  const [game, setGame] = useState(new Chess());
  const gameRef = useRef(new Chess());
  
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const isPlayerTurnRef = useRef(false);

  const [gameOver, setGameOver] = useState<{ status: string; winner: string | null; theme: 'win'|'loss'|'draw' } | null>(null);
  const gameOverRef = useRef(false);

  const [playerTime, setPlayerTime] = useState(180);
  const [opponentTime, setOpponentTime] = useState(180);

  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [moveSquares, setMoveSquares] = useState<Record<string, any>>({});
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [clickedSquare, setClickedSquare] = useState<string | null>(null);
  
  const [premove, setPremove] = useState<{from: string, to: string} | null>(null);
  const premoveRef = useRef<{from: string, to: string} | null>(null);

  const [fenHistory, setFenHistory] = useState<string[]>([new Chess().fen()]);
  const fenHistoryRef = useRef<string[]>([new Chess().fen()]);
  const [viewIndex, setViewIndex] = useState<number>(0);

  const [customPromotion, setCustomPromotion] = useState<{ from: string; to: string; color: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'error' | 'success' | 'info'} | null>(null);

  const isViewingHistory = viewIndex < fenHistory.length - 1;
  const playerPieceColor = playerColor === 'white' ? 'w' : 'b';
  const abortControllerRef = useRef<AbortController | null>(null);

  const pieceSvgs: Record<string, Record<string, string>> = {
    w: { q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg', r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg' },
    b: { q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Chess_ndt45.svg', r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg' }
  };

  const showToast = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
      setToastMessage({text, type});
      setTimeout(() => setToastMessage(null), 3000);
  };

  const updateGameOver = (status: string, winner: string | null) => {
      let theme: 'win'|'loss'|'draw' = 'draw';
      if (winner === playerColorRef.current) theme = 'win';
      else if (winner) theme = 'loss';
      setGameOver({ status, winner, theme });
      gameOverRef.current = true;
  };

  // 🔴 تابع جادویی برای کپی کردن بازی بدون از دست رفتن تاریخچه!
  const cloneGame = (g: Chess) => {
      const copy = new Chess();
      copy.loadPgn(g.pgn());
      return copy;
  };

  const syncGameToState = (g: Chess, isInit = false) => {
      gameRef.current = g;
      setGame(cloneGame(g));
      
      const hist = g.history({ verbose: true }) as any[];
      let fens = [new Chess().fen()];
      
      if (hist.length > 0 && hist[0].after) {
          fens = [new Chess().fen(), ...hist.map(m => m.after)];
      } else {
          const tempG = new Chess();
          hist.forEach(m => {
              tempG.move(m.san || m);
              fens.push(tempG.fen());
          });
      }
      
      fenHistoryRef.current = fens;
      setFenHistory(fens);
      if (!isViewingHistory || isInit) setViewIndex(fens.length - 1);

      const amIWhite = playerColorRef.current === 'white';
      const myTurn = g.turn() === (amIWhite ? 'w' : 'b');
      isPlayerTurnRef.current = myTurn;
      setIsPlayerTurn(myTurn);
  };

  useEffect(() => {
      if (!token || !gameId) { navigate('/play/online/lobby'); return; }
      fetch('https://lichess.org/api/account', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => setMyLichessId(data.id))
          .catch(() => showToast('خطا در دریافت اطلاعات کاربری', 'error'));
  }, [token, gameId, navigate]);

  useEffect(() => {
      if (!token || !gameId || !myLichessId) return;

      let isMounted = true;
      let reconnectTimer: any;

      const connectStream = async () => {
          if (!isMounted || gameOverRef.current) return;
          abortControllerRef.current = new AbortController();

          try {
              const res = await fetch(`https://lichess.org/api/board/game/stream/${gameId}`, {
                  headers: { 'Authorization': `Bearer ${token}` },
                  signal: abortControllerRef.current?.signal
              });

              if (!res.ok) {
                  if (res.status === 404 && isMounted) {
                      showToast(`بازی یافت نشد.`, 'error');
                      setTimeout(() => navigate('/play/online/lobby'), 2500);
                  }
                  return;
              }

              const reader = res.body?.getReader();
              const decoder = new TextDecoder('utf-8');
              let buffer = '';

              if (reader) {
                  while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;

                      buffer += decoder.decode(value, { stream: true });
                      const lines = buffer.split('\n');
                      buffer = lines.pop() || '';

                      for (let line of lines) {
                          if (!line.trim()) continue;
                          try {
                              const data = JSON.parse(line);
                              
                              if (data.type === 'gameFull') {
                                  const amIWhite = data.white.id === myLichessId;
                                  const clr = amIWhite ? 'white' : 'black';
                                  setPlayerColor(clr);
                                  playerColorRef.current = clr;
                                  setBoardOrientation(clr);
                                  
                                  setOpponent({
                                      name: amIWhite ? (data.black.name || 'حریف') : (data.white.name || 'حریف'),
                                      rating: amIWhite ? (data.black.rating || '?') : (data.white.rating || '?')
                                  });

                                  const newGame = new Chess();
                                  if (data.state.moves) {
                                      data.state.moves.split(' ').filter(Boolean).forEach((m: string) => newGame.move(m, { sloppy: true }));
                                  }
                                  syncGameToState(newGame, true);
                                  
                                  setPlayerTime(Math.floor((amIWhite ? data.state.wtime : data.state.btime) / 1000));
                                  setOpponentTime(Math.floor((amIWhite ? data.state.btime : data.state.wtime) / 1000));
                              } 
                              else if (data.type === 'gameState') {
                                  const serverMoves = data.moves.split(' ').filter(Boolean);
                                  const localMovesCount = gameRef.current.history().length;

                                  if (serverMoves.length > localMovesCount) {
                                      const newMoves = serverMoves.slice(localMovesCount);
                                      const gameCopy = cloneGame(gameRef.current);
                                      let lastMove: any = null;
                                      
                                      newMoves.forEach((m: string) => {
                                          lastMove = gameCopy.move(m, { sloppy: true });
                                      });

                                      syncGameToState(gameCopy);

                                      if (lastMove) {
                                          setMoveSquares({ [lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
                                          if (gameCopy.turn() === playerColorRef.current[0]) {
                                              if (gameCopy.isCheckmate()) playSound('gameOver');
                                              else if (gameCopy.isCheck()) playSound('check');
                                              else if (lastMove.captured) playSound('capture');
                                              else playSound('move');
                                          }
                                      }
                                  }

                                  const amIWhite = playerColorRef.current === 'white';
                                  setPlayerTime(Math.floor((amIWhite ? data.wtime : data.btime) / 1000));
                                  setOpponentTime(Math.floor((amIWhite ? data.btime : data.wtime) / 1000));

                                  if (data.status !== 'started') {
                                      let statusText = 'نامشخص';
                                      if (data.status === 'mate') statusText = 'مات';
                                      else if (data.status === 'resign') statusText = 'تسلیم';
                                      else if (data.status === 'draw') statusText = 'تساوی';
                                      else if (data.status === 'outoftime') statusText = 'پایان زمان';
                                      else if (data.status === 'aborted') statusText = 'لغو بازی';
                                      
                                      updateGameOver(statusText, data.winner || null);
                                      playSound('gameOver');
                                  }
                              }
                          } catch (e) {}
                      }
                  }
              }
          } catch (e: any) {
              if (e.name !== 'AbortError') console.error('Stream dropped:', e);
          }

          if (isMounted && !gameOverRef.current) {
              reconnectTimer = setTimeout(connectStream, 1500); 
          }
      };

      connectStream();

      return () => {
          isMounted = false;
          clearTimeout(reconnectTimer);
          abortControllerRef.current?.abort();
      };
  }, [token, gameId, myLichessId, navigate]);

  useEffect(() => {
      if (isPlayerTurn && premoveRef.current && !gameOverRef.current && !isViewingHistory) {
          const pm = premoveRef.current;
          const moves = gameRef.current.moves({ verbose: true });
          const isValid = moves.find(m => m.from === pm.from && m.to === pm.to);
          
          if (isValid) {
              const gameCopy = cloneGame(gameRef.current);
              const moveObj = gameCopy.move({ from: pm.from, to: pm.to, promotion: 'q' });
              
              if (moveObj) {
                  syncGameToState(gameCopy);
                  playSound(moveObj.captured ? 'capture' : 'move');
                  setMoveSquares({ [moveObj.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [moveObj.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
                  
                  fetch(`https://lichess.org/api/board/game/${gameId}/move/${pm.from}${pm.to}${moveObj.promotion||''}`, {
                      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                  });
              }
          }
          
          setPremove(null);
          premoveRef.current = null;
          setOptionSquares({});
      }
  }, [isPlayerTurn, isViewingHistory, gameId, token]);

  const executeLocalMove = (sourceSquare: string, targetSquare: string, promotion = 'q') => {
      const gameCopy = cloneGame(gameRef.current);
      const moveObj = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion });
      
      if (moveObj) {
          syncGameToState(gameCopy);
          playSound(moveObj.captured ? 'capture' : 'move');
          setMoveSquares({ [sourceSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [targetSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } });
          setOptionSquares({});
          
          fetch(`https://lichess.org/api/board/game/${gameId}/move/${sourceSquare}${targetSquare}${moveObj.promotion||''}`, {
              method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => {
              if (!res.ok) {
                  showToast('حرکت در سرور ثبت نشد!', 'error');
                  const rollbackGame = cloneGame(gameRef.current);
                  rollbackGame.undo();
                  syncGameToState(rollbackGame);
              }
          });
          return true;
      }
      return false;
  };

  const getPseudoLegalMoves = (sourceSquare: string) => {
      const tempGame = new Chess(gameRef.current.fen());
      const tokens = tempGame.fen().split(' ');
      tokens[1] = tokens[1] === 'w' ? 'b' : 'w'; 
      tokens[3] = '-'; 
      try {
          tempGame.load(tokens.join(' '));
          return tempGame.moves({ square: sourceSquare as any, verbose: true });
      } catch(e) { return []; }
  };

  const highlightSquares = (sourceSquare: string, moves: any[]) => {
      if (moves.length === 0) return;
      const newSquares: any = {};
      moves.forEach((m: any) => {
          const isCapture = gameRef.current.get(m.to as any) && gameRef.current.get(m.to as any).color !== gameRef.current.get(sourceSquare as any)?.color;
          newSquares[m.to] = { backgroundImage: isCapture ? 'radial-gradient(circle, transparent 0%, transparent 65%, rgba(0,0,0,0.2) 67%, rgba(0,0,0,0.2) 100%)' : 'radial-gradient(circle, rgba(0,0,0,.2) 22%, transparent 23%)' };
      });
      newSquares[sourceSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
      setOptionSquares(newSquares);
  };

  const onPieceDragBegin = (piece: string, sourceSquare: string) => {
    if (gameOverRef.current || isViewingHistory) return;
    if (!isPlayerTurnRef.current) {
        if (piece[0] === playerPieceColor) {
            setClickedSquare(sourceSquare);
            highlightSquares(sourceSquare, getPseudoLegalMoves(sourceSquare));
        }
        return;
    }
    setClickedSquare(sourceSquare);
    highlightSquares(sourceSquare, gameRef.current.moves({ square: sourceSquare as any, verbose: true }));
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    setOptionSquares({}); setClickedSquare(null);
    if (gameOverRef.current || isViewingHistory) { setViewIndex(fenHistoryRef.current.length - 1); return false; }
    
    if (!isPlayerTurnRef.current) {
        if (piece[0] === playerPieceColor) {
            const pseudoMoves = getPseudoLegalMoves(sourceSquare);
            if (pseudoMoves.some((m: any) => m.to === targetSquare)) {
                setPremove({ from: sourceSquare, to: targetSquare });
                premoveRef.current = { from: sourceSquare, to: targetSquare };
            }
        }
        return false; 
    }

    const moves = gameRef.current.moves({ verbose: true });
    const isPromotion = moves.some(m => m.from === sourceSquare && m.to === targetSquare && m.promotion);
    if (isPromotion) { 
        return executeLocalMove(sourceSquare, targetSquare, 'q');
    }

    const legalMove = moves.find(m => m.from === sourceSquare && m.to === targetSquare);
    if (!legalMove) return false;

    return executeLocalMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = (square: string) => {
    if (gameOverRef.current || isViewingHistory || customPromotion) return;
    if (premoveRef.current) { setPremove(null); premoveRef.current = null; setClickedSquare(null); setOptionSquares({}); return; }

    if (!isPlayerTurnRef.current) {
        if (clickedSquare) {
            const pseudoMoves = getPseudoLegalMoves(clickedSquare);
            if (pseudoMoves.some((m: any) => m.to === square)) {
                setPremove({ from: clickedSquare, to: square });
                premoveRef.current = { from: clickedSquare, to: square };
            }
            setClickedSquare(null); setOptionSquares({});
        } else {
            const pieceOnSquare = gameRef.current.get(square as any);
            if (pieceOnSquare && pieceOnSquare.color === playerPieceColor) { 
                setClickedSquare(square); 
                highlightSquares(square, getPseudoLegalMoves(square));
            }
        }
        return;
    }

    if (clickedSquare === square) { setClickedSquare(null); setOptionSquares({}); return; }

    if (clickedSquare) {
      const moves = gameRef.current.moves({ square: clickedSquare as any, verbose: true });
      const move = moves.find(m => m.to === square);
      if (move) {
        executeLocalMove(clickedSquare, square);
        setClickedSquare(null); setOptionSquares({});
        return;
      }
    }

    const pieceOnSquare = gameRef.current.get(square as any);
    if (pieceOnSquare && pieceOnSquare.color === playerPieceColor) { 
        setClickedSquare(square); 
        highlightSquares(square, gameRef.current.moves({ square: square as any, verbose: true })); 
    } else { 
        setClickedSquare(null); setOptionSquares({}); 
    }
  };

  const handleCustomPromotionSelect = (promotionType: string) => {
    if (customPromotion) {
        const gameCopy = cloneGame(gameRef.current);
        const moves = gameCopy.moves({ verbose: true });
        const exactMove = moves.find(m => m.from === customPromotion.from && m.to === customPromotion.to && m.promotion === promotionType);
        
        if (exactMove) {
            gameCopy.move(exactMove);
            syncGameToState(gameCopy);
            sendMoveToLichess(`${customPromotion.from}${customPromotion.to}${promotionType}`);
        }
    }
    setCustomPromotion(null); setClickedSquare(null); setOptionSquares({});
  };

  const handleResign = async () => {
    if (gameOverRef.current) return;
    await fetch(`https://lichess.org/api/board/game/${gameId}/resign`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  };
  const handleDrawOffer = async () => {
    if (gameOverRef.current) return;
    showToast('پیشنهاد تساوی ارسال شد', 'success');
    await fetch(`https://lichess.org/api/board/game/${gameId}/draw/yes`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(Math.max(0, secs) / 60).toString().padStart(2, '0');
    const s = Math.floor(Math.max(0, secs) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // تایمر
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      if (isViewingHistory) return;
      if (isPlayerTurn) setPlayerTime(p => Math.max(0, p - 1));
      else setOpponentTime(p => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayerTurn, gameOver, isViewingHistory]);

  const currentMoves = game.history({ verbose: true }).slice(0, viewIndex);
  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const sortOrder: Record<string, number> = { q: 1, r: 2, b: 3, n: 4, p: 5 };
  
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
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${isOpponent ? 'bg-[#1a1916] text-white border border-[#35332e]' : 'bg-[#262421] text-white border border-[#35332e]'}`}>
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
      <div className={`text-2xl font-mono font-black px-4 py-1.5 rounded-lg transition-all duration-300 shadow-inner ${isActive && !isViewingHistory ? 'bg-zinc-200 text-zinc-900 shadow-md scale-105' : (time < 60 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50')}`}>
        {formatTime(time)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-[#050505] text-gray-300 overflow-hidden font-sans relative" dir="rtl" onContextMenu={e => { e.preventDefault(); setPremove(null); premoveRef.current = null; setClickedSquare(null); setOptionSquares({}); }}>
      {/* 🌟 نورپردازی حرفه‌ای محیط بر اساس نتیجه بازی */}
      <div className={`fixed top-[-10%] right-[-5%] w-[50vw] h-[50vw] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${gameOver?.theme === 'win' ? 'bg-amber-500/20' : gameOver?.theme === 'loss' ? 'bg-rose-500/20' : 'bg-sky-500/10'}`}></div>
      <div className={`fixed bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] blur-[100px] rounded-full pointer-events-none transition-colors duration-1000 ${gameOver?.theme === 'win' ? 'bg-emerald-500/10' : gameOver?.theme === 'loss' ? 'bg-red-500/10' : 'bg-transparent'}`}></div>

      <div className="fixed top-6 inset-x-0 z-[100] flex justify-center pointer-events-none px-4" dir="rtl">
        <AnimatePresence>
          {toastMessage && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className={`border px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 pointer-events-auto ${toastMessage.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-white' : 'bg-[#1e1c19] border-farzin-accent/50 text-white'}`}>
               <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${toastMessage.type === 'error' ? 'bg-red-500/20' : 'bg-farzin-accent/20'}`}>
                   {toastMessage.type === 'error' ? <AlertCircle size={14} className="text-red-400"/> : <CheckCircle2 size={14} className="text-farzin-accent"/>}
               </div>
               <span className="text-xs font-bold">{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-none h-16 flex items-center justify-between px-6 bg-[#161512]/80 backdrop-blur-md border-b border-white/5 z-20" dir="rtl">
        <div className="flex items-center gap-5">
           <button onClick={() => navigate('/play/online/lobby')} className="text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-zinc-800 rounded-lg"><ArrowRight size={22} /></button>
           <div className="flex flex-col">
             <span className="font-bold text-white text-[15px] flex items-center gap-2">آرنای لیچس <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span></span>
             <span className="text-[11px] text-zinc-500 font-medium">Lichess Live Server</span>
           </div>
        </div>
      </div>

      {/* 🔴 استفاده از lg:flex-row برای تطابق کامل با چیدمان استاندارد و صفحه هوش مصنوعی */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-3 lg:p-6 w-full max-w-[1250px] mx-auto gap-5 lg:gap-8 relative z-0" dir="rtl">
        
        <div className="flex flex-col flex-1 min-w-0 h-full items-center justify-center relative z-0">
          <div className="w-full h-full flex flex-col max-w-[90vh] lg:max-w-full relative z-0 justify-center">
            
            {playerColor === 'white' ? <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} {...blackPlayerProps} /> : <PlayerInfo name={opponent.name} rating={opponent.rating} time={opponentTime} isOpponent={true} isActive={!isPlayerTurn && !gameOver} {...whitePlayerProps} />}
            
            {/* افکت لرزش و پالس دور تخته در هنگام پایان بازی */}
            <motion.div animate={gameOver?.theme === 'loss' ? { x: [-5, 5, -5, 5, 0] } : gameOver?.theme === 'win' ? { scale: [1, 1.02, 1] } : {}} transition={{ duration: 0.5 }} className="w-full relative flex items-center justify-center z-0 my-1">
              <div className={`w-full aspect-square max-h-[70vh] relative shadow-2xl rounded-sm border-[4px] z-0 overflow-hidden transition-colors duration-700 ${gameOver?.theme === 'win' ? 'border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : gameOver?.theme === 'loss' ? 'border-rose-500/50 shadow-[0_0_50px_rgba(244,63,94,0.2)]' : 'border-[#2A2926]'}`}>
                
                <div dir="ltr" className="w-full h-full">
                  <Board 
                    position={isViewingHistory ? fenHistory[viewIndex] : game.fen()} 
                    onPieceDrop={onDrop} onPieceDragBegin={onPieceDragBegin} onSquareClick={handleSquareClick}
                    boardOrientation={boardOrientation} animationDuration={200}
                    customDarkSquareStyle={{ backgroundColor: '#779556' }} customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                    customSquareStyles={{ ...moveSquares, ...optionSquares, ...(premove ? {[premove.from]:{backgroundColor:'rgba(239,68,68,0.5)'}, [premove.to]:{backgroundColor:'rgba(239,68,68,0.5)'}} : {}) }}
                  />
                </div>

                {customPromotion && (
                  <div className="z-[1000] absolute w-[12.5%] h-[50%] flex flex-col pointer-events-none" style={{ left: `${(boardOrientation === 'black' ? 7 - (customPromotion.to.charCodeAt(0) - 97) : (customPromotion.to.charCodeAt(0) - 97)) * 12.5}%`, [parseInt(customPromotion.to[1], 10) === 8 ? 'top' : 'bottom']: '0%', flexDirection: parseInt(customPromotion.to[1], 10) === 8 ? 'column' : 'column-reverse' }}>
                    {['q', 'n', 'r', 'b'].map(t => (
                      <button key={t} onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleCustomPromotionSelect(t); }} className="w-full h-1/4 flex items-center justify-center relative group cursor-pointer pointer-events-auto bg-black/40 hover:bg-black/60 backdrop-blur">
                        <img src={pieceSvgs[customPromotion.color][t]} alt={t} className="relative z-10 w-[85%] h-[85%] object-contain drop-shadow-md pointer-events-none" draggable={false} />
                      </button>
                    ))}
                  </div>
                )}
                
                {/* 🌟 پاپ‌آپ پایان بازی (AAA Premium Level) */}
                <AnimatePresence>
                  {gameOver && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6" dir="rtl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5, y: 50, rotateX: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }} 
                            transition={{ type: "spring", damping: 20, stiffness: 200 }}
                            className="w-full max-w-[340px] rounded-[40px] bg-[#11100e]/90 backdrop-blur-2xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden relative"
                        >
                            {/* هاله نورانی بک‌گراند پاپ‌آپ */}
                            <div className={`absolute top-0 inset-x-0 h-40 blur-[80px] opacity-40 ${gameOver.theme === 'win' ? 'bg-amber-500' : gameOver.theme === 'loss' ? 'bg-rose-500' : 'bg-sky-500'}`} />

                            <div className="p-8 flex flex-col items-center text-center relative z-10">
                                
                                <motion.div 
                                    animate={ gameOver.theme === 'win' ? { y: [-5, 5, -5], scale: [1, 1.05, 1] } : gameOver.theme === 'loss' ? { rotate: [-5, 5, -5, 0], scale: [1, 0.95, 1] } : { y: [-2, 2, -2] } }
                                    transition={{ duration: gameOver.theme === 'loss' ? 0.5 : 3, repeat: Infinity }}
                                    className="text-7xl sm:text-8xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] mb-6"
                                >
                                    {gameOver.theme === 'win' ? '🏆' : gameOver.theme === 'loss' ? '💀' : '🤝'}
                                </motion.div>
                                
                                <h2 className={`text-2xl sm:text-3xl font-black mb-2 tracking-tight ${gameOver.theme === 'win' ? 'text-amber-400' : gameOver.theme === 'loss' ? 'text-rose-400' : 'text-sky-400'}`}>
                                    {gameOver.theme === 'win' ? 'پیروزی درخشان!' : gameOver.theme === 'loss' ? 'شکست خوردی' : 'صلح شوالیه‌ها'}
                                </h2>
                                
                                <div className="flex items-center justify-center w-full mb-8">
                                    <div className="bg-black/50 border border-white/5 px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-inner">
                                        <span className="text-zinc-500 font-bold text-xs">لیچس:</span>
                                        <span className={`font-black text-sm ${gameOver.theme === 'win' ? 'text-amber-400' : gameOver.theme === 'loss' ? 'text-rose-400' : 'text-sky-400'}`}>{gameOver.status}</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col w-full gap-3">
                                    <button onClick={() => navigate('/report', { state: { data: game.pgn(), forceNew: true, meta: { white: { name: playerColor === 'white' ? 'شما' : opponent.name, elo: 1500 }, black: { name: playerColor === 'black' ? 'شما' : opponent.name, elo: 1500 }, result: gameOver.winner === null ? '1/2-1/2' : gameOver.winner === 'white' ? '1-0' : '0-1' } } })} className={`w-full text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${gameOver.theme === 'win' ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/20' : 'bg-gradient-to-r from-farzin-accent to-[#5c7a40] shadow-farzin-accent/20'}`}>
                                        <PieChart size={18} /> کالبدشکافی بازی
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => navigate('/play/online/lobby')} className="bg-[#1e1c19] hover:bg-[#262421] text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-[#35332e] shadow-sm"><RotateCcw size={14}/> لابی</button>
                                        <button onClick={() => navigate('/play/online/lobby')} className="bg-[#1e1c19] hover:bg-[#262421] text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-[#35332e] shadow-sm"><Zap size={14}/> حریف جدید</button>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            
            {playerColor === 'white' ? <PlayerInfo name="شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} {...whitePlayerProps} /> : <PlayerInfo name="شما" rating={1500} time={playerTime} isOpponent={false} isActive={isPlayerTurn && !gameOver} {...blackPlayerProps} />}
          </div>
        </div>

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
            <div className="flex-none flex bg-[#0a0a0a] p-3 gap-2 border-t border-[#35332e]" dir="rtl">
              <button onClick={handleDrawOffer} className="flex-1 py-3 bg-[#1e1c19] hover:bg-[#262421] text-zinc-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-[#35332e] active:scale-95 text-xs"><Handshake size={16}/> تساوی</button>
              <button onClick={handleResign} className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-red-500/20 active:scale-95 text-xs"><Flag size={16}/> تسلیم</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}