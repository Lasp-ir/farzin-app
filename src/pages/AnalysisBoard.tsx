import { useState, useEffect, useMemo, useCallback } from 'react';
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

// ساختار داده‌ای درخت با اضافه شدن عمق (Depth) برای محاسبه شماره حرکت
export interface MoveNode {
  id: string;
  san: string;
  fen: string;
  move: any;
  parentId: string | null;
  childrenIds: string[];
  depth: number;
}

const EditablePlayer = ({ color, data, onUpdate }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState(data);

  const handleSave = () => { onUpdate(tempData); setIsEditing(false); };

  return (
    <div className="w-full flex items-center justify-between px-2 py-1.5 bg-[#1e1c19]/50 rounded-xl border border-[#35332e]/50 my-1">
      <div className="flex items-center gap-3 w-full">
        <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center shadow-inner border ${color === 'w' ? 'bg-zinc-200 border-zinc-400 text-zinc-800' : 'bg-[#262421] border-[#403e3a] text-zinc-400'}`}>
          <User size={16} />
        </div>
        
        {isEditing ? (
          <div className="flex flex-col gap-1 w-full mr-2" dir="rtl">
            <input autoFocus className="bg-[#12110f] text-white text-xs px-2 py-1 rounded border border-farzin-accent outline-none" value={tempData.name} onChange={e => setTempData({...tempData, name: e.target.value})} placeholder="نام بازیکن"/>
            <div className="flex gap-2">
              <input className="bg-[#12110f] text-[10px] text-zinc-400 px-2 py-1 rounded border border-[#35332e] outline-none w-16" value={tempData.title} onChange={e => setTempData({...tempData, title: e.target.value})} placeholder="GM"/>
              <input className="bg-[#12110f] text-[10px] font-mono text-zinc-400 px-2 py-1 rounded border border-[#35332e] outline-none w-20" value={tempData.elo} onChange={e => setTempData({...tempData, elo: e.target.value})} placeholder="ریتینگ"/>
            </div>
          </div>
        ) : (
          <div className="flex flex-col mr-2 cursor-pointer group w-full" onClick={() => setIsEditing(true)}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white group-hover:text-farzin-accent transition-colors">{data.name || (color === 'w' ? 'بازیکن سفید' : 'بازیکن سیاه')}</span>
              <Edit2 size={10} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {data.title && data.title !== 'بدون تایتل' && (<span className={`text-[9px] font-black px-1.5 rounded ${color === 'w' ? 'text-sky-400 bg-sky-500/10' : 'text-rose-400 bg-rose-500/10'}`}>{data.title}</span>)}
              <span className="text-[10px] font-mono text-zinc-500">{data.elo || '---'}</span>
            </div>
          </div>
        )}
      </div>
      {isEditing && (<button onClick={handleSave} className="p-1.5 bg-farzin-accent/20 text-farzin-accent rounded-lg hover:bg-farzin-accent hover:text-white transition-colors ml-1"><Check size={14} /></button>)}
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

  const [playerMeta, setPlayerMeta] = useState({
    white: { name: initialData.meta?.whiteName || '', elo: initialData.meta?.whiteElo || '', title: initialData.meta?.whiteTitle || '' },
    black: { name: initialData.meta?.blackName || '', elo: initialData.meta?.blackElo || '', title: initialData.meta?.blackTitle || '' }
  });

  const [tree, setTree] = useState<Record<string, MoveNode>>({});
  const [currentNodeId, setCurrentNodeId] = useState<string>('root');
  
  const { isReady, engineStatus, evaluation, lines, analyze, stop } = useStockfish();

  useEffect(() => {
    const rootFen = initialData.type === 'FEN' ? initialData.data : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setTree({ 'root': { id: 'root', san: 'Start', fen: rootFen, move: null, parentId: null, childrenIds: [], depth: 0 } });
    setCurrentNodeId('root');
    setIsLoaded(true);
  }, []);

  const currentPosition = tree[currentNodeId]?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const activeGame = useMemo(() => new Chess(currentPosition), [currentPosition]);

  useEffect(() => {
    if (isReady && currentPosition) analyze(currentPosition, 24);
  }, [currentPosition, isReady, analyze]);

  const addMoveToTree = (moveParams: {from: string, to: string, promotion?: string}) => {
    try {
      const tempGame = new Chess(currentPosition);
      const move = tempGame.move(moveParams);
      if (!move) return false;

      const newFen = tempGame.fen();
      const newNodeId = `${currentNodeId}-${move.san}`; 

      setTree(prev => {
        if (prev[currentNodeId].childrenIds.includes(newNodeId)) return prev;

        const newNode: MoveNode = {
          id: newNodeId, san: move.san, fen: newFen, move: move,
          parentId: currentNodeId, childrenIds: [], depth: prev[currentNodeId].depth + 1
        };

        return { ...prev, [newNodeId]: newNode, [currentNodeId]: { ...prev[currentNodeId], childrenIds: [...prev[currentNodeId].childrenIds, newNodeId] } };
      });
      setCurrentNodeId(newNodeId);
      return true;
    } catch (e) { return false; }
  };

  // --- کنترلرهای درختی ---
  const prevMove = () => { const pid = tree[currentNodeId]?.parentId; if (pid) setCurrentNodeId(pid); };
  const nextMove = () => { const cids = tree[currentNodeId]?.childrenIds; if (cids && cids.length > 0) setCurrentNodeId(cids[0]); };
  const goStart = () => setCurrentNodeId('root');
  const goEnd = () => {
    let curr = currentNodeId;
    while (tree[curr]?.childrenIds?.length > 0) curr = tree[curr].childrenIds[0];
    setCurrentNodeId(curr);
  };

  // --- هندلرهای تخته ---
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
    setClickedSquare(sourceSquare); highlightLegalMoves(sourceSquare);
  };

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    setOptionSquares({}); setClickedSquare(null);
    return addMoveToTree({ from: sourceSquare, to: targetSquare, promotion: piece[1]?.toLowerCase() ?? 'q' });
  };

  const handleSquareClick = (square: string) => {
    if (clickedSquare === square) { setClickedSquare(null); setOptionSquares({}); return; }
    if (clickedSquare) {
      if (activeGame.moves({ square: clickedSquare as any, verbose: true }).find(m => m.to === square)) {
        addMoveToTree({ from: clickedSquare, to: square, promotion: 'q' });
        setClickedSquare(null); setOptionSquares({}); return;
      }
    }
    const pieceOnSquare = activeGame.get(square as any);
    if (pieceOnSquare && pieceOnSquare.color === activeGame.turn()) {
      setClickedSquare(square); highlightLegalMoves(square);
    } else { setClickedSquare(null); setOptionSquares({}); }
  };

  const moveSquares = useMemo(() => {
    const node = tree[currentNodeId];
    if (!node || node.id === 'root' || !node.move) return {};
    return { [node.move.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [node.move.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } };
  }, [tree, currentNodeId]);

  const evalPercentage = useMemo(() => Math.max(5, Math.min(95, 50 + (evaluation * 10))), [evaluation]);
  const isOpeningPhase = currentNodeId === 'root' || (Object.keys(tree).length < 15);
  const displayEngineStatus = (isOpeningPhase && activeTab === 'explorer') ? 'reading books...' : (isReady ? `Farzin 1.0 (NNUE)` : engineStatus);

  // --- الگوریتم رندر درخت حرکات عین لیچس ---
  const renderTreeNodes = useCallback((nodeId: string, forceShowMoveNumber: boolean = false): React.ReactNode[] => {
    const node = tree[nodeId];
    if (!node || node.childrenIds.length === 0) return [];

    const result: React.ReactNode[] = [];
    const mainChildId = node.childrenIds[0];
    const mainChild = tree[mainChildId];

    const moveNum = Math.ceil(mainChild.depth / 2);
    const isWhite = mainChild.depth % 2 !== 0;
    
    let prefix = '';
    if (isWhite) prefix = `${moveNum}. `;
    else if (forceShowMoveNumber) prefix = `${moveNum}... `;

    result.push(
      <span 
        key={mainChildId} onClick={() => setCurrentNodeId(mainChildId)}
        className={`cursor-pointer px-1 py-0.5 mx-[1px] rounded transition-all duration-200 ${currentNodeId === mainChildId ? 'bg-farzin-accent text-white font-black shadow-[0_0_8px_rgba(119,149,86,0.6)]' : 'text-zinc-300 hover:bg-[#262421]'}`}
      >
        {prefix}{mainChild.san}
      </span>
    );

    // پردازش واریانت‌ها
    if (node.childrenIds.length > 1) {
      for (let i = 1; i < node.childrenIds.length; i++) {
        const varId = node.childrenIds[i];
        const varChild = tree[varId];
        const varIsWhite = varChild.depth % 2 !== 0;
        const varMoveNum = Math.ceil(varChild.depth / 2);
        const varPrefix = varIsWhite ? `${varMoveNum}. ` : `${varMoveNum}... `;

        result.push(
          <span key={`${varId}-wrap`} className="text-zinc-500 mx-1 inline-flex items-baseline flex-wrap bg-[#1a1916] px-1.5 py-0.5 rounded-lg border border-[#35332e]/50 text-xs">
            (
            <span 
              onClick={() => setCurrentNodeId(varId)}
              className={`cursor-pointer px-1 py-0.5 rounded transition-colors ${currentNodeId === varId ? 'text-white font-bold' : 'hover:text-zinc-300'}`}
            >
              {varPrefix}{varChild.san}
            </span>
            <span className="ml-1">{renderTreeNodes(varId, !varIsWhite)}</span>
            )
          </span>
        );
      }
      result.push(<span key={`space-${mainChildId}`} className="ml-0.5"></span>);
      result.push(...renderTreeNodes(mainChildId, !isWhite)); // اگر حرکت اصلی سفید بوده، برای حرکت بعدی سیاه باید شماره حرکت (مثل 1... e5) گذاشته بشه
    } else {
      result.push(<span key={`space-${mainChildId}`} className="ml-0.5"></span>);
      result.push(...renderTreeNodes(mainChildId, false));
    }

    return result;
  }, [tree, currentNodeId]);


  return (
    <div className="min-h-screen bg-[#100f0d] text-zinc-200 flex flex-col font-sans" dir="rtl" onContextMenu={e => {e.preventDefault(); setClickedSquare(null); setOptionSquares({});}}>
      
      <div className={`w-full px-4 py-3 flex items-center justify-between z-10 bg-[#161512] border-b border-[#35332e] transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={() => navigate(-1)} className="p-2 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] transition-colors text-zinc-400"><ChevronRight size={20} /></button>
        <div className="flex flex-col items-center">
            <h1 className="font-black text-base text-white flex items-center gap-2">
              <Activity size={16} className="text-farzin-accent" /> آزمایشگاه فرزین
            </h1>
        </div>
        <div className="flex gap-2">
            <button className="p-2 bg-[#1e1c19] border border-[#35332e] rounded-xl hover:bg-[#262421] text-zinc-400"><Share2 size={18}/></button>
        </div>
      </div>

      {/* 🚀 انجین داشبورد - منتقل شد به بالای صفحه با استایل گلس‌مورفیسم */}
      <div className={`w-full px-4 py-2.5 bg-gradient-to-b from-[#1a1916] to-[#12110f] border-b border-[#35332e] shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative z-20 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 bg-[#262421] px-2 py-1 rounded-md border border-[#35332e]">
                  {!isReady ? <Loader2 size={12} className="text-amber-500 animate-spin" /> : <Zap size={12} className={displayEngineStatus === 'reading books...' ? "text-sky-400 animate-pulse" : "text-amber-400 animate-pulse"} />}
                  <span className="font-mono text-[10px] font-bold text-zinc-300" dir="ltr">{displayEngineStatus}</span>
                  {lines[0] && <span className="text-[10px] text-zinc-500 font-mono ml-1 border-l border-[#35332e] pl-2">D{lines[0].depth}</span>}
              </div>
              <span className={`text-xs font-mono font-black px-2 py-0.5 rounded border ${evaluation > 0 ? 'bg-farzin-accent/10 text-farzin-accent border-farzin-accent/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {evaluation > 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2)}
              </span>
          </div>
          <div className="text-xs font-mono text-zinc-400 truncate leading-relaxed bg-[#1e1c19] px-3 py-1.5 rounded-lg border border-[#35332e] shadow-inner" dir="ltr">
              {lines[0] ? <span className="text-white font-bold">{lines[0].pv.split(' ')[0]} <span className="text-zinc-500 font-normal">{lines[0].pv.substring(lines[0].pv.indexOf(' ') + 1)}</span></span> : 'آماده به کار...'}
          </div>
      </div>

      <div className={`w-full flex-1 flex flex-col lg:flex-row lg:overflow-hidden transition-opacity duration-700 delay-100 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* ستون تخته */}
        <div className="w-full lg:max-w-[45vw] lg:h-full flex flex-col px-3 py-2 shrink-0">
            <EditablePlayer color={boardOrientation === 'white' ? 'b' : 'w'} data={boardOrientation === 'white' ? playerMeta.black : playerMeta.white} onUpdate={(d: any) => setPlayerMeta(p => ({...p, [boardOrientation === 'white' ? 'black' : 'white']: d}))} />
            
            <div className="w-full flex justify-center py-1">
                <div className="flex w-full max-w-[600px] aspect-square gap-1.5" dir="ltr">
                    <div className="flex-1 bg-[#262421] p-1.5 rounded-xl border border-[#35332e] shadow-2xl relative">
                        <div className="w-full h-full rounded-md overflow-hidden">
                          <Chessboard 
                              position={currentPosition} boardOrientation={boardOrientation}
                              customDarkSquareStyle={{ backgroundColor: '#779556' }} customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                              arePiecesDraggable={true} onPieceDrop={onDrop} onPieceDragBegin={onPieceDragBegin}
                              onSquareClick={handleSquareClick} onPieceClick={(piece: string, square: string) => handleSquareClick(square)}
                              onSquareRightClick={() => { setClickedSquare(null); setOptionSquares({}); }}
                              customSquareStyles={{...moveSquares, ...optionSquares}} animationDuration={200}
                          />
                        </div>
                    </div>
                    {/* نوار ارزیابی */}
                    <div className="w-4 shrink-0 bg-[#262421] rounded-lg overflow-hidden flex flex-col relative border border-[#35332e] shadow-inner">
                        <div className="w-full bg-[#35332e] transition-all duration-300 ease-out" style={{ height: `${100 - evalPercentage}%` }}></div>
                        <div className="w-full bg-zinc-200 transition-all duration-300 ease-out flex-1 flex flex-col justify-start items-center">
                            <span className="text-[8px] font-mono font-black text-zinc-800 rotate-90 mt-4 absolute">{evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <EditablePlayer color={boardOrientation === 'white' ? 'w' : 'b'} data={boardOrientation === 'white' ? playerMeta.white : playerMeta.black} onUpdate={(d: any) => setPlayerMeta(p => ({...p, [boardOrientation === 'white' ? 'white' : 'black']: d}))} />
        </div>

        {/* ستون کنترلرها و تب‌ها */}
        <div className="w-full flex-1 flex flex-col bg-[#161512] lg:border-r border-[#35332e] relative z-10">
            
            <div className="px-3 py-3 border-b border-[#35332e] flex items-center justify-between bg-[#1a1916]">
                <div className="flex bg-[#262421] rounded-lg border border-[#35332e] overflow-hidden shadow-sm">
                    <button onClick={goStart} className="p-3 text-zinc-400 hover:text-white hover:bg-[#35332e] transition-colors"><Rewind size={18} /></button>
                    <button onClick={prevMove} className="p-3 text-zinc-400 hover:text-white hover:bg-[#35332e] transition-colors border-r border-[#35332e]/50"><SkipBack size={18} /></button>
                    <button onClick={nextMove} className="p-3 text-white hover:text-farzin-accent hover:bg-[#35332e] transition-colors border-r border-[#35332e]/50"><SkipForward size={18} /></button>
                    <button onClick={goEnd} className="p-3 text-white hover:text-farzin-accent hover:bg-[#35332e] transition-colors border-r border-[#35332e]/50"><FastForward size={18} /></button>
                </div>
                <button onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')} className="p-3 bg-[#262421] border border-[#35332e] rounded-lg text-zinc-400 hover:text-white transition-colors active:scale-95"><RefreshCw size={18} /></button>
            </div>

            <div className="flex px-2 pt-2 border-b border-[#35332e] bg-[#1a1916] overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('notation')} className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'notation' ? 'border-farzin-accent text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><List size={16} /> ثبت حرکات</button>
                <button onClick={() => setActiveTab('graph')} className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'graph' ? 'border-sky-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><TrendingUp size={16} /> گراف ارزیابی</button>
                <button onClick={() => setActiveTab('explorer')} className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'explorer' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><BookOpen size={16} /> دیتابیس (گشایش)</button>
            </div>

            {/* محتوای تب‌ها */}
            <div className="flex-1 overflow-y-auto bg-[#12110f] p-4 relative custom-scrollbar">
                {activeTab === 'notation' && (
                    <AnimatePresence mode="wait">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[15px] font-mono leading-loose" dir="ltr">
                            {Object.keys(tree).length <= 1 ? (
                              <div className="flex flex-col items-center justify-center mt-10 text-zinc-600 gap-3">
                                  <List size={32} className="opacity-50" />
                                  <span className="text-sm font-sans">هیچ حرکتی ثبت نشده است</span>
                              </div>
                            ) : (
                              renderTreeNodes('root')
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
                {activeTab === 'graph' && (
                    <div className="flex flex-col items-center justify-center h-full text-sky-500/50 gap-3"><TrendingUp size={32} /><span className="text-sm font-sans">گراف در مرحله بعدی رسم می‌شود...</span></div>
                )}
                {activeTab === 'explorer' && (
                    <div className="flex flex-col items-center justify-center h-full text-purple-500/50 gap-3"><BookOpen size={32} /><span className="text-sm font-sans">اتصال به دیتابیس لیچس به زودی...</span></div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}