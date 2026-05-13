import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Settings, Maximize2, Minimize2, X, BarChart2, Sparkles, Award, AlertTriangle } from 'lucide-react';
import { TextIcon, ToggleSwitch } from '../utils/analysisConfig';

interface EvaluationGraphProps {
  graphMode: 'hidden' | 'fullscreen' | 'floating';
  setGraphMode: (mode: 'hidden' | 'fullscreen' | 'floating') => void;
  graphPoints: any[];
  activeMainline: any[];
  ghostPaths: string[];
  areaWhite: string;
  areaBlack: string;
  linePath: string;
  stats: any;
  currentNodeId: string;
  setCurrentNodeId: (id: string) => void;
}

export default function EvaluationGraph({
  graphMode, setGraphMode, graphPoints, activeMainline, ghostPaths,
  areaWhite, areaBlack, linePath, stats, currentNodeId, setCurrentNodeId
}: EvaluationGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredGraphIndex, setHoveredGraphIndex] = useState<number | null>(null);
  const [graphSettings, setGraphSettings] = useState({ showVariations: true });
  const [showGraphSettings, setShowGraphSettings] = useState(false);

  const handleGraphPointerMove = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
      if (!svgRef.current || graphPoints.length <= 1) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const pct = x / rect.width;
      const maxX = Math.max(1, activeMainline.length - 1);
      const idx = Math.round(pct * maxX);
      if (idx < graphPoints.length) setHoveredGraphIndex(idx);
  };
  const handleGraphPointerLeave = () => setHoveredGraphIndex(null);
  const handleGraphClick = () => {
      if (hoveredGraphIndex !== null && graphPoints[hoveredGraphIndex]) {
          setCurrentNodeId(graphPoints[hoveredGraphIndex].node.id);
          if (graphMode === 'fullscreen') setGraphMode('floating');
      }
  };

  useEffect(() => {
     if (graphMode !== 'hidden') {
         const idx = graphPoints.findIndex(p => p.node.id === currentNodeId);
         if (idx !== -1) setHoveredGraphIndex(idx);
     }
  }, [currentNodeId, graphMode, graphPoints]);

  if (graphMode === 'hidden') return null;

  return (
    <motion.div 
      drag={graphMode === 'floating'} dragMomentum={false}
      initial={graphMode === 'fullscreen' ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 50 }} 
      animate={graphMode === 'fullscreen' 
          ? { opacity: 1, scale: 1, x: 0, y: 0, width: '100%', height: '100%', maxWidth: '64rem', maxHeight: 'none', borderRadius: '1.5rem' } 
          : { opacity: 1, scale: 1, x: 0, y: 0, width: '320px', height: '220px', maxWidth: '100%', maxHeight: '100%', borderRadius: '1rem' }} 
      exit={{ opacity: 0, scale: 0.9 }} 
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`fixed z-[100] bg-[#12110f]/95 backdrop-blur-xl border border-[#35332e] shadow-2xl flex flex-col overflow-hidden
          ${graphMode === 'fullscreen' ? 'inset-0 m-auto md:p-0' : 'bottom-4 left-4 cursor-grab active:cursor-grabbing'}
      `}
      style={{ ...(graphMode === 'fullscreen' ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : {}) }}
      dir="rtl"
    >
       <div className={`flex items-center justify-between border-b border-[#35332e] bg-gradient-to-r from-[#1a1916]/80 to-[#12110f]/80 ${graphMode === 'fullscreen' ? 'p-5 lg:px-8' : 'p-2 px-3'}`}>
          <div className="flex items-center gap-3">
             <div className={`rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 ${graphMode === 'fullscreen' ? 'w-10 h-10' : 'w-7 h-7'}`}>
                <TrendingUp size={graphMode === 'fullscreen' ? 20 : 14} />
             </div>
             <div className="flex flex-col">
                <h2 className={`font-black text-white tracking-tight ${graphMode === 'fullscreen' ? 'text-lg' : 'text-xs'}`}>گراف بازی</h2>
                {graphMode === 'fullscreen' && <span className="text-[10px] text-zinc-500 font-medium">خط اصلی و شاخه‌های فرعی</span>}
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             {graphMode === 'fullscreen' && (
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
             <button onClick={() => setGraphMode(graphMode === 'fullscreen' ? 'floating' : 'fullscreen')} className="p-1.5 bg-[#262421] rounded-lg text-zinc-400 hover:text-white transition-all">
                {graphMode === 'fullscreen' ? <Minimize2 size={16}/> : <Maximize2 size={14}/>}
             </button>
             <button onClick={() => setGraphMode('hidden')} className="p-1.5 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all"><X size={16}/></button>
          </div>
       </div>

       <div className="relative flex-1 w-full bg-[#100f0d] overflow-hidden" onPointerMove={handleGraphPointerMove} onPointerLeave={handleGraphPointerLeave} onClick={handleGraphClick}>
          <div className="absolute inset-0 flex pointer-events-none">
             {graphPoints.length > 0 && ['opening', 'middlegame', 'endgame'].map(phase => {
                const pointsInPhase = graphPoints.filter(p => p.phase === phase);
                if (pointsInPhase.length === 0) return null;
                const w = (pointsInPhase.length / graphPoints.length) * 100;
                return (
                  <div key={phase} className="h-full border-r border-[#35332e]/30 relative flex justify-center transition-colors" style={{ width: `${w}%`, backgroundColor: phase === 'opening' ? 'rgba(255,255,255,0.015)' : phase === 'endgame' ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      {graphMode === 'fullscreen' && (
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
             <path d={areaWhite} fill="url(#whiteAdvantage)" clipPath="url(#aboveZero)" />
             <path d={areaBlack} fill="url(#blackAdvantage)" clipPath="url(#belowZero)" />
             
             {/* خطوط روح شاخه‌های فرعی */}
             {graphSettings.showVariations && ghostPaths.map((gp, i) => (
                 <path key={`ghost-${i}`} d={gp} fill="none" stroke={`hsl(${(i * 137) % 360}, 70%, 50%)`} strokeWidth="1.5" strokeOpacity="0.3" strokeLinejoin="round" />
             ))}

             <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} d={linePath} fill="none" stroke="#779556" strokeWidth={graphMode === 'fullscreen' ? "3" : "2"} strokeLinejoin="round" strokeLinecap="round" />
             {hoveredGraphIndex !== null && (
                 <line x1={(hoveredGraphIndex / Math.max(1, activeMainline.length - 1)) * 1000} y1="0" x2={(hoveredGraphIndex / Math.max(1, activeMainline.length - 1)) * 1000} y2="300" stroke="#fff" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="3,3" />
             )}
          </svg>

          <div className="absolute inset-0 pointer-events-none">
             {graphPoints.map((pt, i) => {
                 if (!pt.coach || !['brilliant','great','blunder','mistake','miss'].includes(pt.coach.key)) return null;
                 const leftPct = (i / Math.max(1, activeMainline.length - 1)) * 100;
                 const topPct = (1 - pt.ep) * 100;
                 const size = graphMode === 'fullscreen' ? 24 : 16;
                 const iconSize = graphMode === 'fullscreen' ? 14 : 10;
                 return (
                     <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 + (i * 0.02), type: "spring" }} className="absolute flex items-center justify-center rounded-full text-white shadow-lg border border-[#100f0d] z-10" style={{ width: size, height: size, backgroundColor: pt.coach.color, left: `calc(${leftPct}% - ${size/2}px)`, top: `calc(${topPct}% - ${size/2}px)` }}>
                         {typeof pt.coach.icon === 'function' ? pt.coach.icon({size: iconSize}) : <pt.coach.icon size={iconSize} strokeWidth={3} />}
                     </motion.div>
                 );
             })}
          </div>

          {hoveredGraphIndex !== null && graphPoints[hoveredGraphIndex] && (
             <div className="absolute top-2 pointer-events-none bg-[#1e1c19]/90 backdrop-blur border border-[#35332e] text-white px-2 py-1 rounded-lg shadow-2xl flex flex-col gap-0.5 z-50 transform -translate-x-1/2 min-w-[80px]" style={{ left: `${(hoveredGraphIndex / Math.max(1, activeMainline.length - 1)) * 100}%` }}>
                <span className="text-[9px] font-mono text-zinc-400 block text-center">ح {Math.ceil(graphPoints[hoveredGraphIndex].node.depth / 2)}</span>
                <div className="flex items-center justify-center gap-1.5">
                   <span className="font-bold text-xs" dir="ltr">{graphPoints[hoveredGraphIndex].node.san}</span>
                   {graphPoints[hoveredGraphIndex].coach && graphMode === 'fullscreen' && (
                       <span className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0" style={{ backgroundColor: `${graphPoints[hoveredGraphIndex].coach.color}20`, color: graphPoints[hoveredGraphIndex].coach.color }}>{graphPoints[hoveredGraphIndex].coach.text}</span>
                   )}
                </div>
             </div>
          )}
       </div>
    </motion.div>
  );
}