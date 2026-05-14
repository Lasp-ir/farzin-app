import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, FastForward, Rewind, SkipBack, SkipForward,
  Share2, List, TrendingUp, BookOpen, Check, Activity, Settings, Loader2, 
  RefreshCw, Zap, Copy, Save, Pause, Play, Route, RotateCcw, PieChart, Maximize2
} from 'lucide-react';

import { useStockfish } from '../hooks/useStockfish';
import EvaluationGraph from '../components/EvaluationGraph';
import OpeningExplorer from '../components/OpeningExplorer';
import OpeningDisplay from '../components/OpeningDisplay';
import { ShareModal, SaveModal, ResetModal, SettingsModal, ArrowSettingsModal } from '../components/AnalysisModals';

import { isBookPosition } from '../utils/ecoParser';
import type { MoveNode } from '../utils/analysisConfig';
import { COACH_COLORS, COLOR_PALETTES, getAbsScore, epFormula, getPieceValue, EditablePlayer } from '../utils/analysisConfig';

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
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isArrowModalOpen, setIsArrowModalOpen] = useState(false);
  
  const [saveName, setSaveName] = useState("");
  const [engineSettings, setEngineSettings] = useState({ multiPv: 3, threads: 1, hash: 16, maxDepth: 24, maxTime: 0, coachMode: true });
  const [tempSettings, setTempSettings] = useState(engineSettings);
  const [arrowSettings, setArrowSettings] = useState({ showArrows: true, showManeuvers: true });
  const [arrowColors, setArrowColors] = useState([COLOR_PALETTES[0], COLOR_PALETTES[2], COLOR_PALETTES[5]]);
  
  const [graphMode, setGraphMode] = useState<'hidden' | 'fullscreen' | 'floating'>('hidden');
  const [isEnginePaused, setIsEnginePaused] = useState(false);

  // 🌟 استیت کنترل ایستر اگ
  const [easterEggState, setEasterEggState] = useState<'idle' | 'prompt' | 'exploded' | 'resolved'>('idle');

  const { isReady, engineStatus, lines, analyze, stop, setOption } = useStockfish() as any;

  useEffect(() => {
    let rootFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    let initialTree: Record<string, MoveNode> = {
      'root': { id: 'root', san: 'Start', fen: rootFen, move: null, parentId: null, childrenIds: [], depth: 0 }
    };
    let endNodeId = 'root';

    if (initialData.type === 'PGN' && initialData.data) {
      try {
        const game = new Chess();
        game.loadPgn(initialData.data);
        
        const headers = game.header();
        setPlayerMeta(prev => ({
          white: { 
              name: headers.White && headers.White !== '?' ? headers.White : prev.white.name, 
              elo: headers.WhiteElo && headers.WhiteElo !== '?' ? headers.WhiteElo : prev.white.elo, 
              title: prev.white.title 
          },
          black: { 
              name: headers.Black && headers.Black !== '?' ? headers.Black : prev.black.name, 
              elo: headers.BlackElo && headers.BlackElo !== '?' ? headers.BlackElo : prev.black.elo, 
              title: prev.black.title 
          }
        }));

        const history = game.history({ verbose: true });
        const buildGame = new Chess(); 
        
        for (const move of history) {
          buildGame.move(move);
          const newFen = buildGame.fen();
          const newId = `${endNodeId}-${move.san}`;
          
          initialTree[newId] = {
            id: newId,
            san: move.san,
            fen: newFen,
            move: move,
            parentId: endNodeId,
            childrenIds: [],
            depth: initialTree[endNodeId].depth + 1
          };
          
          initialTree[endNodeId].childrenIds.push(newId);
          endNodeId = newId;
        }
      } catch (e) {
        console.error("PGN Parse Error:", e);
      }
    } else if (initialData.type === 'FEN' && initialData.data) {
      rootFen = initialData.data;
      initialTree['root'].fen = rootFen;
    }

    setTree(initialTree);
    setCurrentNodeId(endNodeId); 
    setIsLoaded(true);
  }, []);

  const currentPosition = tree[currentNodeId]?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  // 🌟 محافظت از کرش شدن chess.js در صورت خراب شدن FEN
  const activeGame = useMemo(() => {
    try {
        return new Chess(currentPosition);
    } catch (e) {
        const fallback = new Chess();
        fallback.clear();
        return fallback;
    }
  }, [currentPosition]);
  
  const isBlackTurn = activeGame.turn() === 'b';

  const materialAdvantage = useMemo(() => {
      const fenBoard = currentPosition.split(' ')[0];
      const counts = { w: { p:0, n:0, b:0, r:0, q:0 }, b: { p:0, n:0, b:0, r:0, q:0 } };
      
      for (let char of fenBoard) {
         if (/[pnbrq]/.test(char)) counts.b[char as keyof typeof counts.b]++;
         if (/[PNBRQ]/.test(char)) counts.w[char.toLowerCase() as keyof typeof counts.w]++;
      }
      
      let whiteAdv = { score: 0, pieces: [] as string[] };
      let blackAdv = { score: 0, pieces: [] as string[] };
      
      ['q', 'r', 'b', 'n', 'p'].forEach(p => {
         const diff = counts.w[p as keyof typeof counts.w] - counts.b[p as keyof typeof counts.b];
         if (diff > 0) {
             for(let i=0; i<diff; i++) whiteAdv.pieces.push(p);
         } else if (diff < 0) {
             for(let i=0; i<-diff; i++) blackAdv.pieces.push(p);
         }
      });
      
      let wScore = 0; whiteAdv.pieces.forEach(p => wScore += getPieceValue(p));
      let bScore = 0; blackAdv.pieces.forEach(p => bScore += getPieceValue(p));
      
      if (wScore > bScore) { whiteAdv.score = wScore - bScore; blackAdv.score = 0; }
      else if (bScore > wScore) { blackAdv.score = bScore - wScore; whiteAdv.score = 0; }
      
      return { white: whiteAdv, black: blackAdv };
  }, [currentPosition]);

  // 🌟 ماشین حساب هوشمند تشخیص وضعیت‌های غیرقانونی (شاه زیر ضرب)
  const isKingInDanger = useMemo(() => {
      try {
          const parts = currentPosition.split(' ');
          const turn = parts[1];
          parts[1] = turn === 'w' ? 'b' : 'w'; // نوبت را عوض می‌کنیم تا ببینیم شاه حریف کیش است یا نه
          parts[3] = '-'; // آن‌پاسان رو خاموش می‌کنیم که گیر نده
          const temp = new Chess();
          temp.load(parts.join(' ')); 
          return temp.isCheck(); // اگر نوبت حریف باشه و کیش باشه، یعنی الان ما می‌تونیم بزنیمش!
      } catch (e) {
          return false;
      }
  }, [currentPosition]);

  // 🌟 جلوگیری از ارسال FEN غیرقانونی به موتور و راه‌اندازی ایستر اگ
  useEffect(() => {
    if (isKingInDanger && easterEggState === 'idle') {
        setEasterEggState('prompt');
        setIsEnginePaused(true);
        if (stop) stop(); // موتور رو خفه می‌کنیم که کرش نکنه!
        return;
    }

    if (easterEggState !== 'idle') return; // تو ایستر اگ موتور باید بخوابه

    if (isReady && currentPosition) {
      if (isEnginePaused) {
          if (stop) stop(); 
      } else {
          analyze(currentPosition, engineSettings.maxDepth);
          if (engineSettings.maxTime > 0 && stop) {
            const timer = setTimeout(() => stop(), engineSettings.maxTime * 1000);
            return () => clearTimeout(timer);
          }
      }
    }
  }, [currentPosition, isReady, analyze, stop, engineSettings.maxDepth, engineSettings.maxTime, isEnginePaused, isKingInDanger, easterEggState]);

  useEffect(() => {
    if (lines && lines.length > 0) {
      engineCache.current[currentNodeId] = lines;
    }
  }, [lines, currentNodeId]);

  const calculateNodeCoachData = useCallback((nodeId: string, currentLines: any[], t: Record<string, MoveNode>) => {
    if (!engineSettings.coachMode || nodeId === 'root') return null;
    const node = t[nodeId];
    if (!node || !node.parentId) return null;
    
    const parentFen = t[node.parentId].fen;
    const grandParentId = t[node.parentId].parentId;
    const grandparentFen = grandParentId ? t[grandParentId].fen : null;

    const playerWhoMovedIsBlack = new Chess(parentFen).turn() === 'b';
    const currentTurnIsBlack = new Chess(node.fen).turn() === 'b';

    const parentLines = engineCache.current[node.parentId];
    
    const cg = new Chess(node.fen);
    const isMate = cg.isCheckmate();
    const isDraw = cg.isDraw() || cg.isStalemate() || cg.isThreefoldRepetition() || cg.isInsufficientMaterial();

    const pg = new Chess(parentFen);
    const parentIsMate = pg.isCheckmate();
    const parentIsDraw = pg.isDraw() || pg.isStalemate() || pg.isThreefoldRepetition() || pg.isInsufficientMaterial();

    if (!parentIsMate && !parentIsDraw && (!parentLines || !parentLines[0])) return COACH_COLORS.loading;
    if (!isMate && !isDraw && (!currentLines || !currentLines[0])) return COACH_COLORS.loading;

    let absScoreB = 0;
    if (parentIsMate) absScoreB = playerWhoMovedIsBlack ? 100 : -100;
    else if (parentIsDraw) absScoreB = 0;
    else absScoreB = getAbsScore(parentLines[0], playerWhoMovedIsBlack ? 'b' : 'w');

    let absScoreC = 0;
    if (isMate) absScoreC = currentTurnIsBlack ? 100 : -100;
    else if (isDraw) absScoreC = 0;
    else absScoreC = getAbsScore(currentLines[0], currentTurnIsBlack ? 'b' : 'w');

    let cpLoss = playerWhoMovedIsBlack ? (absScoreC - absScoreB) : (absScoreB - absScoreC);
    cpLoss = Math.max(0, cpLoss);

    const getPlayerEP = (absSc: number) => epFormula(playerWhoMovedIsBlack ? -absSc : absSc);
    const epB = getPlayerEP(absScoreB); 
    const epC = getPlayerEP(absScoreC); 

    let classificationKey: keyof typeof COACH_COLORS = 'good';
    
    let bestUciMove = '';
    if (parentLines && parentLines[0]) {
        const rawParentPv = parentLines[0].pv || '';
        const parentActualPv = rawParentPv.includes(' pv ') ? rawParentPv.split(' pv ')[1] : rawParentPv;
        bestUciMove = parentActualPv.trim().split(' ')[0];
    }
    const userUciMove = `${node.move.from}${node.move.to}${node.move.promotion || ''}`;

    const fenBeforeCount = parentFen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
    const isEndgame = fenBeforeCount <= 16; 
    const inaccuracyLimit = isEndgame ? 1.0 : 1.5;
    const mistakeLimit = isEndgame ? 2.0 : 2.5;

    const fenIsBook = isBookPosition(node.fen);

    if (fenIsBook) {
        classificationKey = 'book';
    }
    else if (isMate || userUciMove === bestUciMove || cpLoss <= 0.05) classificationKey = 'best';
    else if (epB < 0.10) classificationKey = cpLoss <= 0.50 ? 'excellent' : 'good';
    else {
        if (cpLoss <= 0.20) classificationKey = 'excellent'; 
        else if (cpLoss <= 0.50) classificationKey = 'good';      
        else if (cpLoss <= inaccuracyLimit) classificationKey = 'inaccuracy';
        else if (cpLoss <= mistakeLimit) classificationKey = 'mistake';
        else classificationKey = 'blunder'; 
    }

    if (['inaccuracy', 'mistake', 'blunder'].includes(classificationKey) && grandParentId && grandparentFen) {
        const grandparentLines = engineCache.current[grandParentId];
        if (grandparentLines && grandparentLines[0]) {
            const grandparentTurn = new Chess(grandparentFen).turn() as 'w' | 'b';
            const epA = getPlayerEP(getAbsScore(grandparentLines[0], grandparentTurn)); 
            if (epA <= 0.60 && (epB - epA >= 0.15) && epC <= epA + 0.10 && epC >= epA - 0.20) classificationKey = 'miss';
        }
    }

    if (['best', 'excellent'].includes(classificationKey) && parentLines && parentLines.length > 1) {
        const epSecondBest = getPlayerEP(getAbsScore(parentLines[1], playerWhoMovedIsBlack ? 'b' : 'w'));
        if (epB < 0.95 && epSecondBest < 0.90 && ((epB - epSecondBest >= 0.20) || (epB >= 0.45 && epSecondBest <= 0.25) || (epB >= 0.75 && epSecondBest <= 0.55))) {
            classificationKey = 'great';
            let isSacrifice = false;
            try {
                const tempG = new Chess(node.fen);
                const oppMoves = tempG.moves({ verbose: true });
                for (const oppMove of oppMoves) {
                    if (oppMove.captured && ['n', 'b', 'r', 'q'].includes(oppMove.captured.toLowerCase())) {
                        const capturedVal = getPieceValue(oppMove.captured); 
                        tempG.move(oppMove.san);
                        let maxRecaptureVal = 0;
                        for (const ourMove of tempG.moves({ verbose: true })) {
                            if (ourMove.to === oppMove.to && ourMove.captured) maxRecaptureVal = Math.max(maxRecaptureVal, getPieceValue(ourMove.captured));
                        }
                        tempG.undo();
                        if (capturedVal - maxRecaptureVal >= 2) { isSacrifice = true; break; }
                    }
                }
            } catch(e) {}
            if (isSacrifice && epB < 0.85) classificationKey = 'brilliant';
        }
    }

    let bestSanMove = '...';
    try {
        if(bestUciMove) {
            const m = new Chess(parentFen).move({from: bestUciMove.slice(0,2), to: bestUciMove.slice(2,4), promotion: bestUciMove[4]});
            if(m) bestSanMove = m.san;
        }
    } catch(e) {}

    return { ...COACH_COLORS[classificationKey], key: classificationKey, bestSan: bestSanMove, userSan: node.san };
  }, [engineSettings.coachMode]);

  const coachData = useMemo(() => calculateNodeCoachData(currentNodeId, lines, tree), [currentNodeId, lines, tree, calculateNodeCoachData]);

  const activeMainline = useMemo(() => {
      let leaf = currentNodeId;
      while (tree[leaf] && tree[leaf].childrenIds.length > 0) leaf = tree[leaf].childrenIds[0];
      const p = []; let c = leaf;
      while (c && tree[c]) { p.unshift(tree[c]); c = tree[c].parentId as string; }
      return p;
  }, [tree, currentNodeId]);

  const allPaths = useMemo(() => {
      const paths: MoveNode[][] = [];
      const traverse = (nodeId: string, currentPath: MoveNode[]) => {
          const node = tree[nodeId];
          if (!node) return;
          const newPath = [...currentPath, node];
          if (node.childrenIds.length === 0) paths.push(newPath);
          else node.childrenIds.forEach(childId => traverse(childId, newPath));
      };
      traverse('root', []);
      return paths;
  }, [tree]);

  const maxX = useMemo(() => {
      let maxLen = activeMainline.length;
      allPaths.forEach(p => { if (p.length > maxLen) maxLen = p.length; });
      return Math.max(1, maxLen - 1);
  }, [activeMainline, allPaths]);

  const graphPoints = useMemo(() => {
      return activeMainline.map(node => {
          const isCurrent = node.id === currentNodeId;
          const nodeLines = isCurrent ? lines : engineCache.current[node.id];
          
          let ep = 0.5;
          let phase: 'opening' | 'middlegame' | 'endgame' = 'opening';

          const cg = new Chess(node.fen);
          if (cg.isCheckmate()) {
              const fenTurn = node.fen.split(' ')[1] as 'w' | 'b';
              ep = epFormula(fenTurn === 'b' ? 100 : -100);
          } else if (cg.isDraw() || cg.isStalemate() || cg.isThreefoldRepetition() || cg.isInsufficientMaterial()) {
              ep = 0.5;
          } else if (nodeLines && nodeLines[0]) {
              const fenTurn = node.fen.split(' ')[1] as 'w' | 'b'; 
              ep = epFormula(getAbsScore(nodeLines[0], fenTurn)); 
          }

          if (node.depth > 30) {
              const fenRaw = node.fen.split(' ')[0];
              const nonPawns = fenRaw.replace(/[^qrnbQRNB]/g, '');
              let weight = 0;
              for(let char of nonPawns) weight += getPieceValue(char);
              phase = weight < 14 ? 'endgame' : 'middlegame';
          } else if (node.depth > 20) {
              phase = 'middlegame';
          }

          return { node, ep, phase, coach: node.id === 'root' ? null : calculateNodeCoachData(node.id, nodeLines || [], tree) };
      });
  }, [activeMainline, lines, currentNodeId, tree, calculateNodeCoachData]);

  const { areaWhite, areaBlack, linePath, ghostPaths } = useMemo(() => {
    if (graphPoints.length === 0) return { areaWhite: '', areaBlack: '', linePath: '', ghostPaths: [] };
    
    let wPath = `M 0,150 `, bPath = `M 0,150 `, lPath = ``;
    
    graphPoints.forEach((pt, i) => {
        const x = (i / maxX) * 1000, y = 300 - (pt.ep * 300);
        lPath += `${i === 0 ? 'M' : 'L'} ${x},${y} `;
        wPath += `L ${x},${y} `; bPath += `L ${x},${y} `;
    });
    wPath += `L ${((graphPoints.length - 1) / maxX) * 1000},150 Z`;
    bPath += `L ${((graphPoints.length - 1) / maxX) * 1000},150 Z`;

    const gPaths: string[] = [];
    allPaths.forEach(path => {
        const isMainline = path.length === activeMainline.length && path.every((n, i) => n.id === activeMainline[i].id);
        if (!isMainline) {
            let gp = ``;
            path.forEach((node, i) => {
                const nodeLines = engineCache.current[node.id];
                let ep = 0.5;
                const cg = new Chess(node.fen);
                
                if (cg.isCheckmate()) {
                    ep = epFormula(node.fen.split(' ')[1] === 'b' ? 100 : -100);
                } else if (cg.isDraw() || cg.isStalemate() || cg.isThreefoldRepetition() || cg.isInsufficientMaterial()) {
                    ep = 0.5;
                } else if (nodeLines && nodeLines[0]) {
                    ep = epFormula(getAbsScore(nodeLines[0], node.fen.split(' ')[1] as 'w' | 'b'));
                } else if (i > 0 && path[i-1]) {
                    const prevLines = engineCache.current[path[i-1].id];
                    const pg = new Chess(path[i-1].fen);
                    if (pg.isCheckmate()) {
                        ep = epFormula(path[i-1].fen.split(' ')[1] === 'b' ? 100 : -100);
                    } else if (pg.isDraw() || pg.isStalemate() || pg.isThreefoldRepetition() || pg.isInsufficientMaterial()) {
                        ep = 0.5;
                    } else if (prevLines && prevLines[0]) {
                        ep = epFormula(getAbsScore(prevLines[0], path[i-1].fen.split(' ')[1] as 'w' | 'b'));
                    }
                }
                gp += `${i === 0 ? 'M' : 'L'} ${(i / maxX) * 1000},${300 - (ep * 300)} `;
            });
            if(gp) gPaths.push(gp);
        }
    });
    return { areaWhite: wPath, areaBlack: bPath, linePath: lPath, ghostPaths: gPaths };
  }, [graphPoints, activeMainline, allPaths, maxX]);

  const engineArrows = useMemo(() => {
    if (isEnginePaused || easterEggState !== 'idle' || !arrowSettings.showArrows || !lines || lines.length === 0) return [];
    
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
            else if (!bestIsMate && !line.isMate) alpha = Math.max(0.15, 0.85 - (Math.abs(bestScore - line.score) * 0.35));
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
  }, [lines, arrowSettings, engineSettings.multiPv, arrowColors, isEnginePaused, easterEggState]);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };
  const openSettingsModal = () => { setTempSettings(engineSettings); setIsSettingsModalOpen(true); };

  const handleApplySettings = () => {
    setEngineSettings(tempSettings); 
    if (setOption) { setOption('MultiPV', tempSettings.multiPv); setOption('Threads', tempSettings.threads); setOption('Hash', tempSettings.hash); }
    setIsSettingsModalOpen(false); showToast('تنظیمات با موفقیت اعمال شد');
  };

  const getPgnString = () => {
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
    return pgn + movesString.trim() + " *";
  };

  const copyMainlinePgn = () => {
    navigator.clipboard.writeText(getPgnString()); 
    showToast('آنالیز با موفقیت در کلیپ‌بورد کپی شد');
  };

  const downloadFile = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleShare = (platform: string) => {
      const pgn = getPgnString();
      const text = encodeURIComponent(`بررسی آنالیز شطرنج در فرزین:\n\n${pgn}`);
      
      switch(platform) {
          case 'telegram':
              window.open(`https://t.me/share/url?url=${text}`, '_blank');
              break;
          case 'whatsapp':
              window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              break;
          case 'twitter':
              window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
              break;
          case 'txt':
              downloadFile(pgn, 'farzin_analysis.txt');
              break;
          case 'pgn':
              downloadFile(pgn, 'farzin_analysis.pgn');
              break;
      }
      setIsShareModalOpen(false);
  };

  const handleSaveAnalysis = () => {
    if(!saveName.trim()) return; setIsSaveModalOpen(false); showToast(`آنالیز "${saveName}" با موفقیت ذخیره شد`); setSaveName("");
  };

  const confirmResetAnalysis = () => {
      const rootFen = initialData.type === 'FEN' ? initialData.data : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      setTree({ 'root': { id: 'root', san: 'Start', fen: rootFen, move: null, parentId: null, childrenIds: [], depth: 0 } });
      setCurrentNodeId('root');
      engineCache.current = {}; 
      setIsResetModalOpen(false); 
      showToast('آنالیز با موفقیت پاک شد');
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

  // 🌟 قفل کردن دکمه‌ها در حین اجرای ایستر اگ
  const prevMove = () => { if (easterEggState !== 'idle') return; const pid = tree[currentNodeId]?.parentId; if (pid) setCurrentNodeId(pid); };
  const nextMove = () => { if (easterEggState !== 'idle') return; const cids = tree[currentNodeId]?.childrenIds; if (cids && cids.length > 0) setCurrentNodeId(cids[0]); };
  const goStart = () => { if (easterEggState !== 'idle') return; setCurrentNodeId('root'); };
  const goEnd = () => { if (easterEggState !== 'idle') return; let curr = currentNodeId; while (tree[curr]?.childrenIds?.length > 0) curr = tree[curr].childrenIds[0]; setCurrentNodeId(curr); };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowLeft') prevMove();
      else if (e.key === 'ArrowRight') nextMove();
      else if (e.key === 'ArrowUp') goStart();
      else if (e.key === 'ArrowDown') goEnd();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNodeId, tree, easterEggState]);

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

  const onPieceDragBegin = (piece: string, sourceSquare: string) => { 
      if (easterEggState !== 'idle' && easterEggState !== 'prompt') return;
      if (piece[0] !== activeGame.turn()) return; 
      setClickedSquare(sourceSquare); 
      if (easterEggState === 'idle') highlightLegalMoves(sourceSquare); 
  };
  
  // 🌟 منطق انفجار بمب!
  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => { 
    setOptionSquares({}); setClickedSquare(null); 
    
    if (easterEggState === 'prompt') {
        const targetPiece = activeGame.get(targetSquare as any);
        if (targetPiece && targetPiece.type === 'k' && targetPiece.color !== activeGame.turn()) {
            setEasterEggState('exploded');
            
            // 💥 انیمیشن سینمایی، نرم‌تر و زیباتر
            setTimeout(() => {
                const pieces = document.querySelectorAll('[data-piece]');
                pieces.forEach((p: any) => {
                    const x = (Math.random() - 0.5) * 2000;
                    const y = (Math.random() - 0.5) * 2000 - 400; // تمایل به پرتاب رو به بالا
                    const rot = (Math.random() - 0.5) * 720;
                    // ترانزیشن 3 ثانیه‌ای و محو شدن نرم مهره‌ها
                    p.style.transition = 'transform 3s cubic-bezier(0.25, 1, 0.5, 1), opacity 2.5s ease-in-out';
                    p.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${Math.random() * 2 + 1})`;
                    p.style.opacity = '0';
                });
                
                const board = document.getElementById('farzin-board-container');
                if (board) {
                    board.style.transition = 'all 3s cubic-bezier(0.25, 1, 0.5, 1)';
                    // لرزش، کج شدن ظریف‌تر و افکت بلور (Blur)
                    board.style.transform = 'rotate(5deg) scale(0.85) translateY(30px)';
                    board.style.filter = 'contrast(1.5) sepia(1) hue-rotate(-50deg) drop-shadow(0 0 80px rgba(225,29,72,0.8)) blur(2px)';
                }
                
                // تاخیر بیشتر برای دیدن کامل انیمیشن
                setTimeout(() => setEasterEggState('resolved'), 3500);
            }, 100);
            
            return true;
        }
        return false; 
    }
    
    if (easterEggState !== 'idle') return false;

    return addMoveToTree({ from: sourceSquare, to: targetSquare, promotion: piece[1]?.toLowerCase() ?? 'q' }); 
  };
  
  const handleSquareClick = (square: string) => {
    if (easterEggState !== 'idle') { setClickedSquare(null); setOptionSquares({}); return; }
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
        executeVariation(parentId, rawPv.includes(' pv ') ? rawPv.split(' pv ')[1] : rawPv);
    } else {
        if (!lines || !lines[0]) return;
        const rawPv = lines[0].pv || '';
        executeVariation(currentNodeId, rawPv.includes(' pv ') ? rawPv.split(' pv ')[1] : rawPv);
    }
  };

  const getSquareCoordinates = (square: string) => {
    const col = square.charCodeAt(0) - 97; 
    const row = parseInt(square[1]) - 1; 
    const isWhite = boardOrientation === 'white';
    return { x: isWhite ? col : 7 - col, y: isWhite ? 7 - row : row };
  };

  const moveSquares = useMemo(() => {
    const node = tree[currentNodeId];
    if (!node || node.id === 'root' || !node.move) return {};
    let customSq: any = { [node.move.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }, [node.move.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } };
    return customSq;
  }, [tree, currentNodeId]);

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
    
    const isBook = isBookPosition(mainChild.fen);
    result.push(<span key={mainChildId} onClick={() => setCurrentNodeId(mainChildId)} className={`cursor-pointer px-1 py-0.5 mx-[1px] rounded transition-all duration-200 ${currentNodeId === mainChildId ? (isBook ? 'bg-[#c27a3e] text-white font-black shadow-[0_0_8px_rgba(194,122,62,0.6)]' : 'bg-farzin-accent text-white font-black shadow-[0_0_8px_rgba(119,149,86,0.6)]') : (isBook ? 'text-[#c27a3e] font-bold hover:bg-[#262421]' : 'text-zinc-300 hover:bg-[#262421]')}`}>{prefix}{mainChild.san}</span>);

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
      
      <EvaluationGraph 
         graphMode={graphMode} setGraphMode={setGraphMode}
         graphPoints={graphPoints} activeMainline={activeMainline} ghostPaths={ghostPaths}
         areaWhite={areaWhite} areaBlack={areaBlack} linePath={linePath} maxX={maxX} stats={null}
         currentNodeId={currentNodeId} setCurrentNodeId={setCurrentNodeId}
      />

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onShare={handleShare} />
      <SaveModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={handleSaveAnalysis} saveName={saveName} setSaveName={setSaveName} />
      <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={confirmResetAnalysis} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} tempSettings={tempSettings} setTempSettings={setTempSettings} onApply={handleApplySettings} />
      <ArrowSettingsModal isOpen={isArrowModalOpen} onClose={() => setIsArrowModalOpen(false)} arrowSettings={arrowSettings} setArrowSettings={setArrowSettings} arrowColors={arrowColors} setArrowColors={setArrowColors} multiPv={engineSettings.multiPv} />
      
      {/* 😈 پاپ‌آپ‌های ایستر اگ */}
      <AnimatePresence>
        {easterEggState === 'prompt' && (
          // 🌟 پوزیشن به بالا (top-10) تغییر کرد تا روی تخته را نپوشاند
          <motion.div initial={{ y: -50, scale: 0.8, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
            <div className="bg-[#12110f]/90 border border-rose-500/50 backdrop-blur-xl p-4 lg:p-6 rounded-3xl shadow-[0_10px_50px_rgba(225,29,72,0.6)] flex flex-row lg:flex-col items-center gap-4 text-center min-w-[300px]">
              <span className="text-4xl lg:text-6xl drop-shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-pulse">😈</span>
              <h2 className="text-white font-black text-lg lg:text-xl tracking-tight">تعارف نکن. بزن تو شاه!</h2>
            </div>
          </motion.div>
        )}

        {easterEggState === 'resolved' && (
          <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed bottom-0 inset-x-0 z-[300] flex justify-center p-6 bg-black/80 backdrop-blur-xl border-t border-purple-500/30 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
            <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
              <span className="text-5xl drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">👽</span>
              <div className="flex flex-col gap-2">
                <h2 className="text-white font-black text-2xl">حالا دیدی چی میشه؟</h2>
                <p className="text-zinc-400 font-bold">خیالت راحت شد؟ قانون شکنی عواقب داره!</p>
              </div>
              <button 
                onClick={() => {
                    setEasterEggState('idle');
                    navigate('/analysis'); // 🌟 تغییر آدرس بازگشت
                }} 
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 text-lg"
              >
                آره ببخشید، فهمیدم!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <div className={`flex-none w-full px-4 py-2 flex items-center justify-between z-10 bg-[#161512] border-b border-[#35332e] transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={() => navigate(-1)} className="p-1.5 bg-[#1e1c19] border border-[#35332e] rounded-lg hover:bg-[#262421] transition-colors text-zinc-400"><ChevronRight size={20} /></button>
        <div className="flex flex-col items-center">
            <h1 className="font-black text-sm text-white flex items-center gap-2">
              <Activity size={14} className="text-farzin-accent" /> آزمایشگاه فرزین
            </h1>
        </div>
        <div className="flex gap-1.5">
            <button onClick={openSettingsModal} className="p-1.5 bg-[#1e1c19] border border-[#35332e] rounded-lg hover:bg-[#262421] hover:text-white text-zinc-400 transition-colors" title="تنظیمات موتور"><Settings size={16}/></button>
            <button onClick={() => setIsSaveModalOpen(true)} className="p-1.5 bg-[#1e1c19] border border-[#35332e] rounded-lg hover:bg-[#262421] hover:text-white text-zinc-400 transition-colors" title="ذخیره آنالیز"><Save size={16}/></button>
            <button onClick={() => setIsShareModalOpen(true)} className="p-1.5 bg-[#1e1c19] border border-[#35332e] rounded-lg hover:bg-[#262421] hover:text-white text-zinc-400 transition-colors" title="اشتراک‌گذاری"><Share2 size={16}/></button>
        </div>
      </div>

      <div className={`flex-none w-full px-3 py-2 bg-gradient-to-b from-[#1a1916] to-[#12110f] border-b border-[#35332e] shadow-[0_4px_15px_rgba(0,0,0,0.3)] relative z-20 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between mb-1.5 px-1">
              <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-2 bg-[#262421] px-2 py-0.5 rounded-md border border-[#35332e]">
                      {!isReady ? <Loader2 size={10} className="text-amber-500 animate-spin" /> : 
                       (isEnginePaused ? <Pause size={10} className="text-zinc-500" /> : <Zap size={10} className={displayEngineStatus === 'reading books...' ? "text-sky-400 animate-pulse" : "text-amber-400 animate-pulse"} />)}
                      <span className="font-mono text-[9px] font-bold text-zinc-300" dir="ltr">{isEnginePaused ? 'Paused' : displayEngineStatus}</span>
                      {!isEnginePaused && lines[0] && <span className="text-[9px] text-zinc-500 font-mono ml-1 border-l border-[#35332e] pl-1.5">D{lines[0].depth}</span>}
                  </div>
                  <button 
                      onClick={() => setIsEnginePaused(!isEnginePaused)}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${isEnginePaused ? 'bg-farzin-accent/20 border-farzin-accent/50 text-farzin-accent hover:bg-farzin-accent hover:text-white' : 'bg-[#262421] border-[#35332e] text-zinc-400 hover:text-white'}`}
                      title={isEnginePaused ? "شروع محاسبه موتور" : "توقف موتور (صرفه‌جویی در باتری)"}
                  >
                      {isEnginePaused ? <Play size={12} className="ml-0.5" fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                  </button>
              </div>
              <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border shadow-sm ${overallBadgeStyle}`} dir="ltr">{overallEvalText}</span>
          </div>
          
          <div className="mt-2 h-[88px] flex flex-col justify-start overflow-hidden">
             {isEnginePaused && easterEggState === 'idle' ? (
                 <div className="flex flex-col items-center justify-center h-full bg-[#161512] rounded-xl border border-[#35332e] shadow-inner opacity-80">
                     <Pause size={18} className="text-zinc-500 mb-1.5" />
                     <span className="text-[10px] font-sans text-zinc-400">آنالیز متوقف شده است</span>
                 </div>
             ) : engineSettings.coachMode && coachData ? (
                 coachData.key === 'loading' ? (
                     <div className="flex flex-col items-center justify-center py-2 opacity-50"><Loader2 size={18} className="animate-spin text-farzin-accent mb-1"/><span className="text-[10px] font-sans">در حال بررسی دقیق حرکت...</span></div>
                 ) : (
                     <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="flex flex-col gap-1 bg-[#161512] rounded-xl p-2 border border-[#35332e] shadow-inner h-full justify-center">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${coachData.color}20`, color: coachData.color }}>
                                   {typeof coachData.icon === 'function' ? coachData.icon({size: 14}) : <coachData.icon size={14} />}
                                </div>
                                <span className="text-[11px] font-sans text-zinc-300">
                                   حرکت <span className="font-mono font-black text-white px-1">{coachData.userSan}</span> <span className="font-bold" style={{color: coachData.color}}>{coachData.text}</span> بود.
                                </span>
                            </div>
                            { (['best', 'brilliant', 'great', 'book'].includes(coachData.key) || coachData.bestSan === '...') && (
                                <button onClick={()=>handleShowMe(false)} className="text-[9px] font-bold bg-[#262421] border border-[#35332e] px-2 py-1 rounded hover:bg-[#35332e] transition-colors shrink-0">نشونم بده</button>
                            )}
                         </div>
                         { !['best', 'brilliant', 'great', 'book'].includes(coachData.key) && coachData.bestSan !== '...' && (
                             <div className="flex items-center justify-between border-t border-[#262421] pt-1.5 mt-0.5 opacity-80">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 ml-0.5 rounded-md flex items-center justify-center text-zinc-500">
                                       <COACH_COLORS.best.icon size={12} />
                                    </div>
                                    <span className="text-[10px] font-sans text-zinc-400">
                                       اما بهترین حرکت <span className="font-mono font-black text-zinc-200 px-1">{coachData.bestSan}</span> بود.
                                    </span>
                                </div>
                                <button onClick={()=>handleShowMe(true)} className="text-[9px] font-bold bg-[#1e1c19] text-farzin-accent border border-farzin-accent/30 px-2 py-1 rounded hover:bg-farzin-accent hover:text-white transition-colors shrink-0">نشونم بده</button>
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
            <EditablePlayer color={boardOrientation === 'white' ? 'b' : 'w'} data={boardOrientation === 'white' ? playerMeta.black : playerMeta.white} material={boardOrientation === 'white' ? materialAdvantage.black : materialAdvantage.white} onUpdate={(d: any) => setPlayerMeta(p => ({...p, [boardOrientation === 'white' ? 'black' : 'white']: d}))} />
            
            <OpeningDisplay tree={tree} currentNodeId={currentNodeId} />
            
            <div className="w-full flex justify-center py-0.5">
                <div className="flex w-full max-w-[min(100vw-1.5rem,55vh)] lg:max-w-[600px] gap-1.5 relative" dir="ltr">
                    <div className="flex-1 bg-[#262421] p-1.5 rounded-xl border border-[#35332e] shadow-2xl relative flex flex-col justify-center">
                        <div id="farzin-board-container" className="w-full aspect-square rounded-md relative z-10 flex">
                          <Chessboard 
                              position={currentPosition} boardOrientation={boardOrientation}
                              customDarkSquareStyle={{ backgroundColor: '#779556' }} customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                              arePiecesDraggable={true} onPieceDrop={onDrop} onPieceDragBegin={onPieceDragBegin}
                              onSquareClick={handleSquareClick} onPieceClick={(piece: string, square: string) => handleSquareClick(square)}
                              onSquareRightClick={() => { setClickedSquare(null); setOptionSquares({}); }}
                              customSquareStyles={{...moveSquares, ...optionSquares}} 
                              customArrows={engineArrows} animationDuration={200}
                          />

                          {!isEnginePaused && engineSettings.coachMode && coachData && tree[currentNodeId] && tree[currentNodeId].id !== 'root' && (
                            <div className="absolute inset-0 pointer-events-none grid grid-cols-8 grid-rows-8">
                                {Array.from({ length: 64 }).map((_, i) => {
                                    const x = i % 8;
                                    const y = Math.floor(i / 8);
                                    const targetSquare = tree[currentNodeId].move?.to;
                                    
                                    if (!targetSquare) return <div key={i} />;
                                    const coords = getSquareCoordinates(targetSquare);
                                    
                                    if (x === coords.x && y === coords.y) {
                                        return (
                                            <div key={i} className="relative w-full h-full flex items-center justify-center">
                                                {coachData.key === 'brilliant' && (
                                                    <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0" style={{ background: 'radial-gradient(circle, rgba(45,212,191,0) 10%, rgba(45,212,191,0.6) 60%, rgba(45,212,191,0) 100%)' }} />
                                                )}
                                                {coachData.key === 'great' && (
                                                    <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0) 10%, rgba(59,130,246,0.5) 60%, rgba(59,130,246,0) 100%)' }} />
                                                )}
                                                {coachData.key === 'blunder' && (
                                                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 z-0" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0) 10%, rgba(239,68,68,0.8) 60%, rgba(239,68,68,0) 100%)' }} />
                                                )}
                                                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} className="absolute -top-[6px] -right-[6px] w-[22px] h-[22px] rounded-full flex items-center justify-center text-white shadow-[0_4px_10px_rgba(0,0,0,0.6)] border border-black/40 z-10" style={{ backgroundColor: coachData.color }}>
                                                    {typeof coachData.icon === 'function' ? coachData.icon({size: 13}) : <coachData.icon size={13} strokeWidth={3} />}
                                                </motion.div>
                                            </div>
                                        );
                                    }
                                    return <div key={i} />;
                                })}
                            </div>
                          )}
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

            <EditablePlayer color={boardOrientation === 'white' ? 'w' : 'b'} data={boardOrientation === 'white' ? playerMeta.white : playerMeta.black} material={boardOrientation === 'white' ? materialAdvantage.white : materialAdvantage.black} onUpdate={(d: any) => setPlayerMeta(p => ({...p, [boardOrientation === 'white' ? 'white' : 'black']: d}))} />
        </div>

        <div className="flex-1 min-h-0 flex flex-col bg-[#161512] border-t lg:border-t-0 lg:border-r border-[#35332e] relative z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] lg:shadow-none rounded-t-2xl lg:rounded-none mt-2 lg:mt-0">
            
            <div className="flex-none flex px-2 pt-1 border-b border-[#35332e] bg-[#1a1916] overflow-x-auto no-scrollbar rounded-t-2xl lg:rounded-none">
                <button onClick={() => setActiveTab('notation')} className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'notation' ? 'border-farzin-accent text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><List size={14} /> ثبت حرکات</button>
                <button onClick={() => setActiveTab('graph')} className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'graph' ? 'border-sky-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><TrendingUp size={14} /> گراف ارزیابی</button>
                <button onClick={() => setActiveTab('explorer')} className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'explorer' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><BookOpen size={14} /> دیتابیس (گشایش)</button>
            </div>

            <div className="flex-1 min-h-0 p-2.5 lg:p-3 flex flex-col bg-[#12110f]">
                {activeTab === 'notation' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                    </div>
                )}
                
                {activeTab === 'graph' && (
                    <div className="flex-1 relative rounded-xl border border-[#35332e] overflow-hidden bg-[#161512] flex items-center p-3">
                        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                            <path d={areaWhite} fill="#fff" />
                            <path d={areaBlack} fill="#000" />
                            <path d={linePath} fill="none" stroke="#fff" strokeWidth="4" />
                        </svg>
                        <div className="absolute inset-0 backdrop-blur-[2px] bg-black/40 z-10" />
                        
                        <div className="relative z-20 flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-500/50 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)] shrink-0">
                                    <TrendingUp size={20} />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-xs font-bold text-white">تحلیل گرافیکی</span>
                                    <span className="text-[9px] text-zinc-400">سیگموئید و فازها</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setGraphMode('fullscreen')} 
                                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold text-[10px] transition-colors shadow-lg active:scale-95 shrink-0"
                            >
                                باز کردن <Maximize2 size={12} />
                            </button>
                        </div>
                    </div>
                )}
                
                {activeTab === 'explorer' && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <OpeningExplorer 
                            fen={currentPosition} 
                            onMoveSelect={(uci) => {
                                addMoveToTree({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
                            }} 
                        />
                    </div>
                )}
            </div>

            <div className="flex-none px-3 py-2 border-t border-[#35332e] flex items-center justify-between bg-[#1a1916]">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')} className="p-2 bg-[#262421] border border-[#35332e] rounded-lg text-zinc-400 hover:text-white transition-colors active:scale-95" title="چرخش تخته"><RefreshCw size={16} /></button>
                  <button onClick={() => setIsResetModalOpen(true)} className="p-2 bg-[#262421] border border-[#35332e] rounded-lg text-zinc-400 hover:text-red-400 transition-colors active:scale-95" title="ریست کامل آنالیز"><RotateCcw size={16} /></button>
                  <button onClick={copyMainlinePgn} className="p-2 bg-[#262421] border border-[#35332e] rounded-lg text-zinc-400 hover:text-white transition-colors active:scale-95" title="کپی PGN"><Copy size={16} /></button>
                  <button onClick={() => setIsArrowModalOpen(true)} className={`p-2 border rounded-lg transition-colors active:scale-95 ${arrowSettings.showArrows ? 'bg-farzin-accent/20 border-farzin-accent/50 text-farzin-accent hover:bg-farzin-accent hover:text-white' : 'bg-[#262421] border-[#35332e] text-zinc-400 hover:text-white'}`} title="تنظیمات راهنمای بصری"><Route size={16} /></button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate('/report')} 
                        className="relative flex items-center h-[34px] gap-1.5 bg-farzin-accent hover:bg-[#68824b] text-white px-3 rounded-lg text-[11px] font-black transition-all shadow-[0_0_10px_rgba(119,149,86,0.5)] hover:shadow-[0_0_15px_rgba(119,149,86,0.8)] active:scale-95 group"
                    >
                        <PieChart size={14} className="group-hover:scale-110 transition-transform" /> 
                        گزارش بازی
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                        </span>
                    </button>
                    <div className="flex h-[34px] items-center bg-[#262421] rounded-lg border border-[#35332e] overflow-hidden shadow-sm" dir="ltr">
                        <button onClick={goStart} className="p-1.5 px-2 text-zinc-400 hover:text-white hover:bg-[#35332e] transition-colors h-full flex items-center"><Rewind size={17} /></button>
                        <button onClick={prevMove} className="p-1.5 px-2 text-zinc-400 hover:text-white hover:bg-[#35332e] transition-colors border-l border-[#35332e]/50 h-full flex items-center"><SkipBack size={17} /></button>
                        <button onClick={nextMove} className="p-1.5 px-2 text-white hover:text-farzin-accent hover:bg-[#35332e] transition-colors border-l border-[#35332e]/50 h-full flex items-center"><SkipForward size={17} /></button>
                        <button onClick={goEnd} className="p-1.5 px-2 text-white hover:text-farzin-accent hover:bg-[#35332e] transition-colors border-l border-[#35332e]/50 h-full flex items-center"><FastForward size={17} /></button>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}