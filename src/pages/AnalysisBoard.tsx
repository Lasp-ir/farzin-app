import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion, AnimatePresence } from 'framer-motion';


import { 
  ChevronRight, Cpu, FastForward, Rewind, SkipBack, SkipForward,
  Share2, Download, List, TrendingUp, BookOpen, User, Edit2, Check,
  Activity, Settings, Loader2, RefreshCw, Zap
} from 'lucide-react';

import { useStockfish } from '../hooks/useStockfish';

// --- ساختار داده‌ای درخت حرکات (Variation Tree) ---
export interface MoveNode {
  id: string;
  san: string;
  fen: string;
  move: any;
  parentId: string | null;
  childrenIds: string[];
}

// --- کامپوننت هدر قابل ویرایش بازیکن ---
const EditablePlayer = ({ 
  color, 
  data, 
  onUpdate 
}: { 
  color: 'w' | 'b', 
  data: { name: string, elo: string, title: string },
  onUpdate: (newData: any) => void 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState(data);

  const handleSave = () => {
    onUpdate(tempData);
    setIsEditing(false);
  };

  return (
    <div className="w-full flex items-center justify-between px-2 py-1.5 bg-[#1e1c19]/50 rounded-xl border border-[#35332e]/50 my-1">
      <div className="flex items-center gap-3 w-full">
        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center shadow-inner border ${color === 'w' ? 'bg-zinc-200 border-zinc-400 text-zinc-800' : 'bg-[#262421] border-[#403e3a] text-zinc-400'}`}>
          <User size={20} />
        </div>
        
        {isEditing ? (
          <div className="flex flex-col gap-1 w-full mr-2" dir="rtl">
            <input 
              autoFocus
              className="bg-[#12110f] text-white text-sm px-2 py-1 rounded border border-farzin-accent outline-none" 
              value={tempData.name} 
              onChange={e => setTempData({...tempData, name: e.target.value})} 
              placeholder="نام بازیکن"
            />
            <div className="flex gap-2">
              <input 
                className="bg-[#12110f] text-xs text-zinc-400 px-2 py-1 rounded border border-[#35332e] outline-none w-20" 
                value={tempData.title} 
                onChange={e => setTempData({...tempData, title: e.target.value})} 
                placeholder="تایتل (GM)"
              />
              <input 
                className="bg-[#12110f] text-xs font-mono text-zinc-400 px-2 py-1 rounded border border-[#35332e] outline-none w-24" 
                value={tempData.elo} 
                onChange={e => setTempData({...tempData, elo: e.target.value})} 
                placeholder="ریتینگ"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col mr-2 cursor-pointer group w-full" onClick={() => setIsEditing(true)}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white group-hover:text-farzin-accent transition-colors">
                {data.name || (color === 'w' ? 'بازیکن سفید' : 'بازیکن سیاه')}
              </span>
              <Edit2 size={12} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {data.title && data.title !== 'بدون تایتل' && (
                  <span className={`text-[10px] font-black px-1.5 rounded ${color === 'w' ? 'text-sky-400 bg-sky-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                    {data.title}
                  </span>
              )}
              <span className="text-[10px] font-mono text-zinc-500">{data.elo || '---'}</span>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <button onClick={handleSave} className="p-2 bg-farzin-accent/20 text-farzin-accent rounded-lg hover:bg-farzin-accent hover:text-white transition-colors ml-1">
          <Check size={18} />
        </button>
      )}
    </div>
  );
};


export default function AnalysisBoard() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state || { data: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', type: 'FEN', meta: null };

  const [isLoaded, setIsLoaded] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<'white'|'black'>('white');
  const [activeTab, setActiveTab] = useState<'notation'|'graph'|'explorer'>('notation');

  // --- سیستم ثبت متادیتای بازیکنان ---
  const [playerMeta, setPlayerMeta] = useState({
    white: { name: initialData.meta?.whiteName || '', elo: initialData.meta?.whiteElo || '', title: initialData.meta?.whiteTitle || '' },
    black: { name: initialData.meta?.blackName || '', elo: initialData.meta?.blackElo || '', title: initialData.meta?.blackTitle || '' }
  });

  // --- قلب تپنده درخت حرکات (جایگزین آرایه خطی) ---
  const [tree, setTree] = useState<Record<string, MoveNode>>({});
  const [currentNodeId, setCurrentNodeId] = useState<string>('root');
  
  const { isReady, engineStatus, evaluation, lines, analyze, stop } = useStockfish();

  // مقداردهی اولیه درخت
  useEffect(() => {
    const rootFen = initialData.type === 'FEN' ? initialData.data : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setTree({
      'root': { id: 'root', san: 'Start', fen: rootFen, move: null, parentId: null, childrenIds: [] }
    });
    setCurrentNodeId('root');
    setIsLoaded(true);
  }, []);

  const currentPosition = tree[currentNodeId]?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const activeGame = useMemo(() => new Chess(currentPosition), [currentPosition]);

  // فعال‌سازی موتور روی پوزیشن جدید
  useEffect(() => {
    if (isReady && currentPosition) {
      analyze(currentPosition, 24);
    }
  }, [currentPosition, isReady, analyze]);

  // --- منطق ثبت حرکت در درخت واریانت‌ها ---
  const addMoveToTree = (moveParams: {from: string, to: string, promotion?: string}) => {
    try {
      const tempGame = new Chess(currentPosition);
      const move = tempGame.move(moveParams);
      if (!move) return false;

      const newFen = tempGame.fen();
      const newNodeId = `${currentNodeId}-${move.san}`; // شناسه یکتا برای هر واریانت

      setTree(prev => {
        // اگر این حرکت قبلاً در این گره ثبت شده، فقط بهش پرش کن
        if (prev[currentNodeId].childrenIds.includes(newNodeId)) {
          return prev;
        }

        const newNode: MoveNode = {
          id: newNodeId,
          san: move.san,
          fen: newFen,
          move: move,
          parentId: currentNodeId,
          childrenIds: []
        };

        return {
          ...prev,
          [newNodeId]: newNode,
          [currentNodeId]: {
            ...prev[currentNodeId],
            childrenIds: [...prev[currentNodeId].childrenIds, newNodeId]
          }
        };
      });

      setCurrentNodeId(newNodeId);
      return true;
    } catch (e) {
      return false;
    }
  };

  // --- هندلرهای تعامل با تخته (بدون تغییر منطق، متصل به درخت) ---
  const [clickedSquare, setClickedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});

  const highlightLegalMoves = (sourceSquare: string) => {
    const moves = activeGame.moves({ square: sourceSquare as any, verbose: true });
    if (moves.length === 0) return;
    const newSquares: any = {};
    moves.forEach((m: any) => {
      const isCapture = activeGame.get(m.to as any) && activeGame.get(m.to as any).color !== activeGame.get(sourceSquare as any)?.color;
      newSquares[m.to] = {
        backgroundImage: isCapture
            ? 'radial-gradient(circle, transparent 0%, transparent 65%, rgba(0,0,0,0.4) 67%, rgba(0,0,0,0.4) 100%)' 
            : 'radial-gradient(circle, rgba(0,0,0,.4) 22%, transparent 23%)',
      };
    });
    newSquares[sourceSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    setOptionSquares(newSquares);
  };

  const onPieceDragBegin = (piece: string, sourceSquare: string) => {
    if (piece[0] !== activeGame.turn()) return;
    setClickedSquare(sourceSquare);
    highlightLegalMoves(sourceSquare);
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    setOptionSquares({}); 
    setClickedSquare(null);
    return addMoveToTree({ from: sourceSquare, to: targetSquare, promotion: piece[1]?.toLowerCase() ?? 'q' });
  };

  const handleSquareClick = (square: string) => {
    if (clickedSquare === square) {
       setClickedSquare(null); setOptionSquares({}); return;
    }
    if (clickedSquare) {
      const moves = activeGame.moves({ square: clickedSquare as any, verbose: true });
      if (moves.find(m => m.to === square)) {
        addMoveToTree({ from: clickedSquare, to: square, promotion: 'q' });
        setClickedSquare(null); setOptionSquares({});
        return;
      }
    }
    const pieceOnSquare = activeGame.get(square as any);
    if (pieceOnSquare && pieceOnSquare.color === activeGame.turn()) {
      setClickedSquare(square); highlightLegalMoves(square);
    } else {
      setClickedSquare(null); setOptionSquares({});
    }
  };

  const evalPercentage = useMemo(() => {
    let percent = 50 + (evaluation * 10);
    return Math.max(5, Math.min(95, percent));
  }, [evaluation]);

  // نمایش "reading books..." وقتی در گشایش هستیم و تب دیتابیس باز است
  const isOpeningPhase = currentNodeId === 'root' || (tree[currentNodeId] && Object.keys(tree).length < 15);
  const displayEngineStatus = (isOpeningPhase && activeTab === 'explorer') ? 'reading books...' : (isReady ? `Farzin 1.0 (NNUE)` : engineStatus);

  return (
    <div className="min-h-screen bg-[#100f0d] text-zinc-200 flex flex-col font-sans" dir="rtl">
      
      {/* هدر اصلی بالا */}
      <div className={`w-full px-4 py-3 flex items-center justify-between z-10 bg-[#161512] border-b border-[#35332e] transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={() => navigate(-1)} className="p-2 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] transition-colors text-zinc-400">
          <ChevronRight size={20} />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="font-black text-base text-white flex items-center gap-2">
              <Activity size={16} className="text-farzin-accent" />
              آزمایشگاه آنالیز
            </h1>
        </div>
        <div className="flex gap-2">
            <button className="p-2 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] text-zinc-400"><Share2 size={18}/></button>
            <button className="p-2 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] text-zinc-400"><Download size={18}/></button>
        </div>
      </div>

      <div className={`w-full flex-1 flex flex-col lg:flex-row lg:overflow-hidden transition-opacity duration-700 delay-100 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* ستون اول: تخته و بازیکنان (Arena) */}
        <div className="w-full lg:max-w-[45vw] lg:h-full flex flex-col px-3 py-2 shrink-0">
            <EditablePlayer color={boardOrientation === 'white' ? 'b' : 'w'} data={boardOrientation === 'white' ? playerMeta.black : playerMeta.white} onUpdate={(d) => setPlayerMeta(p => ({...p, [boardOrientation === 'white' ? 'black' : 'white']: d}))} />
            
            <div className="w-full flex justify-center py-1">
                <div className="flex w-full max-w-[600px] aspect-square gap-1.5" dir="ltr">
                    <div className="flex-1 bg-[#262421] p-1 rounded border border-[#35332e] shadow-2xl relative">
                        <div className="w-full h-full rounded overflow-hidden">
                          <Chessboard 
                              position={currentPosition} 
                              boardOrientation={boardOrientation}
                              customDarkSquareStyle={{ backgroundColor: '#779556' }}
                              customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                              arePiecesDraggable={true} 
                              onPieceDrop={onDrop}
                              onPieceDragBegin={onPieceDragBegin}
                              onSquareClick={handleSquareClick}
                              onPieceClick={(piece: string, square: string) => handleSquareClick(square)}
                              onSquareRightClick={() => { setClickedSquare(null); setOptionSquares({}); }}
                              customSquareStyles={{...optionSquares}}
                              animationDuration={200}
                          />
                        </div>
                    </div>
                    {/* نوار ارزیابی فشرده شده (ضخامت کمتر برای موبایل) */}
                    <div className="w-3.5 shrink-0 bg-[#262421] rounded overflow-hidden flex flex-col relative border border-[#35332e]">
                        <div className="w-full bg-[#35332e] transition-all duration-300 ease-out" style={{ height: `${100 - evalPercentage}%` }}></div>
                        <div className="w-full bg-zinc-200 transition-all duration-300 ease-out flex-1 flex flex-col justify-start items-center">
                            <span className="text-[7px] font-mono font-black text-zinc-800 rotate-90 mt-3 absolute">
                              {evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <EditablePlayer color={boardOrientation === 'white' ? 'w' : 'b'} data={boardOrientation === 'white' ? playerMeta.white : playerMeta.black} onUpdate={(d) => setPlayerMeta(p => ({...p, [boardOrientation === 'white' ? 'white' : 'black']: d}))} />
        </div>

        {/* ستون دوم: داشبورد هوش مصنوعی، کنترلرها و تب‌ها */}
        <div className="w-full flex-1 flex flex-col bg-[#161512] lg:border-r border-[#35332e] relative z-10">
            
            {/* کنترلرهای حرکتی و چرخش تخته (چسبیده به هم در یک ردیف فشرده) */}
            <div className="px-3 py-3 border-b border-[#35332e] flex items-center justify-between bg-[#1a1916]">
                <div className="flex bg-[#262421] rounded-lg border border-[#35332e] overflow-hidden shadow-inner">
                    <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-[#35332e] transition-colors"><Rewind size={18} /></button>
                    <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-[#35332e] transition-colors border-r border-[#35332e]/50"><SkipBack size={18} /></button>
                    <button className="p-2.5 text-white hover:text-farzin-accent hover:bg-[#35332e] transition-colors border-r border-[#35332e]/50"><SkipForward size={18} /></button>
                    <button className="p-2.5 text-white hover:text-farzin-accent hover:bg-[#35332e] transition-colors border-r border-[#35332e]/50"><FastForward size={18} /></button>
                </div>
                <button 
                  onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
                  className="p-2.5 bg-[#262421] border border-[#35332e] rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <RefreshCw size={18} />
                </button>
            </div>

            {/* داشبورد فشرده استوک‌فیش */}
            <div className="px-3 py-2 border-b border-[#35332e] bg-[#12110f]">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                        {!isReady ? <Loader2 size={12} className="text-amber-500 animate-spin" /> : <Cpu size={12} className={displayEngineStatus === 'reading books...' ? "text-sky-400 animate-pulse" : "text-farzin-accent animate-pulse"} />}
                        <span className="font-mono text-[10px] font-bold text-zinc-300" dir="ltr">{displayEngineStatus}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-farzin-accent/10 text-farzin-accent px-1.5 py-0.5 rounded border border-farzin-accent/20">
                      {evaluation > 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2)}
                    </span>
                </div>
                {/* نمایش خطی لاین برتر برای صرفه‌جویی در فضا تو موبایل */}
                <div className="text-[11px] font-mono text-zinc-500 truncate" dir="ltr">
                    {lines[0] ? lines[0].pv : '...'}
                </div>
            </div>

            {/* تب‌های سه‌گانه */}
            <div className="flex px-2 pt-2 border-b border-[#35332e] bg-[#1a1916] overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('notation')} className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'notation' ? 'border-farzin-accent text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                    <List size={16} /> ثبت حرکات
                </button>
                <button onClick={() => setActiveTab('graph')} className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'graph' ? 'border-sky-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                    <TrendingUp size={16} /> گراف ارزیابی
                </button>
                <button onClick={() => setActiveTab('explorer')} className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'explorer' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                    <BookOpen size={16} /> دیتابیس (گشایش)
                </button>
            </div>

            {/* محتوای تب‌ها (در قدم‌های بعدی تکمیل می‌شود) */}
            <div className="flex-1 overflow-y-auto bg-[#12110f] p-4 relative">
                {activeTab === 'notation' && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3 opacity-50">
                        <List size={32} />
                        <span className="text-sm">درخت واریانت‌ها در قدم بعدی اینجا رندر می‌شود...</span>
                    </div>
                )}
                {activeTab === 'graph' && (
                    <div className="flex flex-col items-center justify-center h-full text-sky-500/50 gap-3">
                        <TrendingUp size={32} />
                        <span className="text-sm">گراف موج‌دار در قدم بعدی رسم می‌شود...</span>
                    </div>
                )}
                {activeTab === 'explorer' && (
                    <div className="flex flex-col items-center justify-center h-full text-purple-500/50 gap-3">
                        <BookOpen size={32} />
                        <span className="text-sm">اتصال به Lichess Database به زودی...</span>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}