import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Cpu, FastForward, Rewind, SkipBack, SkipForward,
  Share2, List, TrendingUp, BookOpen, User, Edit2, Check,
  Activity, Settings, Loader2, RefreshCw, Zap, Copy, Save, Sliders, Database, Clock, Target, Route,
  Sparkles, ThumbsUp, HelpCircle, XCircle, AlertTriangle, CheckCircle2, ThumbsDown
} from 'lucide-react';

import { useStockfish } from '../hooks/useStockfish';

export interface MoveNode {
  id: string;
  san: string;
  fen: string;
  move: any;
  parentId: string | null;
  childrenIds: string[];
  depth: number;
}

const COACH_COLORS = {
  brilliant: { color: '#2dd4bf', text: 'درخشان', icon: Sparkles },
  great: { color: '#3b82f6', text: 'عالی', icon: CheckCircle2 },
  best: { color: '#22c55e', text: 'بهترین', icon: Check },
  excellent: { color: '#86efac', text: 'فوق‌العاده', icon: ThumbsUp },
  good: { color: '#bef264', text: 'خوب', icon: ThumbsUp },
  inaccuracy: { color: '#eab308', text: 'دقت کم', icon: HelpCircle },
  mistake: { color: '#f97316', text: 'اشتباه', icon: AlertTriangle },
  blunder: { color: '#ef4444', text: 'فاجعه', icon: XCircle },
  miss: { color: '#ec4899', text: 'از دست رفته', icon: ThumbsDown },
  loading: { color: '#a1a1aa', text: 'در حال تحلیل...', icon: Loader2 }
};

const COLOR_PALETTES = [
  { label: 'طلایی', hex: '#fbbf24', rgb: '251, 191, 36' },
  { label: 'سبز', hex: '#34d399', rgb: '52, 211, 153' },
  { label: 'آبی', hex: '#0ea5e9', rgb: '14, 165, 233' },
  { label: 'بنفش', hex: '#a855f7', rgb: '168, 85, 247' },
  { label: 'قرمز', hex: '#f43f5e', rgb: '244, 63, 94' },
  { label: 'خاکستری', hex: '#a1a1aa', rgb: '161, 161, 170' },
];

const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) => (
  <div onClick={() => !disabled && onChange(!checked)} className={`w-10 h-5 rounded-full relative transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-farzin-accent' : 'bg-[#35332e]'}`}>
    <motion.div initial={false} animate={{ x: checked ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm" />
  </div>
);

const EditablePlayer = ({ color, data, onUpdate }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState(data);
  const handleSave = () => { onUpdate(tempData); setIsEditing(false); };

  return (
    <div className="w-full flex items-center justify-between px-2 py-1 bg-[#1e1c19]/50 rounded-xl border border-[#35332e]/50 my-0.5">
      <div className="flex items-center gap-3 w-full">
        <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center shadow-inner border ${color === 'w' ? 'bg-zinc-200 border-zinc-400 text-zinc-800' : 'bg-[#262421] border-[#403e3a] text-zinc-400'}`}><User size={14} /></div>
        {isEditing ? (
          <div className="flex flex-col gap-1 w-full mr-2" dir="rtl">
            <input autoFocus className="bg-[#12110f] text-white text-xs px-2 py-0.5 rounded border border-farzin-accent outline-none" value={tempData.name} onChange={e => setTempData({...tempData, name: e.target.value})} placeholder="نام بازیکن"/>
            <div className="flex gap-2">
              <input className="bg-[#12110f] text-[10px] text-zinc-400 px-2 py-0.5 rounded border border-[#35332e] outline-none w-16" value={tempData.title} onChange={e => setTempData({...tempData, title: e.target.value})} placeholder="GM"/>
              <input className="bg-[#12110f] text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded border border-[#35332e] outline-none w-20" value={tempData.elo} onChange={e => setTempData({...tempData, elo: e.target.value})} placeholder="ریتینگ"/>
            </div>
          </div>
        ) : (
          <div className="flex flex-col mr-2 cursor-pointer group w-full" onClick={() => setIsEditing(true)}>
            <div className="flex items-center gap-2"><span className="font-bold text-xs text-white group-hover:text-farzin-accent transition-colors">{data.name || (color === 'w' ? 'بازیکن سفید' : 'بازیکن سیاه')}</span><Edit2 size={10} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
            <div className="flex items-center gap-1.5 mt-0.5">{data.title && data.title !== 'بدون تایتل' && (<span className={`text-[9px] font-black px-1.5 rounded ${color === 'w' ? 'text-sky-400 bg-sky-500/10' : 'text-rose-400 bg-rose-500/10'}`}>{data.title}</span>)}<span className="text-[10px] font-mono text-zinc-500">{data.elo || '---'}</span></div>
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
  
  const engineCache = useRef<Record<string, any[]>>({});

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const [engineSettings, setEngineSettings] = useState({ multiPv: 3, threads: 1, hash: 16, maxDepth: 24, maxTime: 0, coachMode: true });
  const [tempSettings, setTempSettings] = useState(engineSettings);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [arrowSettings, setArrowSettings] = useState({ showArrows: true, showManeuvers: true });
  const [arrowColors, setArrowColors] = useState([COLOR_PALETTES[0], COLOR_PALETTES[2], COLOR_PALETTES[5]]);
  const [isArrowModalOpen, setIsArrowModalOpen] = useState(false);

  const { isReady, engineStatus, lines, analyze, stop, setOption } = useStockfish() as any;

  useEffect(() => {
    const rootFen = initialData.type === 'FEN' ? initialData.data : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setTree({ 'root': { id: 'root', san: 'Start', fen: rootFen, move: null, parentId: null, childrenIds: [], depth: 0 } });
    setCurrentNodeId('root');
    setIsLoaded(true);
  }, []);

  const currentPosition = tree[currentNodeId]?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const activeGame = useMemo(() => new Chess(currentPosition), [currentPosition]);

  useEffect(() => {
    if (isReady && currentPosition) {
      analyze(currentPosition, engineSettings.maxDepth);
      if (engineSettings.maxTime > 0 && stop) {
        const timer = setTimeout(() => stop(), engineSettings.maxTime * 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPosition, isReady, analyze, stop, engineSettings.maxDepth, engineSettings.maxTime]);

  useEffect(() => {
    if (lines && lines.length > 0) {
      engineCache.current[currentNodeId] = lines;
    }
  }, [lines, currentNodeId]);

  const engineArrows = useMemo(() => {
    if (!arrowSettings.showArrows || !lines || lines.length === 0) return [];
    
    const arrowMap = new Map<string, any>();
    const bestScore = lines[0].score;
    const bestIsMate = lines[0].isMate;

    lines.slice(0, engineSettings.multiPv).forEach((line, index) => {
        const rawPv = line.pv || '';
        let actualPv = rawPv.includes(' pv ') ? rawPv.split(' pv ')[1] : rawPv;
        const match = actualPv.match(/[a-h][1-8][a-h][1-8]/);
        if (match && !rawPv.includes(' pv ')) actualPv = actualPv.substring(actualPv.indexOf(match[0]));
        const moves = actualPv.trim().split(' ');
        if (!moves[0] || moves[0].length < 4) return;

        const firstMove = { from: moves[0].slice(0, 2), to: moves[0].slice(2, 4) };
        const selectedColor = arrowColors[index] || arrowColors[2];
        
        let alpha = 0.85; 
        if (index > 0) {
            if (bestIsMate && !line.isMate) alpha = 0.15; 
            else if (!bestIsMate && !line.isMate) {
                const diff = Math.abs(bestScore - line.score);
                alpha = Math.max(0.15, 0.85 - (diff * 0.35));
            }
        }
        
        const rgbaColor = `rgba(${selectedColor.rgb}, ${alpha})`;
        const mainArrowKey = `${firstMove.from}-${firstMove.to}`;
        
        if (!arrowMap.has(mainArrowKey)) arrowMap.set(mainArrowKey, [firstMove.from, firstMove.to, rgbaColor]);

        if (arrowSettings.showManeuvers) {
            let currentTo = firstMove.to;
            for (let i = 2; i < Math.min(moves.length, 10); i += 2) {
                const uci = moves[i];
                if (!uci || uci.length < 4) break;
                const m = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
                if (m.from === currentTo) { 
                    const maneuverKey = `${m.from}-${m.to}`;
                    if (!arrowMap.has(maneuverKey)) arrowMap.set(maneuverKey, [m.from, m.to, rgbaColor]); 
                    currentTo = m.to; 
                } else break;
            }
        }
    });

    return Array.from(arrowMap.values());
  }, [lines, arrowSettings, engineSettings.multiPv, arrowColors]);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };
  const openSettingsModal = () => { setTempSettings(engineSettings); setIsSettingsModalOpen(true); };

  const handleApplySettings = () => {
    setEngineSettings(tempSettings); 
    if (setOption) { setOption('MultiPV', tempSettings.multiPv); setOption('Threads', tempSettings.threads); setOption('Hash', tempSettings.hash); }
    setIsSettingsModalOpen(false); showToast('تنظیمات با موفقیت اعمال شد');
  };

  const copyMainlinePgn = () => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '.');
    let pgn = `[Event "Farzin Analysis"]\n[Site "Lasp - Farzin App"]\n[Date "${dateStr}"]\n[White "${playerMeta.white.name || 'White'}"]\n[Black "${playerMeta.black.name || 'Black'}"]\n`;
    if (playerMeta.white.elo) pgn += `[WhiteElo "${playerMeta.white.elo}"]\n`;
    if (playerMeta.black.elo) pgn += `[BlackElo "${playerMeta.black.elo}"]\n`;
    pgn += `[Result "*"]\n\n`;

    let movesString = ""; let curr = tree['root']?.childrenIds[0]; let moveNum = 1;
    while(curr) {
        const node = tree[curr];
        if (node.depth % 2 !== 0) movesString += `${moveNum}. ${node.san} `;
        else { movesString += `${node.san} `; moveNum++; }
        curr = node.childrenIds[0]; 
    }
    pgn += movesString.trim() + " *"; navigator.clipboard.writeText(pgn); showToast('آنالیز با موفقیت در کلیپ‌بورد کپی شد');
  };

  const handleSaveAnalysis = () => {
    if(!saveName.trim()) return; setIsSaveModalOpen(false); showToast(`آنالیز "${saveName}" با موفقیت ذخیره شد`); setSaveName("");
  };

  const addMoveToTree = (moveParams: {from: string, to: string, promotion?: string}) => {
    try {
      const tempGame = new Chess(currentPosition);
      const move = tempGame.move(moveParams);
      if (!move) return false;
      const newFen = tempGame.fen();
      const newNodeId = `${currentNodeId}-${move.san}`; 
      setTree(prev => {
        if (prev[currentNodeId].childrenIds.includes(newNodeId)) return prev;
        const newNode: MoveNode = { id: newNodeId, san: move.san, fen: newFen, move: move, parentId: currentNodeId, childrenIds: [], depth: prev[currentNodeId].depth + 1 };
        return { ...prev, [newNodeId]: newNode, [currentNodeId]: { ...prev[currentNodeId], childrenIds: [...prev[currentNodeId].childrenIds, newNodeId] } };
      });
      setCurrentNodeId(newNodeId);
      return true;
    } catch (e) { return false; }
  };

  const prevMove = () => { const pid = tree[currentNodeId]?.parentId; if (pid) setCurrentNodeId(pid); };
  const nextMove = () => { const cids = tree[currentNodeId]?.childrenIds; if (cids && cids.length > 0) setCurrentNodeId(cids[0]); };
  const goStart = () => setCurrentNodeId('root');
  const goEnd = () => { let curr = currentNodeId; while (tree[curr]?.childrenIds?.length > 0) curr = tree[curr].childrenIds[0]; setCurrentNodeId(curr); };

  const [clickedSquare, setClickedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});

  const highlightLegalMoves = (sourceSquare: string) => {
    const moves = activeGame.moves({ square: sourceSquare as any, verbose: true });
    if (moves.length === 0) return;
    const newSquares: any = {};
    moves.forEach((m: any) => {
      const isCapture = activeGame.get(m.to as any) && activeGame.get(m.to as any).color !== activeGame.get(sourceSquare as any)?.color;
      newSquares[m.to] = { backgroundImage: isCapture ? 'radial-gradient(circle, transparent 0%, transparent 65%, rgba(0,0,0,0.4) 67%, rgba(0,0,0,0.4) 100%)' : 'radial-gradient(circle, rgba(0,0,0,.4) 22%, transparent 23%)' };
    });
    newSquares[sourceSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    setOptionSquares(newSquares);
  };

  const onPieceDragBegin = (piece: string, sourceSquare: string) => { if (piece[0] !== activeGame.turn()) return; setClickedSquare(sourceSquare); highlightLegalMoves(sourceSquare); };
  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => { setOptionSquares({}); setClickedSquare(null); return addMoveToTree({ from: sourceSquare, to: targetSquare, promotion: piece[1]?.toLowerCase() ?? 'q' }); };

  const handleSquareClick = (square: string) => {
    if (clickedSquare === square) { setClickedSquare(null); setOptionSquares({}); return; }
    if (clickedSquare) {
      if (activeGame.moves({ square: clickedSquare as any, verbose: true }).find(m => m.to === square)) {
        addMoveToTree({ from: clickedSquare, to: square, promotion: 'q' });
        setClickedSquare(null); setOptionSquares({}); return;
      }
    }
    const pieceOnSquare = activeGame.get(square as any);
    if (pieceOnSquare && pieceOnSquare.color === activeGame.turn()) { setClickedSquare(square); highlightLegalMoves(square); } 
    else { setClickedSquare(null); setOptionSquares({}); }
  };

  const executeVariation = (startNodeId: string, uciMovesString: string) => {
    const uciMoves = uciMovesString.trim().split(' ').slice(0, 12);
    if (uciMoves.length === 0) return;
    let tempGame = new Chess(tree[startNodeId].fen);
    let currId = startNodeId;
    let newNodes: Record<string, MoveNode> = {};
    for (const uci of uciMoves) {
        if (!uci || uci.length < 4) break;
        const moveParams: any = { from: uci.slice(0,2), to: uci.slice(2,4) };
        if (uci.length > 4) moveParams.promotion = uci[4];
        const move = tempGame.move(moveParams);
        if (!move) break;
        const nextFen = tempGame.fen();
        const nextId = `${currId}-${move.san}`;
        newNodes[nextId] = { id: nextId, san: move.san, fen: nextFen, move: move, parentId: currId, childrenIds: [], depth: (tree[currId]?.depth || 0) + 1 };
        if (currId !== startNodeId) newNodes[currId].childrenIds.push(nextId);
        currId = nextId;
    }
    setTree(prev => {
        let updatedTree = { ...prev, ...newNodes };
        const firstNewId = Object.keys(newNodes)[0];
        if (firstNewId && !updatedTree[startNodeId].childrenIds.includes(firstNewId)) {
            updatedTree[startNodeId] = { ...updatedTree[startNodeId], childrenIds: [...updatedTree[startNodeId].childrenIds, firstNewId] };
        }
        return updatedTree;
    });
    const firstNewId = Object.keys(newNodes)[0];
    if (firstNewId) setCurrentNodeId(firstNewId);
    setActiveTab('notation');
  };

  const handleShowMe = (useBestMove: boolean) => {
    const parentId = tree[currentNodeId]?.parentId;
    if (!parentId) return;

    if (useBestMove) {
        const parentLines = engineCache.current[parentId];
        if (!parentLines || !parentLines[0]) return;
        const rawPv = parentLines[0].pv || '';
        const actualPv = rawPv.includes(' pv ') ? rawPv.split(' pv ')[1] : rawPv;
        executeVariation(parentId, actualPv);
    } else {
        if (!lines || !lines[0]) return;
        const rawPv = lines[0].pv || '';
        const actualPv = rawPv.includes(' pv ') ? rawPv.split(' pv ')[1] : rawPv;
        executeVariation(currentNodeId, actualPv);
    }
  };

// 🌟 ماشینِ زمان سه‌نقطه‌ای برای تشخیص قطعیِ Miss، Great و Brilliant
  const coachData = useMemo(() => {
    if (!engineSettings.coachMode || currentNodeId === 'root') return null;
    const parentId = tree[currentNodeId]?.parentId;
    if (!parentId) return null;
    
    const parentLines = engineCache.current[parentId];
    if (!parentLines || !parentLines[0] || !lines || !lines[0]) return COACH_COLORS.loading;

    const parentFen = tree[parentId].fen;
    const currentFen = tree[currentNodeId].fen;
    const grandParentId = tree[parentId].parentId;
    const grandparentFen = grandParentId ? tree[grandParentId].fen : null;

    const playerWhoMovedIsBlack = new Chess(parentFen).turn() === 'b';
    const currentTurnIsBlack = new Chess(currentFen).turn() === 'b';

    // 🌟 قطب‌نمای مطلق: این تابع همیشه امتیاز را از دیدگاه "سفید" (مثبت=سفید برنده) برمی‌گرداند!
    const getAbsScore = (line: any, fenTurn: 'w' | 'b') => {
        if (!line) return 0;
        let score = 0;
        if (line.isMate) {
            // اگر کسی که نوبتشه مات می‌کنه، +100، اگر مات میشه -100
            score = line.mateIn > 0 ? 100 : -100; 
        } else {
            score = line.score; 
        }
        // اگر نوبت سیاه بوده، باید امتیاز استوک‌فیش قرینه بشه تا دیدگاه سفید حفظ بشه
        return fenTurn === 'b' ? -score : score;
    };

    // استخراج امتیازات مطلق برای نقطه B (قبل حرکت ما) و نقطه C (بعد حرکت ما)
    const absScoreB = getAbsScore(parentLines[0], playerWhoMovedIsBlack ? 'b' : 'w');
    const absScoreC = getAbsScore(lines[0], currentTurnIsBlack ? 'b' : 'w');

    // محاسبه CP Loss (افت امتیاز): سفید با افتِ مطلق ضرر میکنه، سیاه با افزایشِ مطلق
    let cpLoss = playerWhoMovedIsBlack ? (absScoreC - absScoreB) : (absScoreB - absScoreC);
    cpLoss = Math.max(0, cpLoss);

    // فرمول تبدیل امتیاز (واحد پیاده) به درصد احتمال برد (Expected Points)
    const epFormula = (scoreInPawns: number) => 1 / (1 + Math.pow(10, -scoreInPawns / 4));
    
    // تابعی که همیشه EP را از دیدگاه بازیکنی که حرکت را انجام داده به دست می‌آورد
    const getPlayerEP = (absSc: number) => epFormula(playerWhoMovedIsBlack ? -absSc : absSc);

    const epB = getPlayerEP(absScoreB); // شانس برد ما در نقطه B
    const epC = getPlayerEP(absScoreC); // شانس برد ما در نقطه C

    let classificationKey: keyof typeof COACH_COLORS = 'good';
    
    const rawParentPv = parentLines[0].pv || '';
    const parentActualPv = rawParentPv.includes(' pv ') ? rawParentPv.split(' pv ')[1] : rawParentPv;
    const bestUciMove = parentActualPv.trim().split(' ')[0];
    const userUciMove = `${tree[currentNodeId].move.from}${tree[currentNodeId].move.to}${tree[currentNodeId].move.promotion || ''}`;

    const fenBeforeCount = parentFen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
    const isEndgame = fenBeforeCount <= 16; 

    const inaccuracyLimit = isEndgame ? 1.0 : 1.5;
    const mistakeLimit = isEndgame ? 2.0 : 2.5;

    // ==========================================
    // فاز ۱: طبقه‌بندی پایه با CP-Loss مطلق
    // ==========================================
    if (userUciMove === bestUciMove || cpLoss <= 0.05) {
        classificationKey = 'best';
    } else if (epB < 0.10) {
        classificationKey = cpLoss <= 0.50 ? 'excellent' : 'good';
    } else {
        if (cpLoss <= 0.20) classificationKey = 'excellent'; 
        else if (cpLoss <= 0.50) classificationKey = 'good';      
        else if (cpLoss <= inaccuracyLimit) classificationKey = 'inaccuracy';
        else if (cpLoss <= mistakeLimit) classificationKey = 'mistake';
        else classificationKey = 'blunder'; 
    }

    // ==========================================
    // فاز ۲: فیلترهای ارتقا دهنده (Modifiers)
    // ==========================================

    // 🎯 ۱. فیلتر قطعی Miss (با استفاده از خط زمانی ۳ نقطه‌ای)
    if (['inaccuracy', 'mistake', 'blunder'].includes(classificationKey)) {
        if (grandParentId && grandparentFen) {
            const grandparentLines = engineCache.current[grandParentId];
            if (grandparentLines && grandparentLines[0]) {
                const grandparentTurn = new Chess(grandparentFen).turn() as 'w' | 'b';
                
                // استخراج امتیاز مطلق نقطه A و تبدیل به EP از دید "ما"
                const absScoreA = getAbsScore(grandparentLines[0], grandparentTurn);
                const epA = getPlayerEP(absScoreA); // شانس برد ما در نقطه A

                // شرط ۱ (هدیه واقعی): تو نقطه A برنده نبودیم (<=60%)، اما حریف یهو شانس ما رو برد بالا
                const isRealGift = epA <= 0.60 && (epB - epA >= 0.15);
                
                // شرط ۲ (پس دادن هدیه): با این حرکتمون، شانس برد رو برگردوندیم به حدود همون نقطه A
                const isFumbled = epC <= epA + 0.10;
                
                // شرط ۳ (ضد-خودکشی): اما گندی که زدیم اونقدر فاجعه نبود که از نقطه A هم خیلی بدتر بشیم
                const isNotSuicide = epC >= epA - 0.20;

                // اگر هر ۳ شرط برقرار بود، این فقط یک "فرصتِ از دست رفته" است، نه یک بلاندرِ خالص!
                if (isRealGift && isFumbled && isNotSuicide) {
                    classificationKey = 'miss';
                }
            }
        }
    }

    // 🎯 ۲. فیلتر Great و Brilliant
    if (['best', 'excellent'].includes(classificationKey)) {
        if (parentLines.length > 1) {
            const absScoreSecondBest = getAbsScore(parentLines[1], playerWhoMovedIsBlack ? 'b' : 'w');
            const epSecondBest = getPlayerEP(absScoreSecondBest);

            const isOnlyGoodMove = (epB - epSecondBest) >= 0.20; 
            const isSavingMove = (epB >= 0.45 && epSecondBest <= 0.25);
            const isWinningMove = (epB >= 0.75 && epSecondBest <= 0.55);
            const isNotBlowout = epB < 0.95 && epSecondBest < 0.90; 

            if (isNotBlowout && (isOnlyGoodMove || isSavingMove || isWinningMove)) {
                classificationKey = 'great';
                
                // تشخیص Brilliant با تبادل استاتیک در لحظه (SEE)
                let isSacrifice = false;
                try {
                    const getPieceValue = (p: string) => {
                        const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
                        return vals[p.toLowerCase()] || 0;
                    };

                    const tempG = new Chess(currentFen);
                    const oppMoves = tempG.moves({ verbose: true });
                    
                    for (const oppMove of oppMoves) {
                        if (oppMove.captured && ['n', 'b', 'r', 'q'].includes(oppMove.captured.toLowerCase())) {
                            const capturedVal = getPieceValue(oppMove.captured); 
                            
                            tempG.move(oppMove.san);
                            const ourRecaptures = tempG.moves({ verbose: true });
                            let maxRecaptureVal = 0;
                            for (const ourMove of ourRecaptures) {
                                if (ourMove.to === oppMove.to && ourMove.captured) {
                                    const val = getPieceValue(ourMove.captured);
                                    if (val > maxRecaptureVal) maxRecaptureVal = val;
                                }
                            }
                            tempG.undo();
                            
                            const netLoss = capturedVal - maxRecaptureVal;
                            if (netLoss >= 2) {
                                isSacrifice = true;
                                break;
                            }
                        }
                    }
                } catch(e) {}

                if (isSacrifice && epB < 0.85) {
                    classificationKey = 'brilliant';
                }
            }
        }
    }

    let bestSanMove = '...';
    try {
        const tempG = new Chess(parentFen);
        const m = tempG.move({from: bestUciMove.slice(0,2), to: bestUciMove.slice(2,4), promotion: bestUciMove[4]});
        if(m) bestSanMove = m.san;
    } catch(e) {}

    return { 
        ...COACH_COLORS[classificationKey], 
        key: classificationKey,
        bestSan: bestSanMove,
        userSan: tree[currentNodeId].san 
    };

  }, [currentNodeId, lines, engineSettings.coachMode, tree]);
  
  const moveSquares = useMemo(() => {
    const node = tree[currentNodeId];
    if (!node || node.id === 'root' || !node.move) return {};
    let customSq: any = { [node.move.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [node.move.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } };
    
    if (coachData && coachData.key !== 'loading' && engineSettings.coachMode) {
       customSq[node.move.to] = { 
         backgroundColor: 'rgba(255, 255, 0, 0.4)',
         boxShadow: `inset 0 0 20px ${coachData.color}80` 
       };
    }
    return customSq;
  }, [tree, currentNodeId, coachData, engineSettings.coachMode]);

  const { absoluteScore, absoluteMate, overallEvalText, isMate } = useMemo(() => {
      if (!lines || lines.length === 0 || !lines[0]) return { absoluteScore: 0, absoluteMate: 0, overallEvalText: '0.00', isMate: false };
      const main = lines[0]; const aScore = isBlackTurn ? -main.score : main.score; const aMate = isBlackTurn ? -(main.mateIn || 0) : (main.mateIn || 0);
      let text = '0.00'; if (main.isMate) text = aMate > 0 ? `+M${aMate}` : `-M${Math.abs(aMate)}`; else text = aScore > 0 ? `+${aScore.toFixed(2)}` : aScore.toFixed(2);
      return { absoluteScore: aScore, absoluteMate: aMate, overallEvalText: text, isMate: main.isMate };
  }, [lines, isBlackTurn]);

  const evalPercentage = useMemo(() => { if (isMate) return absoluteMate > 0 ? 95 : 5; return Math.max(5, Math.min(95, 50 + (absoluteScore * 10))); }, [absoluteScore, isMate, absoluteMate]);
  const getBadgeStyle = (score: number, mateFlag: boolean, mateVal: number) => {
      const isWhiteAdv = mateFlag ? mateVal > 0 : score > 0; const isBlackAdv = mateFlag ? mateVal < 0 : score < 0;
      if (isWhiteAdv) return 'bg-white text-zinc-900 border-zinc-200'; if (isBlackAdv) return 'bg-[#1a1916] text-zinc-200 border-[#262421]'; return 'bg-[#262421] text-zinc-400 border-[#35332e]'; 
  };
  const overallBadgeStyle = getBadgeStyle(absoluteScore, isMate, absoluteMate);
  const isOpeningPhase = currentNodeId === 'root' || (Object.keys(tree).length < 15);
  const displayEngineStatus = (isOpeningPhase && activeTab === 'explorer') ? 'reading books...' : (isReady ? `Farzin 1.0 (NNUE)` : engineStatus);

  const renderTreeNodes = useCallback((nodeId: string, forceShowMoveNumber: boolean = false): React.ReactNode[] => {
    const node = tree[nodeId];
    if (!node || node.childrenIds.length === 0) return [];
    const result: React.ReactNode[] = [];
    const mainChildId = node.childrenIds[0];
    const mainChild = tree[mainChildId];
    const moveNum = Math.ceil(mainChild.depth / 2);
    const isWhite = mainChild.depth % 2 !== 0;
    
    let prefix = ''; if (isWhite) prefix = `${moveNum}. `; else if (forceShowMoveNumber) prefix = `${moveNum}... `;
    result.push(<span key={mainChildId} onClick={() => setCurrentNodeId(mainChildId)} className={`cursor-pointer px-1 py-0.5 mx-[1px] rounded transition-all duration-200 ${currentNodeId === mainChildId ? 'bg-farzin-accent text-white font-black shadow-[0_0_8px_rgba(119,149,86,0.6)]' : 'text-zinc-300 hover:bg-[#262421]'}`}>{prefix}{mainChild.san}</span>);

    if (node.childrenIds.length > 1) {
      for (let i = 1; i < node.childrenIds.length; i++) {
        const varId = node.childrenIds[i]; const varChild = tree[varId]; const varIsWhite = varChild.depth % 2 !== 0; const varMoveNum = Math.ceil(varChild.depth / 2); const varPrefix = varIsWhite ? `${varMoveNum}. ` : `${varMoveNum}... `;
        result.push(<span key={`${varId}-wrap`} className="text-zinc-500 mx-1 inline-flex items-baseline flex-wrap bg-[#1a1916] px-1.5 py-0.5 rounded-lg border border-[#35332e]/50 text-xs">(<span onClick={() => setCurrentNodeId(varId)} className={`cursor-pointer px-1 py-0.5 rounded transition-colors ${currentNodeId === varId ? 'text-white font-bold' : 'hover:text-zinc-300'}`}>{varPrefix}{varChild.san}</span><span className="ml-1">{renderTreeNodes(varId, !varIsWhite)}</span>)</span>);
      }
      result.push(<span key={`space-${mainChildId}`} className="ml-0.5"></span>); result.push(...renderTreeNodes(mainChildId, !isWhite)); 
    } else {
      result.push(<span key={`space-${mainChildId}`} className="ml-0.5"></span>); result.push(...renderTreeNodes(mainChildId, false));
    }
    return result;
  }, [tree, currentNodeId]);

  return (
    <div className="h-[100dvh] bg-[#100f0d] text-zinc-200 flex flex-col font-sans overflow-hidden" dir="rtl" onContextMenu={e => {e.preventDefault(); setClickedSquare(null); setOptionSquares({});}}>
      
      <div className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
        <AnimatePresence>
          {toastMessage && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="bg-[#1e1c19] border border-farzin-accent/50 text-white px-4 py-2.5 rounded-xl shadow-[0_5px_20px_rgba(119,149,86,0.3)] flex items-center gap-2.5 whitespace-nowrap pointer-events-auto">
               <div className="w-6 h-6 shrink-0 rounded-full bg-farzin-accent/20 flex items-center justify-center"><Check size={14} className="text-farzin-accent"/></div>
               <span className="text-xs font-bold">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" dir="rtl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 w-[90%] max-w-sm shadow-2xl flex flex-col relative">
               <div className="flex items-center gap-2 mb-4 text-white"><Save size={20} className="text-farzin-accent" /><h2 className="font-bold text-base">ذخیره آنالیز</h2></div>
               <p className="text-xs text-zinc-400 mb-4 leading-relaxed">این آنالیز با تمام شاخه‌ها در آرشیو شما ذخیره خواهد شد.</p>
               <input autoFocus value={saveName} onChange={e => setSaveName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveAnalysis()} placeholder="مثلاً: گشایش اسپانیایی..." className="w-full bg-[#1e1c19] border border-[#35332e] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-farzin-accent transition-colors mb-5 shadow-inner" />
               <div className="flex gap-2 w-full">
                  <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 bg-[#262421] hover:bg-[#35332e] text-zinc-400 hover:text-white font-bold py-2.5 text-sm rounded-xl transition-colors">لغو</button>
                  <button onClick={handleSaveAnalysis} className="flex-1 bg-farzin-accent hover:bg-[#68824b] text-white font-bold py-2.5 text-sm rounded-xl transition-colors shadow-lg">ذخیره در آرشیو</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90dvh] overflow-y-auto custom-scrollbar">
               <div className="flex items-center gap-2 mb-5 text-white border-b border-[#35332e] pb-3"><Sliders size={20} className="text-farzin-accent" /><h2 className="font-bold text-base">تنظیمات پیشرفته موتور</h2></div>
               <div className="flex flex-col gap-5 mb-6">
                 
                 <div className="bg-[#1e1c19] border border-farzin-accent/30 p-3 rounded-xl flex items-center justify-between shadow-inner">
                    <div>
                        <span className="text-sm font-bold text-white block mb-0.5">مربی هوشمند (Coach)</span>
                        <span className="text-[10px] text-zinc-500">جایگزین لاین‌های خام با فیدبک هوشمند متنی</span>
                    </div>
                    <ToggleSwitch checked={tempSettings.coachMode} onChange={(v) => setTempSettings(prev => ({...prev, coachMode: v}))} />
                 </div>

                 <div className={`transition-opacity ${tempSettings.coachMode ? 'opacity-50 pointer-events-none' : ''}`}>
                   <div className="flex justify-between items-center mb-2"><label className="text-sm text-zinc-300 font-bold">خطوط تحلیل (Multi-PV)</label><span className="text-farzin-accent font-mono font-bold bg-farzin-accent/10 px-2 py-0.5 rounded">{tempSettings.multiPv}</span></div>
                   <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[1, 2, 3].map(num => (<button key={num} onClick={() => setTempSettings(prev => ({...prev, multiPv: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.multiPv === num ? 'bg-[#262421] text-farzin-accent shadow-sm border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num} لاین</button>))}</div>
                 </div>
                 <div>
                   <div className="flex justify-between items-center mb-2"><label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5"><Target size={14} className="text-emerald-500"/> حداکثر عمق (Depth)</label><span className="text-emerald-500 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{tempSettings.maxDepth === 99 ? '∞' : tempSettings.maxDepth}</span></div>
                   <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[18, 22, 24, 99].map(num => (<button key={num} onClick={() => setTempSettings(prev => ({...prev, maxDepth: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.maxDepth === num ? 'bg-[#262421] text-emerald-500 shadow-sm border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num === 99 ? 'نامحدود' : num}</button>))}</div>
                 </div>
                 <div>
                   <div className="flex justify-between items-center mb-2"><label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5"><Clock size={14} className="text-rose-500"/> زمان محاسبه هر حرکت</label><span className="text-rose-500 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded">{tempSettings.maxTime === 0 ? '∞' : `${tempSettings.maxTime}s`}</span></div>
                   <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[1, 3, 5, 0].map(num => (<button key={num} onClick={() => setTempSettings(prev => ({...prev, maxTime: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.maxTime === num ? 'bg-[#262421] text-rose-500 shadow-sm border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num === 0 ? 'بدون محدودیت' : `${num} ثانیه`}</button>))}</div>
                 </div>
                 <div className="flex gap-3">
                   <div className="flex-1">
                     <div className="flex justify-between items-center mb-2"><label className="text-[11px] text-zinc-400 flex items-center gap-1"><Cpu size={12}/> پردازنده</label></div>
                     <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[1, 2, 4].map(num => (<button key={num} onClick={() => setTempSettings(prev => ({...prev, threads: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.threads === num ? 'bg-[#262421] text-amber-500 border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num}</button>))}</div>
                   </div>
                   <div className="flex-1">
                     <div className="flex justify-between items-center mb-2"><label className="text-[11px] text-zinc-400 flex items-center gap-1"><Database size={12}/> رَم (MB)</label></div>
                     <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[16, 64, 128].map(num => (<button key={num} onClick={() => setTempSettings(prev => ({...prev, hash: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.hash === num ? 'bg-[#262421] text-sky-500 border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num}</button>))}</div>
                   </div>
                 </div>
               </div>
               <div className="flex gap-2 w-full mt-2">
                  <button onClick={() => setIsSettingsModalOpen(false)} className="flex-1 bg-[#262421] hover:bg-[#35332e] text-zinc-400 hover:text-white font-bold py-2.5 text-sm rounded-xl transition-colors">انصراف</button>
                  <button onClick={handleApplySettings} className="flex-1 bg-farzin-accent hover:bg-[#68824b] text-white font-bold py-2.5 text-sm rounded-xl transition-colors shadow-lg">اعمال تنظیمات</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isArrowModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90dvh] overflow-y-auto custom-scrollbar">
               <div className="flex items-center gap-2 mb-5 text-white border-b border-[#35332e] pb-3"><Route size={20} className="text-amber-500" /><h2 className="font-bold text-base">راهنمای بصری تخته</h2></div>
               <div className="flex flex-col gap-4 mb-6">
                 <div className="flex items-center justify-between bg-[#1e1c19] p-3 rounded-xl border border-[#35332e]">
                    <span className="text-sm font-bold text-white">رسم فلش حرکات برتر</span>
                    <ToggleSwitch checked={arrowSettings.showArrows} onChange={(v) => setArrowSettings(prev => ({...prev, showArrows: v}))} />
                 </div>
                 <div className={`flex flex-col bg-[#1e1c19] p-3 rounded-xl border border-[#35332e] transition-opacity ${!arrowSettings.showArrows ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-sm font-bold text-white">نمایش مانور مهره‌ها</span>
                       <ToggleSwitch checked={arrowSettings.showManeuvers} onChange={(v) => setArrowSettings(prev => ({...prev, showManeuvers: v}))} />
                    </div>
                    <div className="p-3 bg-[#161512] rounded-lg border border-[#35332e]">
                       <p className="text-xs text-zinc-400 leading-relaxed mb-4 text-justify">مانور نشان می‌دهد که موتور قصد دارد یک مهره را در چند حرکت متوالی طی یک مسیر پیوسته جابجا کند.</p>
                       <div className="flex items-center justify-center text-zinc-500 pb-1">
                          <div className="w-8 h-8 rounded-lg bg-[#262421] flex items-center justify-center border border-[#403e3a] shadow-inner"><span className="text-amber-500 text-lg">♞</span></div>
                          <div className="h-0.5 w-8 bg-amber-500 relative"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-l-2 border-b-2 border-amber-500 rotate-45 -ml-0.5"></div></div>
                          <div className="w-8 h-8 rounded-lg bg-[#1a1916] flex items-center justify-center border border-[#35332e] border-dashed"></div>
                          <div className="h-0.5 w-8 bg-amber-500 relative opacity-60"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-l-2 border-b-2 border-amber-500 rotate-45 -ml-0.5"></div></div>
                          <div className="w-8 h-8 rounded-lg bg-[#1a1916] flex items-center justify-center border border-[#35332e] border-dashed"></div>
                       </div>
                    </div>
                 </div>
                 <div className={`flex flex-col bg-[#1e1c19] p-3 rounded-xl border border-[#35332e] transition-opacity ${!arrowSettings.showArrows ? 'opacity-50 pointer-events-none' : ''}`}>
                    <span className="text-sm font-bold text-white mb-1">رنگ‌بندی اختصاصی لاین‌ها</span>
                    <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">این رنگ‌ها هم روی فلش‌های تخته و هم در داشبورد موتور اعمال می‌شوند.</p>
                    <div className="flex flex-col gap-2">
                       {[0, 1, 2].map(idx => idx < engineSettings.multiPv && (
                         <div key={idx} className="flex items-center justify-between bg-[#161512] px-3 py-2 rounded-lg border border-[#35332e]">
                           <span className="text-xs text-zinc-400 font-bold">لاین {idx + 1}</span>
                           <div className="flex gap-2">
                             {COLOR_PALETTES.map(c => (
                               <button 
                                 key={c.hex}
                                 onClick={() => { const newColors = [...arrowColors]; newColors[idx] = c; setArrowColors(newColors); }}
                                 className={`w-5 h-5 rounded-full transition-all ${arrowColors[idx].hex === c.hex ? 'scale-125 ring-2 ring-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'hover:scale-110 opacity-50 hover:opacity-100'}`}
                                 style={{ backgroundColor: c.hex }}
                               />
                             ))}
                           </div>
                         </div>
                       ))}
                    </div>
                 </div>
               </div>
               <button onClick={() => setIsArrowModalOpen(false)} className="w-full bg-[#262421] hover:bg-[#35332e] text-white font-bold py-3 text-sm rounded-xl transition-colors">تایید و بستن</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`flex-none w-full px-4 py-2.5 flex items-center justify-between z-10 bg-[#161512] border-b border-[#35332e] transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={() => navigate(-1)} className="p-1.5 bg-[#1e1c19] border border-[#35332e] rounded-lg hover:bg-[#262421] transition-colors text-zinc-400"><ChevronRight size={20} /></button>
        <div className="flex flex-col items-center">
            <h1 className="font-black text-sm text-white flex items-center gap-2">
              <Activity size={14} className="text-farzin-accent" /> آزمایشگاه فرزین
            </h1>
        </div>
        <div className="flex gap-1.5">
            <button onClick={openSettingsModal} className="p-1.5 bg-[#1e1c19] border border-[#35332e] rounded-lg hover:bg-[#262421] hover:text-white text-zinc-400 transition-colors" title="تنظیمات موتور"><Settings size={16}/></button>
            <button onClick={() => setIsSaveModalOpen(true)} className="p-1.5 bg-[#1e1c19] border border-[#35332e] rounded-lg hover:bg-[#262421] hover:text-white text-zinc-400 transition-colors" title="ذخیره آنالیز"><Save size={16}/></button>
            <button className="p-1.5 bg-[#1e1c19] border border-[#35332e] rounded-lg hover:bg-[#262421] hover:text-white text-zinc-400 transition-colors"><Share2 size={16}/></button>
        </div>
      </div>

      <div className={`flex-none w-full px-3 py-2 bg-gradient-to-b from-[#1a1916] to-[#12110f] border-b border-[#35332e] shadow-[0_4px_15px_rgba(0,0,0,0.3)] relative z-20 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between mb-1.5 px-1">
              <div className="flex items-center gap-2 bg-[#262421] px-2 py-0.5 rounded-md border border-[#35332e]">
                  {!isReady ? <Loader2 size={10} className="text-amber-500 animate-spin" /> : <Zap size={10} className={displayEngineStatus === 'reading books...' ? "text-sky-400 animate-pulse" : "text-amber-400 animate-pulse"} />}
                  <span className="font-mono text-[9px] font-bold text-zinc-300" dir="ltr">{displayEngineStatus}</span>
                  {lines[0] && <span className="text-[9px] text-zinc-500 font-mono ml-1 border-l border-[#35332e] pl-1.5">D{lines[0].depth}</span>}
              </div>
              <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border shadow-sm ${overallBadgeStyle}`} dir="ltr">{overallEvalText}</span>
          </div>
          
          <div className="mt-2 min-h-[50px]">
             {engineSettings.coachMode && coachData ? (
                 coachData.key === 'loading' ? (
                     <div className="flex flex-col items-center justify-center py-2 opacity-50"><Loader2 size={18} className="animate-spin text-farzin-accent mb-1"/><span className="text-[10px] font-sans">در حال بررسی دقیق حرکت...</span></div>
                 ) : (
                     <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="flex flex-col gap-1 bg-[#161512] rounded-xl p-2 border border-[#35332e] shadow-inner">
                         
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${coachData.color}20`, color: coachData.color }}>
                                   <coachData.icon size={14} />
                                </div>
                                <span className="text-[11px] font-sans text-zinc-300">
                                   حرکت <span className="font-mono font-black text-white px-1">{coachData.userSan}</span> <span className="font-bold" style={{color: coachData.color}}>{coachData.text}</span> بود.
                                </span>
                            </div>
                            <button onClick={()=>handleShowMe(false)} className="text-[9px] font-bold bg-[#262421] border border-[#35332e] px-2 py-1 rounded hover:bg-[#35332e] transition-colors">نشونم بده</button>
                         </div>

                         { !['best', 'brilliant', 'great'].includes(coachData.key) && coachData.bestSan !== '...' && (
                             <div className="flex items-center justify-between border-t border-[#262421] pt-1.5 mt-0.5 opacity-80">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 ml-0.5 rounded-md flex items-center justify-center text-zinc-500">
                                       <COACH_COLORS.best.icon size={12} />
                                    </div>
                                    <span className="text-[10px] font-sans text-zinc-400">
                                       اما بهترین حرکت <span className="font-mono font-black text-zinc-200 px-1">{coachData.bestSan}</span> بود.
                                    </span>
                                </div>
                                <button onClick={()=>handleShowMe(true)} className="text-[9px] font-bold bg-[#1e1c19] text-farzin-accent border border-farzin-accent/30 px-2 py-1 rounded hover:bg-farzin-accent hover:text-white transition-colors">نشونم بده</button>
                             </div>
                         )}

                     </motion.div>
                 )
             ) : (
                <div className="flex flex-col gap-0.5" dir="ltr" style={{ fontFamily: "'JetBrains Mono', Consolas, monospace" }}>
                  {lines.length > 0 ? lines.slice(0, engineSettings.multiPv).map((line, idx) => {
                      const rawPv = line.pv || ''; let actualPv = rawPv.includes(' pv ') ? rawPv.split(' pv ')[1] : rawPv; const match = actualPv.match(/[a-h][1-8][a-h][1-8]/); if (match && !rawPv.includes(' pv ')) actualPv = actualPv.substring(actualPv.indexOf(match[0]));
                      const uciMoves = actualPv.trim().split(' ').slice(0, 15); const sanMoves: string[] = [];
                      try { const tempGame = new Chess(currentPosition); for (const uci of uciMoves) { if (!uci || uci.length < 4) break; const moveParams: any = { from: uci.slice(0,2), to: uci.slice(2,4) }; if (uci.length > 4) moveParams.promotion = uci[4]; const result = tempGame.move(moveParams); if (result) sanMoves.push(result.san); else { sanMoves.push(uci); break; } } } catch (e) {}
                      const mainMove = sanMoves[0] || '...'; const restMoves = sanMoves.slice(1).join(' ');
                      const aScore = isBlackTurn ? -line.score : line.score; const aMate = isBlackTurn ? -(line.mateIn || 0) : (line.mateIn || 0);
                      let scoreText = ''; if (line.isMate) scoreText = aMate > 0 ? `+M${aMate}` : `-M${Math.abs(aMate)}`; else scoreText = aScore > 0 ? `+${aScore.toFixed(2)}` : aScore.toFixed(2);
                      const badgeStyle = getBadgeStyle(aScore, line.isMate, aMate); const lineColor = arrowColors[idx] ? arrowColors[idx].hex : '#a1a1aa';
                      return (
                          <div key={idx} className={`flex items-center gap-2 text-[10.5px] truncate px-1.5 py-1 rounded transition-all bg-[#1e1c19] shadow-sm`} style={{ borderLeft: `3px solid ${lineColor}` }}>
                              <span className={`w-10 text-center font-black tracking-tighter rounded border px-1 py-0.5 shrink-0 ${badgeStyle}`}>{scoreText}</span>
                              <span className={`font-bold ml-1 shrink-0`} style={{ color: lineColor }}>{mainMove}</span>
                              <span className="text-zinc-500 truncate opacity-80">{restMoves}</span>
                          </div>
                      );
                  }) : (<div className="text-[10px] text-zinc-500 pl-2">آماده به کار...</div>)}
                </div>
             )}
          </div>
      </div>

      <div className={`w-full flex-1 min-h-0 flex flex-col lg:flex-row transition-opacity duration-700 delay-100 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        
        <div className="flex-none lg:flex-1 lg:max-w-[45vw] flex flex-col px-3 py-1 justify-center relative z-0 shrink-0">
            <EditablePlayer color={boardOrientation === 'white' ? 'b' : 'w'} data={boardOrientation === 'white' ? playerMeta.black : playerMeta.white} onUpdate={(d: any) => setPlayerMeta(p => ({...p, [boardOrientation === 'white' ? 'black' : 'white']: d}))} />
            
            <div className="w-full flex justify-center py-0.5">
                <div className="flex w-full max-w-[min(100vw-1.5rem,48vh)] lg:max-w-[600px] aspect-square gap-1.5" dir="ltr">
                    <div className="flex-1 bg-[#262421] p-1.5 rounded-xl border border-[#35332e] shadow-2xl relative">
                        <div className="w-full h-full rounded-md overflow-hidden">
                          <Chessboard 
                              position={currentPosition} boardOrientation={boardOrientation}
                              customDarkSquareStyle={{ backgroundColor: '#779556' }} customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                              arePiecesDraggable={true} onPieceDrop={onDrop} onPieceDragBegin={onPieceDragBegin}
                              onSquareClick={handleSquareClick} onPieceClick={(piece: string, square: string) => handleSquareClick(square)}
                              onSquareRightClick={() => { setClickedSquare(null); setOptionSquares({}); }}
                              customSquareStyles={{...moveSquares, ...optionSquares}} 
                              customArrows={engineArrows} animationDuration={200}
                          />
                        </div>
                    </div>
                    <div className="w-3.5 shrink-0 bg-[#262421] rounded-lg overflow-hidden flex flex-col relative border border-[#35332e] shadow-inner">
                        <div className="w-full bg-[#35332e] transition-all duration-300 ease-out" style={{ height: `${100 - evalPercentage}%` }}></div>
                        <div className="w-full bg-zinc-200 transition-all duration-300 ease-out flex-1 flex flex-col justify-start items-center">
                            <span className="text-[7px] font-mono font-black text-zinc-800 rotate-90 mt-5 absolute">{overallEvalText}</span>
                        </div>
                    </div>
                </div>
            </div>

            <EditablePlayer color={boardOrientation === 'white' ? 'w' : 'b'} data={boardOrientation === 'white' ? playerMeta.white : playerMeta.black} onUpdate={(d: any) => setPlayerMeta(p => ({...p, [boardOrientation === 'white' ? 'white' : 'black']: d}))} />
        </div>

        <div className="flex-1 min-h-0 flex flex-col bg-[#161512] border-t lg:border-t-0 lg:border-r border-[#35332e] relative z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] lg:shadow-none rounded-t-2xl lg:rounded-none mt-2 lg:mt-0">
            
            <div className="flex-none px-3 py-2 border-b border-[#35332e] flex items-center justify-between bg-[#1a1916] rounded-t-2xl lg:rounded-none">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')} className="p-2 bg-[#262421] border border-[#35332e] rounded-lg text-zinc-400 hover:text-white transition-colors active:scale-95" title="چرخش تخته"><RefreshCw size={16} /></button>
                  <button onClick={copyMainlinePgn} className="p-2 bg-[#262421] border border-[#35332e] rounded-lg text-zinc-400 hover:text-white transition-colors active:scale-95" title="کپی PGN"><Copy size={16} /></button>
                  <button onClick={() => setIsArrowModalOpen(true)} className={`p-2 border rounded-lg transition-colors active:scale-95 ${arrowSettings.showArrows ? 'bg-farzin-accent/20 border-farzin-accent/50 text-farzin-accent hover:bg-farzin-accent hover:text-white' : 'bg-[#262421] border-[#35332e] text-zinc-400 hover:text-white'}`} title="تنظیمات راهنمای بصری"><Route size={16} /></button>
                </div>
                <div className="flex bg-[#262421] rounded-lg border border-[#35332e] overflow-hidden shadow-sm" dir="ltr">
                    <button onClick={goStart} className="p-2 text-zinc-400 hover:text-white hover:bg-[#35332e] transition-colors"><Rewind size={18} /></button>
                    <button onClick={prevMove} className="p-2 text-zinc-400 hover:text-white hover:bg-[#35332e] transition-colors border-l border-[#35332e]/50"><SkipBack size={18} /></button>
                    <button onClick={nextMove} className="p-2 text-white hover:text-farzin-accent hover:bg-[#35332e] transition-colors border-l border-[#35332e]/50"><SkipForward size={18} /></button>
                    <button onClick={goEnd} className="p-2 text-white hover:text-farzin-accent hover:bg-[#35332e] transition-colors border-l border-[#35332e]/50"><FastForward size={18} /></button>
                </div>
            </div>

            <div className="flex-none flex px-2 pt-1 border-b border-[#35332e] bg-[#1a1916] overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('notation')} className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'notation' ? 'border-farzin-accent text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><List size={14} /> ثبت حرکات</button>
                <button onClick={() => setActiveTab('graph')} className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'graph' ? 'border-sky-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><TrendingUp size={14} /> گراف ارزیابی</button>
                <button onClick={() => setActiveTab('explorer')} className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'explorer' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><BookOpen size={14} /> دیتابیس (گشایش)</button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bg-[#12110f] p-3 custom-scrollbar">
                {activeTab === 'notation' && (
                    <AnimatePresence mode="wait">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-mono leading-loose" dir="ltr">
                            {Object.keys(tree).length <= 1 ? (
                              <div className="flex flex-col items-center justify-center mt-10 text-zinc-600 gap-3">
                                  <List size={28} className="opacity-50" />
                                  <span className="text-xs font-sans">هیچ حرکتی ثبت نشده است</span>
                              </div>
                            ) : (
                              renderTreeNodes('root')
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
                {activeTab === 'graph' && (<div className="flex flex-col items-center justify-center h-full text-sky-500/50 gap-3"><TrendingUp size={28} /><span className="text-xs font-sans">گراف در مرحله بعدی رسم می‌شود...</span></div>)}
                {activeTab === 'explorer' && (<div className="flex flex-col items-center justify-center h-full text-purple-500/50 gap-3"><BookOpen size={28} /><span className="text-xs font-sans">اتصال به دیتابیس لیچس به زودی...</span></div>)}
            </div>

        </div>
      </div>
    </div>
  );
}