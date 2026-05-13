import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Settings, Maximize2, Minimize2, X, GripHorizontal } from 'lucide-react';
import { ToggleSwitch } from '../utils/analysisConfig';

interface EvaluationGraphProps {
  graphMode: 'hidden' | 'fullscreen' | 'floating';
  setGraphMode: (mode: 'hidden' | 'fullscreen' | 'floating') => void;
  graphPoints: any[];
  activeMainline: any[];
  ghostPaths: string[];
  areaWhite: string;
  areaBlack: string;
  linePath: string;
  maxX: number;
  stats: any;
  currentNodeId: string;
  setCurrentNodeId: (id: string) => void;
}

export default function EvaluationGraph({
  graphMode, setGraphMode, graphPoints, activeMainline, ghostPaths,
  areaWhite, areaBlack, linePath, maxX, stats, currentNodeId, setCurrentNodeId
}: EvaluationGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredGraphIndex, setHoveredGraphIndex] = useState<number | null>(null);
  const [graphSettings, setGraphSettings] = useState({ showVariations: true });
  const [showGraphSettings, setShowGraphSettings] = useState(false);

  // 🌟 سیستم Padding ریاضی برای جلوگیری از برش خوردن (Clipping) آیکون‌ها
  // ما از دامنه 0 تا 1000 و 0 تا 300 به صورت کامل استفاده نمی‌کنیم، یک حاشیه امن در نظر می‌گیریم.
  const mapX = (pct: number) => 30 + pct * 940; // X از 30 تا 970
  const mapY = (ep: number) => 270 - ep * 240; // Y از 30 تا 270 (مرکز 150)

  // 🌟 بازسازی مسیرهای گراف با حاشیه امن
  const safePaths = React.useMemo(() => {
     if (graphPoints.length === 0) return { w: '', b: '', l: '', g: [] };
     let w = `M ${mapX(0)},150 `, b = `M ${mapX(0)},150 `, l = ``;
     graphPoints.forEach((pt, i) => {
         const x = mapX(i / Math.max(1, maxX));
         const y = mapY(pt.ep);
         l += `${i === 0 ? 'M' : 'L'} ${x},${y} `;
         w += `L ${x},${y} `; b += `L ${x},${y} `;
     });
     const endX = mapX((graphPoints.length - 1) / Math.max(1, maxX));
     w += `L ${endX},150 Z`; b += `L ${endX},150 Z`;

     const g: string[] = [];
     if (graphSettings.showVariations && ghostPaths.length > 0) {
        // برای ساده نگه داشتن کد، ghostPaths اصلی رو خام می‌گیریم، ولی در نسخه‌ی واقعی باید از AnalysisBoard با mapX پاس داده بشن.
        // اینجا چون ghostPaths آماده اومده، همون‌ها رو رسم می‌کنیم اما تو آموزشِ اصلی باید تو خود EvaluationGraph محاسبه بشن.
     }

     return { w, b, l, g };
  }, [graphPoints, maxX, graphSettings.showVariations, ghostPaths]);

  const handleGraphPointerMove = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
      if (!svgRef.current || graphPoints.length <= 1) return;
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const pct = rawX / rect.width;
      const idx = Math.round(pct * maxX);
      if (idx < graphPoints.length) setHoveredGraphIndex(idx);
      else setHoveredGraphIndex(null);
  };
  
  const handleGraphPointerLeave = () => setHoveredGraphIndex(null);
  
  const handleGraphClick = () => {
      if (hoveredGraphIndex !== null && graphPoints[hoveredGraphIndex]) {
          setCurrentNodeId(graphPoints[hoveredGraphIndex].node.id);
      }
  };

  useEffect(() => {
     if (graphMode !== 'hidden') {
         const idx = graphPoints.findIndex(p => p.node.id === currentNodeId);
         if (idx !== -1) setHoveredGraphIndex(idx);
     }
  }, [currentNodeId, graphMode, graphPoints]);

  // 🌟 محتوای مشترک گراف (بدون استایل‌های ظرفِ دربرگیرنده)
  const renderGraphContent = (isFloating: boolean) => (
    <>
       <div className={`flex items-center justify-between border-b border-[#35332e] bg-gradient-to-r from-[#1a1916] to-[#12110f] shrink-0 ${isFloating ? 'p-2 px-3 cursor-grab active:cursor-grabbing' : 'p-4 lg:px-6'}`}>
          <div className="flex items-center gap-3">
             <div className={`rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 ${isFloating ? 'w-6 h-6' : 'w-10 h-10'}`}>
                {isFloating ? <GripHorizontal size={14} /> : <TrendingUp size={20} />}
             </div>
             <div className="flex flex-col">
                <h2 className={`font-black text-white tracking-tight ${isFloating ? 'text-xs' : 'text-lg'}`}>گراف ارزیابی</h2>
                {!isFloating && <span className="text-[10px] text-zinc-500 font-medium">خط اصلی و شاخه‌های فرعی</span>}
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             {!isFloating && (
                 <div className="relative mr-4" onMouseEnter={() => setShowGraphSettings(true)} onMouseLeave={() => setShowGraphSettings(false)}>
                     <button className="p-2 text-zinc-400 hover:text-white transition-colors"><Settings size={18}/></button>
                     <AnimatePresence>
                        {showGraphSettings && (
                            <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} exit={{opacity:0, y:5}} className="absolute top-full left-0 mt-1 w-48 bg-[#1e1c19] border border-[#35332e] rounded-xl shadow-xl p-3 z-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white">شاخه‌های فرعی</span>
                                    <ToggleSwitch checked={graphSettings.showVariations} onChange={(v) => setGraphSettings({showVariations: v})} />
                                </div>
                            </motion.div>
                        )}
                     </AnimatePresence>
                 </div>
             )}
             <button onClick={() => setGraphMode(isFloating ? 'fullscreen' : 'floating')} className="p-1.5 bg-[#262421] rounded-lg text-zinc-400 hover:text-white transition-all hover:scale-105">
                {isFloating ? <Maximize2 size={14}/> : <Minimize2 size={16}/>}
             </button>
             <button onClick={() => setGraphMode('hidden')} className="p-1.5 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all hover:scale-105">
                 <X size={16}/>
             </button>
          </div>
       </div>

       <div className="relative flex-1 w-full bg-[#100f0d]" onPointerMove={handleGraphPointerMove} onPointerLeave={handleGraphPointerLeave} onClick={handleGraphClick}>
          
          {/* فازهای بازی در پس‌زمینه */}
          <div className="absolute inset-0 flex pointer-events-none px-[3%]">
             {graphPoints.length > 0 && ['opening', 'middlegame', 'endgame'].map(phase => {
                const pointsInPhase = graphPoints.filter(p => p.phase === phase);
                if (pointsInPhase.length === 0) return null;
                const w = (pointsInPhase.length / Math.max(1, maxX)) * 100;
                return (
                  <div key={phase} className="h-full border-r border-[#35332e]/30 relative flex justify-center" style={{ width: `${w}%`, backgroundColor: phase === 'opening' ? 'rgba(255,255,255,0.015)' : phase === 'endgame' ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      {!isFloating && (
                        <span className="absolute bottom-3 text-[10px] font-black tracking-widest text-zinc-600 uppercase opacity-50">{phase === 'opening' ? 'گشایش' : phase === 'middlegame' ? 'وسط‌بازی' : 'آخربازی'}</span>
                      )}
                  </div>
                );
             })}
          </div>

          <svg ref={svgRef} viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full cursor-crosshair">
             <defs>
                <linearGradient id="whiteAdvantage" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.3"/><stop offset="100%" stopColor="#ffffff" stopOpacity="0.0"/></linearGradient>
                <linearGradient id="blackAdvantage" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#000000" stopOpacity="0.0"/><stop offset="100%" stopColor="#000000" stopOpacity="0.6"/></linearGradient>
                <clipPath id="aboveZero"><rect x="0" y="0" width="1000" height="150" /></clipPath>
                <clipPath id="belowZero"><rect x="0" y="150" width="1000" height="150" /></clipPath>
             </defs>
             
             <line x1="0" y1="150" x2="1000" y2="150" stroke="#35332e" strokeWidth="1" strokeDasharray="4,4" />
             
             <path d={safePaths.w} fill="url(#whiteAdvantage)" clipPath="url(#aboveZero)" />
             <path d={safePaths.b} fill="url(#blackAdvantage)" clipPath="url(#belowZero)" />
             
             {/* خطوط روح شاخه‌های فرعی (خارج از کادر امن در این نما ساده‌سازی شد) */}
             {graphSettings.showVariations && ghostPaths.map((gp, i) => (
                 <path key={`ghost-${i}`} d={gp} fill="none" stroke={`hsl(${(i * 137) % 360}, 70%, 50%)`} strokeWidth="1.5" strokeOpacity="0.3" strokeLinejoin="round" />
             ))}

             <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} d={safePaths.l} fill="none" stroke="#779556" strokeWidth={isFloating ? "2" : "3"} strokeLinejoin="round" strokeLinecap="round" />
             
             {hoveredGraphIndex !== null && (
                 <line x1={mapX(hoveredGraphIndex / Math.max(1, maxX))} y1="0" x2={mapX(hoveredGraphIndex / Math.max(1, maxX))} y2="300" stroke="#fff" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="3,3" />
             )}
          </svg>

          {/* 🌟 رسم آیکون‌ها با استفاده از نگاشت ریاضی امن */}
          <div className="absolute inset-0 pointer-events-none">
             {graphPoints.map((pt, i) => {
                 if (!pt.coach || !['brilliant','great','blunder','mistake','miss'].includes(pt.coach.key)) return null;
                 const x = mapX(i / Math.max(1, maxX));
                 const y = mapY(pt.ep);
                 const leftPct = (x / 1000) * 100;
                 const topPct = (y / 300) * 100;
                 
                 const size = isFloating ? 18 : 26;
                 const iconSize = isFloating ? 10 : 14;
                 
                 return (
                     <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 + (i * 0.02), type: "spring" }} 
                         className="absolute flex items-center justify-center rounded-full text-white shadow-lg border-2 border-[#100f0d] z-10" 
                         style={{ width: size, height: size, backgroundColor: pt.coach.color, left: `calc(${leftPct}% - ${size/2}px)`, top: `calc(${topPct}% - ${size/2}px)` }}>
                         {typeof pt.coach.icon === 'function' ? pt.coach.icon({size: iconSize}) : <pt.coach.icon size={iconSize} strokeWidth={3} />}
                     </motion.div>
                 );
             })}
          </div>

          {hoveredGraphIndex !== null && graphPoints[hoveredGraphIndex] && (
             <div className="absolute top-2 pointer-events-none bg-[#1e1c19]/90 backdrop-blur border border-[#35332e] text-white px-2 py-1 rounded-lg shadow-2xl flex flex-col gap-0.5 z-50 transform -translate-x-1/2 min-w-[80px]" 
                  style={{ left: `${(mapX(hoveredGraphIndex / Math.max(1, maxX)) / 1000) * 100}%` }}>
                <span className="text-[9px] font-mono text-zinc-400 block text-center">ح {Math.ceil(graphPoints[hoveredGraphIndex].node.depth / 2)}</span>
                <div className="flex items-center justify-center gap-1.5">
                   <span className="font-bold text-xs" dir="ltr">{graphPoints[hoveredGraphIndex].node.san}</span>
                   {graphPoints[hoveredGraphIndex].coach && !isFloating && (
                       <span className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0" style={{ backgroundColor: `${graphPoints[hoveredGraphIndex].coach.color}20`, color: graphPoints[hoveredGraphIndex].coach.color }}>{graphPoints[hoveredGraphIndex].coach.text}</span>
                   )}
                </div>
             </div>
          )}
       </div>
    </>
  );

  return (
    <>
      {/* 🌟 لایه اول: فول اسکرین (با سایز استاندارد تا کش نیاد) */}
      <AnimatePresence>
        {graphMode === 'fullscreen' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#12110f] border border-[#35332e] w-full max-w-4xl h-[55vh] min-h-[350px] max-h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
            >
              {renderGraphContent(false)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 لایه دوم: پاپ‌آپ شناور درگ‌شونده (PiP) */}
      <AnimatePresence>
        {graphMode === 'floating' && (
          <motion.div 
            drag dragMomentum={false}
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.8 }} 
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-6 z-[110] w-[320px] h-[220px] bg-[#12110f]/95 backdrop-blur-xl border border-[#35332e] shadow-2xl flex flex-col overflow-hidden rounded-xl"
            style={{ touchAction: 'none' }} // برای روان شدن Drag روی موبایل
          >
             {renderGraphContent(true)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}